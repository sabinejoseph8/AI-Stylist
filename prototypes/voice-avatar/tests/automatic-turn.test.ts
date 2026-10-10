import { describe, expect, it, vi } from 'vitest';
import { AutomaticTurn } from '../src/automatic-turn.ts';
const frame = (amplitude = 0) => {
  const buffer = new ArrayBuffer(960), view = new DataView(buffer);
  for (let i = 0; i < 480; i++) view.setInt16(i * 2, amplitude, true);
  return buffer;
};
describe('automatic local turn capture, synthetic PCM only', () => {
  it('waits for sustained sound, captures a bounded pre-roll and submits after a pause', () => {
    const start = vi.fn(() => true), turn = vi.fn(), detector = new AutomaticTurn(start, turn);
    for (let i = 0; i < 20; i++) detector.consume(frame());
    for (let i = 0; i < 8; i++) detector.consume(frame(3000));
    expect(start).toHaveBeenCalledTimes(1); expect(turn).not.toHaveBeenCalled();
    for (let i = 0; i < 30; i++) detector.consume(frame());
    expect(turn).toHaveBeenCalledTimes(1);
    expect(Buffer.from(turn.mock.calls[0]![0], 'base64').length).toBe(45 * 960);
  });
  it('does not submit silence or isolated loud frames', () => {
    const start = vi.fn(() => true), turn = vi.fn(), detector = new AutomaticTurn(start, turn);
    for (let i = 0; i < 1000; i++) detector.consume(frame(i % 4 === 0 ? 3000 : 0));
    expect(start).not.toHaveBeenCalled(); expect(turn).not.toHaveBeenCalled();
  });
  it('refuses an interruption before retaining or submitting another turn', () => {
    const start = vi.fn(() => false), turn = vi.fn(), detector = new AutomaticTurn(start, turn);
    detector.consume(frame(3000)); detector.consume(frame(3000));
    expect(detector.consume(frame(3000))).toBe(false);
    for (let i = 0; i < 30; i++) detector.consume(frame());
    expect(turn).not.toHaveBeenCalled();
  });
  it('caps a continuous utterance at twelve seconds without waiting for silence', () => {
    const turn = vi.fn(), detector = new AutomaticTurn(() => true, turn);
    for (let i = 0; i < 600; i++) detector.consume(frame(3000));
    expect(turn).toHaveBeenCalledTimes(1); expect(Buffer.from(turn.mock.calls[0]![0], 'base64').length).toBe(576000);
  });
  it('reset discards the previous utterance and permits a new independently detected one', () => {
    const start = vi.fn(() => true), turn = vi.fn(), detector = new AutomaticTurn(start, turn);
    for (let i = 0; i < 20; i++) detector.consume(frame(3000));
    detector.reset(); for (let i = 0; i < 30; i++) detector.consume(frame());
    expect(turn).not.toHaveBeenCalled();
    for (let i = 0; i < 10; i++) detector.consume(frame(4000));
    for (let i = 0; i < 30; i++) detector.consume(frame());
    expect(start).toHaveBeenCalledTimes(2); expect(turn).toHaveBeenCalledTimes(1);
  });
  it('rejects malformed input instead of guessing its duration', () => {
    const detector = new AutomaticTurn(() => true, () => {});
    expect(() => detector.consume(new ArrayBuffer(958))).toThrow();
  });
});
