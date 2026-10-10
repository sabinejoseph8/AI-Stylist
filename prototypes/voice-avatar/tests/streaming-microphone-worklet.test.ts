import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

function processor(rate = 24000) {
  let Constructor: any;
  const messages: any[] = [];
  class Base { port = { onmessage: null as any, postMessage: (message: any) => messages.push(message) }; }
  runInNewContext(readFileSync(new URL('../src/streaming-microphone-worklet.js', import.meta.url), 'utf8'), {
    AudioWorkletProcessor: Base, sampleRate: rate, Float32Array, Int16Array, ArrayBuffer, DataView,
    registerProcessor: (_name: string, type: any) => { Constructor = type; },
  });
  return { node: new Constructor(), messages };
}
describe('bounded continuous worklet, synthetic microphone only', () => {
  it.each([8000, 24000, 44100, 48000, 96000])('emits exact 20 ms PCM frames at native %s Hz', rate => {
    const { node, messages } = processor(rate);
    node.process([[new Float32Array(rate / 10).fill(0.25)]]);
    // Without credits, only the first four frames may cross into the UI queue.
    expect(messages.filter(m => m.type === 'pcm')).toHaveLength(4);
    expect(messages.at(-1)).toMatchObject({ type: 'stopped', reason: 'backpressure' });
    for (const message of messages.filter(m => m.type === 'pcm')) {
      expect(message.pcm.byteLength).toBe(960);
      expect(new DataView(message.pcm).getInt16(0, true)).toBe(8192);
    }
  });
  it('keeps output silent and clamps nonfinite and out-of-range input', () => {
    const { node, messages } = processor();
    const samples = new Float32Array(480); samples.set([-2, -1, 0, 1, 2, NaN]);
    const output = new Float32Array(128).fill(1);
    node.process([[samples]], [[output]]);
    expect(output.every(value => value === 0)).toBe(true);
    const pcm = new DataView(messages[0].pcm);
    expect([0,2,4,6,8,10].map(offset => pcm.getInt16(offset, true))).toEqual([-32768,-32768,0,32767,32767,0]);
  });
  it('preserves frame order and returns credits without accumulating audio history', () => {
    const { node, messages } = processor();
    for (let i = 0; i < 100; i++) {
      node.process([[new Float32Array(480)]]); node.port.onmessage({ data: 'credit' });
    }
    expect(messages.map(m => m.sequence)).toEqual(Array.from({ length: 100 }, (_, i) => i));
    expect(node.used).toBe(0); expect(node.packet.length).toBe(480);
    expect(node.process([])).toBe(true);
  });
  it('stops at the sample-count deadline even without browser timers', () => {
    const { node, messages } = processor();
    for (let i = 0; i < 4250; i++) {
      node.process([[new Float32Array(480)]]); node.port.onmessage({ data: 'credit' });
    }
    expect(messages.filter(m => m.type === 'pcm')).toHaveLength(4250);
    expect(node.process([[new Float32Array(1)]])).toBe(false);
    expect(messages.at(-1)).toMatchObject({ type: 'stopped', reason: 'time-limit' });
  });
  it('discards partial frames on stop and never restarts with late credits', () => {
    const { node, messages } = processor(); node.process([[new Float32Array(128).fill(0.5)]]);
    node.port.onmessage({ data: 'stop' }); node.port.onmessage({ data: 'stop' }); node.port.onmessage({ data: 'credit' });
    expect(node.process([[new Float32Array(480)]])).toBe(false);
    expect(messages).toEqual([{ type: 'stopped', reason: 'requested' }]);
    expect(node.packet.every((value: number) => value === 0)).toBe(true);
  });
  it('fails closed for unsupported sample rates', () => {
    for (const rate of [0, NaN, 200000]) {
      const { node, messages } = processor(rate);
      expect(node.process([])).toBe(false);
      expect(messages).toEqual([{ type: 'stopped', reason: 'sample-rate' }]);
    }
  });
});
