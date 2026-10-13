import {afterEach,describe,expect,it,vi} from 'vitest';
import {createServer} from 'node:http';
import {isDeepStrictEqual} from 'node:util';
import {WebSocket} from 'ws';
import {attachPreparedNotesOnlyTrial} from '../src/notes-trial-entry.ts';
import {attachProtectedSimulatedNoteBridge} from '../src/protected-note-network-bridge.ts';
import {PreparedNoteAllowance} from '../src/prepared-note-allowance.ts';
import type {PreparedNoteLedger} from '../src/prepared-note-allowance.ts';
import {PreparedBrowserNoteSession} from '../src/note-browser-session.ts';
import {bindSimulatedNoteLifecycle} from '../src/note-browser-lifecycle.ts';
import {prepareNoteOpener} from '../src/prepared-note-opener.ts';
import {TRANSCRIPTION_MODEL} from '../src/live-transcription.ts';
import {NOTE_EXTRACTION_MODEL} from '../src/openai-note-extractor.ts';
const preview={origin:'https://fixture.onrender.com',password:'fixture_password_only_for_tests_123456'};
const headers={Host:'fixture.onrender.com',Origin:preview.origin,Authorization:'Basic '+Buffer.from('stylist:'+preview.password).toString('base64')};
const config={type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:TRANSCRIPTION_MODEL},turn_detection:null}}}};
const cleanups:(()=>Promise<void>)[]=[];
afterEach(async()=>{for(const cleanup of cleanups.splice(0).reverse())await cleanup();});
function store(){
 let saved:PreparedNoteLedger={version:1,purpose:'notes-only-simulation',approval:{id:'synthetic_startup',attempts:2,centsPerAttempt:100,secondsPerAttempt:85},runs:[]};
 return{read:vi.fn(async()=>structuredClone(saved)),compareAndSwap:vi.fn(async(expected:PreparedNoteLedger,next:PreparedNoteLedger)=>{if(!isDeepStrictEqual(saved,expected))return false;saved=structuredClone(next);return true;}),snapshot:()=>structuredClone(saved)};
}
function extractionResponse(init:RequestInit){
 const input=JSON.parse(JSON.parse(init.body as string).input[0].content[0].text);
 return Response.json({model:NOTE_EXTRACTION_MODEL,status:'completed',output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:JSON.stringify({version:1,turnId:input.turnId,patches:[{field:'color',value:input.currentFragment,evidence:input.currentFragment}]})}]}]});
}
async function setup(persistence=store(),extraction=false,dormant=false,counting:'none'|'valid'|'invalid'|'pending'='none',trial=false){
 const allowance=new PreparedNoteAllowance({simulation:true,persistence});
 const socket=Object.assign(new EventTarget(),{readyState:dormant?0:1,bufferedAmount:0,send:vi.fn(),close:vi.fn()}),detachInitialEvents=vi.fn();
 let release!:(value:{socket:typeof socket;detachInitialEvents:()=>void})=>void,initial!:(value:unknown)=>void;
 const manualOpen=vi.fn((_signal:AbortSignal,event:(value:unknown)=>void)=>{initial=event;return new Promise<{socket:typeof socket;detachInitialEvents:()=>void}>(resolve=>{release=resolve;});});
 const construct=vi.fn(()=>({socket,start:vi.fn(()=>{socket.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({type:'session.created',session:{id:'dormant'}})}));})}));
 const open=dormant?vi.fn(prepareNoteOpener({simulation:true,construct})):manualOpen;
 const fetch=vi.fn(async(_url:string,init:RequestInit)=>{if(!extraction)throw Error('No extraction expected.');return extractionResponse(init);});
 let countRelease!:(value:Response)=>void,countSignal:AbortSignal|undefined;
 const countFetch=vi.fn(async(_url:string,init:RequestInit)=>{countSignal=init.signal as AbortSignal;if(counting==='pending')return new Promise<Response>(r=>{countRelease=r;});return Response.json({object:'response.input_tokens',input_tokens:counting==='invalid'?'bad':123});});
 const createStartupTransports=vi.fn(()=>({open,fetch,...(counting==='none'?{}:{countFetch})}));
 let active:Parameters<NonNullable<Parameters<typeof attachProtectedSimulatedNoteBridge>[1]['sessionReady']>>[0]|undefined;
 const server=createServer((_req,res)=>res.end()),bridge=trial?attachPreparedNotesOnlyTrial(server,{simulation:true,preview,allowance,createStartupTransports:()=>({open,fetch,countFetch})}):attachProtectedSimulatedNoteBridge(server,{simulation:true,cleanupRequirement:'remote-verified',preview,allowance,createStartupTransports,sessionReady:session=>{active=session;}});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const address=server.address();if(!address||typeof address==='string')throw Error('No local address');const url=`ws://127.0.0.1:${address.port}/api/notebook-simulation`;
 const clients:WebSocket[]=[],bindings:ReturnType<typeof bindSimulatedNoteLifecycle>[]=[];
 function connect(){
  const ws=new WebSocket(url,{headers});clients.push(ws);const events=new EventTarget(),page=new EventTarget(),visibility=Object.assign(new EventTarget(),{hidden:false}),capture={start:vi.fn(async(accept:(pcm:ArrayBuffer)=>boolean)=>{pcm=accept;return true;}),stop:vi.fn()};
  let pcm:((pcm:ArrayBuffer)=>boolean)|undefined;
  const session=new PreparedBrowserNoteSession({simulation:true,capture,socket:{send:v=>ws.send(v),close:()=>ws.close(),get bufferedAmount(){return ws.bufferedAmount;}},changed:vi.fn()});
  bindings.push(bindSimulatedNoteLifecycle({simulation:true,session,socket:events,page,visibility,status:vi.fn()}));
  ws.on('message',data=>events.dispatchEvent(new MessageEvent('message',{data:data.toString()})));ws.on('close',()=>events.dispatchEvent(new Event('close')));ws.on('error',()=>events.dispatchEvent(new Event('error')));
  return{ws,page,session,capture,frame:()=>pcm!(new ArrayBuffer(960))};
 }
 cleanups.push(async()=>{for(const binding of bindings)binding.dispose();for(const ws of clients)ws.terminate();if(manualOpen.mock.calls.length)release({socket,detachInitialEvents});bridge.dispose();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));});
 return{countFetch,countSignal:()=>countSignal,releaseCount:(r:Response)=>countRelease(r),bridge,connect,persistence,createStartupTransports,construct,open,socket,fetch,active:()=>{if(!active)throw Error("Session not ready");return active;},message:(event:unknown)=>socket.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(event)})),opened:()=>{if(dormant){socket.readyState=1;socket.dispatchEvent(new Event('open'));}else release({socket,detachInitialEvents});},created:()=>initial({type:'session.created',session:{id:'synthetic'}}),ack:(value:unknown=config)=>socket.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(value)}))};
}
describe('startup through protected loopback browser and separate allowance',()=>{
 it('keeps browser capture unavailable until creation and configuration, then retains the hold on end',async()=>{
  const s=await setup(),client=s.connect();await vi.waitFor(()=>expect(s.open).toHaveBeenCalledTimes(1));expect(client.session.status().state).not.toBe('ready');expect(await client.session.startTurn('early')).toBe(false);expect(client.capture.start).not.toHaveBeenCalled();
  s.opened();await Promise.resolve();s.created();expect(client.session.status().state).not.toBe('ready');s.ack();await vi.waitFor(()=>expect(client.session.status().state).toBe('ready'));
  expect(await client.session.startTurn('first')).toBe(true);client.session.stop();await vi.waitFor(()=>expect(s.bridge.snapshot().allowanceState).toBe('held'));expect(client.session.snapshot().capturing).toBe(false);expect(client.session.snapshot().connection.notes).toBeNull();expect(s.socket.close).toHaveBeenCalledTimes(1);expect(s.persistence.compareAndSwap).toHaveBeenCalledTimes(1);expect(s.persistence.snapshot().runs[0]!.closed).toBe(false);
  const fresh=await setup(s.persistence),replacement=fresh.connect();await vi.waitFor(()=>expect(fresh.bridge.snapshot().held).toBe(true));expect(fresh.open).not.toHaveBeenCalled();expect(replacement.session.status().state).not.toBe('ready');expect(s.persistence.snapshot().runs).toHaveLength(1);
 });
 it('holds page exit during opening until the late socket is closed and blocks a fresh owner',async()=>{
  const s=await setup(),client=s.connect();await vi.waitFor(()=>expect(s.open).toHaveBeenCalledTimes(1));client.page.dispatchEvent(new Event('pagehide'));await vi.waitFor(()=>expect(s.bridge.snapshot().allowanceState).toBe('closing'));expect(s.persistence.compareAndSwap).toHaveBeenCalledTimes(1);expect(s.persistence.snapshot().runs[0]!.closed).toBe(false);
  s.opened();await vi.waitFor(()=>expect(s.bridge.snapshot().held).toBe(true));expect(s.socket.close).toHaveBeenCalledTimes(1);expect(s.socket.send).not.toHaveBeenCalled();expect(client.capture.start).not.toHaveBeenCalled();expect(client.session.snapshot().connection.notes).toBeNull();
  const fresh=await setup(s.persistence);fresh.connect();await vi.waitFor(()=>expect(fresh.bridge.snapshot().held).toBe(true));expect(fresh.createStartupTransports).not.toHaveBeenCalled();expect(s.persistence.compareAndSwap).toHaveBeenCalledTimes(1);
 });
 it('never reports Ready for mismatched provider configuration',async()=>{
  const s=await setup(),client=s.connect();await vi.waitFor(()=>expect(s.open).toHaveBeenCalledTimes(1));s.opened();await Promise.resolve();s.created();s.ack({type:'session.updated',session:{type:'transcription'}});await vi.waitFor(()=>expect(s.bridge.snapshot().held).toBe(true));expect(client.session.status().state).not.toBe('ready');expect(client.capture.start).not.toHaveBeenCalled();expect(s.socket.close).toHaveBeenCalledTimes(1);expect(s.persistence.snapshot().runs[0]!.closed).toBe(false);
 });
});


