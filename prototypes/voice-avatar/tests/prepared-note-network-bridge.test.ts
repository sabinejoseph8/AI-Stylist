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
const config={type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:TRANSCRIPTION_MODEL},turn_detection:null}}}};
class Provider extends EventTarget{
 readyState=1;bufferedAmount=0;frames=0;closed=false;
 close=vi.fn(()=>{this.closed=true;});
 send=vi.fn((text:string)=>{const event=JSON.parse(text);if(event.type==='session.update')queueMicrotask(()=>this.message(config));if(event.type==='input_audio_buffer.append')this.frames++;});
 message(event:unknown){this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(event)}));}
}
function response(turnId:string,text:string){return Response.json({model:NOTE_EXTRACTION_MODEL,status:'completed',output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:JSON.stringify({version:1,turnId,patches:[{field:'color',value:text,evidence:text}]})}]}]});}
async function setup(deferred=false,delayConfiguration=false){
 const provider=new Provider();if(delayConfiguration)provider.send.mockImplementation((text:string)=>{const event=JSON.parse(text);if(event.type==='input_audio_buffer.append')provider.frames++;});let release:((response:Response)=>void)|undefined,requestSignal:AbortSignal|undefined;
 const fetch=vi.fn(async(_url:string,init:RequestInit)=>{requestSignal=init.signal as AbortSignal;const input=JSON.parse(JSON.parse(init.body as string).input[0].content[0].text);return deferred?new Promise<Response>(r=>{release=r;}):response(input.turnId,input.currentFragment);});
 const server=createServer((_req,res)=>res.end());const createTransports=vi.fn(()=>({socket:provider,fetch}));const bridge=attachPreparedSimulatedNoteBridge(server,{simulation:true,preview,createTransports});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const address=server.address();if(!address||typeof address==='string')throw Error('No loopback');
 const ws=new WebSocket(`ws://127.0.0.1:${address.port}/api/notebook-simulation`,{headers});const controller=new NoteBrowserController({simulation:true,socket:{send:text=>ws.send(text),close:()=>ws.close(),get bufferedAmount(){return ws.bufferedAmount;}},changed:vi.fn()});
 ws.on('message',data=>controller.receive(JSON.parse(data.toString())));ws.on('close',()=>controller.disconnected());ws.on('error',()=>controller.disconnected());
 cleanups.push(async()=>{controller.stop();ws.terminate();bridge.dispose();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));});
 if(delayConfiguration){await vi.waitFor(()=>expect(createTransports).toHaveBeenCalledTimes(1));expect(controller.snapshot().ready).toBe(false);expect(controller.begin('premature')).toBe(false);provider.message(config);}
 await vi.waitFor(()=>expect(controller.snapshot().notes).not.toBeNull());
 async function begin(turnId:string){expect(controller.begin(turnId)).toBe(true);await vi.waitFor(()=>expect(controller.snapshot().pending).toBe(false));for(let i=0;i<5;i++)expect(controller.audio(new ArrayBuffer(960))).toBe(true);await vi.waitFor(()=>expect(provider.frames).toBeGreaterThanOrEqual(5));}
 function partial(index:number,text:string){provider.message({type:'conversation.item.input_audio_transcription.delta',event_id:`d${index}`,item_id:`i${index}`,content_index:0,delta:text});}
 async function commit(index:number,text:string){expect(controller.commit()).toBe(true);await vi.waitFor(()=>expect(controller.snapshot().pending).toBe(false));provider.message({type:'input_audio_buffer.committed',event_id:`c${index}`,item_id:`i${index}`});provider.message({type:'conversation.item.input_audio_transcription.completed',event_id:`f${index}`,item_id:`i${index}`,content_index:0,transcript:text});await vi.waitFor(()=>expect(controller.snapshot().awaitingProvider).toBe(false));}
 return{provider,fetch,bridge,controller,ws,begin,partial,commit,release:(r:Response)=>release!(r),signal:()=>requestSignal};
}
describe('combined disabled browser/provider bridge',()=>{
 it('rejects default construction before attaching a listener or creating transports',()=>{const server=createServer(),createTransports=vi.fn();expect(()=>attachPreparedSimulatedNoteBridge(server,{preview,createTransports})).toThrow('disabled');expect(server.listenerCount('upgrade')).toBe(0);expect(createTransports).not.toHaveBeenCalled();});
 it('carries two turns and customer confirmation through the complete combined path',async()=>{const s=await setup();await s.begin('t1');s.partial(1,'green');await vi.waitFor(()=>expect(s.controller.snapshot().notes?.notes.color).toMatchObject({value:'green',status:'tentative'}));expect(s.controller.confirm('color')).toBe(true);await vi.waitFor(()=>{expect(s.controller.snapshot().pending).toBe(false);expect(s.controller.snapshot().notes?.notes.color.status).toBe('confirmed');});await s.commit(1,'green');await s.begin('t2');s.partial(2,'blue');await vi.waitFor(()=>expect(s.controller.snapshot().notes?.notes.color).toMatchObject({value:'blue',status:'tentative'}));await s.commit(2,'blue');expect(s.provider.frames).toBe(10);s.controller.stop();await vi.waitFor(()=>expect(s.provider.close).toHaveBeenCalledTimes(1));expect(s.controller.snapshot().notes).toBeNull();expect(s.bridge.snapshot().active).toBe(false);});
 it('preserves a touch correction when an older extraction finishes',async()=>{const s=await setup(true);await s.begin('t1');s.partial(1,'green');await vi.waitFor(()=>expect(s.fetch).toHaveBeenCalledTimes(1));expect(s.controller.edit('color','blue')).toBe(true);await vi.waitFor(()=>{expect(s.controller.snapshot().pending).toBe(false);expect(s.controller.snapshot().notes?.notes.color.value).toBe('blue');});s.release(response('t1','green'));await vi.waitFor(()=>expect(s.signal()?.aborted).toBe(false));await new Promise(r=>setTimeout(r,50));expect(s.controller.snapshot().notes?.notes.color).toMatchObject({value:'blue',status:'confirmed'});});
 it('cancels pending extraction and closes providers on browser disconnect',async()=>{const s=await setup(true);await s.begin('t1');s.partial(1,'green');await vi.waitFor(()=>expect(s.fetch).toHaveBeenCalledTimes(1));s.ws.terminate();await vi.waitFor(()=>expect(s.signal()?.aborted).toBe(true));expect(s.provider.close).toHaveBeenCalledTimes(1);expect(s.controller.snapshot().notes).toBeNull();s.release(response('t1','green'));await new Promise(r=>setTimeout(r,20));expect(s.controller.snapshot().notes).toBeNull();});
 it('holds the connection lease when provider socket cleanup fails',async()=>{const s=await setup();s.provider.close.mockImplementation(()=>{throw Error('private sentinel');});s.controller.stop();await vi.waitFor(()=>expect(s.bridge.snapshot().held).toBe(true));expect(JSON.stringify(s.bridge.snapshot())).not.toContain('sentinel');});
 it('notifies the browser immediately when the provider fails during capture',async()=>{const s=await setup();await s.begin('t1');expect(s.controller.snapshot().audioActive).toBe(true);s.provider.dispatchEvent(new Event('error'));await vi.waitFor(()=>expect(s.controller.snapshot().ended).toBe(true));expect(s.controller.snapshot().audioActive).toBe(false);expect(s.controller.snapshot().notes).toBeNull();expect(s.provider.close).toHaveBeenCalledTimes(1);});
 it('withholds browser readiness until provider configuration is acknowledged',async()=>{const s=await setup(false,true);expect(s.controller.snapshot().ready).toBe(true);await s.begin('t1');expect(s.controller.snapshot().audioActive).toBe(true);});
});
