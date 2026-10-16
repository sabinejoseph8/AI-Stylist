/** Disabled custom-LLM HTTP candidate. No listener, provider, environment or SDK.
 * Uses documented static configuration, not automatic Tavus request-ID headers.
 * Exact native payload/ordering/retry behavior still requires live verification. */
import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
import {historyCanonical} from './local-cvi-history-authority.ts';
import {cviCredentialDigests} from './local-cvi-credentials.ts';
import {cviBodyAdmissionDigest,localCviOwnerBoundary} from './local-cvi-endpoint.ts';
import type {createLocalCviEndpoint} from './local-cvi-endpoint.ts';
import {isLocalCviStartedOwner} from './local-cvi-startup-owner.ts';
import type {createLocalCviNotebookContext} from './local-cvi-notebook-context.ts';
import {localCviCompletedInput,localCviTranscriptSourceMatches} from './local-cvi-transcript-adapter.ts';
import type {createLocalCviTranscriptAdapter} from './local-cvi-transcript-adapter.ts';
type Binding=Parameters<typeof createLocalCviEndpoint>[0];
type Owner=ReturnType<typeof createLocalCviEndpoint>;
type Context=ReturnType<typeof createLocalCviNotebookContext>;
type Transcript=ReturnType<typeof createLocalCviTranscriptAdapter>;
type Profile=Readonly<{temperature?:number;top_p?:number}>;
const hash=(value:Record<string,unknown>)=>createHash('sha256').update(historyCanonical(value)).digest('hex');
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const int=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const deny=(status:number)=>new Response(JSON.stringify({error:'Styling request unavailable'}),{status,headers:{...headers,'Content-Type':'application/json'}});
function configuration(binding:Binding,profile:Profile){
 const u=new URL(binding.origin);
 if(u.origin!==binding.origin||u.protocol!=='https:'||!/^fixture-[a-z0-9-]{1,60}$/.test(binding.conversation)||!/^[a-f0-9]{64}$/.test(binding.secret)||!int(binding.expiresAt)||!profile||typeof profile!=='object'||Array.isArray(profile)||Object.keys(profile).some(k=>!['temperature','top_p'].includes(k)))throw Error('Local HTTP configuration unavailable');
 for(const [key,value] of Object.entries(profile))if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>(key==='temperature'?2:1))throw Error('Local HTTP configuration unavailable');
 return Object.freeze({...profile});
}
/** Partial server-only PAL configuration. Not a ready create-PAL payload.
 * api_key encoding is not assumed: the separate static header authenticates. */
