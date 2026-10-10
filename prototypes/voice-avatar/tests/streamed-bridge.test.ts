import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startStreamedBridge } from '../src/streamed-bridge.ts';
import { streamSpokenReply } from '../src/scripted-providers.ts';
vi.mock('../src/scripted-providers.ts',()=>({streamSpokenReply:vi.fn()}));
const generated={responseId:'response',itemId:'item',audioBytes:1920,transcript:'Hello',inputTokens:10,outputTokens:20};
const frame=(sequence:number)=>({responseId:'response',itemId:'item',eventId:`frame-${sequence}`,sequence,pcm:Buffer.alloc(960)});
const options=()=>({openaiKey:'fixture',conversationId:'room',signal:new AbortController().signal,audio:'fixture-audio',history:[],send:vi.fn().mockReturnValue(true)});
beforeEach(()=>{vi.resetAllMocks();vi.useFakeTimers({toFake:['setTimeout','clearTimeout','performance']});});afterEach(()=>vi.useRealTimers());
describe('streamed output bridge, mocked generator and transport',()=>{
  it('connects incremental generation to paced output without confirming playback',async()=>{
    vi.mocked(streamSpokenReply).mockImplementation(async(_key,_signal,_audio,_history,accept)=>{expect(accept(frame(0))).toBe(true);expect(accept(frame(1))).toBe(true);return generated;});
    const input=options(),bridge=startStreamedBridge(input);expect(input.send).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(40);expect(await bridge.result).toMatchObject({outputState:'sent',playbackConfirmed:false});
    bridge.cancel();expect(input.send.mock.calls.at(-1)![0]).toMatchObject({event_type:'conversation.interrupt'});
  });
  it('cancels generation and queued output together',async()=>{
    let accept!:(value:ReturnType<typeof frame>)=>boolean;
    vi.mocked(streamSpokenReply).mockImplementation((_key,signal,_audio,_history,sink)=>{accept=sink;accept(frame(0));accept(frame(1));return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('private detail')),{once:true}));});
    const input=options(),bridge=startStreamedBridge(input);const pending=bridge.result.catch(e=>e);bridge.cancel();
    expect(await pending).toBeInstanceOf(Error);expect(accept(frame(2))).toBe(false);
    const count=input.send.mock.calls.length;await vi.advanceTimersByTimeAsync(1000);expect(input.send).toHaveBeenCalledTimes(count);expect(bridge.snapshot()).toMatchObject({active:false,queued:0});
  });
  it('stops partial output on unsuccessful generation',async()=>{
    vi.mocked(streamSpokenReply).mockImplementation(async(_key,_signal,_audio,_history,accept)=>{accept(frame(0));accept(frame(1));throw Error('private generation error');});
    const input=options(),bridge=startStreamedBridge(input);await expect(bridge.result).rejects.toThrow('cleanup requires verification');
    await vi.advanceTimersByTimeAsync(1000);expect(input.send.mock.calls.filter(c=>c[0].event_type==='conversation.echo')).toHaveLength(1);
  });
  it('refuses an already canceled bridge without provider work',async()=>{
    const controller=new AbortController();controller.abort();const input=options(),bridge=startStreamedBridge({...input,signal:controller.signal});
    await expect(bridge.result).rejects.toThrow();expect(streamSpokenReply).not.toHaveBeenCalled();expect(input.send).not.toHaveBeenCalled();
  });
  it('still interrupts remote playback when its parent ends after all frames were sent',async()=>{
    vi.mocked(streamSpokenReply).mockImplementation(async(_key,_signal,_audio,_history,accept)=>{accept(frame(0));return {...generated,audioBytes:960};});
    const controller=new AbortController(),input=options();
    const bridge=startStreamedBridge({...input,signal:controller.signal});
    await vi.advanceTimersByTimeAsync(20);await bridge.result;
    controller.abort();
    expect(input.send.mock.calls.filter(c=>c[0].event_type==='conversation.interrupt')).toHaveLength(1);
    bridge.cancel();controller.abort();await vi.advanceTimersByTimeAsync(1000);
    expect(input.send.mock.calls.filter(c=>c[0].event_type==='conversation.interrupt')).toHaveLength(1);
  });
  it('rejects completion if the parent ends while the final frame is handed off',async()=>{
    vi.mocked(streamSpokenReply).mockImplementation(async(_key,_signal,_audio,_history,accept)=>{accept(frame(0));return {...generated,audioBytes:960};});
    const controller=new AbortController(),input=options();
    input.send.mockImplementation((message:{properties?:{done?:boolean}})=>{if(message.properties?.done) controller.abort();return true;});
    const bridge=startStreamedBridge({...input,signal:controller.signal});const pending=bridge.result.catch(e=>e);
    await vi.advanceTimersByTimeAsync(20);expect(await pending).toBeInstanceOf(Error);
    expect(bridge.snapshot()).toMatchObject({active:false,queued:0});
  });

});
