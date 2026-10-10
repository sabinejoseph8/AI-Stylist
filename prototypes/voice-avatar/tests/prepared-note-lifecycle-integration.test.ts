import {afterEach,describe,it,expect,vi} from 'vitest';
import {createServer} from 'node:http';
import {WebSocket} from 'ws';
import {attachPreparedSimulatedNoteBridge} from '../src/prepared-note-network-bridge.ts';
import {PreparedBrowserNoteSession} from '../src/note-browser-session.ts';
import {bindSimulatedNoteLifecycle} from '../src/note-browser-lifecycle.ts';
import {NOTE_EXTRACTION_MODEL} from '../src/openai-note-extractor.ts';
import {TRANSCRIPTION_MODEL} from '../src/live-transcription.ts';
const preview={origin:'https://fixture.onrender.com',password:'fixture_password_only_for_tests_123456'};
const headers={Host:'fixture.onrender.com',Origin:preview.origin,Authorization:'Basic '+Buffer.from('stylist:'+preview.password).toString('base64')};
const cleanups:(()=>Promise<void>)[]=[];
afterEach(async()=>{for(const cleanup of cleanups.splice(0).reverse())await cleanup();});
const reply=()=>Response.json({model:NOTE_EXTRACTION_MODEL,status:'completed',output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:JSON.stringify({version:1,turnId:'t1',patches:[{field:'color',value:'green',evidence:'green'}]})}]}]});
async function setup(options:{permissionPending?:boolean;extractionPending?:boolean}={}){
 const provider=Object.assign(new EventTarget(),{readyState:1,bufferedAmount:0,frames:0,close:vi.fn(),send:(_text:string)=>{}});
 const event=(value:unknown)=>provider.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(value)}));
 provider.send=text=>{const value=JSON.parse(text);if(value.type==='session.update')queueMicrotask(()=>event({type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:TRANSCRIPTION_MODEL},turn_detection:null}}}}));if(value.type==='input_audio_buffer.append')provider.frames++;};
 let extractionSignal:AbortSignal|undefined,resolveExtraction:((response:Response)=>void)|undefined;
 const fetch=vi.fn(async(_url:string,init:RequestInit)=>{extractionSignal=init.signal as AbortSignal;return options.extractionPending?new Promise<Response>(resolve=>{resolveExtraction=resolve;}):reply();});
 const server=createServer((_req,res)=>res.end()),bridge=attachPreparedSimulatedNoteBridge(server,{simulation:true,preview,createTransports:()=>({socket:provider,fetch})});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const address=server.address();if(!address||typeof address==='string')throw Error('Loopback unavailable');
 const ws=new WebSocket(`ws://127.0.0.1:${address.port}/api/notebook-simulation`,{headers}),socketEvents=new EventTarget(),page=new EventTarget(),visibility=Object.assign(new EventTarget(),{hidden:false});let frame!:(pcm:ArrayBuffer)=>boolean,deviceStopped!:(reason:string)=>void,resolvePermission:((value:boolean)=>void)|undefined;
 const capture={start:vi.fn(async(accept:(pcm:ArrayBuffer)=>boolean,stopped:(reason:string)=>void)=>{frame=accept;deviceStopped=stopped;return options.permissionPending?new Promise<boolean>(resolve=>{resolvePermission=resolve;}):true;}),stop:vi.fn()};
 const changed=vi.fn(),status=vi.fn(),session=new PreparedBrowserNoteSession({simulation:true,capture,socket:{send:value=>ws.send(value),close:()=>ws.close(),get bufferedAmount(){return ws.bufferedAmount;}},changed});
 const binding=bindSimulatedNoteLifecycle({simulation:true,session,socket:socketEvents,page,visibility,status});
 ws.on('message',data=>socketEvents.dispatchEvent(new MessageEvent('message',{data:data.toString()})));ws.on('close',()=>socketEvents.dispatchEvent(new Event('close')));ws.on('error',()=>socketEvents.dispatchEvent(new Event('error')));
 cleanups.push(async()=>{binding.dispose();resolvePermission?.(true);ws.terminate();bridge.dispose();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));});
 await vi.waitFor(()=>expect(session.status().state).toBe('ready'));
 async function begin(){expect(await session.startTurn('t1')).toBe(true);await vi.waitFor(()=>expect(session.snapshot().connection.pending).toBe(false));for(let i=0;i<5;i++)expect(frame(new ArrayBuffer(960))).toBe(true);await vi.waitFor(()=>expect(provider.frames).toBe(5));}
 function partial(){event({type:'conversation.item.input_audio_transcription.delta',event_id:'d1',item_id:'i1',content_index:0,delta:'green'});}
 return{provider,event,fetch,bridge,ws,page,visibility,capture,session,binding,changed,status,begin,partial,frame:()=>frame(new ArrayBuffer(960)),deviceStopped:()=>deviceStopped('device-lost'),permission:()=>resolvePermission!(true),resolveExtraction:()=>resolveExtraction!(reply()),signal:()=>extractionSignal};
}
describe('combined provider factory with browser page and capture lifecycle',()=>{
 it.each(['pagehide','visibility'])('stops capture and clears tentative notes on %s',async kind=>{const s=await setup();await s.begin();s.partial();await vi.waitFor(()=>expect(s.session.snapshot().connection.notes?.notes.color.value).toBe('green'));if(kind==='pagehide')s.page.dispatchEvent(new Event('pagehide'));else{s.visibility.hidden=true;s.visibility.dispatchEvent(new Event('visibilitychange'));}await vi.waitFor(()=>expect(s.provider.close).toHaveBeenCalledTimes(1));expect(s.session.status().state).toBe('ended');expect(s.session.snapshot().connection.notes).toBeNull();expect(s.capture.stop).toHaveBeenCalled();expect(s.frame()).toBe(false);expect(s.bridge.snapshot().active).toBe(false);});
 it.each(['pagehide','provider-failure'])('releases permission granted after %s without sending audio',async kind=>{const s=await setup({permissionPending:true});const pending=s.session.startTurn('t1');await vi.waitFor(()=>expect(s.capture.start).toHaveBeenCalledTimes(1));if(kind==='pagehide')s.page.dispatchEvent(new Event('pagehide'));else s.provider.dispatchEvent(new Event('error'));await vi.waitFor(()=>expect(s.session.snapshot().ended).toBe(true));const stops=s.capture.stop.mock.calls.length;s.permission();expect(await pending).toBe(false);expect(s.capture.stop.mock.calls.length).toBeGreaterThan(stops);expect(s.frame()).toBe(false);expect(s.provider.frames).toBe(0);await vi.waitFor(()=>expect(s.provider.close).toHaveBeenCalledTimes(1));});
 it('cancels extraction on hidden page and ignores its late response',async()=>{const s=await setup({extractionPending:true});await s.begin();s.partial();await vi.waitFor(()=>expect(s.fetch).toHaveBeenCalledTimes(1));s.visibility.hidden=true;s.visibility.dispatchEvent(new Event('visibilitychange'));await vi.waitFor(()=>expect(s.signal()?.aborted).toBe(true));s.resolveExtraction();await new Promise(r=>setTimeout(r,20));expect(s.session.snapshot().connection.notes).toBeNull();expect(s.changed).toHaveBeenLastCalledWith(null);expect(s.provider.close).toHaveBeenCalledTimes(1);});
 it('stops both owners when the capture device is lost',async()=>{const s=await setup();await s.begin();s.deviceStopped();await vi.waitFor(()=>expect(s.provider.close).toHaveBeenCalledTimes(1));expect(s.session.snapshot().capturing).toBe(false);expect(s.session.snapshot().connection.notes).toBeNull();expect(s.frame()).toBe(false);expect(s.bridge.snapshot().active).toBe(false);});
 it('stops capture when the actual browser connection is terminated',async()=>{const s=await setup();await s.begin();s.ws.terminate();await vi.waitFor(()=>expect(s.session.snapshot().ended).toBe(true));await vi.waitFor(()=>expect(s.provider.close).toHaveBeenCalledTimes(1));expect(s.capture.stop).toHaveBeenCalled();expect(s.frame()).toBe(false);expect(s.session.snapshot().connection.notes).toBeNull();});
});