export function localCviLlmConfiguration(binding:Binding,profile:Profile={}){
 const extra=configuration(binding,profile);
 return Object.freeze({pipeline_mode:'full',layers:Object.freeze({llm:Object.freeze({model:'local-simulation',base_url:binding.origin+'/cvi/v1',api_key:binding.secret,headers:Object.freeze({'X-AI-Stylist-Token':binding.secret}),speculative_inference:false,...(Object.keys(extra).length?{extra_body:extra}:{})})})});
}
export function createLocalCviHttpAdapter(options:Readonly<{
 simulation:true;binding:Binding;owner:Owner;context:Context;transcript:Transcript;
 applicationRequest:Request;profile?:Profile;clock?:()=>number;deadlineMs?:number;
}>){
 const binding=Object.freeze({...options.binding}),profile=configuration(binding,options.profile??{}),clock=options.clock??Date.now,deadline=options.deadlineMs??8000;
 const context=options.context,transcript=options.transcript,owner=options.owner;
 const digest=cviCredentialDigests(binding).bindingDigest,boundary=localCviOwnerBoundary(owner,context.flow,digest);
 if(options.simulation!==true||!isLocalCviStartedOwner(owner)||!boundary||!localCviTranscriptSourceMatches(transcript,context)||!(options.applicationRequest instanceof Request)||typeof clock!=='function'||!int(deadline)||deadline<1||deadline>8000)throw Error('Local HTTP adapter unavailable');
 const applicationRequest=new Request(options.applicationRequest),handle=owner.handle.bind(owner),spend=owner.spendAdmission.bind(owner),end=owner.end.bind(owner),origin=new URL(binding.origin),token=Buffer.from(binding.secret);
 let closed=false,held=false,last=-1,attempts=0;
 type Operation={abort:AbortController;phase:'none'|'body-started'|'body-spent'|'turn-started'|'turn-spent';release():void;stop():void};
 let active:Operation|undefined;
 const bodySeen=new Set<string>(),turnSeen=new Set<string>();
 const hold=()=>{held=true;transcript.close();end();};
 const close=()=>{if(closed)return;closed=true;active?.stop();transcript.close();end();};
 const current=()=>{try{const at=clock();if(!int(at)||at<last||at>=binding.expiresAt){close();return false;}last=at;return !closed&&!held;}catch{close();return false;}};
 const match=async(text:string,signal:AbortSignal)=>{
  const input=localCviCompletedInput(transcript,context);if(!input||input.text!==text||!context.flow.available()||signal.aborted)return null;
  const snapshot=await context.snapshot(new Request(applicationRequest),signal),state=context.flow.snapshot(),again=localCviCompletedInput(transcript,context);
  if(signal.aborted||!snapshot||snapshot.state!=='active'||!state.context||!again||historyCanonical(input)!==historyCanonical(again)||input.epoch!==snapshot.epoch||input.inputRevision!==state.context.inputRevision||state.context.epoch!==snapshot.epoch||state.revision!==snapshot.revision||!context.flow.available())return null;
  return Object.freeze({input,version:Object.freeze({...state.context,revision:state.revision})});
 };
 return Object.freeze({close,isHeld:()=>held,async handle(request:Request):Promise<Response>{
  if(!current())return deny(410);const url=new URL(request.url);
  if(url.origin!==binding.origin||url.pathname!=='/cvi/v1/chat/completions'||url.search||request.method!=='POST'||request.headers.has('host')&&request.headers.get('host')!==origin.host)return deny(404);
  if(request.headers.has('origin')||request.headers.has('cookie'))return deny(403);
  const supplied=Buffer.from(request.headers.get('x-ai-stylist-token')??'');if(supplied.length!==token.length||!timingSafeEqual(supplied,token))return deny(401);
  if(!/^application\/json(?:;\s*charset=utf-8)?$/i.test(request.headers.get('content-type')??'')||request.headers.has('content-encoding')||request.headers.has('x-cvi-request-id')||request.headers.has('x-cvi-conversation')||request.signal.aborted)return deny(400);
  if(active||attempts>=128)return deny(409);attempts++;
  const operationExpiresAt=Math.min(binding.expiresAt,last+deadline);
  const abort=new AbortController(),signal=abort.signal;let timer:ReturnType<typeof setTimeout>|undefined,reader:ReadableStreamDefaultReader<Uint8Array>|undefined,internalRequest:Request|undefined,released=false;
  const terminal=()=>{if(operation.phase==='turn-started'&&internalRequest&&owner.deliveryState(internalRequest).status==='spent')operation.phase='turn-spent';};
  const operation:Operation={abort,phase:'none',release(){if(released)return;released=true;if(timer)clearTimeout(timer);request.signal.removeEventListener('abort',operation.stop);if(active===operation)active=undefined;},stop(){terminal();abort.abort();if(active===operation&&['body-started','turn-started'].includes(operation.phase))hold();void reader?.cancel().catch(()=>{});operation.release();}};
  active=operation;request.signal.addEventListener('abort',operation.stop,{once:true});timer=setTimeout(operation.stop,deadline);
  const canceled=new Promise<never>((_,reject)=>signal.addEventListener('abort',()=>reject(Error()),{once:true}));void canceled.catch(()=>{});
  const live=()=>{if(active!==operation||signal.aborted)return false;if(!current()||last>=operationExpiresAt){operation.stop();return false;}return true;};
  try{
   if(!request.body)throw Error();reader=request.body.getReader();let size=0;const pieces:Uint8Array[]=[];
   while(true){if(!live())throw Error();const next=await Promise.race([reader.read(),canceled]);if(!live())throw Error();if(next.done)break;size+=next.value.byteLength;if(size>65536){void reader.cancel().catch(()=>{});return deny(413);}pieces.push(next.value);}
   reader.releaseLock();reader=undefined;
   let body:unknown;try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(pieces)));}catch{return deny(400);}
   if(!exact(body,['model','stream','messages',...Object.keys(profile)])||body.model!=='local-simulation'||body.stream!==true||Object.entries(profile).some(([k,v])=>body[k]!==v)||!Array.isArray(body.messages)||!body.messages.length||body.messages.length>32||body.messages.some(m=>!exact(m,['role','content'])||!['user','assistant','system'].includes(String(m.role))||typeof m.content!=='string'||m.content.length>4000))return deny(400);
   const lastMessage=body.messages.at(-1);if(lastMessage.role!=='user'||!lastMessage.content.trim())return deny(400);
   const bodyDigest=createHmac('sha256',Buffer.from(binding.secret,'hex')).update('local-cvi-wire-body-v1\0').update(historyCanonical(body)).digest('hex');if(bodySeen.has(bodyDigest))return deny(409);
   const pin=await Promise.race([match(lastMessage.content,signal),canceled]);if(!pin||!live())return deny(409);
   const turnId='fixture-wire-'+BigInt('0x'+hash({purpose:'cvi-wire-turn-v1',conversation:pin.input.conversation,turnId:pin.input.turnId,turnOrdinal:pin.input.turnOrdinal,epoch:pin.input.epoch})).toString(36);
   if(turnSeen.has(turnId))return deny(409);bodySeen.add(bodyDigest);turnSeen.add(turnId);
   operation.phase='body-started';const ack=await Promise.race([spend(bodyDigest,signal),canceled]);
   if(!live())throw Error();
   if(!exact(ack,['status','storeId','bindingDigest','requestDigest','receipt','now'])||ack.status!=='spent-admission'||ack.storeId!==boundary.storeId||ack.bindingDigest!==digest||ack.requestDigest!==cviBodyAdmissionDigest(bodyDigest)||typeof ack.receipt!=='string'||!/^fixture-receipt-[a-f0-9]{32}$/.test(ack.receipt)||!int(ack.now)||ack.now>last)throw Error();
   operation.phase='body-spent';const before=await Promise.race([match(lastMessage.content,signal),canceled]);if(!live()||!before||historyCanonical(pin)!==historyCanonical(before))return deny(409);
   operation.phase='turn-started';internalRequest=new Request(binding.origin+'/v1/chat/completions',{method:'POST',signal,headers:{authorization:'Bearer '+binding.secret,'x-cvi-conversation':binding.conversation,'x-cvi-request-id':turnId,'content-type':'application/json'},body:JSON.stringify({model:'local-simulation',stream:true,messages:[{role:'user',content:lastMessage.content}]})});const response=await Promise.race([handle(internalRequest,{kind:'untrusted-conversation',epoch:pin.input.epoch,inputRevision:pin.input.inputRevision,messages:body.messages.map(m=>({speaker:m.role==='user'?'customer':m.role==='assistant'?'stylist':'provider-context',text:m.content}))}),canceled]);
   if(!live()||response.status!==200||!response.body||response.headers.get('content-type')!=='text/event-stream')throw Error();
   const upstream=response.body.getReader();reader=upstream;let sent=false;
   const stream=new ReadableStream<Uint8Array>({async pull(controller){if(sent)return;sent=true;try{
    let length=0;const chunks:Uint8Array[]=[];
    while(true){if(!live())throw Error();const next=await Promise.race([upstream.read(),canceled]);if(!live())throw Error();if(next.done)break;operation.phase='turn-spent';length+=next.value.byteLength;if(length>32768)throw Error();chunks.push(next.value);}
    const latest=await Promise.race([match(lastMessage.content,signal),canceled]);if(!live()||!length||!latest||historyCanonical(pin)!==historyCanonical(latest))throw Error();
    controller.enqueue(Buffer.concat(chunks));controller.close();
   }catch{terminal();if(active===operation&&['body-started','turn-started'].includes(operation.phase))hold();void upstream.cancel().catch(()=>{});controller.error(Error('Styling delivery unavailable'));}finally{operation.release();}},cancel(){operation.stop();}},{highWaterMark:0});
   // Ownership of cleanup transfers to the body consumer or request deadline.
   return new Response(stream,{headers:{...headers,'Content-Type':'text/event-stream'}});
  }catch{terminal();if(active===operation&&['body-started','turn-started'].includes(operation.phase))hold();operation.stop();return deny(409);}
  finally{if(active===operation&&operation.phase!=='turn-started'&&operation.phase!=='turn-spent')operation.release();}
 }});
}
