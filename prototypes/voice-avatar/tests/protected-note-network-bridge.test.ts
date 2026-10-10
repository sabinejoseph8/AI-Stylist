import {afterEach,describe,it,expect,vi} from 'vitest';
import {createServer} from 'node:http';
import {WebSocket} from 'ws';
import {attachProtectedSimulatedNoteBridge} from '../src/protected-note-network-bridge.ts';
import {NoteBrowserController} from '../src/note-browser-controller.ts';
import {NOTE_EXTRACTION_MODEL} from '../src/openai-note-extractor.ts';
import {SimulatedPreferenceSource} from '../src/simulated-preference-source.ts';
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
function fakeAllowance(){return {purpose:'notes-only-simulation' as const,reserve:vi.fn(async():Promise<string>=>crypto.randomUUID()),closeVerified:vi.fn(async(_id:string)=>{})};}
async function setup(deferred=false,delayConfiguration=false,extra:{allowance?:ReturnType<typeof fakeAllowance>;wait?:boolean;preferences?:SimulatedPreferenceSource;headers?:Record<string,string>}={}){
 const allowance=extra.allowance??fakeAllowance();
 const provider=new Provider();if(delayConfiguration)provider.send.mockImplementation((text:string)=>{const event=JSON.parse(text);if(event.type==='input_audio_buffer.append')provider.frames++;});let release:((response:Response)=>void)|undefined,requestSignal:AbortSignal|undefined;
 const fetch=vi.fn(async(_url:string,init:RequestInit)=>{requestSignal=init.signal as AbortSignal;const input=JSON.parse(JSON.parse(init.body as string).input[0].content[0].text);return deferred?new Promise<Response>(r=>{release=r;}):response(input.turnId,input.currentFragment);});
 const server=createServer((_req,res)=>res.end());const createTransports=vi.fn(()=>({socket:provider,fetch}));const bridge=attachProtectedSimulatedNoteBridge(server,{simulation:true,preview,createTransports,allowance,preferences:extra.preferences});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const address=server.address();if(!address||typeof address==='string')throw Error('No loopback');
 const ws=new WebSocket(`ws://127.0.0.1:${address.port}/api/notebook-simulation`,{headers:extra.headers??headers});const controller=new NoteBrowserController({simulation:true,socket:{send:text=>ws.send(text),close:()=>ws.close(),get bufferedAmount(){return ws.bufferedAmount;}},changed:vi.fn()});
 const messages:string[]=[];ws.on('message',data=>{messages.push(data.toString());controller.receive(JSON.parse(data.toString()));});ws.on('close',()=>controller.disconnected());ws.on('error',()=>controller.disconnected());
 cleanups.push(async()=>{controller.stop();ws.terminate();bridge.dispose();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));});
 if(delayConfiguration){await vi.waitFor(()=>expect(createTransports).toHaveBeenCalledTimes(1));expect(controller.snapshot().ready).toBe(false);expect(controller.begin('premature')).toBe(false);provider.message(config);}
 if(extra.wait!==false)await vi.waitFor(()=>expect(controller.snapshot().notes).not.toBeNull());
 async function begin(turnId:string){expect(controller.begin(turnId)).toBe(true);await vi.waitFor(()=>expect(controller.snapshot().pending).toBe(false));for(let i=0;i<5;i++)expect(controller.audio(new ArrayBuffer(960))).toBe(true);await vi.waitFor(()=>expect(provider.frames).toBeGreaterThanOrEqual(5));}
 function partial(index:number,text:string){provider.message({type:'conversation.item.input_audio_transcription.delta',event_id:`d${index}`,item_id:`i${index}`,content_index:0,delta:text});}
 async function commit(index:number,text:string){expect(controller.commit()).toBe(true);await vi.waitFor(()=>expect(controller.snapshot().pending).toBe(false));provider.message({type:'input_audio_buffer.committed',event_id:`c${index}`,item_id:`i${index}`});provider.message({type:'conversation.item.input_audio_transcription.completed',event_id:`f${index}`,item_id:`i${index}`,content_index:0,transcript:text});await vi.waitFor(()=>expect(controller.snapshot().awaitingProvider).toBe(false));}
 return{messages,provider,fetch,bridge,controller,ws,begin,partial,commit,allowance,createTransports,url:`ws://127.0.0.1:${address.port}/api/notebook-simulation`,release:(r:Response)=>release!(r),signal:()=>requestSignal};
}
describe('protected simulated browser/provider bridge',()=>{
 it('rejects default construction before attaching a listener or creating transports',()=>{const server=createServer(),createTransports=vi.fn();expect(()=>attachProtectedSimulatedNoteBridge(server,{preview,createTransports,allowance:fakeAllowance()})).toThrow('disabled');expect(server.listenerCount('upgrade')).toBe(0);expect(createTransports).not.toHaveBeenCalled();});
 it('carries two turns and customer confirmation through the complete combined path',async()=>{const s=await setup();await s.begin('t1');s.partial(1,'green');await vi.waitFor(()=>expect(s.controller.snapshot().notes?.notes.color).toMatchObject({value:'green',status:'tentative'}));expect(s.controller.confirm('color')).toBe(true);await vi.waitFor(()=>{expect(s.controller.snapshot().pending).toBe(false);expect(s.controller.snapshot().notes?.notes.color.status).toBe('confirmed');});await s.commit(1,'green');await s.begin('t2');s.partial(2,'blue');await vi.waitFor(()=>expect(s.controller.snapshot().notes?.notes.color).toMatchObject({value:'blue',status:'tentative'}));await s.commit(2,'blue');expect(s.provider.frames).toBe(10);s.controller.stop();await vi.waitFor(()=>expect(s.provider.close).toHaveBeenCalledTimes(1));expect(s.controller.snapshot().notes).toBeNull();await vi.waitFor(()=>expect(s.bridge.snapshot().active).toBe(false));expect(s.allowance.closeVerified).toHaveBeenCalledTimes(1);});
 it('preserves a touch correction when an older extraction finishes',async()=>{const s=await setup(true);await s.begin('t1');s.partial(1,'green');await vi.waitFor(()=>expect(s.fetch).toHaveBeenCalledTimes(1));expect(s.controller.edit('color','blue')).toBe(true);await vi.waitFor(()=>{expect(s.controller.snapshot().pending).toBe(false);expect(s.controller.snapshot().notes?.notes.color.value).toBe('blue');});s.release(response('t1','green'));await vi.waitFor(()=>expect(s.signal()?.aborted).toBe(false));await new Promise(r=>setTimeout(r,50));expect(s.controller.snapshot().notes?.notes.color).toMatchObject({value:'blue',status:'confirmed'});});
 it('cancels pending extraction and closes providers on browser disconnect',async()=>{const s=await setup(true);await s.begin('t1');s.partial(1,'green');await vi.waitFor(()=>expect(s.fetch).toHaveBeenCalledTimes(1));s.ws.terminate();await vi.waitFor(()=>expect(s.signal()?.aborted).toBe(true));expect(s.provider.close).toHaveBeenCalledTimes(1);expect(s.controller.snapshot().notes).toBeNull();s.release(response('t1','green'));await new Promise(r=>setTimeout(r,20));expect(s.controller.snapshot().notes).toBeNull();});
 it('holds the connection lease when provider socket cleanup fails',async()=>{const s=await setup();s.provider.close.mockImplementation(()=>{throw Error('private sentinel');});s.controller.stop();await vi.waitFor(()=>expect(s.bridge.snapshot().held).toBe(true));expect(JSON.stringify(s.bridge.snapshot())).not.toContain('sentinel');});
 it('notifies the browser immediately when the provider fails during capture',async()=>{const s=await setup();await s.begin('t1');expect(s.controller.snapshot().audioActive).toBe(true);s.provider.dispatchEvent(new Event('error'));await vi.waitFor(()=>expect(s.controller.snapshot().ended).toBe(true));expect(s.controller.snapshot().audioActive).toBe(false);expect(s.controller.snapshot().notes).toBeNull();expect(s.provider.close).toHaveBeenCalledTimes(1);});
 it('withholds browser readiness until provider configuration is acknowledged',async()=>{const s=await setup(false,true);expect(s.controller.snapshot().ready).toBe(true);await s.begin('t1');expect(s.controller.snapshot().audioActive).toBe(true);});
 it('denies authentication before allowance or transports',async()=>{const s=await setup(false,false,{wait:false,headers:{...headers,Authorization:'Basic invalid'}});await vi.waitFor(()=>expect(s.controller.snapshot().ended).toBe(true));expect(s.allowance.reserve).not.toHaveBeenCalled();expect(s.createTransports).not.toHaveBeenCalled();});
 it('holds exhausted allowance and closes the browser without provider work',async()=>{const allowance=fakeAllowance();allowance.reserve.mockRejectedValue(Error('private'));const s=await setup(false,false,{allowance,wait:false});await vi.waitFor(()=>expect(s.controller.snapshot().ended).toBe(true));expect(s.bridge.snapshot().allowanceState).toBe('held');expect(s.createTransports).not.toHaveBeenCalled();expect(s.allowance.closeVerified).not.toHaveBeenCalled();});
 it('never becomes ready while reservation is pending and closes a late reservation after disconnect',async()=>{const allowance=fakeAllowance();let resolve!:(id:string)=>void;allowance.reserve.mockImplementation(()=>new Promise(r=>{resolve=r;}));const s=await setup(false,false,{allowance,wait:false});await vi.waitFor(()=>expect(allowance.reserve).toHaveBeenCalledTimes(1));expect(s.controller.snapshot().ready).toBe(false);expect(s.createTransports).not.toHaveBeenCalled();s.ws.terminate();await vi.waitFor(()=>expect(s.controller.snapshot().ended).toBe(true));resolve('late-synthetic');await vi.waitFor(()=>expect(allowance.closeVerified).toHaveBeenCalledExactlyOnceWith('late-synthetic'));await vi.waitFor(()=>expect(s.bridge.snapshot().active).toBe(false));expect(s.createTransports).not.toHaveBeenCalled();expect(s.bridge.snapshot().allowanceState).toBe('idle');});
 it('rejects a second connection until durable closure settles',async()=>{const allowance=fakeAllowance();let close!:()=>void;allowance.closeVerified.mockImplementation(()=>new Promise(r=>{close=r;}));const s=await setup(false,false,{allowance});s.controller.stop();await vi.waitFor(()=>expect(s.bridge.snapshot().allowanceState).toBe('closing'));const ws=new WebSocket(s.url,{headers});const denied=await new Promise<number>(resolve=>{ws.on('unexpected-response',(_req,res)=>{res.resume();resolve(res.statusCode!);ws.terminate();});ws.on('error',()=>{});});expect(denied).toBe(409);expect(allowance.reserve).toHaveBeenCalledTimes(1);close();await vi.waitFor(()=>expect(s.bridge.snapshot().active).toBe(false));});
 it('rejects an old session identifier on a replacement connection',async()=>{const s=await setup();const old=s.controller.snapshot().notes!.sessionId;s.controller.stop();await vi.waitFor(()=>expect(s.bridge.snapshot().active).toBe(false));const ws=new WebSocket(s.url,{headers});ws.on('error',()=>{});const closed=new Promise<void>(r=>ws.on('close',()=>r()));ws.on('message',data=>{const message=JSON.parse(data.toString());if(message.type==='ready')ws.send(JSON.stringify({version:1,type:'begin',sessionId:old,sequence:0,turnId:'stale'}));});await closed;await vi.waitFor(()=>expect(s.bridge.snapshot().active).toBe(false));expect(s.allowance.reserve).toHaveBeenCalledTimes(2);expect(s.allowance.closeVerified).toHaveBeenCalledTimes(2);});
 it.each([{Origin:'https://wrong.onrender.com'},{Host:'wrong.onrender.com'}])('rejects a wrong upgrade boundary %j before allowance work',async change=>{const s=await setup(false,false,{wait:false,headers:{...headers,...change}});await vi.waitFor(()=>expect(s.controller.snapshot().ended).toBe(true));expect(s.allowance.reserve).not.toHaveBeenCalled();expect(s.createTransports).not.toHaveBeenCalled();});
 it('rejects commands before readiness and retires a late allowance without providers',async()=>{const allowance=fakeAllowance();let resolve!:(id:string)=>void;allowance.reserve.mockImplementation(()=>new Promise(r=>{resolve=r;}));const s=await setup(false,false,{allowance,wait:false});await vi.waitFor(()=>expect(allowance.reserve).toHaveBeenCalledTimes(1));s.ws.send(JSON.stringify({version:1,type:'begin',sessionId:'invented',sequence:0,turnId:'t1'}));await vi.waitFor(()=>expect(s.controller.snapshot().ended).toBe(true));resolve('synthetic');await vi.waitFor(()=>expect(allowance.closeVerified).toHaveBeenCalledTimes(1));expect(s.createTransports).not.toHaveBeenCalled();await vi.waitFor(()=>expect(s.bridge.snapshot().active).toBe(false));});
 it('holds failed allowance closure and refuses replacement without a second reservation',async()=>{const allowance=fakeAllowance();allowance.closeVerified.mockRejectedValue(Error('private sentinel'));const s=await setup(false,false,{allowance});s.controller.stop();await vi.waitFor(()=>expect(s.bridge.snapshot().held).toBe(true));expect(s.bridge.snapshot().allowanceState).toBe('held');const ws=new WebSocket(s.url,{headers});const denied=await new Promise<number>(resolve=>{ws.on('unexpected-response',(_req,res)=>{res.resume();resolve(res.statusCode!);ws.terminate();});ws.on('error',()=>{});});expect(denied).toBe(409);expect(allowance.reserve).toHaveBeenCalledTimes(1);expect(allowance.closeVerified).toHaveBeenCalledTimes(1);expect(JSON.stringify(s.bridge.snapshot())).not.toContain('sentinel');});
 it('disposal during startup cancels a late allowance without creating providers',async()=>{const allowance=fakeAllowance();let resolve!:(id:string)=>void;allowance.reserve.mockImplementation(()=>new Promise(r=>{resolve=r;}));const s=await setup(false,false,{allowance,wait:false});await vi.waitFor(()=>expect(allowance.reserve).toHaveBeenCalledTimes(1));s.bridge.dispose();resolve('synthetic');await vi.waitFor(()=>expect(allowance.closeVerified).toHaveBeenCalledTimes(1));expect(s.createTransports).not.toHaveBeenCalled();expect(s.bridge.snapshot().closed).toBe(true);});

 it('publishes active preference invalidation without exposing saved constraints',async()=>{
  const preferences=new SimulatedPreferenceSource({simulation:true});const s=await setup(false,false,{preferences});await s.begin('t1');
  const revision=s.controller.snapshot().notes!.revision;
  expect(preferences.replace(1,['private_profile_color'])).toBe(true);
  await vi.waitFor(()=>expect(s.controller.snapshot().notes!.revision).toBeGreaterThan(revision));
  expect(s.controller.snapshot().audioActive).toBe(true);
  expect(s.messages.join('')).not.toContain('private_profile_color');expect(s.messages.join('')).not.toContain('excludedColors');
 });
 it('keeps pending extraction valid under the latest separate profile revision',async()=>{
  const preferences=new SimulatedPreferenceSource({simulation:true});const s=await setup(true,false,{preferences});await s.begin('t1');s.partial(1,'green');
  await vi.waitFor(()=>expect(s.fetch).toHaveBeenCalledTimes(1));const revision=s.controller.snapshot().notes!.revision;
  preferences.replace(1,['private_profile_color']);await vi.waitFor(()=>expect(s.controller.snapshot().notes!.revision).toBeGreaterThan(revision));
  s.release(response('t1','green'));await vi.waitFor(()=>expect(s.controller.snapshot().notes?.notes.color.value).toBe('green'));
  expect(s.signal()?.aborted).toBe(false);expect(s.messages.join('')).not.toContain('private_profile_color');
 });
 it('clears capture and pending extraction on malformed profile data without permitting replacement work',async()=>{
  const preferences=new SimulatedPreferenceSource({simulation:true});const s=await setup(true,false,{preferences});await s.begin('t1');s.partial(1,'green');
  await vi.waitFor(()=>expect(s.fetch).toHaveBeenCalledTimes(1));expect(preferences.replace(1,{})).toBe(false);
  await vi.waitFor(()=>expect(s.controller.snapshot().ended).toBe(true));await vi.waitFor(()=>expect(s.bridge.snapshot().active).toBe(false));
  expect(s.signal()?.aborted).toBe(true);expect(s.controller.snapshot().notes).toBeNull();expect(s.provider.close).toHaveBeenCalledTimes(1);
  s.release(response('t1','green'));await new Promise(r=>setTimeout(r,20));expect(s.controller.snapshot().notes).toBeNull();expect(s.allowance.closeVerified).toHaveBeenCalledTimes(1);
  const fresh=await setup(false,false,{preferences,wait:false});await vi.waitFor(()=>expect(fresh.controller.snapshot().ended).toBe(true));expect(fresh.allowance.reserve).not.toHaveBeenCalled();expect(fresh.createTransports).not.toHaveBeenCalled();
 });
 it('unsubscribes ended sessions and isolates a replacement using the same preference source',async()=>{
  const preferences=new SimulatedPreferenceSource({simulation:true});const old=await setup(false,false,{preferences});old.controller.stop();await vi.waitFor(()=>expect(old.bridge.snapshot().active).toBe(false));
  const fresh=await setup(false,false,{preferences});const revision=fresh.controller.snapshot().notes!.revision;
  preferences.replace(1,['private_profile_color']);await vi.waitFor(()=>expect(fresh.controller.snapshot().notes!.revision).toBeGreaterThan(revision));
  expect(old.controller.snapshot().notes).toBeNull();expect(old.allowance.reserve).toHaveBeenCalledTimes(1);expect(fresh.messages.join('')).not.toContain('private_profile_color');
 });
 it('retires a pending reservation after malformed profile data without constructing providers',async()=>{
  const preferences=new SimulatedPreferenceSource({simulation:true}),allowance=fakeAllowance();let resolve!:(id:string)=>void;
  allowance.reserve.mockImplementation(()=>new Promise(r=>{resolve=r;}));const s=await setup(false,false,{preferences,allowance,wait:false});await vi.waitFor(()=>expect(allowance.reserve).toHaveBeenCalledTimes(1));
  preferences.replace(1,{});resolve('synthetic');await vi.waitFor(()=>expect(s.controller.snapshot().ended).toBe(true));await vi.waitFor(()=>expect(s.bridge.snapshot().active).toBe(false));
  expect(s.createTransports).not.toHaveBeenCalled();expect(allowance.closeVerified).toHaveBeenCalledExactlyOnceWith('synthetic');
 });

 it('keeps preference changes during startup private until readiness',async()=>{
  const preferences=new SimulatedPreferenceSource({simulation:true}),allowance=fakeAllowance();let resolve!:(id:string)=>void;
  allowance.reserve.mockImplementation(()=>new Promise(r=>{resolve=r;}));const s=await setup(false,false,{preferences,allowance,wait:false});await vi.waitFor(()=>expect(allowance.reserve).toHaveBeenCalledTimes(1));
  preferences.replace(1,['private_profile_color']);expect(s.controller.snapshot().ready).toBe(false);expect(s.messages).toEqual([]);resolve('synthetic');
  await vi.waitFor(()=>expect(s.controller.snapshot().notes?.revision).toBe(1));expect(s.controller.snapshot().ready).toBe(true);expect(s.messages.join('')).not.toContain('private_profile_color');
 });
 it('rejects browser profile-save commands without changing server preferences',async()=>{
  const preferences=new SimulatedPreferenceSource({simulation:true,excludedColors:['private_profile_color']});const s=await setup(false,false,{preferences});
  s.ws.send(JSON.stringify({version:1,type:'preferences',sessionId:s.controller.snapshot().notes!.sessionId,sequence:1,excludedColors:[]}));
  await vi.waitFor(()=>expect(s.controller.snapshot().ended).toBe(true));await vi.waitFor(()=>expect(s.bridge.snapshot().active).toBe(false));
  expect(preferences.snapshot()).toEqual({revision:1,excludedColors:['private_profile_color']});expect(s.allowance.closeVerified).toHaveBeenCalledTimes(1);
 });

});
