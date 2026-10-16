import {createHash,timingSafeEqual} from 'node:crypto';
import type {CviConversationInput,createLocalCviStyling} from './local-cvi-styling.ts';
type Flow=ReturnType<typeof createLocalCviStyling>;
type Binding=Readonly<{origin:string;conversation:string;secret:string;expiresAt:number}>;
const owners=new WeakMap<object,{flow:Flow;bindingDigest:string;storeId:string;guarded:boolean;isIdle():boolean}>();
/** Server composition check, not an HTTP-supplied permission or key lookup. */
export function localCviOwnerBoundary(owner:object,flow:Flow,bindingDigest:string){const pin=owners.get(owner);return pin?.guarded&&pin.flow===flow&&pin.bindingDigest===bindingDigest?Object.freeze({storeId:pin.storeId,bindingDigest:pin.bindingDigest}):null;}
export const localCviOwnerIsIdle=(owner:object)=>owners.get(owner)?.isIdle()===true;
export const cviBodyAdmissionDigest=(digest:string)=>createHash('sha256').update('local-cvi-body-admission-v1:'+digest).digest('hex');
export type CviReplayRequest=Readonly<{storeId:string;bindingDigest:string;requestDigest:string;now:number}>;
export type CviReplayReceipt=Readonly<CviReplayRequest & {receipt:string;status:'reserved'|'spent'}>;
/** Disconnected durable-admission port. A write must commit before acknowledgment. */
export interface CviReplayPort {
 readonly storeId:string;
 reserve(input:CviReplayRequest,signal:AbortSignal):Promise<unknown>;
 consume(input:CviReplayReceipt,signal:AbortSignal):Promise<unknown>;
}
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
const fixedHeaders={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const deny=(status:number)=>new Response(JSON.stringify({error:'CVI request unavailable'}),{status,headers:{...fixedHeaders,'Content-Type':'application/json'}});
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
function validBody(v:unknown):boolean{
 if(!exact(v,['model','stream','messages'])||v.model!=='local-simulation'||v.stream!==true||!Array.isArray(v.messages)||v.messages.length<1||v.messages.length>32)return false;
 return v.messages.every(m=>exact(m,['role','content'])&&['user','assistant','system'].includes(String(m.role))&&typeof m.content==='string'&&m.content.length<=4000);
}
/** Proposed local wire contract, NOT verified Tavus request/header compatibility.
 * Secret is injected by server/test owner, never body or forwarded headers.
 * No listener, route registration, SDK, environment access or provider work. */
export function createLocalCviEndpoint(binding:Binding,flow:Flow,clock=Date.now,deadlineMs=1000,replay?:CviReplayPort,fence?:Readonly<{check(signal:AbortSignal,now:number):Promise<boolean>;stale?(signal:AbortSignal):boolean}>){
 let u:URL;try{u=new URL(binding.origin);}catch{throw Error('Invalid local CVI configuration');}
 if(u.origin!==binding.origin||u.protocol!=='https:'||!/^fixture-[a-z0-9-]{1,60}$/.test(binding.conversation)||
  !/^[a-f0-9]{64}$/.test(binding.secret)||!Number.isSafeInteger(binding.expiresAt)||
  !Number.isInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Invalid local CVI configuration');
 // Capture immutable primitive configuration, including if caller mutates its object.
 const origin=binding.origin,conversation=binding.conversation,secret=Buffer.from(`Bearer ${binding.secret}`),expiresAt=binding.expiresAt;
 let closed=false,unsettled=false,lastClock=-Infinity,active:{abort:AbortController;release:()=>void}|undefined;
 const used=new Set<string>(),deliveries=new WeakMap<Request,'reserved'|'spent'>();
 const storeId=replay?.storeId;
 if(replay&&(!/^[a-f0-9-]{36}$/.test(storeId??'')||typeof replay.reserve!=='function'||typeof replay.consume!=='function'))throw Error('Invalid local replay configuration');
 const bindingDigest=hash(JSON.stringify([origin,conversation,binding.secret,expiresAt]));
 const acknowledge=(raw:unknown,input:CviReplayRequest,status:'reserved'|'spent',receipt?:string):CviReplayReceipt=>{
  if(!exact(raw,['storeId','bindingDigest','requestDigest','now','receipt','status'])||raw.storeId!==input.storeId||
    raw.bindingDigest!==input.bindingDigest||raw.requestDigest!==input.requestDigest||raw.now!==input.now||raw.status!==status||
    typeof raw.receipt!=='string'||!/^fixture-receipt-[a-f0-9]{32}$/.test(raw.receipt)||(receipt!==undefined&&raw.receipt!==receipt))throw Error();
  return Object.freeze({...input,receipt:raw.receipt,status});
 };
 const current=()=>{try{const n=clock();if(!Number.isSafeInteger(n)||n<lastClock||n>=expiresAt){end();return false;}lastClock=n;return !closed;}catch{end();return false;}};
 function end(){if(closed)return;closed=true;active?.abort.abort();active?.release();flow.end();}
 const endpoint=Object.freeze({end,
 /** Original in-memory request only. This is consumption evidence, never a
  * new output permission or a handoff reconstructed from stored records. */
 deliveryState(request:Request){return Object.freeze({status:deliveries.get(request)??'unseen'});},
 /** Permanently spend a body admission BEFORE a separate turn delivery. It
  * grants no output permission and has no unguarded/credential-only fallback. */
 async spendAdmission(bodyDigest:string,external:AbortSignal){
  if(!/^[a-f0-9]{64}$/.test(bodyDigest)||!fence||typeof fence.check!=='function'||!replay||external.aborted||!current()||active||!flow.available()||used.has('admission:'+bodyDigest)||used.size>=64)return null;
  used.add('admission:'+bodyDigest);
  const operationExpiresAt=Math.min(expiresAt,lastClock+deadlineMs);
  const abort=new AbortController(),stop=()=>abort.abort();let timer:ReturnType<typeof setTimeout>|undefined,released=false;
  const operation={abort,release:()=>{if(released)return;released=true;if(timer)clearTimeout(timer);external.removeEventListener('abort',stop);if(active===operation)active=undefined;}};
  active=operation;external.addEventListener('abort',stop,{once:true});timer=setTimeout(stop,deadlineMs);
  const canceled=new Promise<never>((_,reject)=>abort.signal.addEventListener('abort',()=>reject(Error()),{once:true}));void canceled.catch(()=>{});
  const live=()=>{if(active!==operation||abort.signal.aborted)return false;if(!current()||lastClock>=operationExpiresAt){stop();return false;}return true;};
  const checked=async()=>{if(!live()||await Promise.race([fence.check(abort.signal,lastClock),canceled])!==true||!live())throw Error();};
  try{
   await checked();
   const input=Object.freeze({storeId:storeId!,bindingDigest,requestDigest:cviBodyAdmissionDigest(bodyDigest),now:lastClock});
   unsettled=true;const reserved=acknowledge(await Promise.race([Promise.resolve().then(()=>{if(!live())throw Error();return replay.reserve(input,abort.signal);}),canceled]),input,'reserved');
   await checked();const spending=Object.freeze({...reserved,now:lastClock});
   const spent=acknowledge(await Promise.race([Promise.resolve().then(()=>{if(!live())throw Error();return replay.consume(spending,abort.signal);}),canceled]),spending,'spent',reserved.receipt);
   unsettled=false;await checked();
   return Object.freeze({status:'spent-admission',storeId:spent.storeId,bindingDigest:spent.bindingDigest,requestDigest:spent.requestDigest,receipt:spent.receipt,now:spent.now});
  }catch{stop();return null;}finally{operation.release();}
 },async handle(request:Request,advisory?:CviConversationInput):Promise<Response>{
  let capturedAdvisory:CviConversationInput|undefined;try{capturedAdvisory=advisory===undefined?undefined:structuredClone(advisory);}catch{return deny(400);}
  if(!current())return deny(410);
  const url=new URL(request.url);
  if((request.headers.has('host')&&request.headers.get('host')!==u.host)||url.origin!==origin||url.pathname!=='/v1/chat/completions'||url.search||request.method!=='POST')return deny(404);
  // This is server-to-server. Browser credentials and redirects are not accepted.
  if(request.headers.has('origin')||request.headers.has('cookie'))return deny(403);
  const auth=Buffer.from(request.headers.get('authorization')??'');
  if(auth.length!==secret.length||!timingSafeEqual(auth,secret)||request.headers.get('x-cvi-conversation')!==conversation)return deny(401);
  const id=request.headers.get('x-cvi-request-id')??'';
  if(!/^fixture-[a-z0-9-]{1,60}$/.test(id)||request.headers.get('content-type')!=='application/json'||
    request.headers.has('content-encoding')||request.signal.aborted)return deny(400);
  if(used.has(id)||used.size>=64)return deny(409);
  used.add(id); // Never refund an authenticated attempt, including busy/failed requests.
  if(active||!flow.available())return deny(409);
  const operationExpiresAt=Math.min(expiresAt,lastClock+deadlineMs);
  const abort=new AbortController();let released=false,timer:ReturnType<typeof setTimeout>|undefined;
  const stop=()=>abort.abort();
  const operation={abort,release:()=>{if(released)return;released=true;if(timer)clearTimeout(timer);request.signal.removeEventListener('abort',stop);if(active===operation)active=undefined;}};
  active=operation;request.signal.addEventListener('abort',stop,{once:true});
  timer=setTimeout(stop,deadlineMs);
  let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
  const canceled=new Promise<never>((_,reject)=>abort.signal.addEventListener('abort',()=>{void reader?.cancel().catch(()=>{});reject(Error('Stopped'));},{once:true}));void canceled.catch(()=>{});
  const live=()=>{if(active!==operation||abort.signal.aborted)return false;if(!current()||lastClock>=operationExpiresAt){stop();return false;}return true;};
  try{
   let durable:CviReplayReceipt|undefined,consumed=false;
   const requireFence=async()=>{
    if(!live())throw Error();
    const accepted=!fence||await Promise.race([fence.check(abort.signal,lastClock),canceled])===true;
    if(!live())throw Error();if(accepted)return;
    // A still-live original reservation may be spent without output only after
    // an explicit verified same-owner stale refusal. Unknown/retired owners do
    // not use this path, and no old handoff is reconstructed from storage.
    if(durable&&!consumed&&replay&&fence.stale?.(abort.signal)===true&&live()){
     const input=Object.freeze({...durable,now:lastClock});acknowledge(await Promise.race([Promise.resolve().then(()=>{if(!live())throw Error();return replay.consume(input,abort.signal);}),canceled]),input,'spent',durable.receipt);consumed=true;unsettled=false;deliveries.set(request,'spent');
    }
    throw Error();
   };
   await requireFence();
   if(!live())throw Error();
   if(replay){
    const input=Object.freeze({storeId:storeId!,bindingDigest,requestDigest:hash(id),now:lastClock});
    unsettled=true;durable=acknowledge(await Promise.race([Promise.resolve().then(()=>{if(!live())throw Error();return replay.reserve(input,abort.signal);}),canceled]),input,'reserved');deliveries.set(request,'reserved');
    if(!live())throw Error();
   }
   if(!request.body)throw Error();reader=request.body.getReader();let length=0;const chunks:Uint8Array[]=[];
   while(true){if(!live())throw Error();const chunk=await Promise.race([reader.read(),canceled]);if(!live())throw Error();if(chunk.done)break;
    length+=chunk.value.byteLength;if(length>16384)throw Error();chunks.push(chunk.value);}
   reader.releaseLock();reader=undefined;
   const raw=new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)),parsed=JSON.parse(raw);if(!validBody(parsed))throw Error();
   if(capturedAdvisory){const question=capturedAdvisory.messages?.at(-1),last=parsed.messages.at(-1);if(question?.speaker!=='customer'||last.role!=='user'||question.text!==last.content)throw Error();}
   // Prompt content is deliberately not treated as authenticated notebook updates.
   if(!live())throw Error();
   const reply=await Promise.race([flow.prepare(abort.signal,capturedAdvisory),canceled]);
   if(reply.status!=='prepared'){
    if((reply.reason==='context-changed'||reply.reason==='context-pending')&&fence&&durable&&replay&&live()){
     await requireFence();const input=Object.freeze({...durable,now:lastClock});acknowledge(await Promise.race([Promise.resolve().then(()=>{if(!live())throw Error();return replay.consume(input,abort.signal);}),canceled]),input,'spent',durable.receipt);consumed=true;unsettled=false;deliveries.set(request,'spent');
    }
    throw Error();
   }
   if(!live())throw Error();
   let sent=false;
   const body=new ReadableStream<Uint8Array>({
    async pull(controller){
     if(sent)return;sent=true;
     try{if(!live())throw Error();
      await requireFence();
      if(!live())throw Error();
      if(replay&&durable){
       // Spend delivery permission durably BEFORE handing any bytes to a transport.
       const input=Object.freeze({...durable,now:lastClock});
       acknowledge(await Promise.race([Promise.resolve().then(()=>{if(!live())throw Error();return replay.consume(input,abort.signal);}),canceled]),input,'spent',durable.receipt);consumed=true;unsettled=false;deliveries.set(request,'spent');
      }
      await requireFence();
      if(!live())throw Error();const wire=reply.takeSse();if(wire===null)throw Error();
      controller.enqueue(new TextEncoder().encode(wire));controller.close();
     }catch{controller.error(Error('CVI delivery unavailable'));}
     finally{operation.release();}
    },
    cancel(){stop();operation.release();},
   },{highWaterMark:0});
   // Consume the cancellation race even if the HTTP consumer never pulls the body.
   void canceled.catch(()=>operation.release());
   return new Response(body,{status:200,headers:{...fixedHeaders,'Content-Type':'text/event-stream'}});
  }catch{void reader?.cancel().catch(()=>{});stop();operation.release();return deny(409);}
 }});
 owners.set(endpoint,{flow,bindingDigest,storeId:storeId??'',guarded:!!replay&&typeof fence?.check==='function',isIdle:()=>!closed&&!active&&!unsettled});return endpoint;
}

/** Restart-protection experiment requires a port; missing storage never falls back. */
export function createLocalCviRestartEndpoint(binding:Binding,flow:Flow,replay:CviReplayPort,clock=Date.now,deadlineMs=1000){
 if(!replay)throw Error('Local replay storage required');
 return createLocalCviEndpoint(binding,flow,clock,deadlineMs,replay);
}
