import {afterEach, describe, expect, it, vi} from 'vitest';
import {createPreparedNoteServerOwner} from '../src/prepared-note-server-owner.ts';
import {NOTE_EXTRACTION_MODEL} from '../src/openai-note-extractor.ts';
import {TRANSCRIPTION_MODEL} from '../src/live-transcription.ts';
const preview = {origin: 'https://notes-test.onrender.com', password: 'x'.repeat(32)};
const authorization = 'Basic ' + Buffer.from('stylist:' + preview.password).toString('base64');
class Socket extends EventTarget {readyState = 1; bufferedAmount = 0; send = vi.fn(); close = vi.fn();}
function setup() {
 const socket = new Socket(), capture = {start: vi.fn(async () => true), stop: vi.fn(), end: vi.fn()};
 const allowance = {purpose: 'notes-only-simulation' as const, reserve: vi.fn(async () => 'synthetic-reservation'), closeVerified: vi.fn(async (_id: string) => {})};
 const fetch = vi.fn(async (_url: string, _init: RequestInit) => Response.json({}));
 const createTransports = vi.fn(() => ({socket, capture, fetch}));
 const options = {simulation: true, preview, allowance, createTransports, changed: vi.fn()};
 return {...options, socket, capture, fetch, owner: createPreparedNoteServerOwner(options)};
}
function request(changes = {}) {return {method: 'GET', path: '/api/notebook-simulation', host: 'notes-test.onrender.com', origin: preview.origin, authorization, signal: new AbortController().signal, ...changes};}
afterEach(() => vi.useRealTimers());
describe('disabled private notebook server owner', () => {
 it('requires explicit simulation', () => {const s = setup(); expect(() => createPreparedNoteServerOwner({...s, simulation: false})).toThrow('disabled'); expect(s.allowance.reserve).not.toHaveBeenCalled();});
 it.each([{method: 'POST'}, {path: '/api/notebook-simulation?key=x'}, {host: 'other.onrender.com'}, {origin: 'https://other.onrender.com'}])('rejects wrong request boundary %j before allowance or transports', async changes => {
  const s = setup(); expect(await s.owner.start(request(changes))).toEqual({status: 403}); expect(s.allowance.reserve).not.toHaveBeenCalled(); expect(s.createTransports).not.toHaveBeenCalled();
 });
 it('rejects missing authentication before allowance and provider work', async () => {const s = setup(); expect(await s.owner.start(request({authorization: undefined}))).toEqual({status: 401}); expect(s.allowance.reserve).not.toHaveBeenCalled(); expect(s.createTransports).not.toHaveBeenCalled();});
 it('rate-limits failed credentials without provider work', async () => {const s = setup(); for (let i = 0; i < 60; i++) await s.owner.start(request({authorization: undefined})); expect(await s.owner.start(request({authorization: undefined}))).toEqual({status: 429}); expect(s.allowance.reserve).not.toHaveBeenCalled();});
 it('holds exhausted or uncertain allowance with redacted errors and no retry', async () => {const s = setup(); s.allowance.reserve.mockRejectedValue(Error('private ledger sentinel')); expect(await s.owner.start(request())).toEqual({status: 503}); expect(s.owner.status().state).toBe('held'); expect(await s.owner.start(request())).toEqual({status: 409}); expect(s.allowance.reserve).toHaveBeenCalledTimes(1); expect(s.createTransports).not.toHaveBeenCalled();});
 it('refuses an unlabeled legacy allowance before any work', () => {const s = setup(); expect(() => createPreparedNoteServerOwner({...s, allowance: {...s.allowance, purpose: undefined} as never})).toThrow('disabled'); expect(s.allowance.reserve).not.toHaveBeenCalled();});
 it('rejects pre-aborted access without reservation', async () => {const s = setup(); expect(await s.owner.start(request({signal: AbortSignal.abort()}))).toEqual({status: 499}); expect(s.allowance.reserve).not.toHaveBeenCalled();});
 it('blocks a concurrent start while a reservation is pending', async () => {const s = setup(); let resolve!: (id: string) => void; s.allowance.reserve.mockImplementation(() => new Promise(r => {resolve = r;})); const pending = s.owner.start(request()); expect(await s.owner.start(request())).toEqual({status: 409}); resolve('synthetic'); const first = await pending; if (first.status !== 200) throw Error('start'); await first.end(); expect(s.allowance.reserve).toHaveBeenCalledTimes(1);});
 it('closes a late reservation after cancellation without creating providers', async () => {const s = setup(), abort = new AbortController(); let resolve!: (id: string) => void; s.allowance.reserve.mockImplementation(() => new Promise(r => {resolve = r;})); const pending = s.owner.start(request({signal: abort.signal})); abort.abort(); resolve('late-synthetic'); expect(await pending).toEqual({status: 499}); expect(s.createTransports).not.toHaveBeenCalled(); expect(s.allowance.closeVerified).toHaveBeenCalledExactlyOnceWith('late-synthetic'); expect(s.owner.status().state).toBe('idle');});
 it('ends capture, provider and reservation once across repeated ends', async () => {const s = setup(); const active = await s.owner.start(request()); if (active.status !== 200) throw Error('start'); await Promise.all([active.end(), active.end()]); expect(s.socket.close).toHaveBeenCalledTimes(1); expect(s.capture.end).toHaveBeenCalledTimes(1); expect(s.allowance.closeVerified).toHaveBeenCalledTimes(1); expect(s.owner.status().state).toBe('idle');});
 it('closes after provider failure', async () => {const s = setup(); const active = await s.owner.start(request()); if (active.status !== 200) throw Error('start'); s.socket.dispatchEvent(new Event('error')); await active.end(); expect(s.allowance.closeVerified).toHaveBeenCalledTimes(1); expect(s.owner.status().state).toBe('idle');});
 it('holds transport construction failure without asserting cleanup', async () => {const s = setup(); s.createTransports.mockImplementation(() => {throw Error('private');}); expect(await s.owner.start(request())).toEqual({status: 503}); expect(s.owner.status().state).toBe('held'); expect(s.allowance.closeVerified).not.toHaveBeenCalled();});
 it('holds failed provider cleanup without closing the reservation', async () => {const s = setup(); s.socket.close.mockImplementation(() => {throw Error('private');}); const active = await s.owner.start(request()); if (active.status !== 200) throw Error('start'); await active.end(); expect(s.owner.status().state).toBe('held'); expect(s.allowance.closeVerified).not.toHaveBeenCalled(); expect(await s.owner.start(request())).toEqual({status: 409});});
 it('holds failed durable closure without retrying', async () => {const s = setup(); s.allowance.closeVerified.mockRejectedValue(Error('private')); const active = await s.owner.start(request()); if (active.status !== 200) throw Error('start'); await active.end(); await active.end(); expect(s.allowance.closeVerified).toHaveBeenCalledTimes(1); expect(s.owner.status().state).toBe('held');});
 it('closes at the active deadline with no retry or lingering timer', async () => {vi.useFakeTimers(); const s = setup(); const active = await s.owner.start(request()); if (active.status !== 200) throw Error('start'); await vi.advanceTimersByTimeAsync(85_000); await active.end(); expect(s.owner.status().state).toBe('idle'); expect(s.socket.close).toHaveBeenCalledTimes(1); expect(s.allowance.closeVerified).toHaveBeenCalledTimes(1); expect(vi.getTimerCount()).toBe(0);});
 it('blocks replacement until durable closure finishes', async () => {const s = setup(); let resolve!: () => void; s.allowance.closeVerified.mockImplementation(() => new Promise(r => {resolve = r;})); const active = await s.owner.start(request()); if (active.status !== 200) throw Error('start'); const ending = active.end(); await Promise.resolve(); expect(await s.owner.start(request())).toEqual({status: 409}); resolve(); await ending; expect(s.owner.status().state).toBe('idle');});
 it('retains final capture failure before closing allowance', async () => {const s = setup(); s.capture.stop.mockImplementation(() => {throw Error('private');}); const active = await s.owner.start(request()); if (active.status !== 200) throw Error('start'); active.probe.end(); await active.end(); expect(s.capture.end).toHaveBeenCalledTimes(1); expect(s.owner.status().state).toBe('held'); expect(s.allowance.closeVerified).not.toHaveBeenCalled();});
 it('displays tentative partial notes and protects a touch edit during the same turn', async () => {
  vi.useFakeTimers(); const s = setup();
  s.fetch.mockImplementation(async () => Response.json({model: NOTE_EXTRACTION_MODEL, status: 'completed', output: [{type: 'message', role: 'assistant', status: 'completed', content: [{type: 'output_text', text: JSON.stringify({version: 1, turnId: 't1', patches: [{field: 'color', value: 'green', evidence: 'green'}]})}]}]}));
  const active = await s.owner.start(request()); if (active.status !== 200) throw Error('start');
  active.probe.receive({type: 'session.updated', session: {type: 'transcription', audio: {input: {format: {type: 'audio/pcm', rate: 24000}, transcription: {model: TRANSCRIPTION_MODEL}, turn_detection: null}}}});
  expect(await active.probe.beginTurn('t1')).toBe(true);
  active.probe.receive({type: 'conversation.item.input_audio_transcription.delta', event_id: 'e1', item_id: 'i1', content_index: 0, delta: 'green'});
  await vi.advanceTimersByTimeAsync(100);
  expect(active.snapshot().notes.color).toMatchObject({value: 'green', status: 'tentative'});
  s.fetch.mockImplementation(async () => Response.json({model: NOTE_EXTRACTION_MODEL, status: 'completed', output: [{type: 'message', role: 'assistant', status: 'completed', content: [{type: 'output_text', text: JSON.stringify({version: 1, turnId: 't1', patches: []})}]}]}));
  const note = active.snapshot().notes.color; expect(active.probe.edit('color', 'Blue', note.revision)).toBe(true);
  active.probe.receive({type: 'conversation.item.input_audio_transcription.delta', event_id: 'e2', item_id: 'i1', content_index: 0, delta: ' please'});
  await vi.advanceTimersByTimeAsync(100); expect(active.snapshot().notes.color.value).toBe('Blue');
  await active.end(); expect(active.snapshot().notes.color.status).toBe('missing'); expect(s.allowance.closeVerified).toHaveBeenCalledTimes(1); expect(vi.getTimerCount()).toBe(0);
 });
 it('aborts pending extraction on exit and ignores its late successful result', async () => {
  vi.useFakeTimers(); const s = setup(), abort = new AbortController(); let signal: AbortSignal | undefined, resolve!: (response: Response) => void;
  s.fetch.mockImplementation(async (_url, init) => {signal = init.signal as AbortSignal; return new Promise(r => {resolve = r;});});
  const active = await s.owner.start(request({signal: abort.signal})); if (active.status !== 200) throw Error('start');
  active.probe.receive({type: 'session.updated', session: {type: 'transcription', audio: {input: {format: {type: 'audio/pcm', rate: 24000}, transcription: {model: TRANSCRIPTION_MODEL}, turn_detection: null}}}});
  await active.probe.beginTurn('t1'); active.probe.receive({type: 'conversation.item.input_audio_transcription.delta', event_id: 'e1', item_id: 'i1', content_index: 0, delta: 'green'});
  await vi.advanceTimersByTimeAsync(100); expect(signal?.aborted).toBe(false); abort.abort(); await active.end(); expect(signal?.aborted).toBe(true);
  resolve(Response.json({model: NOTE_EXTRACTION_MODEL, status: 'completed', output: [{type: 'message', role: 'assistant', status: 'completed', content: [{type: 'output_text', text: JSON.stringify({version: 1, turnId: 't1', patches: [{field: 'color', value: 'green', evidence: 'green'}]})}]}]}));
  await vi.advanceTimersByTimeAsync(0); expect(active.snapshot().notes.color.status).toBe('missing'); expect(s.changed).toHaveBeenLastCalledWith(null); expect(s.allowance.closeVerified).toHaveBeenCalledTimes(1); expect(vi.getTimerCount()).toBe(0);
 });
 it('bounds the pending allowance lifetime and cleans a late success', async () => {vi.useFakeTimers(); const s = setup(); let resolve!: (id: string) => void; s.allowance.reserve.mockImplementation(() => new Promise(r => {resolve = r;})); const pending = s.owner.start(request()); await vi.advanceTimersByTimeAsync(85_000); expect(s.owner.status().state).toBe('starting'); resolve('late'); expect(await pending).toEqual({status: 499}); expect(s.createTransports).not.toHaveBeenCalled(); expect(s.allowance.closeVerified).toHaveBeenCalledExactlyOnceWith('late'); expect(vi.getTimerCount()).toBe(0);});
});
