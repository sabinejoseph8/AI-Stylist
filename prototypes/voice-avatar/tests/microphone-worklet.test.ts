import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
function processor() {
  let Constructor: any;
  class Base { port = { onmessage: null as any, postMessage: (message: any) => messages.push(message) }; }
  const messages: any[] = [];
  runInNewContext(readFileSync(new URL('../src/microphone-worklet.js', import.meta.url), 'utf8'), { AudioWorkletProcessor: Base, sampleRate: 24000, Float32Array, registerProcessor: (_name: string, type: any) => { Constructor = type; } });
  return { node: new Constructor(), messages };
}
describe('microphone worklet, synthetic samples only', () => {
  it('caps samples at twelve seconds independently of browser timers', () => {
    const { node, messages } = processor(); const input = [[new Float32Array(128).fill(0.25)]];
    for (let i = 0; i < 2300; i++) node.process(input);
    expect(messages.filter(m => m.type === 'samples').reduce((sum, m) => sum + m.samples.length, 0)).toBe(288000);
    expect(messages.filter(m => m.type === 'finished')).toHaveLength(1); expect(node.process(input)).toBe(false);
  });
  it('flushes the last partial buffer once when Send is selected', () => {
    const { node, messages } = processor(); node.process([[new Float32Array(128).fill(0.2)]]);
    node.port.onmessage({ data: 'finish' }); node.port.onmessage({ data: 'finish' });
    expect(messages.map(m => m.type)).toEqual(['samples','finished']); expect(messages[0].samples.length).toBe(128);
  });
  it('does not fabricate samples when no microphone channel is present', () => {
    const { node, messages } = processor(); node.process([]); node.port.onmessage({ data: 'finish' }); expect(messages.map(m => m.type)).toEqual(['finished']);
  });
});
