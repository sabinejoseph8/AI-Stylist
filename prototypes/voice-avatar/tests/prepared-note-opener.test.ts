import {describe,it,expect,vi} from 'vitest';
import {prepareNoteStartup} from '../src/prepared-note-startup.ts';
import {NotebookState} from '../src/notebook-state.ts';
import {TRANSCRIPTION_MODEL} from '../src/live-transcription.ts';
import {prepareNoteOpener} from '../src/prepared-note-opener.ts';
function fixture(){
 const controller=new AbortController();
 const socket=Object.assign(new EventTarget(),{readyState:0,bufferedAmount:0,send:vi.fn(),close:vi.fn()});
 const start=vi.fn(),construct=vi.fn(()=>({socket,start})),receive=vi.fn();
 const open=prepareNoteOpener({simulation:true,construct});
 const emit=(value:unknown)=>socket.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(value)}));
 const opened=()=>{socket.readyState=1;socket.dispatchEvent(new Event('open'));};
 return{controller,socket,start,construct,receive,open,emit,opened};
}
describe('disabled dormant note opener',()=>{
 it('requires simulation before construction',()=>{const construct=vi.fn();expect(()=>prepareNoteOpener({construct})).toThrow('disabled');expect(construct).not.toHaveBeenCalled();});
 it('does not construct after cancellation',async()=>{const s=fixture();s.controller.abort();await expect(s.open(s.controller.signal,s.receive)).rejects.toThrow('canceled');expect(s.construct).not.toHaveBeenCalled();});
 it('observes a synchronous first packet',async()=>{const s=fixture();s.start.mockImplementation(()=>{s.emit({type:'session.created'});s.opened();});const opened=await s.open(s.controller.signal,s.receive);expect(s.receive).toHaveBeenCalledExactlyOnceWith({type:'session.created'});expect(opened.socket.readyState).toBe(1);opened.socket.close();expect(s.socket.close).toHaveBeenCalledTimes(1);});
 it('detaches observation without closing after handover',async()=>{const s=fixture();const pending=s.open(s.controller.signal,s.receive);s.opened();const opened=await pending;opened.detachInitialEvents();s.emit({type:'later'});expect(s.receive).not.toHaveBeenCalled();expect(s.socket.close).not.toHaveBeenCalled();opened.socket.close();});
 it.each(['abort','error','close','start-throw'])('settles %s without reconnect',async kind=>{const s=fixture();if(kind==='start-throw')s.start.mockImplementation(()=>{throw Error('private');});const pending=s.open(s.controller.signal,s.receive);if(kind==='abort')s.controller.abort();else if(kind!=='start-throw')s.socket.dispatchEvent(new Event(kind));const opened=await pending;s.opened();s.emit({type:'late'});opened.socket.close();expect(opened.socket.readyState).toBe(3);expect(s.socket.close).toHaveBeenCalledTimes(1);expect(s.construct).toHaveBeenCalledTimes(1);expect(s.receive).not.toHaveBeenCalled();});
 it.each(['bad-json','oversize','binary'])('holds %s packets',async kind=>{const s=fixture();const pending=s.open(s.controller.signal,s.receive);s.socket.dispatchEvent(new MessageEvent('message',{data:kind==='bad-json'?'{':kind==='oversize'?'x'.repeat(16385):new Uint8Array(1)}));expect((await pending).socket.readyState).toBe(3);expect(s.receive).not.toHaveBeenCalled();});
 it('preserves failed close evidence without retry',async()=>{const s=fixture();s.socket.close.mockImplementation(()=>{throw Error('private');});const pending=s.open(s.controller.signal,s.receive);s.controller.abort();const opened=await pending;expect(()=>opened.socket.close()).toThrow('cleanup unverified');expect(s.socket.close).toHaveBeenCalledTimes(1);});
 it('preserves failed listener removal evidence',async()=>{const s=fixture();vi.spyOn(s.socket,'removeEventListener').mockImplementation(()=>{throw Error('private');});const pending=s.open(s.controller.signal,s.receive);s.opened();const opened=await pending;expect(()=>opened.detachInitialEvents()).toThrow('cleanup unverified');expect(()=>opened.detachInitialEvents()).toThrow('cleanup unverified');expect(()=>opened.socket.close()).toThrow('cleanup unverified');});
 it('holds throwing observers',async()=>{const s=fixture();s.receive.mockImplementation(()=>{throw Error('private');});const pending=s.open(s.controller.signal,s.receive);s.emit({type:'first'});const opened=await pending;s.emit({type:'late'});expect(s.receive).toHaveBeenCalledTimes(1);expect(opened.socket.readyState).toBe(3);});
});

describe('opener startup composition',()=>{
 it('waits for configuration and propagates failed close ownership',async()=>{
  const s=fixture();s.start.mockImplementation(()=>{s.opened();s.emit({type:'session.created',session:{id:'synthetic'}});});
  const ready=vi.fn(),capture={start:vi.fn(async()=>true),stop:vi.fn()};
  const startup=prepareNoteStartup({simulation:true,signal:s.controller.signal,open:s.open,session:{notebook:new NotebookState(),capture,fetch:vi.fn(async()=>{throw Error('unused');}),changed:vi.fn()},ready});
  await startup.openingSettled;expect(ready).not.toHaveBeenCalled();expect(s.socket.send).toHaveBeenCalledTimes(1);
  s.emit({type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:TRANSCRIPTION_MODEL},turn_detection:null}}}});
  expect(ready).toHaveBeenCalledTimes(1);expect(capture.start).not.toHaveBeenCalled();
  s.socket.close.mockImplementation(()=>{throw Error('private');});startup.end();
  expect(startup.status()).toMatchObject({state:'ended',cleanupFailed:true,remoteCleanupVerified:false,liveEnabled:false});expect(s.socket.close).toHaveBeenCalledTimes(1);
 });
 it('retains cleanup failure after cancellation during opening',async()=>{
  const s=fixture();s.socket.close.mockImplementation(()=>{throw Error('private');});
  const startup=prepareNoteStartup({simulation:true,signal:s.controller.signal,open:s.open,session:{notebook:new NotebookState(),capture:{start:vi.fn(async()=>true),stop:vi.fn()},fetch:vi.fn(async()=>{throw Error('unused');}),changed:vi.fn()}});
  s.controller.abort();await startup.openingSettled;s.opened();
  expect(startup.status()).toMatchObject({state:'ended',cleanupFailed:true,remoteCleanupVerified:false});expect(s.socket.close).toHaveBeenCalledTimes(1);expect(s.construct).toHaveBeenCalledTimes(1);
 });
});
