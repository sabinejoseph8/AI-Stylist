import { describe, expect, it, vi } from 'vitest';
import { ContextRecovery } from '../src/context-recovery.ts';
import { RendererTeardown } from '../src/renderer-teardown.ts';
import { withRendererTeardown } from '../src/renderer-recovery.ts';
import { VoiceSession } from '../src/voice-session.ts';
import { SILENT_FRAME } from '../src/contracts.ts';
function fixture(destroy: () => Promise<void>, isDestroyed = () => true) {
  const session = new VoiceSession('room'); const old = session.start('old-response','old-item');
  session.enqueue({...old,eventId:'audio',pcm:SILENT_FRAME});session.takeAudio();session.interrupt();
  const element = {muted:false,srcObject:{} as MediaStream,pause:vi.fn()};
  const invalidate = vi.fn();
  const transport = {stopLocalOutput:vi.fn(),closeOldContext:vi.fn(async()=>true),openFreshContext:vi.fn(async()=>({id:'fresh',configurationVerified:true})),restoreConfirmedContext:vi.fn(async()=>true),discardFreshContext:vi.fn(async()=>{})};
  const renderer = new RendererTeardown({destroy,isDestroyed},[element],invalidate);
  const recovery = new ContextRecovery(session,withRendererTeardown(transport,renderer));
  return {session,element,invalidate,transport,recovery};
}
describe('recovery with actual local disposal coordination, simulated clients',()=>{
  it('detaches immediately and waits for destruction before opening replacement',async()=>{
    let finish!:()=>void;const f=fixture(()=>new Promise<void>(resolve=>{finish=resolve;}));
    const result=f.recovery.recover('old');
    expect(f.element.srcObject).toBeNull();expect(f.element.muted).toBe(true);expect(f.invalidate).toHaveBeenCalledOnce();
    await Promise.resolve();await Promise.resolve();expect(f.transport.openFreshContext).not.toHaveBeenCalled();
    finish();expect(await result).toBe(true);expect(f.transport.openFreshContext).toHaveBeenCalledOnce();
  });
  it('refuses replacement when destruction is not verified',async()=>{
    const f=fixture(async()=>{},()=>false);
    expect(await f.recovery.recover('old')).toBe(false);expect(f.transport.openFreshContext).not.toHaveBeenCalled();expect(f.session.snapshot().state).toBe('held');
  });
  it('disposes local playback even when remote closure is refused',async()=>{
    const destroy=vi.fn(async()=>{});const f=fixture(destroy);f.transport.closeOldContext.mockResolvedValue(false);
    expect(await f.recovery.recover('old')).toBe(false);expect(destroy).toHaveBeenCalledOnce();expect(f.element.srcObject).toBeNull();expect(f.transport.openFreshContext).not.toHaveBeenCalled();
  });
});