describe('startup-backed speech, correction and recommendation isolation',()=>{
 it('carries two turns, rejects stale extraction and speech, and holds a fresh owner after shutdown',async()=>{
  const s=await setup(store(),true),client=s.connect();
  await vi.waitFor(()=>expect(s.open).toHaveBeenCalledTimes(1));
  s.opened();await Promise.resolve();s.created();s.ack();
  await vi.waitFor(()=>expect(client.session.status().state).toBe('ready'));
  const values={occasion:'wedding',season:'November; season not specified',color:'green',style:'structured',budget:'USD 500 maximum (items only)',lookType:'dress'} as const;
  for(const [field,value] of Object.entries(values)){
   expect(client.session.edit(field as keyof typeof values,value)).toBe(true);
   await vi.waitFor(()=>expect(client.session.snapshot().connection.pending).toBe(false));
  }
  const candidate={id:'green-look',color:'green',style:'structured',occasion:'wedding',lookType:'dress',newItemCents:30000,currency:'USD' as const};
  const ticket=s.active().looks.begin(candidate)!,permit=s.active().looks.complete(ticket)!;
  expect(permit).not.toBeNull();expect(s.active().looks.visual(permit)?.id).toBe('green-look');
  let signal!:AbortSignal,authorize!:()=>boolean;
  expect(s.active().looks.startSpeech(permit,(_draft,abort,frame)=>{signal=abort;authorize=frame;})).toBe(true);
  expect(authorize()).toBe(true);
  async function begin(id:string){
   expect(await client.session.startTurn(id)).toBe(true);
   await vi.waitFor(()=>expect(client.session.snapshot().connection.audioActive).toBe(true));
   for(let i=0;i<5;i++)expect(client.frame()).toBe(true);
   await vi.waitFor(()=>expect(s.socket.send.mock.calls.filter(([text])=>JSON.parse(text).type==='input_audio_buffer.append').length).toBe(id==='t1'?5:10));
  }
  function partial(index:number,text:string){s.message({type:'conversation.item.input_audio_transcription.delta',event_id:`delta-${index}`,item_id:`item-${index}`,content_index:0,delta:text});}
  async function commit(index:number,text:string){
   await vi.waitFor(()=>expect(client.session.snapshot().connection.pending).toBe(false));
   expect(client.session.commit()).toBe(true);
   await vi.waitFor(()=>expect(client.session.snapshot().connection.pending).toBe(false));
   s.message({type:'input_audio_buffer.committed',event_id:`commit-${index}`,item_id:`item-${index}`});
   s.message({type:'conversation.item.input_audio_transcription.completed',event_id:`final-${index}`,item_id:`item-${index}`,content_index:0,transcript:text});
   await vi.waitFor(()=>expect(client.session.status().state).toBe('ready'));
  }
  await begin('t1');expect(signal.aborted).toBe(true);expect(authorize()).toBe(false);
  expect(s.active().looks.visual(permit)).toBeNull();expect(s.active().looks.startSpeech(permit,vi.fn())).toBe(false);
  partial(1,'green');await vi.waitFor(()=>expect(s.fetch).toHaveBeenCalled());await commit(1,'green');
  expect(client.session.confirm('color')).toBe(true);await vi.waitFor(()=>expect(client.session.snapshot().connection.pending).toBe(false));
  let resolve!:(value:Response)=>void,delayed!:RequestInit;
  const before=s.fetch.mock.calls.length;
  s.fetch.mockImplementation(async(_url,init)=>{delayed=init;return new Promise<Response>(r=>{resolve=r;});});
  await begin('t2');partial(2,'green');await vi.waitFor(()=>expect(s.fetch).toHaveBeenCalledTimes(before+1));
  expect(client.session.edit('color','blue')).toBe(true);
  await vi.waitFor(()=>{expect(client.session.snapshot().connection.pending).toBe(false);expect(client.session.snapshot().connection.notes?.notes.color).toMatchObject({value:'blue',status:'confirmed',source:'touch'});});
  s.fetch.mockImplementation(async(_url,init)=>extractionResponse(init));resolve(extractionResponse(delayed));
  await vi.waitFor(()=>expect(s.fetch.mock.settledResults[before]?.type).toBe('fulfilled'));
  await commit(2,'green');
  expect(client.session.snapshot().connection.notes?.notes.color).toMatchObject({value:'blue',status:'confirmed',source:'touch'});
  const rejected=s.active().looks.begin(candidate)!;expect(s.active().looks.complete(rejected)).toBeNull();
  const corrected=s.active().looks.begin({...candidate,id:'blue-look',color:'blue'})!,freshPermit=s.active().looks.complete(corrected)!;
  expect(freshPermit).not.toBeNull();expect(s.active().looks.visual(freshPermit)?.id).toBe('blue-look');
  let latestSignal!:AbortSignal,latestAuthorize!:()=>boolean;
  expect(s.active().looks.startSpeech(freshPermit,(_draft,abort,frame)=>{latestSignal=abort;latestAuthorize=frame;})).toBe(true);
  expect(latestAuthorize()).toBe(true);
  expect(client.session.edit('budget','USD 250 maximum (items only)')).toBe(true);
  await vi.waitFor(()=>{expect(client.session.snapshot().connection.pending).toBe(false);expect(client.session.snapshot().connection.notes?.notes.budget.value).toBe('USD 250 maximum (items only)');});
  expect(latestSignal.aborted).toBe(true);expect(latestAuthorize()).toBe(false);
  expect(s.active().looks.visual(freshPermit)).toBeNull();expect(s.active().looks.startSpeech(freshPermit,vi.fn())).toBe(false);
  const cheaperTicket=s.active().looks.begin({...candidate,id:'cheaper-blue-look',color:'blue',newItemCents:20000})!;
  const cheaperPermit=s.active().looks.complete(cheaperTicket)!;expect(cheaperPermit).not.toBeNull();
  expect(s.active().looks.startSpeech(cheaperPermit,(_draft,abort,frame)=>{latestSignal=abort;latestAuthorize=frame;})).toBe(true);
  expect(latestAuthorize()).toBe(true);const ended=s.active();
  client.session.stop();await vi.waitFor(()=>expect(s.bridge.snapshot().held).toBe(true));
  expect(latestSignal.aborted).toBe(true);expect(latestAuthorize()).toBe(false);expect(ended.looks.visual(cheaperPermit)).toBeNull();
  expect(client.session.snapshot().connection.notes).toBeNull();expect(client.session.snapshot().capturing).toBe(false);
  s.message({type:'conversation.item.input_audio_transcription.delta',event_id:'late',item_id:'item-2',content_index:0,delta:'green'});
  expect(client.session.snapshot().connection.notes).toBeNull();expect(s.socket.close).toHaveBeenCalledTimes(1);
  expect(s.persistence.snapshot().runs[0]!.closed).toBe(false);
  const fresh=await setup(s.persistence,true),replacement=fresh.connect();
  await vi.waitFor(()=>expect(fresh.bridge.snapshot().held).toBe(true));
  expect(fresh.open).not.toHaveBeenCalled();expect(fresh.fetch).not.toHaveBeenCalled();expect(replacement.session.snapshot().connection.notes).toBeNull();
  expect(s.persistence.snapshot().runs).toHaveLength(1);
 });
});

