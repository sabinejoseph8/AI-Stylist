import {afterEach, describe, expect, it, vi} from 'vitest';
import {createPreparedNoteServerOwner} from '../src/prepared-note-server-owner.ts';
import {NOTE_EXTRACTION_MODEL} from '../src/openai-note-extractor.ts';
import {SimulatedPreferenceSource} from '../src/simulated-preference-source.ts';
import {TRANSCRIPTION_MODEL} from '../src/live-transcription.ts';
const preview = {origin: 'https://notes-test.onrender.com', password: 'x'.repeat(32)};
const authorization = 'Basic ' + Buffer.from('stylist:' + preview.password).toString('base64');
class Socket extends EventTarget {readyState = 1; bufferedAmount = 0; send = vi.fn(); close = vi.fn();}
function setup(preferences?: SimulatedPreferenceSource) {
 const socket = new Socket(), capture = {start: vi.fn(async (_accept?: (pcm: ArrayBuffer) => boolean) => true), stop: vi.fn(), end: vi.fn()};
 const allowance = {purpose: 'notes-only-simulation' as const, reserve: vi.fn(async () => 'synthetic-reservation'), closeVerified: vi.fn(async (_id: string) => {})};
 const fetch = vi.fn(async (_url: string, _init: RequestInit) => Response.json({}));
 const createTransports = vi.fn(() => ({socket, capture, fetch}));
 const options = {simulation: true, preview, allowance, preferences, createTransports, changed: vi.fn()};
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

describe('server-owned synthetic look authorization', () => {
 const draft = {id:'synthetic-look',color:'green',style:'structured',occasion:'wedding',lookType:'dress',newItemCents:30000,currency:'USD' as const};
 async function activeSession(preferences?: SimulatedPreferenceSource) {
  const s = setup(preferences), active = await s.owner.start(request());
  if (active.status !== 200) throw Error('start');
  active.probe.receive({type: 'session.updated', session: {type: 'transcription', audio: {input: {format: {type: 'audio/pcm', rate: 24000}, transcription: {model: TRANSCRIPTION_MODEL}, turn_detection: null}}}});
  for(const [field,value] of Object.entries({occasion:'wedding',season:'November; season not specified',color:'green',style:'structured',budget:'USD 500 maximum (items only)',lookType:'dress'}))active.probe.edit(field as 'color',value,0);
  const ticket = active.looks.begin(draft); if (!ticket) throw Error('ticket');
  const permit = active.looks.complete(ticket); if (!permit) throw Error('permit');
  return {...s, active, ticket, permit};
 }
 it('requires provider readiness and preserves exact ticket and permit identities', async () => {
  const s = setup(), active = await s.owner.start(request()); if (active.status !== 200) throw Error('start');
  expect(active.looks.begin(draft)).toBeNull(); await active.end();
  const a = await activeSession();
  expect(a.active.looks.visual({...a.permit})).toBeNull();
  expect(a.active.looks.visual(a.permit)).toMatchObject({id:draft.id,description:expect.stringContaining('Synthetic sample: green')});
  const ticket = a.active.looks.begin(draft)!;
  expect(a.active.looks.complete({...ticket})).toBeNull();
  expect(a.active.looks.complete(ticket)).not.toBeNull(); await a.active.end();
 });
 it.each([{color:'red'},{newItemCents:50001}])('holds a conflicting synthetic candidate %j', async changes => {
  const a=await activeSession(),ticket=a.active.looks.begin({...draft,...changes})!;
  expect(a.active.looks.complete(ticket)).toBeNull(); expect(a.active.looks.visual(a.permit)).toBeNull();
  expect(a.active.snapshot().gate?.state).toBe('held'); await a.active.end();
 });
 it('requires confirmed fields and does not accept a forged passed result', async () => {
  const a=await activeSession(); a.active.probe.edit('budget','',1);
  const ticket=a.active.looks.begin(draft)!;
  const forged=a.active.looks.complete as (...args: unknown[]) => unknown;
  expect(forged(ticket,{outcome:'passed',reason:'forged'})).toBeNull(); await a.active.end();
 });
 it('captures immutable candidate data and rejects description injection', async () => {
  const a=await activeSession(), candidate={...draft};
  const ticket=a.active.looks.begin(candidate)!; candidate.color='red';
  const permit=a.active.looks.complete(ticket)!;expect(permit).not.toBeNull();
  expect(a.active.looks.visual(permit)?.description).toContain('Synthetic sample: green');
  expect(a.active.looks.begin({...draft,description:'Unchecked text'} as never)).toBeNull();
  expect(a.active.looks.visual(permit)).toBeNull(); await a.active.end();
 });
 it('rejects a result if notes change between candidate capture and validation', async () => {
  const a=await activeSession(),ticket=a.active.looks.begin(draft)!;
  a.active.probe.edit('budget','USD 100 maximum (items only)',1);
  expect(a.active.looks.complete(ticket)).toBeNull(); await a.active.end();
 });
 it('applies server preferences even when the candidate omits exclusions', async () => {
  const source=new SimulatedPreferenceSource({simulation:true,excludedColors:['pink']}),a=await activeSession(source);
  expect(source.replace(1,['green'])).toBe(true);
  const ticket=a.active.looks.begin(draft)!; expect(a.active.looks.complete(ticket)).toBeNull();
  expect(a.active.looks.begin({...draft,excludedColors:[]} as never)).toBeNull(); await a.active.end();
 });
 it('revokes a pending check and queued speech when the profile changes', async () => {
  const source=new SimulatedPreferenceSource({simulation:true}),a=await activeSession(source);let signal!:AbortSignal,frame!:()=>boolean;
  a.active.looks.startSpeech(a.permit,(_draft,abort,authorize)=>{signal=abort;frame=authorize;});
  source.replace(1,['pink']);expect(signal.aborted).toBe(true);expect(frame()).toBe(false);expect(a.active.looks.visual(a.permit)).toBeNull();
  const ticket=a.active.looks.begin(draft)!;source.replace(2,['green']);expect(a.active.looks.complete(ticket)).toBeNull();await a.active.end();
 });
 it('holds invalid preference updates and does not restore old approvals', async () => {
  const source=new SimulatedPreferenceSource({simulation:true}),a=await activeSession(source);let signal!:AbortSignal;
  a.active.looks.startSpeech(a.permit,(_draft,abort)=>{signal=abort;});
  expect(source.replace(1,[''])).toBe(false);expect(signal.aborted).toBe(true);expect(a.active.looks.begin(draft)).toBeNull();await a.active.end();
  expect(await a.owner.start(request())).toEqual({status:503});
 });
 it('detaches profile listeners when the session ends', async () => {
  const source=new SimulatedPreferenceSource({simulation:true}),a=await activeSession(source);await a.active.end();const before=a.active.snapshot();
  expect(source.replace(1,['blue'])).toBe(true);expect(a.active.snapshot()).toEqual(before);
 });
 it('revokes both display and queued speech immediately on a touch correction', async () => {
  const a = await activeSession(); let signal!: AbortSignal, frame!: () => boolean;
  expect(a.active.looks.startSpeech(a.permit, (_draft, abort, authorize) => {signal = abort; frame = authorize;})).toBe(true);
  expect(frame()).toBe(true); expect(a.active.probe.edit('color', 'Blue', 1)).toBe(true);
  expect(signal.aborted).toBe(true); expect(frame()).toBe(false); expect(a.active.looks.visual(a.permit)).toBeNull(); await a.active.end();
 });
 it('revokes before microphone permission resolves and blocks approval during capture', async () => {
  const a = await activeSession(); let grant!: (value: boolean) => void, signal!: AbortSignal;
  a.capture.start.mockImplementation(() => new Promise(resolve => {grant = resolve;}));
  a.active.looks.startSpeech(a.permit, (_draft, abort) => {signal = abort;});
  const acquiring = a.active.probe.beginTurn('pending');
  expect(signal.aborted).toBe(true); expect(a.active.looks.begin(draft)).toBeNull();
  grant(true); expect(await acquiring).toBe(true); expect(a.active.looks.begin(draft)).toBeNull(); await a.active.end();
 });
 it('blocks validation while committed audio awaits final extraction', async () => {
  const a = await activeSession(); let send!: (pcm: ArrayBuffer) => boolean;
  a.capture.start.mockImplementation(async (accept?: (pcm: ArrayBuffer) => boolean) => {send = accept!; return true;});
  expect(await a.active.probe.beginTurn('pending')).toBe(true); for(let i=0;i<5;i++)expect(send(new ArrayBuffer(960))).toBe(true);
  expect(a.active.probe.commit()).toBe(true);
  expect(a.active.looks.begin(draft)).toBeNull();
  expect(a.active.looks.complete(a.ticket)).toBeNull(); await a.active.end();
 });
 it('waits for final extraction settlement before permitting a fresh check', async () => {
  vi.useFakeTimers(); const a = await activeSession(); let send!: (pcm: ArrayBuffer) => boolean, respond!: (value: Response) => void;
  a.capture.start.mockImplementation(async accept => {send=accept!;return true;});
  a.fetch.mockImplementation(async () => new Promise(resolve => {respond=resolve;}));
  await a.active.probe.beginTurn('t1'); for(let i=0;i<5;i++)send(new ArrayBuffer(960)); a.active.probe.commit();
  a.active.probe.receive({type:'input_audio_buffer.committed',event_id:'commit1',item_id:'i1'});
  a.active.probe.receive({type:'conversation.item.input_audio_transcription.completed',event_id:'final1',item_id:'i1',content_index:0,transcript:'green'});
  await vi.advanceTimersByTimeAsync(100);
  expect(a.active.probe.snapshot().notes.extracting).toBe(true); expect(a.active.looks.begin(draft)).toBeNull();
  respond(Response.json({model:NOTE_EXTRACTION_MODEL,status:'completed',output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:JSON.stringify({version:1,turnId:'t1',patches:[]})}]}]}));
  await vi.advanceTimersByTimeAsync(0);
  expect(a.active.probe.readyForLook()).toBe(true); expect(a.active.looks.visual(a.permit)).toBeNull();
  const ticket=a.active.looks.begin(draft)!; expect(a.active.looks.complete(ticket)).not.toBeNull(); await a.active.end();
 });
 it('revokes synchronously while durable closure remains pending', async () => {
  const a = await activeSession(); let close!: () => void, signal!: AbortSignal;
  a.allowance.closeVerified.mockImplementation(() => new Promise(resolve => {close = resolve;}));
  a.active.looks.startSpeech(a.permit, (_draft, abort) => {signal = abort;});
  const ending = a.active.end(); expect(signal.aborted).toBe(true);
  expect(a.active.looks.visual(a.permit)).toBeNull(); expect(a.active.looks.begin(draft)).toBeNull();
  await Promise.resolve(); close(); await ending;
 });
 it('cannot reuse an old owner capability after a replacement starts', async () => {
  const a = await activeSession(); await a.active.end();
  const next = await a.owner.start(request()); if (next.status !== 200) throw Error('start');
  expect(a.active.looks.begin(draft)).toBeNull(); expect(a.active.looks.visual(a.permit)).toBeNull();
  expect(a.active.looks.startSpeech(a.permit, vi.fn())).toBe(false); await next.end();
 });
 it('revokes on provider failure even when cleanup is uncertain', async () => {
  const a = await activeSession(); let signal!: AbortSignal;
  a.active.looks.startSpeech(a.permit, (_draft, abort) => {signal = abort;});
  a.socket.close.mockImplementation(() => {throw Error('synthetic cleanup failure');});
  a.socket.dispatchEvent(new Event('error')); expect(signal.aborted).toBe(true);
  expect(a.active.looks.visual(a.permit)).toBeNull(); await a.active.end(); expect(a.owner.status().state).toBe('held');
 });
 it('revokes the active permit at the bounded deadline', async () => {
  vi.useFakeTimers(); const a = await activeSession(); let signal!: AbortSignal;
  a.active.looks.startSpeech(a.permit, (_draft, abort) => {signal = abort;});
  await vi.advanceTimersByTimeAsync(85_000); expect(signal.aborted).toBe(true);
  expect(a.active.looks.visual(a.permit)).toBeNull(); await a.active.end(); expect(vi.getTimerCount()).toBe(0);
 });
});
