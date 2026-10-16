/** Disabled Daily transcript composition. No SDK, listener, provider or storage.
 * Payload fields describe content, never authenticate its sender/customer.
 * Public field references: docs/local-tavus-wire-compatibility.md. */
import type {createLocalCviNotebookContext} from './local-cvi-notebook-context.ts';
import type {Proposal,ProposalTurn} from '../session/proposal-stream.ts';
type Context=ReturnType<typeof createLocalCviNotebookContext>;
export type CviUtterance=Readonly<{
 conversation:string;seq:number;timestamp:number;role:'user'|'pal'|'replica';text:string;
 kind:'streaming'|'complete';participantId?:string;inferenceId?:string;turnIndex?:number;
 contentIndex?:number;final:boolean;
}>;
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const int=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const id=(v:unknown):v is string=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(v);
const only=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).every(k=>keys.includes(k));
/** Narrow documented text-event parser. Unknown extensions stay held for review.
 * Streaming speech is accumulated text, not a delta to append. */
export function decodeCviUtterance(raw:unknown):CviUtterance|null{
 try{
  const v:unknown=structuredClone(raw);
  if(!object(v)||!only(v,['message_type','event_type','timestamp','seq','conversation_id','inference_id','turn_idx','properties'])||new TextEncoder().encode(JSON.stringify(v)).length>16384||v.message_type!=='conversation'||!['conversation.utterance','conversation.utterance.streaming'].includes(String(v.event_type))||!id(v.conversation_id)||!int(v.seq)||typeof v.timestamp!=='number'||!Number.isFinite(v.timestamp)||v.timestamp<0||!object(v.properties))return null;
  const p=v.properties,stream=v.event_type==='conversation.utterance.streaming';
  if(!only(p,stream?['role','speech','content_index','final','is_interrupted','participant_id','participant_name']:['role','speech','interrupted','participant_id','participant_name','user_audio_analysis','user_visual_analysis'])||!['user','pal','replica'].includes(String(p.role))||typeof p.speech!=='string'||!p.speech.trim()||p.speech.length>4000)return null;
  if(('participant_id' in p&&!id(p.participant_id))||('inference_id' in v&&!id(v.inference_id))||('turn_idx' in v&&!int(v.turn_idx)))return null;
  for(const k of ['participant_name','user_audio_analysis','user_visual_analysis'])if(k in p&&(typeof p[k]!=='string'||(p[k] as string).length>4000))return null;
  for(const k of ['interrupted','is_interrupted'])if(k in p&&(typeof p[k]!=='boolean'||p.role==='user'))return null;
  if(stream&&(!int(p.content_index)||typeof p.final!=='boolean'))return null;
  return Object.freeze({conversation:v.conversation_id,seq:v.seq,timestamp:v.timestamp,role:p.role as CviUtterance['role'],text:p.speech,kind:stream?'streaming':'complete',final:stream?p.final as boolean:true,...('participant_id' in p?{participantId:p.participant_id as string}:{}),...('inference_id' in v?{inferenceId:v.inference_id as string}:{}),...('turn_idx' in v?{turnIndex:v.turn_idx as number}:{}),...(stream?{contentIndex:p.content_index as number}:{})});
 }catch{return null;}
}
export type CviTranscriptDelivery=Readonly<{room:string;sender:string;event:CviUtterance}>;
/** Trusted transport integration must verify Daily room and sender separately,
 * authenticate the app customer and correlate a customer turn across both event
 * forms. Neither turn_idx nor inference_id alone proves that correlation. */
