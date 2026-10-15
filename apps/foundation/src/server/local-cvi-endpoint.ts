import {timingSafeEqual} from 'node:crypto';
import type {createLocalCviStyling} from './local-cvi-styling.ts';
type Flow=ReturnType<typeof createLocalCviStyling>;
type Binding=Readonly<{origin:string;conversation:string;secret:string;expiresAt:number}>;
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
export function createLocalCviEndpoint(binding:Binding,flow:Flow,clock=Date.now,deadlineMs=1000){
 let u:URL;try{u=new URL(binding.origin);}catch{throw Error('Invalid local CVI configuration');}
 if(u.origin!==binding.origin||u.protocol!=='https:'||!/^fixture-[a-z0-9-]{1,60}$/.test(binding.conversation)||
  !/^[a-f0-9]{64}$/.test(binding.secret)||!Number.isSafeInteger(binding.expiresAt)||
  !Number.isInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Invalid local CVI configuration');
 // Capture immutable primitive configuration, including if caller mutates its object.
 const origin=binding.origin,conversation=binding.conversation,secret=Buffer.from(`Bearer ${binding.secret}`),expiresAt=binding.expiresAt;
 let closed=false,lastClock=-Infinity,active:{abort:AbortController;release:()=>void}|undefined;
 const used=new Set<string>();
 const current=()=>{try{const n=clock();if(!Number.isSafeInteger(n)||n<lastClock||n>=expiresAt){end();return false;}lastClock=n;return !closed;}catch{end();return false;}};
 function end(){if(closed)return;closed=true;active?.abort.abort();active?.release();flow.end();}
 return Object.freeze({end,async handle(request:Request):Promise<Response>{
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
  if(active)return deny(409);
  const abort=new AbortController();let released=false,timer:ReturnType<typeof setTimeout>|undefined;
  const stop=()=>abort.abort();
  const operation={abort,release:()=>{if(released)return;released=true;if(timer)clearTimeout(timer);request.signal.removeEventListener('abort',stop);if(active===operation)active=undefined;}};
  active=operation;request.signal.addEventListener('abort',stop,{once:true});
  timer=setTimeout(stop,deadlineMs);
  let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
  const canceled=new Promise<never>((_,reject)=>abort.signal.addEventListener('abort',()=>{void reader?.cancel().catch(()=>{});reject(Error('Stopped'));},{once:true}));
  try{
   if(!request.body)throw Error();reader=request.body.getReader();let length=0;const chunks:Uint8Array[]=[];
   while(true){const chunk=await Promise.race([reader.read(),canceled]);if(chunk.done)break;
    length+=chunk.value.byteLength;if(length>16384)throw Error();chunks.push(chunk.value);}
   reader.releaseLock();reader=undefined;
   const raw=new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks));if(!validBody(JSON.parse(raw)))throw Error();
   // Prompt content is deliberately not treated as authenticated notebook updates.
   const reply=await Promise.race([flow.prepare(abort.signal),canceled]);
   if(reply.status!=='prepared'||abort.signal.aborted||!current())throw Error();
   let sent=false;
   const body=new ReadableStream<Uint8Array>({
    pull(controller){
     if(sent)return;sent=true;
     try{if(abort.signal.aborted||!current())throw Error();const wire=reply.takeSse();if(wire===null)throw Error();
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
}
