import {afterEach,describe,it,expect,vi} from 'vitest';
import {createServer} from 'node:http';
import {WebSocket} from 'ws';
import {attachPreparedSimulatedNoteBridge} from '../src/prepared-note-network-bridge.ts';
import {NoteBrowserController} from '../src/note-browser-controller.ts';
import {NOTE_EXTRACTION_MODEL} from '../src/openai-note-extractor.ts';
import {TRANSCRIPTION_MODEL} from '../src/live-transcription.ts';
const preview={origin:'https://fixture.onrender.com',password:'fixture_password_only_for_tests_123456'};
const headers={Host:'fixture.onrender.com',Origin:preview.origin,Authorization:'Basic '+Buffer.from('stylist:'+preview.password).toString('base64')};
const cleanups:(()=>Promise<void>)[]=[];
afterEach(async()=>{for(const cleanup of cleanups.splice(0).reverse())await cleanup();});
function response(turnId:string,text:string){return Response.json({model:NOTE_EXTRACTION_MODEL,status:'completed',output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:JSON.stringify({version:1,turnId,patches:[{field:'color',value:text,evidence:text}]})}]}]});}
async function setup(){
 const providers:Array<EventTarget&{close:ReturnType<typeof vi.fn>;message:(event:unknown)=>void}>=[],pending:Array<{signal:AbortSignal;release:()=>void}>=[];
 const server=createServer((_req,res)=>res.end()),bridge=attachPreparedSimulatedNoteBridge(server,{simulation:true,preview,createTransports:()=>{
  const socket=Object.assign(new EventTarget(),{readyState:1,bufferedAmount:0,close:vi.fn(),send:(_text:string)=>{},message:(_event:unknown)=>{}});
  socket.message=event=>socket.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(event)}));
  socket.send=text=>{if(JSON.parse(text).type==='session.update')queueMicrotask(()=>socket.message({type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:TRANSCRIPTION_MODEL},turn_detection:null}}}}));};providers.push(socket);
  return{socket,fetch:async(_url,init)=>{const input=JSON.parse(JSON.parse(init.body as string).input[0].content[0].text);return new Promise<Response>(resolve=>pending.push({signal:init.signal as AbortSignal,release:()=>resolve(response(input.turnId,input.currentFragment))}));}};
 }});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const address=server.address();if(!address||typeof address==='string')throw Error('Loopback unavailable');const url=`ws://127.0.0.1:${address.port}/api/notebook-simulation`;
 cleanups.push(async()=>{bridge.dispose();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));});
 async function connect(){const ws=new WebSocket(url,{headers}),controller=new NoteBrowserController({simulation:true,socket:{send:value=>ws.send(value),close:()=>ws.close(),get bufferedAmount(){return ws.bufferedAmount;}},changed:vi.fn()});ws.on('message',data=>controller.receive(JSON.parse(data.toString())));ws.on('close',()=>controller.disconnected());ws.on('error',()=>controller.disconnected());cleanups.push(async()=>{controller.stop();ws.terminate();});await vi.waitFor(()=>expect(controller.snapshot().notes).not.toBeNull());return{ws,controller};}
 async function partial(controller:NoteBrowserController,provider:typeof providers[number],id:string,text:string){expect(controller.begin(id)).toBe(true);await vi.waitFor(()=>expect(controller.snapshot().pending).toBe(false));for(let i=0;i<5;i++)expect(controller.audio(new ArrayBuffer(960))).toBe(true);provider.message({type:'conversation.item.input_audio_transcription.delta',event_id:`d_${id}`,item_id:`i_${id}`,content_index:0,delta:text});}
 async function refused(){return new Promise<number>((resolve,reject)=>{const ws=new WebSocket(url,{headers});ws.on('error',()=>{});ws.once('unexpected-response',(_req,res)=>{res.resume();resolve(res.statusCode!);ws.terminate();});ws.once('open',()=>{ws.terminate();reject(Error('Unexpected replacement'));});});}
 return{providers,pending,bridge,connect,partial,refused};
}
describe('combined session replacement isolation',()=>{
 it('ignores old extraction and provider events after a fresh connection owns the notebook',async()=>{const s=await setup(),first=await s.connect();await s.partial(first.controller,s.providers[0]!,'old','green');await vi.waitFor(()=>expect(s.pending).toHaveLength(1));const oldId=first.controller.snapshot().notes!.sessionId;first.controller.stop();await vi.waitFor(()=>expect(s.bridge.snapshot().active).toBe(false));expect(s.pending[0]!.signal.aborted).toBe(true);const fresh=await s.connect();expect(fresh.controller.snapshot().notes!.sessionId).not.toBe(oldId);await s.partial(fresh.controller,s.providers[1]!,'fresh','blue');await vi.waitFor(()=>expect(s.pending).toHaveLength(2));s.pending[1]!.release();await vi.waitFor(()=>expect(fresh.controller.snapshot().notes?.notes.color.value).toBe('blue'));s.pending[0]!.release();s.providers[0]!.message({type:'conversation.item.input_audio_transcription.completed',event_id:'late',item_id:'i_old',content_index:0,transcript:'green'});await new Promise(r=>setTimeout(r,20));expect(fresh.controller.snapshot().notes?.notes.color).toMatchObject({value:'blue',status:'tentative'});expect(first.controller.snapshot().notes).toBeNull();expect(s.providers[0]!.close).toHaveBeenCalledTimes(1);});
 it('refuses a replacement after provider socket cleanup fails',async()=>{const s=await setup(),first=await s.connect();s.providers[0]!.close.mockImplementation(()=>{throw Error('private sentinel');});first.controller.stop();await vi.waitFor(()=>expect(s.bridge.snapshot().held).toBe(true));expect(await s.refused()).toBe(409);expect(s.providers).toHaveLength(1);});
 it('rejects a render receipt belonging to the previous connection',async()=>{const s=await setup(),first=await s.connect(),oldId=first.controller.snapshot().notes!.sessionId;first.controller.stop();await vi.waitFor(()=>expect(s.bridge.snapshot().active).toBe(false));const fresh=await s.connect();fresh.ws.send(JSON.stringify({version:1,type:'rendered',sessionId:oldId,sequence:1,receipt:1}));await vi.waitFor(()=>expect(fresh.controller.snapshot().ended).toBe(true));expect(fresh.controller.snapshot().notes).toBeNull();expect(s.pending).toHaveLength(0);expect(s.providers[1]!.close).toHaveBeenCalledTimes(1);});
});
