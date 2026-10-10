import { afterEach, describe, expect, it, vi } from 'vitest';
import { StreamingMicrophone } from '../src/streaming-microphone.ts';

function setup() {
  const document = Object.assign(new EventTarget(), { hidden: false });
  const window = new EventTarget();
  const track = Object.assign(new EventTarget(), { readyState: 'live', stop: vi.fn() });
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
  const media = vi.fn().mockResolvedValue(stream);
  const source = { connect: vi.fn(), disconnect: vi.fn() };
  const contexts: any[] = [], nodes: any[] = [];
  class Context {
    state = 'running'; sampleRate = 24000; destination = {};
    audioWorklet = { addModule: vi.fn().mockResolvedValue(undefined) };
    resume = vi.fn().mockResolvedValue(undefined); close = vi.fn().mockResolvedValue(undefined);
    createMediaStreamSource = vi.fn(() => source);
    constructor() { contexts.push(this); }
  }
  class Node {
    port = { onmessage: null as any, postMessage: vi.fn() }; onprocessorerror: any = null;
    connect = vi.fn(); disconnect = vi.fn();
    constructor() { nodes.push(this); }
  }
  vi.stubGlobal('document', document); vi.stubGlobal('window', window);
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: media } });
  vi.stubGlobal('AudioContext', Context); vi.stubGlobal('AudioWorkletNode', Node);
  return { document, window, track, stream, media, source, contexts, nodes };
}
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe('streaming capture lifecycle, mocked devices only', () => {
  it('requires explicit start, delivers one frame at a time and returns credit only after acceptance', async () => {
    const env = setup(); const capture = new StreamingMicrophone(); const accept = vi.fn(() => true), stopped = vi.fn();
    expect(env.media).not.toHaveBeenCalled();
    expect(await capture.start(accept, stopped)).toBe(true);
    expect(env.media).toHaveBeenCalledWith({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 }, video: false });
    env.nodes[0].port.onmessage({ data: { type: 'pcm', sequence: 0, pcm: new ArrayBuffer(960) } });
    expect(accept).toHaveBeenCalledTimes(1); expect(env.nodes[0].port.postMessage).toHaveBeenCalledWith('credit');
    capture.stop(); expect(env.track.stop).toHaveBeenCalledTimes(1); expect(stopped).toHaveBeenCalledWith('requested');
    expect(env.contexts[0].close).toHaveBeenCalledTimes(1);
  });
  it('stops on transport refusal and ignores a late frame callback', async () => {
    const env = setup(); const capture = new StreamingMicrophone(); const accept = vi.fn(() => false), stopped = vi.fn();
    await capture.start(accept, stopped); const callback = env.nodes[0].port.onmessage;
    callback({ data: { type: 'pcm', sequence: 0, pcm: new ArrayBuffer(960) } });
    callback({ data: { type: 'pcm', sequence: 1, pcm: new ArrayBuffer(960) } });
    expect(accept).toHaveBeenCalledTimes(1); expect(stopped).toHaveBeenCalledWith('transport-held');
    expect(env.nodes[0].port.postMessage).not.toHaveBeenCalledWith('credit');
  });
  it.each([{ type: 'pcm', sequence: 1, pcm: new ArrayBuffer(960) }, { type: 'pcm', sequence: 0, pcm: new ArrayBuffer(962) }, {}])('rejects invalid or out-of-order frames', async message => {
    const env = setup(); const capture = new StreamingMicrophone(), accept = vi.fn(() => true), stopped = vi.fn();
    await capture.start(accept, stopped); env.nodes[0].port.onmessage({ data: message });
    expect(accept).not.toHaveBeenCalled(); expect(stopped).toHaveBeenCalledWith('capture-failed');
  });
  it('stops pending permission and closes a late device grant', async () => {
    const env = setup(); let grant!: (stream: unknown) => void;
    env.media.mockReturnValue(new Promise(resolve => { grant = resolve; }));
    const capture = new StreamingMicrophone(), stopped = vi.fn(); const pending = capture.start(() => true, stopped);
    capture.stop(); grant(env.stream);
    expect(await pending).toBe(false); expect(env.track.stop).toHaveBeenCalledTimes(1);
    expect(env.nodes).toHaveLength(0); expect(stopped).toHaveBeenCalledTimes(1);
  });
  it('stops when hidden, on page exit and on device loss', async () => {
    for (const event of ['visibilitychange', 'pagehide', 'ended']) {
      const env = setup(); const capture = new StreamingMicrophone(), stopped = vi.fn();
      await capture.start(() => true, stopped);
      if (event === 'visibilitychange') { env.document.hidden = true; env.document.dispatchEvent(new Event(event)); }
      else if (event === 'pagehide') env.window.dispatchEvent(new Event(event));
      else env.track.dispatchEvent(new Event(event));
      expect(env.track.stop).toHaveBeenCalledTimes(1); expect(stopped).toHaveBeenCalledTimes(1);
    }
  });
  it('enforces an independent wall-clock deadline', async () => {
    vi.useFakeTimers(); const env = setup(); const capture = new StreamingMicrophone(), stopped = vi.fn();
    await capture.start(() => true, stopped); vi.advanceTimersByTime(85000);
    expect(stopped).toHaveBeenCalledWith('time-limit'); expect(env.track.stop).toHaveBeenCalledTimes(1);
    capture.stop(); expect(stopped).toHaveBeenCalledTimes(1);
  });
  it('cleans up on permission denial without leaking the audio context', async () => {
    const env = setup(); env.media.mockRejectedValue(new Error('denied'));
    const stopped = vi.fn(); expect(await new StreamingMicrophone().start(() => true, stopped)).toBe(false);
    expect(stopped).toHaveBeenCalledWith('capture-failed'); expect(env.contexts[0].close).toHaveBeenCalledTimes(1);
  });
  it('cleans up before notifying an owner that throws', async () => {
    const env = setup(); const capture = new StreamingMicrophone();
    await capture.start(() => { throw new Error('transport'); }, () => { throw new Error('owner'); });
    expect(() => env.nodes[0].port.onmessage({ data: { type: 'pcm', sequence: 0, pcm: new ArrayBuffer(960) } })).not.toThrow();
    expect(env.track.stop).toHaveBeenCalledTimes(1); expect(env.source.disconnect).toHaveBeenCalledTimes(1);
  });
  it('ignores a late permission grant from a replaced capture without stopping the current one', async () => {
    const env = setup(); let grant!: (stream: unknown) => void;
    const oldTrack = { stop: vi.fn() };
    env.media.mockReturnValueOnce(new Promise(resolve => { grant = resolve; }));
    const capture = new StreamingMicrophone(), oldStopped = vi.fn(), currentStopped = vi.fn();
    const oldStart = capture.start(() => true, oldStopped);
    expect(await capture.start(() => true, currentStopped)).toBe(true);
    grant({ getTracks: () => [oldTrack] }); expect(await oldStart).toBe(false);
    expect(oldTrack.stop).toHaveBeenCalledTimes(1); expect(env.track.stop).not.toHaveBeenCalled();
    expect(oldStopped).toHaveBeenCalledWith('requested'); expect(currentStopped).not.toHaveBeenCalled(); capture.stop();
  });
  it('closes capture on worklet failure and ignores its late callback', async () => {
    const env = setup(); const capture = new StreamingMicrophone(), stopped = vi.fn();
    await capture.start(() => true, stopped); const fail = env.nodes[0].onprocessorerror;
    fail(); fail(); expect(stopped).toHaveBeenCalledTimes(1); expect(env.track.stop).toHaveBeenCalledTimes(1);
  });
  it('does not ask for permission when the page is already hidden', async () => {
    const env = setup(); env.document.hidden = true; const stopped = vi.fn();
    expect(await new StreamingMicrophone().start(() => true, stopped)).toBe(false);
    expect(env.media).not.toHaveBeenCalled(); expect(stopped).toHaveBeenCalledWith('hidden');
  });
  it('continues cleanup if one resource throws while closing', async () => {
    const env = setup(); const capture = new StreamingMicrophone(), stopped = vi.fn();
    await capture.start(() => true, stopped);
    env.source.disconnect.mockImplementation(() => { throw new Error('already disconnected'); });
    capture.stop(); expect(env.nodes[0].disconnect).toHaveBeenCalledTimes(1);
    expect(env.contexts[0].close).toHaveBeenCalledTimes(1); expect(stopped).toHaveBeenCalledWith('requested');
  });
});