describe('startup-backed cancellation during extraction',()=>{
 it('aborts unfinished extraction, discards its late response and preserves the unresolved reservation',async()=>{
  const s=await setup(store(),true),client=s.connect();
  let resolve!:(value:Response)=>void,request!:RequestInit;
  s.fetch.mockImplementation(async(_url,init)=>{request=init;return new Promise<Response>(r=>{resolve=r;});});
  await vi.waitFor(()=>expect(s.open).toHaveBeenCalledTimes(1));s.opened();await Promise.resolve();s.created();s.ack();
  await vi.waitFor(()=>expect(client.session.status().state).toBe('ready'));
  expect(await client.session.startTurn('pending')).toBe(true);
  await vi.waitFor(()=>expect(client.session.snapshot().connection.audioActive).toBe(true));
  for(let i=0;i<5;i++)expect(client.frame()).toBe(true);
  s.message({type:'conversation.item.input_audio_transcription.delta',event_id:'pending-delta',item_id:'pending-item',content_index:0,delta:'green'});
  await vi.waitFor(()=>expect(s.fetch).toHaveBeenCalledTimes(1));expect(request.signal?.aborted).toBe(false);
  client.page.dispatchEvent(new Event('pagehide'));
  await vi.waitFor(()=>expect(s.bridge.snapshot().held).toBe(true));
  expect(request.signal?.aborted).toBe(true);expect(client.session.snapshot().connection.notes).toBeNull();
  expect(client.session.snapshot().capturing).toBe(false);expect(client.frame()).toBe(false);
  resolve(extractionResponse(request));await vi.waitFor(()=>expect(s.fetch.mock.settledResults[0]?.type).toBe('fulfilled'));
  expect(client.session.snapshot().connection.notes).toBeNull();expect(await client.session.startTurn('late')).toBe(false);
  expect(s.socket.close).toHaveBeenCalledTimes(1);expect(s.persistence.compareAndSwap).toHaveBeenCalledTimes(1);
  const fresh=await setup(s.persistence,true);fresh.connect();await vi.waitFor(()=>expect(fresh.bridge.snapshot().held).toBe(true));
  expect(fresh.createStartupTransports).not.toHaveBeenCalled();expect(fresh.fetch).not.toHaveBeenCalled();
  expect(s.persistence.snapshot().runs).toHaveLength(1);expect(s.persistence.snapshot().runs[0]!.closed).toBe(false);
 });
});


