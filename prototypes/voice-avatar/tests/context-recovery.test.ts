import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfirmedConversation } from '../src/confirmed-conversation.ts';
import { ContextRecovery } from '../src/context-recovery.ts';
import { VoiceSession } from '../src/voice-session.ts';
import { SILENT_FRAME } from '../src/contracts.ts';
function fixture(confirmed = new ConfirmedConversation()) {
  const session = new VoiceSession('room'); const old = session.start('old-response', 'old-item');
  session.enqueue({ ...old, eventId:'audio', pcm:SILENT_FRAME }); session.takeAudio(); session.interrupt();
  const transport = { stopLocalOutput:vi.fn(), closeOldContext:vi.fn().mockResolvedValue(true), verifyRendererStopped:vi.fn().mockResolvedValue(true), openFreshContext:vi.fn().mockResolvedValue({id:'fresh',configurationVerified:true}), restoreConfirmedContext:vi.fn().mockResolvedValue(true), discardFreshContext:vi.fn().mockResolvedValue(undefined) };
  return {session,old,transport,recovery:new ContextRecovery(session,transport,confirmed)};
}
afterEach(() => vi.useRealTimers());
describe('verified context recovery with synthetic transports only', () => {
  it('stops local output, verifies old closure, then admits a verified fresh context',async()=>{
    const {session,old,transport,recovery}=fixture();
    expect(await recovery.recover('old')).toBe(true); expect(session.snapshot().state).toBe('idle');
    expect(transport.stopLocalOutput.mock.invocationCallOrder[0]).toBeLessThan(transport.closeOldContext.mock.invocationCallOrder[0]!);
    expect(transport.closeOldContext.mock.invocationCallOrder[0]).toBeLessThan(transport.verifyRendererStopped.mock.invocationCallOrder[0]!);
    const current=session.start('new-response','new-item');
    session.enqueue({...old,eventId:'late',pcm:SILENT_FRAME}); expect(session.acknowledgePlayback(old,0)).toBe(false);
    session.enqueue({...current,eventId:'new',pcm:SILENT_FRAME}); expect(session.takeAudio()).toHaveLength(1);
    expect(await recovery.recover('old')).toBe(false);
  });
  it('holds when old renderer output cannot be verified stopped',async()=>{
    const {session,transport,recovery}=fixture();transport.verifyRendererStopped.mockResolvedValue(false);
    expect(await recovery.recover('old')).toBe(false);expect(session.snapshot().state).toBe('held');
    expect(transport.openFreshContext).not.toHaveBeenCalled();
  });
  it.each([false,undefined])('does not open a replacement on unverified closure: %s',async closed=>{
    const {session,transport,recovery}=fixture();transport.closeOldContext.mockResolvedValue(closed);
    expect(await recovery.recover('old')).toBe(false);expect(transport.openFreshContext).not.toHaveBeenCalled();
    expect(session.snapshot().state).toBe('held'); expect(await recovery.recover('old')).toBe(false);
    expect(transport.closeOldContext).toHaveBeenCalledOnce();
  });
  it.each([{id:'old',configurationVerified:true},{id:'fresh',configurationVerified:false},{id:'',configurationVerified:true}])('discards an unusable replacement %j',async fresh=>{
    const {session,transport,recovery}=fixture();transport.openFreshContext.mockResolvedValue(fresh);
    expect(await recovery.recover('old')).toBe(false);expect(session.snapshot().state).toBe('held');
    expect(transport.discardFreshContext).toHaveBeenCalledWith(fresh);
  });
  it('refuses duplicate concurrent recovery and never revives an ended session',async()=>{
    const {session,transport,recovery}=fixture();let resolve!:(v:boolean)=>void;
    transport.closeOldContext.mockImplementation(()=>new Promise(r=>{resolve=r;}));
    const pending=recovery.recover('old');expect(await recovery.recover('old')).toBe(false);
    session.end();resolve(true);expect(await pending).toBe(false);expect(transport.openFreshContext).not.toHaveBeenCalled();expect(session.snapshot().state).toBe('ended');
  });
  it('times out a stalled close without opening a new context or retrying',async()=>{
    vi.useFakeTimers();const {session,transport,recovery}=fixture();transport.closeOldContext.mockImplementation(()=>new Promise(()=>{}));
    const pending=recovery.recover('old',100);await vi.advanceTimersByTimeAsync(100);
    expect(await pending).toBe(false);expect(session.snapshot().state).toBe('held');
    expect(recovery.snapshot().recovering).toBe(false);expect(await recovery.recover('old')).toBe(false);
    expect(transport.openFreshContext).not.toHaveBeenCalled();
  });
  it('discards a replacement arriving after cancellation',async()=>{
    const {session,transport,recovery}=fixture();let resolve!:(v:object)=>void;
    transport.openFreshContext.mockImplementation(()=>new Promise(r=>{resolve=r;}));
    const pending=recovery.recover('old');await Promise.resolve();await Promise.resolve();recovery.cancel();expect(await pending).toBe(false);
    const fresh={id:'late',configurationVerified:true};resolve(fresh);await Promise.resolve();await Promise.resolve();
    expect(transport.discardFreshContext).toHaveBeenCalledWith(fresh);expect(session.snapshot().state).toBe('held');
  });
  it('discards a replacement arriving after its recovery deadline',async()=>{
    vi.useFakeTimers();const {session,transport,recovery}=fixture();let resolve!:(v:object)=>void;
    transport.openFreshContext.mockImplementation(()=>new Promise(r=>{resolve=r;}));
    const pending=recovery.recover('old',100);await Promise.resolve();await Promise.resolve();await vi.advanceTimersByTimeAsync(100);
    expect(await pending).toBe(false);const late={id:'late',configurationVerified:true};resolve(late);await Promise.resolve();await Promise.resolve();
    expect(transport.discardFreshContext).toHaveBeenCalledWith(late);expect(session.snapshot().state).toBe('held');
  });
  it('restores confirmed history only and discards the interrupted pending reply',async()=>{
    const context=new ConfirmedConversation(),audio=Buffer.alloc(9600).toString('base64');
    context.stage(context.revision(),'first',audio,'Heard reply');context.confirm('first');
    context.stage(context.revision(),'second',audio,'Unheard reply');const {transport,recovery}=fixture(context);
    expect(await recovery.recover('old')).toBe(true);
    expect(transport.restoreConfirmedContext).toHaveBeenCalledWith({id:'fresh',configurationVerified:true},[{audio,reply:'Heard reply'}],expect.any(AbortSignal));
    expect(()=>context.confirm('second')).toThrow();
  });
  it('holds and discards the replacement if context restoration is not acknowledged',async()=>{
    const {session,transport,recovery}=fixture();transport.restoreConfirmedContext.mockResolvedValue(false);
    expect(await recovery.recover('old')).toBe(false);expect(session.snapshot().state).toBe('held');expect(transport.discardFreshContext).toHaveBeenCalledOnce();
  });
  it('discards a fresh context when confirmed memory changes during restoration',async()=>{
    const context=new ConfirmedConversation(),{session,transport,recovery}=fixture(context);
    transport.restoreConfirmedContext.mockImplementation(async()=>{context.clear();return true;});
    expect(await recovery.recover('old')).toBe(false);expect(session.snapshot().state).toBe('held');expect(transport.discardFreshContext).toHaveBeenCalledOnce();
  });
  it('starts fresh-context cleanup at the deadline even if restoration never resolves',async()=>{
    vi.useFakeTimers();const {session,transport,recovery}=fixture();transport.restoreConfirmedContext.mockImplementation(()=>new Promise(()=>{}));
    const pending=recovery.recover('old',100);await vi.advanceTimersByTimeAsync(100);
    expect(await pending).toBe(false);expect(transport.discardFreshContext).toHaveBeenCalledOnce();expect(session.snapshot().state).toBe('held');
  });
  it('holds on restoration errors without leaking private content',async()=>{
    const {session,transport,recovery}=fixture();transport.restoreConfirmedContext.mockRejectedValue(Error('private content'));
    expect(await recovery.recover('old')).toBe(false);expect(session.snapshot().state).toBe('held');expect(transport.discardFreshContext).toHaveBeenCalledOnce();
  });
  it('never revives an ended session when a restoration acknowledgment arrives late',async()=>{
    const {session,transport,recovery}=fixture();let resolve!:(value:boolean)=>void;
    transport.restoreConfirmedContext.mockImplementation(()=>new Promise(r=>{resolve=r;}));
    const pending=recovery.recover('old');for(let i=0;i<5;i++)await Promise.resolve();
    session.end();resolve(true);expect(await pending).toBe(false);expect(session.snapshot().state).toBe('ended');
    expect(transport.discardFreshContext).toHaveBeenCalledOnce();
  });
  it('keeps cleanup visible and blocks recovery while fresh-context disposal is unresolved',async()=>{
    vi.useFakeTimers();const {transport,recovery}=fixture();transport.restoreConfirmedContext.mockImplementation(()=>new Promise(()=>{}));
    transport.discardFreshContext.mockImplementation(()=>new Promise(()=>{}));
    const pending=recovery.recover('old',100);await vi.advanceTimersByTimeAsync(100);expect(await pending).toBe(false);
    expect(recovery.snapshot()).toMatchObject({recovering:false,cleanupPending:true});expect(await recovery.recover('old')).toBe(false);
  });
  it('marks failed late cleanup and refuses further recovery',async()=>{
    const {transport,recovery}=fixture();transport.openFreshContext.mockResolvedValue({id:'old',configurationVerified:true});
    transport.discardFreshContext.mockRejectedValue(new Error('private detail'));
    expect(await recovery.recover('old')).toBe(false);expect(recovery.snapshot().cleanupFailed).toBe(true);
  });
  it('holds on adapter errors without exposing private error details',async()=>{
    const {session,transport,recovery}=fixture();transport.stopLocalOutput.mockImplementation(()=>{throw Error('secret')});
    expect(await recovery.recover('old')).toBe(false);expect(session.snapshot().state).toBe('held');expect(transport.closeOldContext).not.toHaveBeenCalled();
  });
});
