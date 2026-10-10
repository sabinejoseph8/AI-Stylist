import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { streamSpokenReply, MODEL, VOICE } from '../src/scripted-providers.ts';
import { realtimeConfiguration } from '../src/contracts.ts';
const mocks=vi.hoisted(()=>({sockets:[] as any[]}));
vi.mock('ws',async()=>{
  const {EventEmitter}=await import('node:events');
  return {default:class extends EventEmitter {
    send=vi.fn();terminate=vi.fn();constructor(..._args:unknown[]){super();mocks.sockets.push(this);}
  }};
});
const AUDIO=Buffer.alloc(9600).toString('base64');
function ready(ws:any) {
  ws.emit('open'); const config=realtimeConfiguration(MODEL,VOICE) as any;
  config.session.max_output_tokens=1024;ws.emit('message',JSON.stringify({type:'session.updated',session:config.session}));
  ws.emit('message',JSON.stringify({type:'response.created',response:{id:'response'}}));
}
function delta(ws:any,id='delta',length=1920,extra={}) {
  ws.emit('message',JSON.stringify({type:'response.output_audio.delta',event_id:id,response_id:'response',item_id:'item',content_index:0,output_index:0,delta:Buffer.alloc(length).toString('base64'),...extra}));
}
function done(ws:any,status='completed') {ws.emit('message',JSON.stringify({type:'response.done',response:{id:'response',status,usage:{input_tokens:10,output_tokens:20}}}));}
beforeEach(()=>{mocks.sockets=[];});afterEach(()=>vi.useRealTimers());
describe('incremental generated audio, mocked WebSocket only',()=>{
  it('delivers bounded identified frames before response completion without claiming playback',async()=>{
    const accept=vi.fn().mockReturnValue(true);let resolved=false;
    const pending=streamSpokenReply('fixture',new AbortController().signal,AUDIO,[],accept).then(result=>{resolved=true;return result;});
    const ws=mocks.sockets[0];ready(ws);delta(ws);
    expect(accept).toHaveBeenCalledTimes(2);expect(resolved).toBe(false);
    expect(accept.mock.calls.map(c=>({sequence:c[0].sequence,bytes:c[0].pcm.length,eventId:c[0].eventId}))).toEqual([{sequence:0,bytes:960,eventId:'delta/0'},{sequence:1,bytes:960,eventId:'delta/960'}]);
    done(ws);expect(await pending).toEqual({responseId:'response',itemId:'item',audioBytes:1920,transcript:'',inputTokens:10,outputTokens:20});expect(ws.terminate).toHaveBeenCalledOnce();
  });
  it('rejects refused capacity immediately and never sends subsequent frames',async()=>{
    const accept=vi.fn().mockReturnValue(false);const pending=streamSpokenReply('fixture',new AbortController().signal,AUDIO,[],accept);
    const ws=mocks.sockets[0];ready(ws);delta(ws);await expect(pending).rejects.toThrow('capacity');
    delta(ws,'late');expect(accept).toHaveBeenCalledOnce();expect(ws.terminate).toHaveBeenCalledOnce();
  });
  it('cancellation inside an accepted frame prevents all later output',async()=>{
    const abort=new AbortController();const accept=vi.fn(()=>{abort.abort();return true;});
    const pending=streamSpokenReply('fixture',abort.signal,AUDIO,[],accept);const ws=mocks.sockets[0];ready(ws);delta(ws);
    await expect(pending).rejects.toThrow('canceled');expect(accept).toHaveBeenCalledOnce();delta(ws,'late');expect(accept).toHaveBeenCalledOnce();
  });
  it('ignores duplicate provider deltas and rejects mismatched response identity',async()=>{
    const accept=vi.fn().mockReturnValue(true);const pending=streamSpokenReply('fixture',new AbortController().signal,AUDIO,[],accept);
    const ws=mocks.sockets[0];ready(ws);delta(ws);delta(ws);expect(accept).toHaveBeenCalledTimes(2);
    delta(ws,'wrong',960,{response_id:'old'});await expect(pending).rejects.toThrow('identity');expect(accept).toHaveBeenCalledTimes(2);
  });
  it.each([0,1,1_200_002])('rejects invalid audio length %s before delivery',async length=>{
    const accept=vi.fn().mockReturnValue(true);const pending=streamSpokenReply('fixture',new AbortController().signal,AUDIO,[],accept);
    const ws=mocks.sockets[0];ready(ws);delta(ws,'bad',length);await expect(pending).rejects.toThrow();expect(accept).not.toHaveBeenCalled();
  });
  it('requires successful generation after partial delivery',async()=>{
    const accept=vi.fn().mockReturnValue(true);const pending=streamSpokenReply('fixture',new AbortController().signal,AUDIO,[],accept);
    const ws=mocks.sockets[0];ready(ws);delta(ws);done(ws,'failed');await expect(pending).rejects.toThrow('did not complete');expect(ws.terminate).toHaveBeenCalledOnce();
  });
  it('sanitizes thrown downstream errors and stops without retry',async()=>{
    const accept=vi.fn(()=>{throw Error('private detail');});const pending=streamSpokenReply('fixture',new AbortController().signal,AUDIO,[],accept);
    const ws=mocks.sockets[0];ready(ws);delta(ws);await expect(pending).rejects.toThrow('Invalid OpenAI event');expect(accept).toHaveBeenCalledOnce();expect(mocks.sockets).toHaveLength(1);
  });
  it('times out and refuses an already aborted request before connection',async()=>{
    vi.useFakeTimers();const controller=new AbortController();const pending=streamSpokenReply('fixture',controller.signal,AUDIO,[],()=>true).catch(e=>e);
    await vi.advanceTimersByTimeAsync(30000);expect(await pending).toBeInstanceOf(Error);
    controller.abort();await expect(streamSpokenReply('fixture',controller.signal,AUDIO,[],()=>true)).rejects.toThrow('canceled');expect(mocks.sockets).toHaveLength(1);
  });
});
