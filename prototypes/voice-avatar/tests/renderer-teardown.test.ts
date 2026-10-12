import { describe, expect, it, vi } from 'vitest';
import { RendererTeardown } from '../src/renderer-teardown.ts';
describe('local renderer disposal', () => {
  it('invalidates attachments and detaches playback before destroying, once', async () => {
    const order: string[] = [];
    const element = { muted: false, srcObject: {} as MediaStream, pause: () => order.push('pause') };
    const client = { destroy: vi.fn(async () => { order.push('destroy'); }), isDestroyed: () => true };
    const teardown = new RendererTeardown(client, [element], () => order.push('invalidate'));
    expect(await teardown.dispose(new AbortController().signal)).toBe(true);
    expect(order).toEqual(['invalidate', 'pause', 'destroy']);
    expect(element.srcObject).toBeNull(); expect(element.muted).toBe(true);
    expect(await teardown.dispose(new AbortController().signal)).toBe(true);
    expect(client.destroy).toHaveBeenCalledTimes(1);
  });
  it('refuses an acknowledgment without a destroyed client', async () => {
    const teardown = new RendererTeardown({ destroy: async () => {}, isDestroyed: () => false }, [], () => {});
    expect(await teardown.dispose(new AbortController().signal)).toBe(false);
  });
  it('holds on failure and never retries destruction', async () => {
    const destroy = vi.fn(async () => { throw Error('failed'); });
    const teardown = new RendererTeardown({ destroy, isDestroyed: () => true }, [], () => {});
    expect(await teardown.dispose(new AbortController().signal)).toBe(false);
    expect(await teardown.dispose(new AbortController().signal)).toBe(false);
    expect(destroy).toHaveBeenCalledTimes(1);
  });
  it('does not authorize recovery after cancellation but continues cleanup', async () => {
    let finish!: () => void;
    const destroy = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    const teardown = new RendererTeardown({ destroy, isDestroyed: () => true }, [], () => {});
    const controller = new AbortController(); const result = teardown.dispose(controller.signal);
    controller.abort(); expect(await result).toBe(false); finish();
    expect(await teardown.dispose(new AbortController().signal)).toBe(true);
    expect(destroy).toHaveBeenCalledTimes(1);
  });
  it('still destroys and detaches when invalidation or pause fails', async () => {
    const destroy = vi.fn(async () => {});
    const element = { muted: false, srcObject: {} as MediaStream, pause: () => { throw Error('pause'); } };
    const teardown = new RendererTeardown({ destroy, isDestroyed: () => true }, [element], () => { throw Error('invalidate'); });
    expect(await teardown.dispose(new AbortController().signal)).toBe(false);
    expect(element.srcObject).toBeNull(); expect(element.muted).toBe(true);
    expect(destroy).toHaveBeenCalledTimes(1);
  });

});
