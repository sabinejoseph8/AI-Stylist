import {afterEach,describe,it,expect,vi} from 'vitest';
import {createServer} from 'node:http';
import {WebSocket} from 'ws';
import {attachProtectedSimulatedNoteBridge} from '../src/protected-note-network-bridge.ts';
import {NoteBrowserController} from '../src/note-browser-controller.ts';
import {NOTE_EXTRACTION_MODEL} from '../src/openai-note-extractor.ts';
import {TRANSCRIPTION_MODEL} from '../src/live-transcription.ts';
const preview={origin:'https://fixture.onrender.com',password:'fixture_password_only_for_tests_123456'};
const headers={Host:'fixture.onrender.com',Origin:preview.origin,Authorization:'Basic '+Buffer.from('stylist:'+preview.password).toString('base64')};
const config={type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:TRANSCRIPTION_MODEL},turn_detection:null}}}};
const cleanups:(()=>Promise<void>)[]=[];
afterEach(async()=>{vi.useRealTimers();for(const cleanup of cleanups.splice(0).reverse())await cleanup();});
function allowance(){return{purpose:'notes-only-simulation' as const,reserve:vi.fn(async():Promise<string>=>crypto.randomUUID()),closeVerified:vi.fn(async(_id:string)=>{})};}
class Provider extends EventTarget{
 readyState=1;bufferedAmount=0;close=vi.fn();
 send=(text:string)=>{if(JSON.parse(text).type==='session.update')queueMicrotask(()=>this.message(config));};
 message(value:unknown){this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(value)}));}
}
function response(color:string){return Response.json({model:NOTE_EXTRACTION_MODEL,status:'completed',output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:JSON.stringify({version:1,turnId:'t1',patches:[{field:'color',value:color,evidence:color}]})}]}]});}
async function setup(budget=allowance(),deferExtraction=false){
 const providers:Provider[]=[],requests:{signal:AbortSignal;resolve:(response:Response)=>void}[]=[],clients:WebSocket[]=[];
 const server=createServer((_req,res)=>res.end());
 const createTransports=vi.fn(()=>{const socket=new Provider();providers.push(socket);return{socket,fetch:vi.fn(async(_url:string,init:RequestInit)=>{
  const input=JSON.parse(JSON.parse(init.body as string).input[0].content[0].text);
  if(deferExtraction&&providers.length===1)return new Promise<Response>(resolve=>requests.push({signal:init.signal as AbortSignal,resolve}));
  return response(input.currentFragment);
 })};});
 const bridge=attachProtectedSimulatedNoteBridge(server,{simulation:true,preview,allowance:budget,createTransports});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();if(!address||typeof address==='string')throw Error('No loopback');
 const url=`ws://127.0.0.1:${address.port}/api/notebook-simulation`;
 const connect=()=>{const ws=new WebSocket(url,{headers});clients.push(ws);const messages:any[]=[];ws.on('message',data=>messages.push(JSON.parse(data.toString())));ws.on('error',()=>{});return{ws,messages};};
 const denied=async()=>{const ws=new WebSocket(url,{headers});clients.push(ws);ws.on('error',()=>{});return new Promise<number>(resolve=>ws.on('unexpected-response',(_req,res)=>{res.resume();resolve(res.statusCode!);ws.terminate();}));};
 cleanups.push(async()=>{for(const ws of clients)ws.terminate();bridge.dispose();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));});
 return{budget,providers,requests,createTransports,bridge,connect,denied};
}
describe('protected notebook deadline and replacement ownership',()=>{
 it('keeps replacement blocked while deadline closure is pending, then releases once',async()=>{
  vi.useFakeTimers({toFake:['setTimeout','clearTimeout']});const budget=allowance();let close!:()=>void;budget.closeVerified.mockImplementation(()=>new Promise(r=>{close=r;}));const s=await setup(budget),first=s.connect();
  await vi.waitFor(()=>expect(first.messages.some(m=>m.type==='ready')).toBe(true));await vi.advanceTimersByTimeAsync(85_000);
  await vi.waitFor(()=>expect(first.ws.readyState).toBe(WebSocket.CLOSED));expect(s.bridge.snapshot().allowanceState).toBe('closing');expect(s.bridge.snapshot().active).toBe(true);expect(await s.denied()).toBe(409);
  close();await vi.waitFor(()=>expect(s.bridge.snapshot().active).toBe(false));expect(budget.closeVerified).toHaveBeenCalledTimes(1);expect(s.providers[0]!.close).toHaveBeenCalledTimes(1);expect(s.bridge.snapshot().allowanceState).toBe('idle');
 });
 it('retains a deadline cleanup failure without retrying reservation or closure',async()=>{
  vi.useFakeTimers({toFake:['setTimeout','clearTimeout']});const budget=allowance();budget.closeVerified.mockRejectedValue(Error('private sentinel'));const s=await setup(budget),first=s.connect();await vi.waitFor(()=>expect(first.messages.some(m=>m.type==='ready')).toBe(true));
  await vi.advanceTimersByTimeAsync(85_000);await vi.waitFor(()=>expect(s.bridge.snapshot().held).toBe(true));expect(await s.denied()).toBe(409);await vi.advanceTimersByTimeAsync(85_000);expect(budget.reserve).toHaveBeenCalledTimes(1);expect(budget.closeVerified).toHaveBeenCalledTimes(1);expect(s.providers[0]!.close).toHaveBeenCalledTimes(1);expect(JSON.stringify(s.bridge.snapshot())).not.toContain('sentinel');
 });
 it('expires a pending startup and retires its late allowance without a provider',async()=>{
  vi.useFakeTimers({toFake:['setTimeout','clearTimeout']});const budget=allowance();let reserve!:(id:string)=>void;budget.reserve.mockImplementation(()=>new Promise(r=>{reserve=r;}));const s=await setup(budget),first=s.connect();await vi.waitFor(()=>expect(budget.reserve).toHaveBeenCalledTimes(1));
  await vi.advanceTimersByTimeAsync(85_000);await vi.waitFor(()=>expect(first.ws.readyState).toBe(WebSocket.CLOSED));expect(first.messages.some(m=>m.type==='ready')).toBe(false);expect(s.createTransports).not.toHaveBeenCalled();expect(await s.denied()).toBe(409);
  reserve('late-synthetic');await vi.waitFor(()=>expect(s.bridge.snapshot().active).toBe(false));expect(budget.closeVerified).toHaveBeenCalledExactlyOnceWith('late-synthetic');expect(s.createTransports).not.toHaveBeenCalled();
 });
 it('isolates old extraction and provider events from a fresh notebook',async()=>{
  const s=await setup(allowance(),true);
  function client(){const raw=s.connect();const controller=new NoteBrowserController({simulation:true,socket:{send:value=>raw.ws.send(value),close:()=>raw.ws.close(),get bufferedAmount(){return raw.ws.bufferedAmount;}},changed:vi.fn()});raw.ws.on('message',data=>controller.receive(JSON.parse(data.toString())));raw.ws.on('close',()=>controller.disconnected());return{...raw,controller};}
  const first=client();await vi.waitFor(()=>expect(first.controller.snapshot().ready).toBe(true));expect(first.controller.begin('t1')).toBe(true);await vi.waitFor(()=>expect(first.controller.snapshot().pending).toBe(false));
  s.providers[0]!.message({type:'conversation.item.input_audio_transcription.delta',event_id:'old',item_id:'i1',content_index:0,delta:'green'});await vi.waitFor(()=>expect(s.requests.length).toBe(1));first.controller.stop();await vi.waitFor(()=>expect(s.bridge.snapshot().active).toBe(false));expect(s.requests[0]!.signal.aborted).toBe(true);
  const second=client();await vi.waitFor(()=>expect(second.controller.snapshot().ready).toBe(true));expect(second.controller.begin('t1')).toBe(true);await vi.waitFor(()=>expect(second.controller.snapshot().pending).toBe(false));s.providers[1]!.message({type:'conversation.item.input_audio_transcription.delta',event_id:'new',item_id:'i1',content_index:0,delta:'blue'});await vi.waitFor(()=>expect(second.controller.snapshot().notes?.notes.color.value).toBe('blue'));
  s.requests[0]!.resolve(response('green'));s.providers[0]!.message({type:'conversation.item.input_audio_transcription.completed',event_id:'late',item_id:'i1',content_index:0,transcript:'green'});await new Promise(r=>setTimeout(r,20));expect(second.controller.snapshot().notes?.notes.color.value).toBe('blue');expect(s.budget.closeVerified).toHaveBeenCalledTimes(1);
  second.controller.stop();await vi.waitFor(()=>expect(s.bridge.snapshot().active).toBe(false));expect(s.budget.reserve).toHaveBeenCalledTimes(2);expect(s.budget.closeVerified).toHaveBeenCalledTimes(2);
 });
});
