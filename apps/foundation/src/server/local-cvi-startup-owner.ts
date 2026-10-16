import {createLocalReplayInspector} from './local-cvi-replay-inspection.ts';
import {localCviOwnerIsIdle} from './local-cvi-endpoint.ts';
import type {OwnerCheckpointTransition,OwnerContinuationPort} from './local-cvi-owner-continuation.ts';
import {planLocalCviLifetimes} from './local-cvi-lifetime.ts';
import {historyCanonical} from './local-cvi-history-authority.ts';
/** Disabled local composition. No listener, provider, secrets lookup or paid work. */
import {createLocalCurrentOwnerCredentialAuthority} from './local-cvi-checkpoint-credentials.ts';
import {localStartupOwnerBoot} from './local-cvi-startup-admission.ts';
import type {StartupOwnerPin} from './local-cvi-startup-checkpoint.ts';
import {randomBytes} from 'node:crypto';
import {cviCredentialDigests,startLocalCviCredentialEndpoint} from './local-cvi-credentials.ts';
import type {CviCredentialAuthority,CviCredentialBootAuthority,CviCredentialLease} from './local-cvi-credentials.ts';
import type {CviReplayPort} from './local-cvi-endpoint.ts';
import {CVI_FIELDS} from './local-cvi-styling.ts';
import type {createLocalCviStyling} from './local-cvi-styling.ts';
const startedOwners=new WeakSet<object>();
const continuations=new WeakMap<object,(port:OwnerContinuationPort,signal:AbortSignal)=>Promise<boolean>>();
/** Trusted local server control only. No HTTP route or credential fallback. */
export async function continueLocalCviOwner(owner:object,port:OwnerContinuationPort,signal:AbortSignal){const renew=continuations.get(owner);return renew&&localCviOwnerIsIdle(owner)?renew(port,signal):false;}
/** Only successful full-checkpoint startup can register this owner. */
export const isLocalCviStartedOwner=(owner:object)=>startedOwners.has(owner);
export type CviCheckpointIdentity=Readonly<{storeId:string;operationId:string;revision:number}>;
export type FreshOwnerAdmissionInput=Readonly<{checkpoint:CviCheckpointIdentity;credentialStoreId:string;replayStoreId:string;previous:number;bootDigest:string;scopeDigest:string;bindingDigest:string;nonce:string;issuedAt:number;expiresAt:number}>;
/** Trusted server ports, never supplied by an HTTP body. Admission must be
 * durably spent before acknowledgment; this module cannot prove its storage. */
