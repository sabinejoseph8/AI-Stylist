import { describe, expect, it } from 'vitest';
import { encodePcm } from '../src/microphone.ts';
describe('microphone PCM conversion, synthetic samples only', () => {
  it('uses bounded little-endian PCM16 and clamps samples', () => {
    const samples = new Float32Array(4800); samples.set([-2, -1, 0, 1, 2, NaN]);
    const bytes = Buffer.from(encodePcm(samples), 'base64'); expect(bytes.length).toBe(9600);
    expect([0,2,4,6,8,10].map(offset => bytes.readInt16LE(offset))).toEqual([-32768,-32768,0,32767,32767,0]);
  });
  it('rejects too little or too much input', () => { for (const size of [0,4799,288001]) expect(() => encodePcm(new Float32Array(size))).toThrow(); });
  it('accepts the twelve-second ceiling', () => expect(Buffer.from(encodePcm(new Float32Array(288000)), 'base64').length).toBe(576000));
});
