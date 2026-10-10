import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfirmedConversation } from '../src/confirmed-conversation.ts';
import { ContextRecovery } from '../src/context-recovery.ts';
import { VoiceSession } from '../src/voice-session.ts';
import { startStreamedBridge } from '../src/streamed-bridge.ts';
import { streamSpokenReply } from '../src/scripted-providers.ts';
import { SILENT_FRAME } from '../src/contracts.ts';

vi.mock('../src/scripted-providers.ts',async importOriginal=>({
  ...await importOriginal<typeof import('../src/scripted-providers.ts')>(),streamSpokenReply:vi.fn(),
}));
beforeEach(()=>{vi.clearAllMocks();vi.useFakeTimers({toFake:['setTimeout','clearTimeout','performance']});});
afterEach(()=>vi.useRealTimers());

function flow() {
  const memory=new ConfirmedConversation(),audio=Buffer.alloc(9600).toString('base64');
  memory.stage(memory.revision(),'heard',audio,'Confirmed earlier reply');memory.confirm('heard');
  memory.stage(memory.revision(),'interrupted',audio,'Unheard interrupted reply');
  const session=new VoiceSession('room'),old=session.start('old-response','old-item');
  session.enqueue({...old,eventId:'audio',pcm:SILENT_FRAME});session.takeAudio();
  let lateFrame!:(sequence:number)=>boolean;
  vi.mocked(streamSpokenReply).mockImplementation((_key,signal,_audio,_history,accept)=>{
    lateFrame=sequence=>accept({responseId:old.responseId,itemId:old.itemId,eventId:`frame-${sequence}`,sequence,pcm:Buffer.alloc(960)});
    lateFrame(0);lateFrame(1);
    return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('synthetic stop')),{once:true}));
  });
  const messages:object[]=[],controller=new AbortController();
  const bridge=startStreamedBridge({openaiKey:'fixture',conversationId:'room',signal:controller.signal,audio,history:memory.history(),send:message=>{messages.push(message);return true;}});
  const stopped=bridge.result.catch(()=>false);
  const transport={
    stopLocalOutput:vi.fn(()=>controller.abort()),
    closeOldContext:vi.fn(async()=>{await stopped;return true;}),
    verifyRendererStopped:vi.fn().mockResolvedValue(true),
    openFreshContext:vi.fn().mockResolvedValue({id:'fresh',configurationVerified:true}),
    restoreConfirmedContext:vi.fn().mockResolvedValue(true),
    discardFreshContext:vi.fn().mockResolvedValue(undefined),
  };
  session.interrupt();
  return {memory,audio,session,old,bridge,lateFrame,messages,transport,recovery:new ContextRecovery(session,transport,memory)};
}

describe('combined recovery flow with synthetic provider acknowledgments only',()=>{
  it('stops old output, restores only confirmed context, then accepts a new response',async()=>{
    const f=flow();expect(await f.recovery.recover('old')).toBe(true);
    expect(f.bridge.snapshot()).toMatchObject({active:false,queued:0});expect(f.lateFrame(2)).toBe(false);
    expect(f.messages).toHaveLength(2); // One audio frame and one interrupt, never the queued old frame.
    expect(f.transport.restoreConfirmedContext).toHaveBeenCalledWith({id:'fresh',configurationVerified:true},[{audio:f.audio,reply:'Confirmed earlier reply'}],expect.any(AbortSignal));
    expect(()=>f.memory.confirm('interrupted')).toThrow();
    expect(f.session.acknowledgePlayback(f.old,20)).toBe(false);
    const current=f.session.start('new-response','new-item');
    f.session.enqueue({...f.old,eventId:'late',pcm:SILENT_FRAME});
    f.session.enqueue({...current,eventId:'new',pcm:SILENT_FRAME});expect(f.session.takeAudio()).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1000);expect(f.messages).toHaveLength(2);
  });
  it('keeps the session held when renderer cleanup is unverified even after generation stops',async()=>{
    const f=flow();f.transport.verifyRendererStopped.mockResolvedValue(false);
    expect(await f.recovery.recover('old')).toBe(false);
    expect(f.bridge.snapshot()).toMatchObject({active:false,queued:0});expect(f.session.snapshot().state).toBe('held');
    expect(f.transport.openFreshContext).not.toHaveBeenCalled();expect(f.lateFrame(2)).toBe(false);
    expect(()=>f.session.start('new-response','new-item')).toThrow();
  });
  it('disposes the replacement and cannot resume if the owner ends during restoration',async()=>{
    const f=flow();let acknowledge!:(value:boolean)=>void;
    f.transport.restoreConfirmedContext.mockImplementation(()=>new Promise(resolve=>{acknowledge=resolve;}));
    const recovering=f.recovery.recover('old');await vi.advanceTimersByTimeAsync(0);
    expect(f.transport.restoreConfirmedContext).toHaveBeenCalledOnce();
    f.session.end();f.memory.clear();f.recovery.cancel();acknowledge(true);
    expect(await recovering).toBe(false);await vi.advanceTimersByTimeAsync(0);
    expect(f.transport.discardFreshContext).toHaveBeenCalledOnce();expect(f.session.snapshot().state).toBe('ended');
    expect(f.memory.history()).toEqual([]);expect(f.lateFrame(2)).toBe(false);
  });
});