export interface FreshOwnerAdmissionPort {admit(input:FreshOwnerAdmissionInput,signal:AbortSignal):Promise<unknown>}
export interface FreshCheckpointPort {inspectFresh(signal:AbortSignal):Promise<unknown>}
export interface CurrentOwnerCheckpointPort extends FreshCheckpointPort {inspectOwnerFresh(owner:StartupOwnerPin,signal:AbortSignal):Promise<unknown>;beginOwnerContinuation?(signal:AbortSignal):OwnerCheckpointTransition|null}
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const int=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const hex=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const uuid=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
const identity=(v:unknown):v is CviCheckpointIdentity=>exact(v,['storeId','operationId','revision'])&&uuid(v.storeId)&&hex(v.operationId)&&int(v.revision);
const same=(a:any,b:any)=>historyCanonical(a)===historyCanonical(b);
export function createLocalCviStartupOwner(
 expected:CviCheckpointIdentity,checkpoint:CurrentOwnerCheckpointPort,admission:FreshOwnerAdmissionPort,
 resources:Readonly<{binding:Readonly<{origin:string;conversation:string;secret:string;expiresAt:number}>;boot:Readonly<{storeId:string;previous:number;bootDigest:string}>;replay:CviReplayPort;authority:CviCredentialBootAuthority;makeFlow:()=>ReturnType<typeof createLocalCviStyling>}>,
 clock=Date.now,deadlineMs=8000,writerLeaseMs?:number,
){
 if(!exact(resources?.binding,['origin','conversation','secret','expiresAt'])||!identity(expected)||typeof checkpoint?.inspectFresh!=='function'||typeof checkpoint.inspectOwnerFresh!=='function'||typeof admission?.admit!=='function'||typeof resources?.makeFlow!=='function'||typeof resources.authority?.activate!=='function'||typeof resources.authority.check!=='function'||!resources.replay||typeof resources.replay.inspect!=='function'||typeof resources.replay.reserve!=='function'||typeof resources.replay.consume!=='function'||!uuid(resources.replay.storeId)||!exact(resources.boot,['storeId','previous','bootDigest'])||!uuid(resources.boot.storeId)||!int(resources.boot.previous)||resources.boot.previous>=Number.MAX_SAFE_INTEGER||!hex(resources.boot.bootDigest)||typeof clock!=='function'||!int(deadlineMs)||deadlineMs<1||deadlineMs>8000||writerLeaseMs!==undefined&&(!int(writerLeaseMs)||writerLeaseMs<1||writerLeaseMs>8000))throw Error('Local startup owner unavailable');
 const before=Object.freeze({...expected}),binding=Object.freeze({...resources.binding}),boot=Object.freeze({...resources.boot}),replay={storeId:resources.replay.storeId,inspect:resources.replay.inspect!.bind(resources.replay),reserve:resources.replay.reserve.bind(resources.replay),consume:resources.replay.consume.bind(resources.replay)},inspect=checkpoint.inspectFresh.bind(checkpoint),inspectOwner=checkpoint.inspectOwnerFresh.bind(checkpoint),beginContinuation=checkpoint.beginOwnerContinuation?.bind(checkpoint),admit=admission.admit.bind(admission),activate=resources.authority.activate.bind(resources.authority),check=resources.authority.check.bind(resources.authority),makeFlow=resources.makeFlow;
 const origin=new URL(binding.origin);if(origin.origin!==binding.origin||origin.protocol!=='https:'||!/^fixture-[a-z0-9-]{1,60}$/.test(binding.conversation)||!hex(binding.secret)||!int(binding.expiresAt))throw Error('Local startup owner unavailable');
 let attempted=false,held=false,last=-1;
 const now=()=>{const at=clock();if(!int(at)||at<last||at>=binding.expiresAt)throw Error();last=at;return at;};
 const replayBoundary=createLocalReplayInspector(replay,cviCredentialDigests(binding).bindingDigest,binding.expiresAt,now);
 const verifyCheckpoint=(raw:unknown,want:CviCheckpointIdentity)=>{
  if(!exact(raw,['status','revision','operationId','permissions','reason'])||raw.status!=='checkpoint-consistent'||raw.revision!==want.revision||raw.operationId!==want.operationId||raw.reason!=='fresh-owner-required'||!exact(raw.permissions,['write','reconcile','sign','resume'])||Object.values(raw.permissions).some(v=>v!==false))throw Error();
 };
 return Object.freeze({isHeld:()=>held,async start(external:AbortSignal){
  if(attempted||external.aborted)return null;attempted=true;
  const cancel=new AbortController(),signal=AbortSignal.any([external,cancel.signal]);let timer:ReturnType<typeof setTimeout>|undefined,onAbort:(()=>void)|undefined,flow:ReturnType<typeof createLocalCviStyling>|undefined,endpoint:Awaited<ReturnType<typeof startLocalCviCredentialEndpoint>>=null;
  try{
   const started=now(),end=Math.min(binding.expiresAt,started+deadlineMs);if(!int(end))throw Error();
   const current=()=>{const at=now();if(signal.aborted||at>=end)throw Error();return at;};
   const canceled=new Promise<never>((_,reject)=>{onAbort=()=>reject(Error());signal.addEventListener('abort',onAbort,{once:true});timer=setTimeout(()=>cancel.abort(),end-started);});
   const work=async()=>{
    if(!await replayBoundary.idle(signal))throw Error();current();
    const first=structuredClone(await inspect(signal));current();verifyCheckpoint(first,before);
    const issuedAt=current(),lifetime=planLocalCviLifetimes({startedAt:started,issuedAt,consultationExpiresAt:binding.expiresAt,startupDeadlineMs:deadlineMs,writerLeaseMs});
    const input:FreshOwnerAdmissionInput=Object.freeze({checkpoint:before,credentialStoreId:boot.storeId,replayStoreId:replay.storeId,previous:boot.previous,bootDigest:boot.bootDigest,...cviCredentialDigests(binding),nonce:randomBytes(32).toString('hex'),issuedAt,expiresAt:lifetime.requestedLeaseExpiresAt});
    const permit=structuredClone(await admit(input,signal));current();
    if(!exact(permit,['status','authorizationId','input','after','ownerExpiresAt','owner'])||permit.status!=='authorized'||!int(permit.ownerExpiresAt)||permit.ownerExpiresAt<=current()||permit.ownerExpiresAt>binding.expiresAt||permit.ownerExpiresAt>input.expiresAt||!hex(permit.authorizationId)||!exact(permit.input,['checkpoint','credentialStoreId','replayStoreId','previous','bootDigest','scopeDigest','bindingDigest','nonce','issuedAt','expiresAt'])||!same(permit.input,input)||!identity(permit.after)||permit.after.storeId!==before.storeId||permit.after.revision<before.revision||((permit.after.revision===before.revision)!==(permit.after.operationId===before.operationId)))throw Error();
    if(!await replayBoundary.idle(signal))throw Error();current();
    const after=Object.freeze({...permit.after});
    if(!exact(permit.owner,['storeId','generation','ownerDigest','bootDigest','expiresAt','minimumRevision'])||permit.owner.storeId!==after.storeId||permit.owner.generation!==boot.previous+1||!hex(permit.owner.ownerDigest)||permit.owner.bootDigest!==localStartupOwnerBoot(input)||permit.owner.expiresAt!==permit.ownerExpiresAt||permit.owner.minimumRevision!==after.revision)throw Error();
    const nativeOwner=Object.freeze({...permit.owner}) as StartupOwnerPin;
    flow=makeFlow();const initial=flow.snapshot();
    if(initial.revision!==0||!exact(initial.notes,[...CVI_FIELDS])||Object.values(initial.notes).some(n=>n.text!==''||n.confirmed!==false))throw Error();
    let lease:CviCredentialLease|undefined,guard:ReturnType<typeof createLocalCurrentOwnerCredentialAuthority>|undefined;
    const authority:CviCredentialBootAuthority={stale:s=>guard?.isStale(s)===true,activate:async(i,s)=>{const raw=structuredClone(await activate(i,AbortSignal.any([s,signal])));current();lease=raw as CviCredentialLease;return raw;},check:async(i,s)=>{if(!guard)throw Error();const proof=await guard.check(i,s);if(proof===null){if(guard.isHeld())flow?.end();else flow?.interrupt();}return proof;}};
    const prepared=await startLocalCviCredentialEndpoint(binding,flow,replay,boot,authority,now,Math.max(1,Math.min(deadlineMs,end-current())),deadlineMs);
    endpoint=prepared;if(signal.aborted||held){endpoint?.end();throw Error();}current();if(!endpoint||!lease)throw Error();
    guard=createLocalCurrentOwnerCredentialAuthority(nativeOwner,lease,{inspectOwnerFresh:inspectOwner,...(beginContinuation?{beginOwnerContinuation:beginContinuation}:{})},{check},now,binding.expiresAt);
    const at=current(),proof=structuredClone(await guard.check(Object.freeze({...lease,now:at}),signal));current();
    if(!exact(proof,['storeId','scopeDigest','bindingDigest','bootDigest','generation','now','active'])||proof.active!==true||proof.now!==at||Object.entries(lease).some(([k,v])=>proof[k]!==v))throw Error();
    if(!await replayBoundary.idle(signal))throw Error();current();
    const owner=endpoint,currentGuard=guard,currentFlow=flow;let renewing=false;continuations.set(owner,async(port,s)=>{if(renewing)return false;renewing=true;try{if(!await replayBoundary.idle(s)){owner.end();return false;}if(!localCviOwnerIsIdle(owner))return false;const ok=await currentGuard.continue(port,s,()=>currentFlow.interrupt(),()=>currentFlow.isOpen());if(!ok&&currentGuard.isHeld())owner.end();if(ok&&!await replayBoundary.idle(s)){owner.end();return false;}return ok;}finally{renewing=false;}});
    startedOwners.add(endpoint);return endpoint;
   };
   return await Promise.race([work(),canceled]);
  }catch{held=true;cancel.abort();(endpoint as Awaited<ReturnType<typeof startLocalCviCredentialEndpoint>>)?.end();flow?.end();return null;}
  finally{if(timer)clearTimeout(timer);if(onAbort)signal.removeEventListener('abort',onAbort);}
 }});
}
