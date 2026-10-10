import {once} from 'node:events';
import {WebSocketServer} from 'ws';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {prepareTranscriptionSocketWire} from '../src/transcription-socket-wire.ts';
import {PreparedLiveTranscription,TRANSCRIPTION_MODEL} from '../src/live-transcription.ts';
import {NoteSessionProbe} from '../src/note-session-probe.ts';
import {NotebookState} from '../src/notebook-state.ts';
import {createPreparedOpenAINoteExtractor,NOTE_EXTRACTION_MODEL} from '../src/openai-note-extractor.ts';
import {createPreparedNoteExtractionTransport} from '../src/note-extraction-transport.ts';
class Socket extends EventTarget{
 readyState=1;bufferedAmount=0;send=vi.fn();close=vi.fn();
 message(data:unknown){this.dispatchEvent(new MessageEvent('message',{data}));}
}
const config={type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:TRANSCRIPTION_MODEL},turn_detection:null}}}};
function setup(){const socket=new Socket(),abort=new AbortController(),receive=vi.fn(),stopped=vi.fn();const binding=prepareTranscriptionSocketWire({simulation:true,socket,signal:abort.signal,receive,stopped});return{socket,abort,receive,stopped,...binding};}
afterEach(()=>vi.useRealTimers());
describe('disabled transcription socket lifecycle',()=>{
 it('requires explicit simulation and an open injected socket',()=>{const socket=new Socket(),signal=new AbortController().signal,options={socket,signal,receive:vi.fn(),stopped:vi.fn()};expect(()=>prepareTranscriptionSocketWire(options)).toThrow('disabled');socket.readyState=0;expect(()=>prepareTranscriptionSocketWire({...options,simulation:true})).toThrow('unavailable');expect(socket.send).not.toHaveBeenCalled();});
 it('serializes one event without queuing or adding credentials',()=>{const s=setup();expect(s.wire.send({type:'test'})).toBe(true);expect(s.socket.send.mock.calls).toEqual([['{"type":"test"}']]);s.stop();});
 it.each([65537,Infinity,NaN,-1])('holds invalid or excessive backlog %s',amount=>{const s=setup();s.socket.bufferedAmount=amount;expect(s.wire.send({type:'test'})).toBe(false);expect(s.socket.send).not.toHaveBeenCalled();expect(s.stopped).toHaveBeenCalledWith('transport-held');});
 it('holds oversized outgoing events',()=>{const s=setup();expect(s.wire.send({type:'test',text:'x'.repeat(16384)})).toBe(false);expect(s.socket.send).not.toHaveBeenCalled();});
 it.each(['bad','[]','null','{}',new Uint8Array(2),'x'.repeat(16385),'é'.repeat(8193)])('holds malformed, binary or oversized input',data=>{const s=setup();s.socket.message(data);expect(s.receive).not.toHaveBeenCalled();expect(s.stopped).toHaveBeenCalledWith('event-held');});
 it('bounds incoming events independently of protocol filtering',()=>{const s=setup();for(let i=0;i<513;i++)s.socket.message('{"type":"ignored"}');expect(s.receive).toHaveBeenCalledTimes(512);expect(s.stopped).toHaveBeenCalledWith('event-held');});
 it('detaches listeners and closes once on cancellation',()=>{const s=setup();s.socket.message('{"type":"test"}');s.abort.abort();s.socket.message('{"type":"late"}');s.socket.dispatchEvent(new Event('error'));s.stop();expect(s.receive).toHaveBeenCalledTimes(1);expect(s.socket.close).toHaveBeenCalledTimes(1);expect(s.status()).toEqual({ended:true,cleanupRequested:true,cleanupFailed:false});});
 it('starts ended for an already aborted owner',()=>{const socket=new Socket(),abort=new AbortController();abort.abort();const stopped=vi.fn();const s=prepareTranscriptionSocketWire({simulation:true,socket,signal:abort.signal,receive:vi.fn(),stopped});expect(s.wire.send({type:'test'})).toBe(false);expect(stopped).toHaveBeenCalledWith('canceled');});
 it.each(['close','error'])('ends on socket %s',event=>{const s=setup();s.socket.dispatchEvent(new Event(event));expect(s.status().ended).toBe(true);expect(s.socket.close).toHaveBeenCalledTimes(1);});
 it('reports cleanup failure without exposing transport errors',()=>{const s=setup();s.socket.close.mockImplementation(()=>{throw Error('private sentinel');});s.stop();expect(s.stopped).toHaveBeenCalledWith('cleanup-unverified');expect(s.status().cleanupFailed).toBe(true);});
 it('ends if the receiving owner throws',()=>{const s=setup();s.receive.mockImplementation(()=>{throw Error('private');});s.socket.message('{"type":"test"}');expect(s.stopped).toHaveBeenCalledWith('event-held');});
 it('connects configuration, generated PCM and partial text to the existing protocol',()=>{vi.useFakeTimers();const socket=new Socket(),abort=new AbortController(),emit=vi.fn(),stopped=vi.fn();let protocol:PreparedLiveTranscription|undefined;const binding=prepareTranscriptionSocketWire({simulation:true,socket,signal:abort.signal,receive:event=>{protocol?.receive(event);},stopped:reason=>{stopped(reason);abort.abort();}});protocol=new PreparedLiveTranscription({simulation:true,wire:binding.wire,signal:abort.signal,emit,stopped});expect(JSON.parse(socket.send.mock.calls[0]![0])).toMatchObject({type:'session.update'});socket.message(JSON.stringify(config));expect(protocol.beginTurn('t1')).toBe(true);for(let i=0;i<5;i++)expect(protocol.append(new ArrayBuffer(960),i)).toBe(true);socket.message(JSON.stringify({type:'conversation.item.input_audio_transcription.delta',event_id:'e1',item_id:'i1',content_index:0,delta:'green'}));expect(emit).toHaveBeenCalledWith(expect.objectContaining({turnId:'t1',text:'green',final:false}));expect(protocol.commit()).toBe(true);socket.dispatchEvent(new Event('close'));expect(binding.status().ended).toBe(true);expect(protocol.beginTurn('t2')).toBe(false);expect(socket.close).toHaveBeenCalledTimes(1);expect(vi.getTimerCount()).toBe(0);});
 it('carries a partial through both prepared transports into owned notebook state',async()=>{
  vi.useFakeTimers();const socket=new Socket(),abort=new AbortController(),notebook=new NotebookState(),changed=vi.fn(),captureStop=vi.fn();let accept!:(pcm:ArrayBuffer)=>boolean,probe:NoteSessionProbe|undefined;
  const binding=prepareTranscriptionSocketWire({simulation:true,socket,signal:abort.signal,receive:event=>{probe?.receive(event);},stopped:()=>{probe?.end();}});
  const request=createPreparedNoteExtractionTransport({simulation:true,fetch:async()=>Response.json({model:NOTE_EXTRACTION_MODEL,status:'completed',output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:JSON.stringify({version:1,turnId:'t1',patches:[{field:'color',value:'green',evidence:'green'}]})}]}]})});
  probe=new NoteSessionProbe({simulation:true,notebook,wire:binding.wire,capture:{start:async callback=>{accept=callback;return true;},stop:captureStop},extract:createPreparedOpenAINoteExtractor({simulation:true,request}),changed});
  socket.message(JSON.stringify(config));expect(await probe.beginTurn('t1')).toBe(true);for(let i=0;i<5;i++)expect(accept(new ArrayBuffer(960))).toBe(true);
  socket.message(JSON.stringify({type:'conversation.item.input_audio_transcription.delta',event_id:'e1',item_id:'i1',content_index:0,delta:'green'}));await vi.advanceTimersByTimeAsync(100);
  expect(notebook.snapshot().notes.color).toMatchObject({value:'green',status:'tentative'});expect(changed).toHaveBeenCalled();expect(probe.acknowledgeRendered(changed.mock.calls.at(-1)![0])).toBe(true);
  socket.dispatchEvent(new Event('close'));expect(notebook.snapshot().notes.color.status).toBe('missing');expect(captureStop).toHaveBeenCalled();expect(socket.close).toHaveBeenCalledTimes(1);expect(vi.getTimerCount()).toBe(0);
 });
 it('uses actual loopback socket framing with a synthetic provider and closes on disconnect',async()=>{
  const server=new WebSocketServer({host:'127.0.0.1',port:0});await once(server,'listening');const address=server.address();if(typeof address==='string'||!address)throw Error('Loopback unavailable');
  let frames=0;server.on('connection',peer=>peer.on('message',bytes=>{const event=JSON.parse(bytes.toString());if(event.type==='session.update')peer.send(JSON.stringify(config));if(event.type==='input_audio_buffer.append'&&++frames===5)peer.send(JSON.stringify({type:'conversation.item.input_audio_transcription.delta',event_id:'e1',item_id:'i1',content_index:0,delta:'green'}));}));
  const socket=new WebSocket(`ws://127.0.0.1:${address.port}`),abort=new AbortController(),emit=vi.fn(),stopped=vi.fn();let protocol:PreparedLiveTranscription|undefined;
  try{
   await new Promise<void>((resolve,reject)=>{socket.addEventListener('open',()=>resolve(),{once:true});socket.addEventListener('error',()=>reject(Error('Loopback unavailable')),{once:true});});
   const binding=prepareTranscriptionSocketWire({simulation:true,socket,signal:abort.signal,receive:event=>{protocol?.receive(event);},stopped:()=>{protocol?.disconnected();}});
   protocol=new PreparedLiveTranscription({simulation:true,wire:binding.wire,signal:abort.signal,emit,stopped});await vi.waitFor(()=>expect(protocol!.snapshot().ready).toBe(true));
   expect(protocol.beginTurn('t1')).toBe(true);for(let i=0;i<5;i++)expect(protocol.append(new ArrayBuffer(960),i)).toBe(true);
   await vi.waitFor(()=>expect(emit).toHaveBeenCalledWith(expect.objectContaining({text:'green',final:false})));
   for(const peer of server.clients)peer.terminate();await vi.waitFor(()=>expect(protocol!.snapshot().ended).toBe(true));expect(binding.status().ended).toBe(true);expect(protocol.snapshot().remoteCleanupVerified).toBe(false);
  }finally{protocol?.end();socket.close();for(const peer of server.clients)peer.terminate();await new Promise<void>(resolve=>server.close(()=>resolve()));}
 });
});
