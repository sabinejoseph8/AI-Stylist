import { beforeEach, describe, expect, it, vi } from 'vitest';
const fake = vi.hoisted(() => {
  class Socket {
    static instances: Socket[] = [];
    handlers = new Map<string, ((...args: any[]) => void)[]>(); sent: any[] = []; terminated = false;
    constructor(..._args: unknown[]) { Socket.instances.push(this); }
    on(name: string, callback: (...args: any[]) => void) { this.handlers.set(name, [...this.handlers.get(name) ?? [], callback]); }
    send(body: string) { this.sent.push(JSON.parse(body)); }
    terminate() { this.terminated = true; }
    emit(name: string, ...args: any[]) { for (const handler of this.handlers.get(name) ?? []) handler(...args); }
    event(body: object) { this.emit('message', JSON.stringify(body)); }
  }
  return { Socket };
});
vi.mock('ws', () => ({ default: fake.Socket }));
import { generateSpokenReply, MODEL, VOICE } from '../src/scripted-providers.ts';
const AUDIO = Buffer.alloc(9600).toString('base64');
const delta = { type: 'response.output_audio.delta', event_id: 'audio-one', response_id: 'response-one', item_id: 'item-one', content_index: 0, output_index: 0, delta: Buffer.alloc(960).toString('base64') };
const done = { type: 'response.done', response: { id: 'response-one', status: 'completed', usage: { input_tokens: 30, output_tokens: 20 } } };
function start() {
  const abort = new AbortController(), result = generateSpokenReply('fixture-key', abort.signal, AUDIO, []), socket = fake.Socket.instances.at(-1)!;
  socket.emit('open'); socket.event({ type: 'session.updated', session: { model: MODEL, audio: { input: { format: { type: 'audio/pcm', rate: 24000 }, turn_detection: null }, output: { voice: VOICE, format: { type: 'audio/pcm', rate: 24000 } } }, max_output_tokens: 1024 } });
  socket.event({ type: 'response.created', response: { id: 'response-one' } }); return { abort, result, socket };
}
describe('Realtime spoken generation, mocked socket only', () => {
  beforeEach(() => { fake.Socket.instances = []; });
  it('sends explicit audio input and returns only a bounded completed response', async () => {
    const { result, socket } = start(); expect(socket.sent[0].session.tools).toEqual([]); expect(socket.sent[1].response.input[0].content[0].audio).toBe(AUDIO);
    socket.event(delta); socket.event({ ...delta, type: 'response.output_audio_transcript.delta', event_id: 'text-one', delta: 'Hello.' }); socket.event(done);
    expect(await result).toMatchObject({ transcript: 'Hello.', inputTokens: 30, outputTokens: 20 }); expect(socket.terminated).toBe(true);
  });
  it('deduplicates repeated audio events', async () => {
    const { result, socket } = start(); socket.event(delta); socket.event(delta); socket.event(done); expect((await result).pcm.length).toBe(960);
  });
  it.each([{ ...delta, response_id: 'old' }, { ...delta, content_index: 1 }, { ...delta, event_id: '' }, { ...delta, delta: 'bad' }])('rejects incorrect audio identity or encoding', async event => {
    const { result, socket } = start(); socket.event(event); await expect(result).rejects.toThrow(); expect(socket.terminated).toBe(true);
  });
  it('rejects a transcript from another output item', async () => {
    const { result, socket } = start(); socket.event(delta); socket.event({ ...delta, type: 'response.output_audio_transcript.delta', event_id: 'text-two', item_id: 'different', delta: 'Wrong.' }); await expect(result).rejects.toThrow();
  });
  it('aborts the socket and ignores late completion', async () => {
    const { result, socket, abort } = start(); abort.abort(); socket.event(delta); socket.event(done); await expect(result).rejects.toThrow('canceled'); expect(socket.terminated).toBe(true);
  });
  it('rejects failed generation and unexpected usage', async () => {
    for (const response of [{ ...done.response, status: 'incomplete' }, { ...done.response, usage: { input_tokens: 4001, output_tokens: 20 } }]) {
      const { result, socket } = start(); socket.event(delta); socket.event({ ...done, response }); await expect(result).rejects.toThrow();
    }
  });
});
