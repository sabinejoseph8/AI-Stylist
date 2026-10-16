import {historyCanonical} from './local-cvi-history-authority.ts';
/** Disabled local composition. No listener, provider, secrets lookup or paid work. */
import {randomBytes} from 'node:crypto';
import {cviCredentialDigests,startLocalCviCredentialEndpoint} from './local-cvi-credentials.ts';
import type {CviCredentialBootAuthority,CviCredentialLease} from './local-cvi-credentials.ts';
import type {CviReplayPort} from './local-cvi-endpoint.ts';
import {CVI_FIELDS} from './local-cvi-styling.ts';
import type {createLocalCviStyling} from './local-cvi-styling.ts';
export type CviCheckpointIdentity=Readonly<{storeId:string;operationId:string;revision:number}>;
export type FreshOwnerAdmissionInput=Readonly<{checkpoint:CviCheckpointIdentity;credentialStoreId:string;replayStoreId:string;previous:number;bootDigest:string;scopeDigest:string;bindingDigest:string;nonce:string;issuedAt:number;expiresAt:number}>;
/** Trusted server ports, never supplied by an HTTP body. Admission must be
 * durably spent before acknowledgment; this module cannot prove its storage. */
export interface FreshOwnerAdmissionPort {admit(input:FreshOwnerAdmissionInput,signal:AbortSignal):Promise<unknown>}
export interface FreshCheckpointPort {inspectFresh(signal:AbortSignal):Promise<unknown>}
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const int=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const hex=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const uuid=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
const identity=(v:unknown):v is CviCheckpointIdentity=>exact(v,['storeId','operationId','revision'])&&uuid(v.storeId)&&hex(v.operationId)&&int(v.revision);
const same=(a:any,b:any)=>historyCanonical(a)===historyCanonical(b);
export function createLocalCviStartupOwner(
 expected:CviCheckpointIdentity,checkpoint:FreshCheckpointPort,admission:FreshOwnerAdmissionPort,
 resources:Readonly<{binding:Readonly<{origin:string;conversation:string;secret:string;expiresAt:number}>;boot:Readonly<{storeId:string;previous:number;bootDigest:string}>;replay:CviReplayPort;authority:CviCredentialBootAuthority;makeFlow:()=>ReturnType<typeof createLocalCviStyling>}>,
 clock=Date.now,deadlineMs=8000,
){
 if(!exact(resources?.binding,['origin','conversation','secret','expiresAt'])||!identity(expected)||typeof checkpoint?.inspectFresh!=='function'||typeof admission?.admit!=='function'||typeof resources?.makeFlow!=='function'||typeof resources.authority?.activate!=='function'||typeof resources.authority.check!=='function'||!resources.replay||typeof resources.replay.reserve!=='function'||typeof resources.replay.consume!=='function'||!uuid(resources.replay.storeId)||!exact(resources.boot,['storeId','previous','bootDigest'])||!uuid(resources.boot.storeId)||!int(resources.boot.previous)||resources.boot.previous>=Number.MAX_SAFE_INTEGER||!hex(resources.boot.bootDigest)||typeof clock!=='function'||!int(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Local startup owner unavailable');
 const before=Object.freeze({...expected}),binding=Object.freeze({...resources.binding}),boot=Object.freeze({...resources.boot}),replay={storeId:resources.replay.storeId,reserve:resources.replay.reserve.bind(resources.replay),consume:resources.replay.consume.bind(resources.replay)},inspect=checkpoint.inspectFresh.bind(checkpoint),admit=admission.admit.bind(admission),activate=resources.authority.activate.bind(resources.authority),check=resources.authority.check.bind(resources.authority),makeFlow=resources.makeFlow;
 const origin=new URL(binding.origin);if(origin.origin!==binding.origin||origin.protocol!=='https:'||!/^fixture-[a-z0-9-]{1,60}$/.test(binding.conversation)||!hex(binding.secret)||!int(binding.expiresAt))throw Error('Local startup owner unavailable');
 let attempted=false,held=false,last=-1,transferred=false;
 const now=()=>{const at=clock();if(!int(at)||at<last||at>=binding.expiresAt)throw Error();last=at;return at;};
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
    const first=structuredClone(await inspect(signal));current();verifyCheckpoint(first,before);
    const input:FreshOwnerAdmissionInput=Object.freeze({checkpoint:before,credentialStoreId:boot.storeId,replayStoreId:replay.storeId,previous:boot.previous,bootDigest:boot.bootDigest,...cviCredentialDigests(binding),nonce:randomBytes(32).toString('hex'),issuedAt:current(),expiresAt:end});
    const permit=structuredClone(await admit(input,signal));current();
    if(!exact(permit,['status','authorizationId','input','after'])||permit.status!=='authorized'||!hex(permit.authorizationId)||!exact(permit.input,['checkpoint','credentialStoreId','replayStoreId','previous','bootDigest','scopeDigest','bindingDigest','nonce','issuedAt','expiresAt'])||!same(permit.input,input)||!identity(permit.after)||permit.after.storeId!==before.storeId||permit.after.revision<before.revision||((permit.after.revision===before.revision)!==(permit.after.operationId===before.operationId)))throw Error();
    const after=Object.freeze({...permit.after});
    flow=makeFlow();const initial=flow.snapshot();
    if(initial.revision!==0||!exact(initial.notes,[...CVI_FIELDS])||Object.values(initial.notes).some(n=>n.text!==''||n.confirmed!==false))throw Error();
    let lease:CviCredentialLease|undefined;
    const authority:CviCredentialBootAuthority={activate:async(i,s)=>{const raw=structuredClone(await activate(i,AbortSignal.any([s,signal])));current();lease=raw as CviCredentialLease;return raw;},check:async(i,s)=>structuredClone(await check(i,transferred?s:AbortSignal.any([s,signal])))};
    const prepared=await startLocalCviCredentialEndpoint(binding,flow,replay,boot,authority,now,Math.max(1,Math.min(deadlineMs,end-current())));
    endpoint=prepared;if(signal.aborted||held){endpoint?.end();throw Error();}current();if(!endpoint||!lease)throw Error();
    const final=structuredClone(await inspect(signal));current();verifyCheckpoint(final,after);
    const at=current(),proof=structuredClone(await check(Object.freeze({...lease,now:at}),signal));current();
    if(!exact(proof,['storeId','scopeDigest','bindingDigest','bootDigest','generation','now','active'])||proof.active!==true||proof.now!==at||Object.entries(lease).some(([k,v])=>proof[k]!==v))throw Error();
    transferred=true;return endpoint;
   };
   return await Promise.race([work(),canceled]);
  }catch{held=true;cancel.abort();(endpoint as Awaited<ReturnType<typeof startLocalCviCredentialEndpoint>>)?.end();flow?.end();return null;}
  finally{if(timer)clearTimeout(timer);if(onAbort)signal.removeEventListener('abort',onAbort);}
 }});
}