describe('dormant opener through protected browser ownership',()=>{
 it('observes early creation, waits for acknowledgment, and retains the ended reservation',async()=>{
  const s=await setup(store(),false,true),client=s.connect();await vi.waitFor(()=>expect(s.construct).toHaveBeenCalledTimes(1));
  expect(client.capture.start).not.toHaveBeenCalled();expect(s.socket.send).not.toHaveBeenCalled();
  s.opened();await vi.waitFor(()=>expect(s.socket.send).toHaveBeenCalledTimes(1));expect(client.session.status().state).not.toBe('ready');
  s.ack();await vi.waitFor(()=>expect(client.session.status().state).toBe('ready'));
  expect(await client.session.startTurn('dormant')).toBe(true);client.session.stop();
  await vi.waitFor(()=>expect(s.bridge.snapshot().held).toBe(true));expect(s.socket.close).toHaveBeenCalledTimes(1);
  expect(client.session.snapshot().capturing).toBe(false);expect(client.session.snapshot().connection.notes).toBeNull();
  const fresh=await setup(s.persistence,false,true);fresh.connect();await vi.waitFor(()=>expect(fresh.bridge.snapshot().held).toBe(true));expect(fresh.construct).not.toHaveBeenCalled();
  expect(s.persistence.compareAndSwap).toHaveBeenCalledTimes(1);expect(s.persistence.snapshot().runs[0]!.closed).toBe(false);
 });
 it.each(['pagehide','error','failed-close'])('holds %s during opening and rejects late open and replacement',async kind=>{
  const s=await setup(store(),false,true),client=s.connect();await vi.waitFor(()=>expect(s.construct).toHaveBeenCalledTimes(1));
  if(kind==='failed-close')s.socket.close.mockImplementation(()=>{throw Error('private cleanup detail');});
  if(kind==='error')s.socket.dispatchEvent(new Event('error'));else client.page.dispatchEvent(new Event('pagehide'));
  await vi.waitFor(()=>expect(s.bridge.snapshot().held).toBe(true));s.opened();s.ack();
  expect(s.socket.close).toHaveBeenCalledTimes(1);expect(s.socket.send).not.toHaveBeenCalled();expect(client.capture.start).not.toHaveBeenCalled();
  expect(client.session.snapshot().connection.notes).toBeNull();expect(s.fetch).not.toHaveBeenCalled();
  const fresh=await setup(s.persistence,false,true);fresh.connect();await vi.waitFor(()=>expect(fresh.bridge.snapshot().held).toBe(true));
  expect(fresh.createStartupTransports).not.toHaveBeenCalled();expect(fresh.construct).not.toHaveBeenCalled();
  expect(s.persistence.compareAndSwap).toHaveBeenCalledTimes(1);expect(s.persistence.snapshot().runs).toHaveLength(1);expect(s.persistence.snapshot().runs[0]!.closed).toBe(false);
 });
});


