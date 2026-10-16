import {localGatedExecutionFinished,closeLocalGatedExecution,localGatedExecutionBinding,inspectLocalGatedExecution} from './local-cvi-gated-execution.ts';
import type {LocalGatedExecutionContext} from './local-cvi-gated-execution.ts';
import {cviCredentialDigests} from './local-cvi-credentials.ts';
/** Private local replay capability. No listener, key lookup or raw fallback. */
import {claimLocalStartupReplayLease} from './local-cvi-startup-admission.ts';
import {claimLocalContinuationReplayLease} from './local-cvi-owner-continuation.ts';
import type {FreshOwnerAdmissionInput} from './local-cvi-startup-owner.ts';
import type {OwnerContinuationInput} from './local-cvi-owner-continuation.ts';
import type {CviReplayPort,CviReplayRequest,CviReplayReceipt} from './local-cvi-endpoint.ts';
import type {ReplayInspectionRequest} from './local-cvi-replay-inspection.ts';
import {historyCanonical} from './local-cvi-history-authority.ts';
type NativeLease=Readonly<{storeId:string;policyDigest:string;generation:number;ownerDigest:string;bootDigest:string;token:string;issuedAt:number;expiresAt:number}>;
export type OwnedReplayScope=Readonly<{storeId:string;nativeStoreId:string;binding:Readonly<{origin:string;conversation:string;secret:string;expiresAt:number}>}>;
export interface OwnedReplayBackend {
 inspect(input:ReplayInspectionRequest,signal:AbortSignal):Promise<unknown>;
 mutate(mode:'reserve'|'consume',lease:NativeLease,minimumRevision:number,input:CviReplayRequest|CviReplayReceipt,signal:AbortSignal):Promise<unknown>;
}
type Control={bind(raw:unknown,input:FreshOwnerAdmissionInput):void;adopt(raw:unknown,input:OwnerContinuationInput):void;hold():void;isBound():boolean;isHeld():boolean;matches(scope:Record<string,unknown>):boolean;claimStartup():boolean;execution():LocalGatedExecutionContext|undefined};
const controls=new WeakMap<object,Control>();
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const int=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const hex=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const uuid=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
const same=(a:unknown,b:unknown)=>historyCanonical(a as Record<string,unknown>)===historyCanonical(b as Record<string,unknown>);
const native=(v:unknown):v is NativeLease=>exact(v,['storeId','policyDigest','generation','ownerDigest','bootDigest','token','issuedAt','expiresAt'])&&uuid(v.storeId)&&hex(v.policyDigest)&&int(v.generation)&&v.generation>0&&hex(v.ownerDigest)&&hex(v.bootDigest)&&hex(v.token)&&int(v.issuedAt)&&int(v.expiresAt)&&v.expiresAt>v.issuedAt;
export function createLocalOwnedReplayPort(rawScope:OwnedReplayScope,backend:OwnedReplayBackend,clock=Date.now):CviReplayPort{
 if(!exact(rawScope,['storeId','nativeStoreId','binding'])||!uuid(rawScope.storeId)||!uuid(rawScope.nativeStoreId)||!exact(rawScope.binding,['origin','conversation','secret','expiresAt'])||typeof rawScope.binding.origin!=='string'||typeof rawScope.binding.conversation!=='string'||!hex(rawScope.binding.secret)||!int(rawScope.binding.expiresAt)||typeof backend?.inspect!=='function'||typeof backend.mutate!=='function'||typeof clock!=='function')throw Error('Private replay unavailable');
 const binding=Object.freeze({...rawScope.binding}),origin=new URL(binding.origin);if(origin.origin!==binding.origin||origin.protocol!=='https:'||!/^fixture-[a-z0-9-]{1,60}$/.test(binding.conversation))throw Error('Private replay unavailable');
 const scope=Object.freeze({storeId:rawScope.storeId,nativeStoreId:rawScope.nativeStoreId,...cviCredentialDigests(binding),applicationExpiresAt:binding.expiresAt}),inspect=backend.inspect.bind(backend),mutate=backend.mutate.bind(backend);
 let execution:LocalGatedExecutionContext|undefined,lease:NativeLease|undefined,minimumRevision=0,held=false,busy=false,startupClaimed=false,last=-1,activeAbort:AbortController|undefined;
 const attempts=new Set<string>(),pending=new Map<string,CviReplayReceipt>();
 const retire=()=>{held=true;activeAbort?.abort();lease=undefined;if(execution)void closeLocalGatedExecution(execution).catch(()=>{});};
 const now=()=>{const at=clock();if(held||!int(at)||at<last||at>=scope.applicationExpiresAt||lease&&at>=lease.expiresAt)throw Error();last=at;return at;};
 const validRequest=(v:unknown,mode:'reserve'|'consume')=>exact(v,mode==='reserve'?['storeId','bindingDigest','requestDigest','now']:['storeId','bindingDigest','requestDigest','now','receipt','status'])&&v.storeId===scope.storeId&&v.bindingDigest===scope.bindingDigest&&hex(v.requestDigest)&&int(v.now)&&(mode==='reserve'||v.status==='reserved'&&typeof v.receipt==='string'&&/^fixture-receipt-[a-f0-9]{32}$/.test(v.receipt));
 const operate=async(mode:'reserve'|'consume',raw:CviReplayRequest|CviReplayReceipt,external:AbortSignal)=>{
  if(held||!lease||busy||external.aborted||execution&&!localGatedExecutionFinished(execution))return null;
  const input=structuredClone(raw);if(!validRequest(input,mode))return null;
  const request=input as CviReplayReceipt,previous=pending.get(request.requestDigest);
  if(mode==='reserve'&&(attempts.has(request.requestDigest)||attempts.size>=64||pending.size)||mode==='consume'&&(!previous||previous.receipt!==request.receipt||request.now<previous.now))return null;
  busy=true;const abort=new AbortController();activeAbort=abort;const signal=AbortSignal.any([external,abort.signal]);let timer:ReturnType<typeof setTimeout>|undefined,onAbort:(()=>void)|undefined;
  try{
   const at=now();if(request.now>at)throw Error();const deadline=Math.min(scope.applicationExpiresAt,lease.expiresAt,at+8000);
   if(mode==='reserve')attempts.add(request.requestDigest);
   const canceled=new Promise<never>((_,reject)=>{onAbort=()=>reject(Error());signal.addEventListener('abort',onAbort,{once:true});timer=setTimeout(()=>abort.abort(),deadline-at);});void canceled.catch(()=>{});
   const result=structuredClone(await Promise.race([Promise.resolve().then(()=>{if(signal.aborted)throw Error();return mutate(mode,structuredClone(lease!),minimumRevision,Object.freeze(input),signal);}),canceled]));
   if(signal.aborted||now()>=deadline||!exact(result,['storeId','bindingDigest','requestDigest','now','receipt','status'])||Object.entries(input).some(([k,v])=>k!=='status'&&k!=='receipt'&&result[k]!==v)||result.status!==(mode==='reserve'?'reserved':'spent')||typeof result.receipt!=='string'||!/^fixture-receipt-[a-f0-9]{32}$/.test(result.receipt)||mode==='consume'&&result.receipt!==request.receipt)throw Error();
   const receipt=Object.freeze({...result}) as CviReplayReceipt;if(mode==='reserve')pending.set(request.requestDigest,receipt);else pending.delete(request.requestDigest);return receipt;
  }catch{retire();abort.abort();return null;}finally{busy=false;if(activeAbort===abort)activeAbort=undefined;if(timer)clearTimeout(timer);if(onAbort)signal.removeEventListener('abort',onAbort);}
 };
 const port=Object.freeze({storeId:scope.storeId,close:retire,inspect:async(input:ReplayInspectionRequest,signal:AbortSignal)=>{
  if(signal.aborted||input.storeId!==scope.storeId||input.bindingDigest!==scope.bindingDigest)throw Error('Private replay unavailable');
  if(execution&&!localGatedExecutionFinished(execution)){const b=localGatedExecutionBinding(execution),value:any=await inspectLocalGatedExecution(execution,{...input,bindingDigest:b.marker.bindingDigest},signal);return {...value.snapshot,bindingDigest:input.bindingDigest};}
  return inspect(Object.freeze({...input}),signal);
 },reserve:(r:CviReplayRequest,s:AbortSignal)=>operate('reserve',r,s),consume:(r:CviReplayReceipt,s:AbortSignal)=>operate('consume',r,s)});
 controls.set(port,{execution:()=>held?undefined:execution,matches:expected=>same(expected,scope),claimStartup:()=>{if(held||lease||startupClaimed)return false;startupClaimed=true;return true;},isBound:()=>!!lease&&!held,isHeld:()=>held,hold:retire,bind(raw,input){
  let acquired:LocalGatedExecutionContext|undefined;try{input=structuredClone(input);if(lease||held||busy||input.replayStoreId!==scope.storeId||input.bindingDigest!==scope.bindingDigest||input.scopeDigest!==scope.scopeDigest||input.checkpoint.storeId!==scope.nativeStoreId)throw Error();const at=now(),claimed=claimLocalStartupReplayLease(raw,input,at),permit=claimed.permit as any,next=claimed.lease;acquired=claimed.execution;
   if(!native(next)||next.storeId!==scope.nativeStoreId||next.expiresAt>scope.applicationExpiresAt||next.expiresAt!==permit.ownerExpiresAt||!int(permit.after?.revision)||permit.owner?.generation!==next.generation||permit.owner?.ownerDigest!==next.ownerDigest||permit.owner?.bootDigest!==next.bootDigest||next.expiresAt<=at)throw Error();if(claimed.execution){const b=localGatedExecutionBinding(claimed.execution);if(b.marker.storeId!==scope.storeId||b.marker.nativeStoreId!==scope.nativeStoreId||b.marker.applicationExpiresAt!==scope.applicationExpiresAt||b.owner.minimumRevision!==permit.after.revision||b.plan.id!==permit.after.operationId)throw Error();}lease=Object.freeze({...next});minimumRevision=permit.after.revision;execution=claimed.execution;startupClaimed=true;
  }catch{if(acquired)void closeLocalGatedExecution(acquired).catch(()=>{});retire();throw Error('Private replay bind unavailable');}
 },adopt(raw,input){
  let acquired:LocalGatedExecutionContext|undefined;try{input=structuredClone(input);if(!lease||held||busy||pending.size||execution&&!localGatedExecutionFinished(execution)||input.bindingDigest!==scope.bindingDigest||input.applicationExpiresAt!==scope.applicationExpiresAt||input.revision<minimumRevision||['storeId','generation','ownerDigest','bootDigest','expiresAt'].some(k=>(input.owner as any)[k]!== (lease as any)[k]))throw Error();
   const at=now(),claimed=claimLocalContinuationReplayLease(raw,input,at),next=claimed.lease;acquired=claimed.execution;
   if(!native(next)||next.storeId!==lease.storeId||next.policyDigest!==lease.policyDigest||next.generation!==lease.generation||next.ownerDigest!==lease.ownerDigest||next.bootDigest!==lease.bootDigest||next.token===lease.token||next.issuedAt<lease.issuedAt||next.expiresAt<=lease.expiresAt||next.expiresAt>scope.applicationExpiresAt||claimed.after.revision<=input.revision||next.expiresAt<=at)throw Error();if(claimed.execution){const b=localGatedExecutionBinding(claimed.execution);if(b.marker.storeId!==scope.storeId||b.marker.nativeStoreId!==scope.nativeStoreId||b.marker.applicationExpiresAt!==scope.applicationExpiresAt||b.owner.minimumRevision!==claimed.after.revision||b.plan.id!==claimed.after.operationId)throw Error();}lease=Object.freeze({...next});minimumRevision=claimed.after.revision;execution=claimed.execution;
  }catch{if(acquired)void closeLocalGatedExecution(acquired).catch(()=>{});retire();throw Error('Private replay adoption unavailable');}
 }});return port;
}
/** Server-only controls require the original port identity and transient handoff. */
export const isLocalOwnedReplayPort=(port:object)=>controls.has(port);
export const localOwnedReplayState=(port:object)=>{const c=controls.get(port);return Object.freeze({bound:c?.isBound()===true,held:c?.isHeld()===true});};
export function bindLocalOwnedReplay(port:object,raw:unknown,input:FreshOwnerAdmissionInput){const c=controls.get(port);if(!c)throw Error('Private replay port required');c.bind(raw,input);}
export function adoptLocalOwnedReplay(port:object,raw:unknown,input:OwnerContinuationInput){const c=controls.get(port);if(!c)throw Error('Private replay port required');c.adopt(raw,input);}
export function holdLocalOwnedReplay(port:object){const c=controls.get(port);if(!c)throw Error('Private replay port required');c.hold();}

export const localOwnedReplayMatches=(port:object,scope:Record<string,unknown>)=>controls.get(port)?.matches(scope)===true;
export const claimLocalOwnedReplayStartup=(port:object)=>controls.get(port)?.claimStartup()===true;

/** Original private transition context only; absence is not a gated pair. */
export function localOwnedReplayExecutionContext(port:object){const c=controls.get(port);if(!c)throw Error('Original private replay port required');return c.execution();}