export type CviTranscriptAdmission=Readonly<{request:Request;turnId:string;turnOrdinal:number}>;
export function createLocalCviTranscriptAdapter(options:Readonly<{
 simulation:true;conversation:string;participantId:string;context:Context;
 admit(delivery:CviTranscriptDelivery,signal:AbortSignal):Promise<CviTranscriptAdmission|null>;
 extract(input:Readonly<{text:string;complete:boolean}>,signal:AbortSignal):Promise<readonly Proposal[]>;
 deadlineMs?:number;
}>){
 const timeout=options.deadlineMs??1000;
 if(options.simulation!==true||!id(options.conversation)||!id(options.participantId)||typeof options.admit!=='function'||typeof options.extract!=='function'||typeof options.context?.beginProposal!=='function'||typeof options.context.refreshProposal!=='function'||!int(timeout)||timeout<1||timeout>8000)throw Error('Local transcript adapter unavailable');
 const conversation=options.conversation,participant=options.participantId,admit=options.admit.bind(options),extract=options.extract.bind(options),context=options.context;
 const stop=new AbortController();let closed=false,inflight=0,ordinal=-1;
 type Turn={id:string;ordinal:number;seq:number;index:number;revision:number;closed:boolean;handle:Promise<ProposalTurn|null>;text?:string};
 const turns=new Map<string,Turn>();let active:Turn|undefined;
 const valid=(a:CviTranscriptAdmission|null):a is CviTranscriptAdmission=>!!a&&Object.keys(a).sort().join(',')==='request,turnId,turnOrdinal'&&a.request instanceof Request&&id(a.turnId)&&int(a.turnOrdinal);
 const close=()=>{if(closed)return;closed=true;stop.abort();turns.clear();active=undefined;context.flow.end();};
 return Object.freeze({close,async ingest(room:string,sender:string,raw:unknown,external:AbortSignal):Promise<Readonly<{status:'applied'|'ignored'|'held'|'stale'}>>{
  const event=decodeCviUtterance(raw);
  if(!event)return {status:'held'};
  if(event.role!=='user')return {status:'ignored'};
  if(closed||external.aborted||inflight>=4||event.conversation!==conversation||event.participantId!==participant||!id(room)||!id(sender))return {status:'held'};
  const abort=new AbortController(),signal=AbortSignal.any([external,stop.signal,abort.signal]),delivery=Object.freeze({room,sender,event});inflight++;
  const pending=(async()=>{
   const a=await admit(delivery,signal);if(signal.aborted||closed||!valid(a))return {status:'held'} as const;
   const request=new Request(a.request),turnId=a.turnId,turnOrdinal=a.turnOrdinal;
   if(turnOrdinal<ordinal||turnOrdinal===ordinal&&active?.id!==turnId)return {status:'stale'} as const;
   let turn=turns.get(turnId);
   if(turn&&(turn.ordinal!==turnOrdinal||turn.closed)||!turn&&turns.size>=64)return {status:'held'} as const;
   if(!turn){
    ordinal=turnOrdinal;
    // Capture the original field baselines before extraction waits. Beginning a
    // new turn invalidates older draft work through the existing context model.
    turn={id:turnId,ordinal:turnOrdinal,seq:-1,index:-1,revision:-1,closed:false,handle:context.beginProposal(request,turnId,signal)};
    turns.set(turnId,turn);active=turn;
   }
   if(turn.revision>=127)return {status:'held'} as const;
   if(turn!==active||event.seq<=turn.seq||event.kind==='streaming'&&event.contentIndex!<=turn.index)return {status:'stale'} as const;
   turn.seq=event.seq;if(event.kind==='streaming')turn.index=event.contentIndex!;
   const revision=++turn.revision,handle=await turn.handle;
   const current=()=>!closed&&!signal.aborted&&active===turn&&!turn.closed&&turn.revision===revision;
   if(!handle||!current())return {status:'stale'} as const;
   if(revision>0&&!await context.refreshProposal(request,handle,revision,signal))return {status:'held'} as const;
   if(!current())return {status:'stale'} as const;
   // Even streaming.final remains provisional until the full utterance event.
   // Identical full completion closes the existing turn without re-extraction.
   const complete=event.kind==='complete',values=complete&&turn.text===event.text?[]:structuredClone(await extract(Object.freeze({text:event.text,complete}),signal));
   if(!current())return {status:'stale'} as const;
   const fresh=await admit(delivery,signal);
   if(!current()||!valid(fresh)||fresh.turnId!==turnId||fresh.turnOrdinal!==turnOrdinal)return {status:'held'} as const;
   const result=await context.acceptProposal(new Request(fresh.request),handle,revision,values,complete,signal);
   if(!current()||result?.status!=='accepted')return {status:'held'} as const;
   turn.text=event.text;turn.closed=complete;return {status:'applied'} as const;
  })().catch(()=>({status:'held'} as const)).finally(()=>{inflight--;});
  let timer:ReturnType<typeof setTimeout>|undefined,onAbort:(()=>void)|undefined;
  try{return await Promise.race([pending,new Promise<{status:'held'}>(resolve=>{onAbort=()=>resolve({status:'held'});signal.addEventListener('abort',onAbort,{once:true});timer=setTimeout(()=>abort.abort(),timeout);})]);}
  finally{if(timer)clearTimeout(timer);if(onAbort)signal.removeEventListener('abort',onAbort);}
 }});
}