describe('counted startup through actual local WebSocket and browser controller',()=>{
 async function ready(s:Awaited<ReturnType<typeof setup>>){
  const client=s.connect();await vi.waitFor(()=>expect(s.open).toHaveBeenCalledTimes(1));s.opened();await Promise.resolve();s.created();s.ack();
  await vi.waitFor(()=>expect(client.session.status().state).toBe('ready'));expect(await client.session.startTurn('t1')).toBe(true);
  await vi.waitFor(()=>expect(client.session.snapshot().connection.audioActive).toBe(true));
  for(let i=0;i<5;i++)expect(client.frame()).toBe(true);
  s.message({type:'conversation.item.input_audio_transcription.delta',event_id:'counted-delta',item_id:'counted-item',content_index:0,delta:'green'});
  return client;
 }
 it('counts the same request before extraction and delivers progressive tentative notes',async()=>{
  const s=await setup(store(),true,false,'valid'),client=await ready(s);
  await vi.waitFor(()=>expect(client.session.snapshot().connection.notes?.notes.color).toMatchObject({value:'green',status:'tentative'}));
  expect(s.countFetch).toHaveBeenCalledTimes(1);expect(s.fetch).toHaveBeenCalledTimes(1);
  expect(s.countFetch.mock.calls[0]![1].body).toBe(s.fetch.mock.calls[0]![1].body);
  client.session.stop();await vi.waitFor(()=>expect(s.bridge.snapshot().held).toBe(true));
  expect(client.session.snapshot().connection.notes).toBeNull();expect(s.persistence.snapshot().runs[0]!.closed).toBe(false);
 });
 it('page exit aborts pending counting and preserves a fresh-owner hold',async()=>{
  const s=await setup(store(),true,false,'pending'),client=await ready(s);
  await vi.waitFor(()=>expect(s.countFetch).toHaveBeenCalledTimes(1));client.page.dispatchEvent(new Event('pagehide'));
  await vi.waitFor(()=>expect(s.bridge.snapshot().held).toBe(true));expect(s.countSignal()?.aborted).toBe(true);
  s.releaseCount(Response.json({object:'response.input_tokens',input_tokens:123}));await new Promise(r=>setTimeout(r,10));
  expect(s.fetch).not.toHaveBeenCalled();expect(client.session.snapshot().connection.notes).toBeNull();expect(client.session.snapshot().capturing).toBe(false);
  const fresh=await setup(s.persistence,true,false,'valid');fresh.connect();await vi.waitFor(()=>expect(fresh.bridge.snapshot().held).toBe(true));
  expect(fresh.open).not.toHaveBeenCalled();expect(fresh.countFetch).not.toHaveBeenCalled();expect(s.persistence.snapshot().runs).toHaveLength(1);
 });
 it('invalid counting ends the browser connection before generation',async()=>{
  const s=await setup(store(),true,false,'invalid'),client=await ready(s);
  await vi.waitFor(()=>expect(s.bridge.snapshot().held).toBe(true));expect(s.countFetch).toHaveBeenCalledTimes(1);expect(s.fetch).not.toHaveBeenCalled();
  await vi.waitFor(()=>expect(client.session.snapshot().connection.notes).toBeNull());expect(client.session.snapshot().capturing).toBe(false);expect(s.socket.close).toHaveBeenCalledTimes(1);
 });
});


