/** Invoked only after the owner harness verifies its isolated synthetic database. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {WebSocket} from 'ws';
import {PreparedNoteAllowance} from '../src/prepared-note-allowance.ts';
import type {PreparedNoteLedger} from '../src/prepared-note-allowance.ts';
import {createPreparedNotePersistenceTransport} from '../src/prepared-note-persistence-transport.ts';
import {attachProtectedSimulatedNoteBridge} from '../src/protected-note-network-bridge.ts';
import {PreparedBrowserNoteSession} from '../src/note-browser-session.ts';
import {bindSimulatedNoteLifecycle} from '../src/note-browser-lifecycle.ts';
import {TRANSCRIPTION_MODEL} from '../src/live-transcription.ts';
import {NOTE_EXTRACTION_MODEL} from '../src/openai-note-extractor.ts';

type Database = {reset:()=>Promise<string>;read:()=>Promise<PreparedNoteLedger>;sql:(query:string)=>Promise<string>;literal:(value:unknown)=>string};
type Fault = 'none'|'reserve-pending'|'closure-pending'|'closure-failed'|'reserve-ack-lost';
const preview={origin:'https://fixture.onrender.com',password:'synthetic_local_password_123456789'};
const headers={Host:'fixture.onrender.com',Origin:preview.origin,Authorization:'Basic '+Buffer.from('stylist:'+preview.password).toString('base64')};
async function until(check:()=>boolean,timeout=4000) {
 const deadline=Date.now()+timeout;
 while(!check()) {if(Date.now()>deadline)throw Error('Local browser check did not settle.');await new Promise(resolve=>setTimeout(resolve,10));}
}
async function harness(db:Database,fault:Fault='none',extract?:(url:string,init:RequestInit)=>Promise<Response>) {
 let calls=0,providers=0,closed=0,closureGated=false,release:()=>void=()=>{};
 let signalPending!:()=>void;
 const pending=new Promise<void>(resolve=>{signalPending=resolve;});
 let emit:(value:unknown)=>void=()=>{throw Error('Synthetic provider is not constructed.');};
 const gate=async()=>{const wait=new Promise<void>(resolve=>{release=resolve;});signalPending();await wait;};
 const fetch=async(url:string,init:RequestInit):Promise<Response>=>{
  calls++;
  if(url==='https://fixture.supabase.co/rest/v1/rpc/stylist_notebook_allowance_read')return Response.json(await db.read());
  assert.equal(url,'https://fixture.supabase.co/rest/v1/rpc/stylist_notebook_allowance_change');
  const {expected,replacement}=JSON.parse(init.body as string) as {expected:PreparedNoteLedger;replacement:PreparedNoteLedger};
  const reserving=replacement.runs.some(run=>!run.closed);
  if(!reserving&&fault==='closure-failed')return new Response('null',{status:500,headers:{'content-type':'application/json'}});
  if(!reserving&&fault==='closure-pending'&&!closureGated){closureGated=true;await gate();}
  let applied:string;
  try{applied=await db.sql('set role service_role; select public.stylist_notebook_allowance_change('+db.literal(expected)+','+db.literal(replacement)+');');}
  catch{return new Response('null',{status:500,headers:{'content-type':'application/json'}});}
  assert.equal(applied,'t');
  if(reserving&&fault==='reserve-ack-lost')throw Error('Synthetic acknowledgment loss.');
  if(reserving&&fault==='reserve-pending')await gate();
  return Response.json(true);
 };
 const persistence=createPreparedNotePersistenceTransport({simulation:true,url:'https://fixture.supabase.co',fetch});
 const allowance=new PreparedNoteAllowance({simulation:true,persistence});
 const server=createServer((_req,res)=>{res.writeHead(404);res.end();});
 const bridge=attachProtectedSimulatedNoteBridge(server,{simulation:true,preview,allowance,createTransports:()=>{
  providers++;
  const socket=Object.assign(new EventTarget(),{readyState:1,bufferedAmount:0,close:()=>{closed++;},send:(value:string)=>{
   if(JSON.parse(value).type==='session.update')queueMicrotask(()=>socket.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:TRANSCRIPTION_MODEL},turn_detection:null}}}})})));
  }});
  emit=value=>socket.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(value)}));
  return {socket,fetch:extract??(async()=>{throw Error('No provider requests permitted.');})};
 }});
 await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const address=server.address();if(!address||typeof address==='string')throw Error('Loopback listener unavailable.');
 const url=`ws://127.0.0.1:${address.port}/api/notebook-simulation`;
 const sockets:WebSocket[]=[],bindings:ReturnType<typeof bindSimulatedNoteLifecycle>[]=[];
 function connect(){
  const socket=new WebSocket(url,{headers});sockets.push(socket);
  const events=new EventTarget(),page=new EventTarget(),visibility=Object.assign(new EventTarget(),{hidden:false});
  let starts=0,stops=0,frame:(pcm:ArrayBuffer)=>boolean=()=>false;
  const capture={start:async(accept:(pcm:ArrayBuffer)=>boolean)=>{starts++;frame=accept;return true;},stop:()=>{stops++;}};
  const session=new PreparedBrowserNoteSession({simulation:true,capture,socket:{send:value=>socket.send(value),close:()=>socket.close(),get bufferedAmount(){return socket.bufferedAmount;}},changed:()=>{}});
  const binding=bindSimulatedNoteLifecycle({simulation:true,session,socket:events,page,visibility,status:()=>{}});bindings.push(binding);
  socket.on('message',data=>events.dispatchEvent(new MessageEvent('message',{data:data.toString()})));
  socket.on('close',()=>events.dispatchEvent(new Event('close')));socket.on('error',()=>events.dispatchEvent(new Event('error')));
  return {socket,session,page,visibility,captureCounts:()=>({starts,stops}),frame:()=>frame(new ArrayBuffer(960))};
 }
 async function denied(requestHeaders:Record<string,string>=headers){
  const socket=new WebSocket(url,{headers:requestHeaders});sockets.push(socket);socket.on('error',()=>{});
  return new Promise<number>((resolve,reject)=>{
   const timer=setTimeout(()=>{socket.terminate();reject(Error('Expected local upgrade refusal.'));},4000);
   socket.on('unexpected-response',(_req,res)=>{clearTimeout(timer);res.resume();resolve(res.statusCode!);socket.terminate();});
   socket.on('open',()=>{clearTimeout(timer);socket.terminate();reject(Error('Unexpected replacement connection.'));});
  });
 }
 async function dispose(){
  release();
  for(const binding of bindings)binding.dispose();
  for(const socket of sockets)socket.terminate();
  try{await until(()=>!bridge.snapshot().active||bridge.snapshot().held);}finally{
   bridge.dispose();server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));
  }
 }
 return {bridge,pending,release:()=>release(),connect,denied,dispose,emit:(value:unknown)=>emit(value),counts:()=>({calls,providers,closed})};
}
export async function checkNotebookBrowserDb(db:Database){
 const fixtures:Awaited<ReturnType<typeof harness>>[]=[];
 const open=async(fault:Fault='none',extract?:(url:string,init:RequestInit)=>Promise<Response>)=>{const fixture=await harness(db,fault,extract);fixtures.push(fixture);return fixture;};
 const response=(turnId:string,text:string)=>Response.json({model:NOTE_EXTRACTION_MODEL,status:'completed',output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:JSON.stringify({version:1,turnId,patches:[{field:'color',value:text,evidence:text}]})}]}]});
 const fragment=(init:RequestInit)=>JSON.parse(JSON.parse(init.body as string).input[0].content[0].text) as {turnId:string;currentFragment:string};
 const delta=(index:number,text:string)=>({type:'conversation.item.input_audio_transcription.delta',event_id:`delta_${index}`,item_id:`item_${index}`,content_index:0,delta:text});
 async function begin(client:ReturnType<Awaited<ReturnType<typeof harness>>['connect']>,id:string){
  assert.equal(await client.session.startTurn(id),true);await until(()=>!client.session.snapshot().connection.pending);
  for(let i=0;i<5;i++)assert.equal(client.frame(),true);
 }
 async function commit(fixture:Awaited<ReturnType<typeof harness>>,client:ReturnType<typeof fixture.connect>,index:number,text:string){
  assert.equal(client.session.commit(),true);await until(()=>!client.session.snapshot().connection.pending);
  fixture.emit({type:'input_audio_buffer.committed',event_id:`commit_${index}`,item_id:`item_${index}`});
  fixture.emit({type:'conversation.item.input_audio_transcription.completed',event_id:`final_${index}`,item_id:`item_${index}`,content_index:0,transcript:text});
  await until(()=>!client.session.snapshot().connection.awaitingProvider);
 }
 const clear=async()=>{
  const results=await Promise.allSettled(fixtures.splice(0).reverse().map(fixture=>fixture.dispose()));
  if(results.some(result=>result.status==='rejected'))throw Error('Local browser fixture cleanup requires review.');
 };
 try{
  await db.reset();
  const access=await open();
  assert.equal(await access.denied({...headers,Origin:'https://other.invalid'}),403);
  assert.equal(await access.denied({...headers,Host:'other.invalid'}),403);
  assert.equal(await access.denied({...headers,Authorization:'Basic '+Buffer.from('stylist:incorrect').toString('base64')}),401);
  assert.deepEqual(access.counts(),{calls:0,providers:0,closed:0});assert.equal((await db.read()).runs.length,0);await clear();

  await db.reset();
  const pending=await open('reserve-pending'),departing=pending.connect();
  await pending.pending;
  assert.equal((await db.read()).runs[0]!.closed,false);
  departing.page.dispatchEvent(new Event('pagehide'));
  await until(()=>departing.socket.readyState===WebSocket.CLOSED);
  assert.equal(await pending.denied(),409);assert.equal(pending.counts().providers,0);
  pending.release();await until(()=>!pending.bridge.snapshot().active);
  assert.equal((await db.read()).runs[0]!.closed,true);
  assert.equal(departing.session.snapshot().connection.notes,null);
  assert.equal(pending.counts().calls,4);await clear();

  await db.reset();
  const closing=await open('closure-pending'),first=closing.connect();
  await until(()=>first.session.status().state==='ready');
  first.page.dispatchEvent(new Event('pagehide'));await closing.pending;
  assert.equal(closing.bridge.snapshot().allowanceState,'closing');assert.equal(await closing.denied(),409);
  assert.equal((await db.read()).runs[0]!.closed,false);
  closing.release();await until(()=>!closing.bridge.snapshot().active);
  const second=closing.connect();await until(()=>second.session.status().state==='ready');
  const history=await db.read();assert.equal(history.runs.length,2);assert.equal(history.runs[0]!.closed,true);assert.equal(history.runs[1]!.closed,false);
  second.session.stop();
  await until(()=>!closing.bridge.snapshot().active);assert.ok((await db.read()).runs.every(run=>run.closed));await clear();

  await db.reset();
  const failed=await open('closure-failed'),leaving=failed.connect();await until(()=>leaving.session.status().state==='ready');
  leaving.page.dispatchEvent(new Event('pagehide'));await until(()=>failed.bridge.snapshot().held);
  assert.equal(await failed.denied(),409);assert.equal((await db.read()).runs[0]!.closed,false);
  assert.deepEqual(failed.counts(),{calls:4,providers:1,closed:1});await clear();

  await db.reset();
  const uncertain=await open('reserve-ack-lost'),uncertainClient=uncertain.connect();await until(()=>uncertain.bridge.snapshot().held);
  const unresolved=await db.read();assert.equal(unresolved.runs[0]!.closed,false);
  assert.equal(uncertainClient.session.snapshot().connection.ready,false);assert.equal(uncertain.counts().providers,0);
  const fresh=await open();fresh.connect();await until(()=>fresh.bridge.snapshot().held);
  assert.equal(fresh.counts().providers,0);assert.deepEqual(await db.read(),unresolved);assert.equal(await fresh.denied(),409);await clear();

  await db.reset();
  const hidden=await open(),active=hidden.connect();await until(()=>active.session.status().state==='ready');
  assert.equal(await active.session.startTurn('synthetic_turn'),true);
  active.visibility.hidden=true;active.visibility.dispatchEvent(new Event('visibilitychange'));
  await until(()=>!hidden.bridge.snapshot().active);
  assert.equal(active.captureCounts().starts,1);assert.ok(active.captureCounts().stops>=1);
  assert.equal(active.session.snapshot().capturing,false);assert.equal(active.session.snapshot().connection.notes,null);
  assert.equal((await db.read()).runs[0]!.closed,true);assert.deepEqual(hidden.counts(),{calls:4,providers:1,closed:1});await clear();

  await db.reset();
  const timedOut=await open('reserve-pending'),waiting=timedOut.connect();await timedOut.pending;
  await until(()=>timedOut.bridge.snapshot().held,12000); // Exercise the real eight-second transport deadline.
  assert.equal(waiting.session.snapshot().connection.ready,false);assert.equal(timedOut.counts().providers,0);
  const timedOutHistory=await db.read();assert.equal(timedOutHistory.runs[0]!.closed,false);
  timedOut.release();await until(()=>waiting.socket.readyState===WebSocket.CLOSED);
  const replacement=await open();replacement.connect();await until(()=>replacement.bridge.snapshot().held);
  assert.equal(replacement.counts().providers,0);assert.deepEqual(await db.read(),timedOutHistory);
  assert.equal(timedOut.counts().calls,2);await clear();

  await db.reset();
  const notes=await open('none',async(_url,init)=>{const input=fragment(init);return response(input.turnId,input.currentFragment);});
  const notebook=notes.connect();await until(()=>notebook.session.status().state==='ready');
  await begin(notebook,'turn_1');notes.emit(delta(1,'green'));
  await until(()=>notebook.session.snapshot().connection.notes?.notes.color.value==='green');
  assert.equal(notebook.session.snapshot().connection.notes?.notes.color.status,'tentative');
  assert.equal(notebook.session.confirm('color'),true);await until(()=>!notebook.session.snapshot().connection.pending);
  assert.equal(notebook.session.snapshot().connection.notes?.notes.color.status,'confirmed');
  await commit(notes,notebook,1,'green');await begin(notebook,'turn_2');notes.emit(delta(2,'blue'));
  await until(()=>notebook.session.snapshot().connection.notes?.notes.color.value==='blue');
  assert.equal(notebook.session.snapshot().connection.notes?.notes.color.status,'tentative');
  await commit(notes,notebook,2,'blue');notebook.session.stop();await until(()=>!notes.bridge.snapshot().active);
  assert.equal(notebook.session.snapshot().connection.notes,null);assert.equal((await db.read()).runs[0]!.closed,true);await clear();

  await db.reset();
  let releaseExtraction!:(value:Response)=>void,extractCalls=0;
  const edited=await open('none',async(_url,init)=>{
   const input=fragment(init);extractCalls++;
   if(extractCalls===1)return new Promise<Response>(resolve=>{releaseExtraction=resolve;});
   return response(input.turnId,input.currentFragment);
  });
  const customer=edited.connect();await until(()=>customer.session.status().state==='ready');await begin(customer,'turn_1');edited.emit(delta(1,'green'));
  await until(()=>extractCalls===1);assert.equal(customer.session.edit('color','blue'),true);
  await until(()=>!customer.session.snapshot().connection.pending);releaseExtraction(response('turn_1','green'));
  await commit(edited,customer,1,'green');
  assert.equal(customer.session.snapshot().connection.notes?.notes.color.value,'blue');
  assert.equal(customer.session.snapshot().connection.notes?.notes.color.status,'confirmed');
  customer.session.stop();await until(()=>!edited.bridge.snapshot().active);assert.equal((await db.read()).runs[0]!.closed,true);await clear();

  await db.reset();
  let canceledSignal:AbortSignal|undefined,releaseLate!:(value:Response)=>void;
  const late=await open('none',async(_url,init)=>{canceledSignal=init.signal as AbortSignal;return new Promise<Response>(resolve=>{releaseLate=resolve;});});
  const leavingDuringExtraction=late.connect();await until(()=>leavingDuringExtraction.session.status().state==='ready');
  await begin(leavingDuringExtraction,'turn_1');late.emit(delta(1,'green'));await until(()=>Boolean(canceledSignal));
  leavingDuringExtraction.page.dispatchEvent(new Event('pagehide'));await until(()=>canceledSignal!.aborted);
  const lateResponse=response('turn_1','green');releaseLate(lateResponse);
  await until(()=>lateResponse.bodyUsed);await until(()=>!late.bridge.snapshot().active);
  assert.equal(leavingDuringExtraction.session.snapshot().connection.notes,null);assert.equal(leavingDuringExtraction.frame(),false);
  assert.equal((await db.read()).runs[0]!.closed,true);assert.equal(late.counts().closed,1);await clear();
  console.log('10 local SQL-backed loopback browser scenarios passed, including note extraction and correction. Devices and providers were synthetic.');
 }finally{await clear();}
}
