/** Mandatory full-state fence for the disconnected local endpoint composition.
 * Inspection ports are pinned server configuration, never request data. */
import {createLocalCviCredentialEndpoint} from './local-cvi-credentials.ts';
import type {CviCredentialAuthority,CviCredentialLease} from './local-cvi-credentials.ts';
import type {CviCheckpointIdentity,FreshCheckpointPort} from './local-cvi-startup-owner.ts';
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const hex=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const uuid=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
export function createLocalCheckpointCredentialAuthority(expected:CviCheckpointIdentity,lease:CviCredentialLease,checkpoint:FreshCheckpointPort,authority:CviCredentialAuthority,validUntil:number,clock=Date.now):CviCredentialAuthority & {isHeld():boolean}{
 if(!exact(expected,['storeId','operationId','revision'])||!uuid(expected.storeId)||!hex(expected.operationId)||!Number.isSafeInteger(expected.revision)||expected.revision<0||!exact(lease,['storeId','scopeDigest','bindingDigest','bootDigest','generation'])||!uuid(lease.storeId)||!hex(lease.scopeDigest)||!hex(lease.bindingDigest)||!hex(lease.bootDigest)||!Number.isSafeInteger(lease.generation)||lease.generation<1||typeof checkpoint?.inspectFresh!=='function'||typeof authority?.check!=='function'||!Number.isSafeInteger(validUntil)||validUntil<1||typeof clock!=='function')throw Error('Local full-state fence unavailable');
 const want=Object.freeze({...expected}),owner=Object.freeze({...lease}),inspect=checkpoint.inspectFresh.bind(checkpoint),check=authority.check.bind(authority);let held=false,last=-1;
 const current=(minimum:number)=>{const at=clock();if(!Number.isSafeInteger(at)||at<minimum||at<last||at>=validUntil)throw Error();last=at;};
 const observe=async(signal:AbortSignal)=>{
  const r=structuredClone(await inspect(signal));
  if(signal.aborted||!exact(r,['status','revision','operationId','permissions','reason'])||r.status!=='checkpoint-consistent'||r.revision!==want.revision||r.operationId!==want.operationId||r.reason!=='fresh-owner-required'||!exact(r.permissions,['write','reconcile','sign','resume'])||Object.values(r.permissions).some(v=>v!==false))throw Error();
 };
 return Object.freeze({isHeld:()=>held,async check(input:CviCredentialLease & {now:number},signal:AbortSignal){
  if(held||signal.aborted)return null;
  try{
   if(!exact(input,['storeId','scopeDigest','bindingDigest','bootDigest','generation','now'])||!Number.isSafeInteger(input.now)||input.now<0||Object.entries(owner).some(([k,v])=>(input as any)[k]!==v))throw Error();
   current(input.now);await observe(signal);current(input.now);
   const raw=structuredClone(await check(Object.freeze({...owner,now:input.now}),signal));
   if(signal.aborted||!exact(raw,['storeId','scopeDigest','bindingDigest','bootDigest','generation','now','active'])||raw.active!==true||raw.now!==input.now||Object.entries(owner).some(([k,v])=>raw[k]!==v))throw Error();
   // A transition while the separate credential proof was awaited must refuse.
   await observe(signal);current(input.now);return raw;
  }catch{held=true;return null;}
 }});
}
/** No optional fence and no credential-only fallback in this composed path. */
export function createLocalCviCheckpointEndpoint(
 binding:Parameters<typeof createLocalCviCredentialEndpoint>[0],flow:Parameters<typeof createLocalCviCredentialEndpoint>[1],replay:Parameters<typeof createLocalCviCredentialEndpoint>[2],lease:CviCredentialLease,expected:CviCheckpointIdentity,checkpoint:FreshCheckpointPort,authority:CviCredentialAuthority,validUntil:number,clock=Date.now,deadlineMs=1000,
){
 const guard=createLocalCheckpointCredentialAuthority(expected,lease,checkpoint,authority,validUntil,clock);
 return createLocalCviCredentialEndpoint(binding,flow,replay,lease,{check:async(input,signal)=>{const proof=await guard.check(input,signal);if(proof===null)flow.end();return proof;}},clock,deadlineMs);
}