it('the concrete notes-only entry enforces two turns before any third capture reaches the provider',async()=>{
 const s=await setup(store(),true,false,'valid',true),client=s.connect();await vi.waitFor(()=>expect(s.open).toHaveBeenCalledTimes(1));s.opened();await Promise.resolve();s.created();s.ack();
 await vi.waitFor(()=>expect(client.session.status().state).toBe('ready'));
 for(let n=1;n<=2;n++){
  expect(await client.session.startTurn('trial-'+n)).toBe(true);await vi.waitFor(()=>expect(client.session.snapshot().connection.audioActive).toBe(true));
  for(let i=0;i<5;i++)expect(client.frame()).toBe(true);
  await vi.waitFor(()=>expect(s.socket.send.mock.calls.filter(([v])=>JSON.parse(v).type==='input_audio_buffer.append')).toHaveLength(n*5));
  expect(client.session.commit()).toBe(true);await vi.waitFor(()=>expect(client.session.snapshot().connection.pending).toBe(false));
  s.message({type:'input_audio_buffer.committed',event_id:'tc-'+n,item_id:'ti-'+n});
  s.message({type:'conversation.item.input_audio_transcription.completed',event_id:'tf-'+n,item_id:'ti-'+n,content_index:0,transcript:'green'});
  await vi.waitFor(()=>expect(client.session.status().state).toBe('ready'));
 }
 const appends=s.socket.send.mock.calls.filter(([v])=>JSON.parse(v).type==='input_audio_buffer.append').length;
 await client.session.startTurn('forbidden-third');await vi.waitFor(()=>expect(s.bridge.snapshot().held).toBe(true));
 await vi.waitFor(()=>expect(client.session.snapshot().connection.notes).toBeNull());
 expect(s.socket.send.mock.calls.filter(([v])=>JSON.parse(v).type==='input_audio_buffer.append')).toHaveLength(appends);
 expect(client.session.snapshot().capturing).toBe(false);expect(s.countFetch).toHaveBeenCalledTimes(2);expect(s.persistence.snapshot().runs[0]!.closed).toBe(false);
});
