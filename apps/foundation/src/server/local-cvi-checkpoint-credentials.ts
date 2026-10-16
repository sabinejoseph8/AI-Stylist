import {inspectOwnerContinuation,consumeOwnerContinuation} from './local-cvi-owner-continuation.ts';
import type {OwnerCheckpointTransition,OwnerContinuationPort,OwnerContinuationInput} from './local-cvi-owner-continuation.ts';
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

/** Current active native owner, allowing only registry-verified same-owner
 * state progress. Revision floors increase in this instance and never reset. */
export function createLocalCurrentOwnerCredentialAuthority(
 native:import('./local-cvi-startup-checkpoint.ts').StartupOwnerPin,lease:CviCredentialLease,
 checkpoint:Pick<import('./local-cvi-startup-owner.ts').CurrentOwnerCheckpointPort,'inspectOwnerFresh'|'beginOwnerContinuation'>,authority:CviCredentialAuthority,clock=Date.now,applicationExpiresAt=native.expiresAt,adoptReplay?:(raw:unknown,input:OwnerContinuationInput,now:number)=>void,
):CviCredentialAuthority & {isHeld():boolean;isStale(signal:AbortSignal):boolean;continue(port:OwnerContinuationPort,signal:AbortSignal,invalidate:()=>void,alive:()=>boolean):Promise<boolean>}{
 if(!exact(native,['storeId','generation','ownerDigest','bootDigest','expiresAt','minimumRevision'])||!uuid(native.storeId)||!Number.isSafeInteger(native.generation)||native.generation<1||!hex(native.ownerDigest)||!hex(native.bootDigest)||!Number.isSafeInteger(native.expiresAt)||native.expiresAt<1||!Number.isSafeInteger(native.minimumRevision)||native.minimumRevision<0||!exact(lease,['storeId','scopeDigest','bindingDigest','bootDigest','generation'])||!uuid(lease.storeId)||!hex(lease.scopeDigest)||!hex(lease.bindingDigest)||!hex(lease.bootDigest)||lease.generation!==native.generation||typeof checkpoint?.inspectOwnerFresh!=='function'||typeof authority?.check!=='function'||typeof clock!=='function'||adoptReplay!==undefined&&typeof adoptReplay!=='function'||!Number.isSafeInteger(applicationExpiresAt)||applicationExpiresAt<native.expiresAt)throw Error('Current owner unavailable');
 let want=Object.freeze({...native});const credential=Object.freeze({...lease}),inspect=checkpoint.inspectOwnerFresh.bind(checkpoint),check=authority.check.bind(authority),begin=checkpoint.beginOwnerContinuation?.bind(checkpoint);let held=false,continuing=false,checks=0,floor=want.minimumRevision,last=-1,operation:string|undefined;const versions=new WeakMap<AbortSignal,{revision:number;operation:string}>(),stale=new WeakSet<AbortSignal>();
 const current=(minimum:number)=>{const at=clock();if(held||!Number.isSafeInteger(at)||at<minimum||at<last||at>=want.expiresAt)throw Error();last=at;return at;};
 const observe=async(signal:AbortSignal)=>{
  const r=structuredClone(await inspect(Object.freeze({...want,minimumRevision:floor}),signal));
  if(signal.aborted||!exact(r,['status','revision','operationId','owner','permissions'])||r.status!=='owner-current'||!Number.isSafeInteger(r.revision)||Number(r.revision)<floor||!hex(r.operationId)||!exact(r.owner,['storeId','generation','ownerDigest','bootDigest','expiresAt'])||Object.entries(want).some(([k,v])=>k!=='minimumRevision'&&(r.owner as Record<string,unknown>)[k]!==v)||!exact(r.permissions,['write','reconcile','sign','resume'])||Object.values(r.permissions).some(v=>v!==false))throw Error();
  if(operation!==undefined&&((Number(r.revision)===floor&&r.operationId!==operation)||(Number(r.revision)>floor&&r.operationId===operation)))throw Error();floor=Number(r.revision);operation=r.operationId;
 };
 return Object.freeze({isHeld:()=>held,isStale:(signal:AbortSignal)=>!held&&!signal.aborted&&stale.has(signal),async check(input:CviCredentialLease & {now:number},signal:AbortSignal){
  if(held||continuing||signal.aborted)return null;checks++;
  try{
   if(!exact(input,['storeId','scopeDigest','bindingDigest','bootDigest','generation','now'])||!Number.isSafeInteger(input.now)||input.now<0||Object.entries(credential).some(([k,v])=>(input as any)[k]!==v))throw Error();
   current(input.now);await observe(signal);current(input.now);
   const raw=structuredClone(await check(Object.freeze({...credential,now:input.now}),signal));
   if(signal.aborted||!exact(raw,['storeId','scopeDigest','bindingDigest','bootDigest','generation','now','active'])||raw.active!==true||raw.now!==input.now||Object.entries(credential).some(([k,v])=>raw[k]!==v))throw Error();
   current(input.now);await observe(signal);current(input.now);const previous=versions.get(signal);if(previous&&(previous.revision!==floor||previous.operation!==operation)){stale.add(signal);return null;}versions.set(signal,{revision:floor,operation:operation!});return raw;
  }catch{held=true;return null;}finally{checks--;}
 },async continue(port:OwnerContinuationPort,external:AbortSignal,invalidate:()=>void,alive:()=>boolean){
  if(held||continuing||checks||external.aborted||want.expiresAt>=applicationExpiresAt)return false;continuing=true;
  const abort=new AbortController(),signal=AbortSignal.any([external,abort.signal]);let timer:ReturnType<typeof setTimeout>|undefined,transition:OwnerCheckpointTransition|null|undefined,adopted=false;
  try{
   if(typeof port?.renew!=='function'||typeof invalidate!=='function'||typeof alive!=='function'||!alive())throw Error();
   if(begin){transition=begin(signal);if(!transition)return false;if(!exact(transition,['inspect','finish','cancel'])||!['inspect','finish','cancel'].every(k=>typeof (transition as any)[k]==='function'))throw Error();}
   const started=clock();current(started);
   const canceled=new Promise<never>((_,reject)=>{signal.addEventListener('abort',()=>reject(Error()),{once:true});timer=setTimeout(()=>abort.abort(),want.expiresAt-started);});void canceled.catch(()=>{});
   const work=async()=>{
    await observe(signal);current(started);
    const initial=structuredClone(await check(Object.freeze({...credential,now:started}),signal));
    if(signal.aborted||!exact(initial,['storeId','scopeDigest','bindingDigest','bootDigest','generation','now','active'])||initial.active!==true||initial.now!==started||Object.entries(credential).some(([k,v])=>initial[k]!==v))throw Error();
    await observe(signal);current(started);
    const input:OwnerContinuationInput={owner:Object.freeze({...want,minimumRevision:floor}),operationId:operation!,revision:floor,bindingDigest:credential.bindingDigest,applicationExpiresAt};
    invalidate();const raw=await port.renew(Object.freeze(input),signal);current(started);
    const next=inspectOwnerContinuation(raw,input,current(started));
    const fresh=async()=>{const r=structuredClone(await (transition?transition.inspect(raw,input,signal):inspect(next.owner,signal)));current(started);if(signal.aborted||!exact(r,['status','revision','operationId','owner','permissions'])||r.status!=='owner-current'||r.revision!==next.after.revision||r.operationId!==next.after.operationId||!exact(r.owner,['storeId','generation','ownerDigest','bootDigest','expiresAt'])||Object.entries(next.owner).some(([k,v])=>k!=='minimumRevision'&&(r.owner as any)[k]!==v)||!exact(r.permissions,['write','reconcile','sign','resume'])||Object.values(r.permissions).some(v=>v!==false))throw Error();};
    await fresh();const at=current(started);const proof=structuredClone(await check(Object.freeze({...credential,now:at}),signal));
    if(signal.aborted||!exact(proof,['storeId','scopeDigest','bindingDigest','bootDigest','generation','now','active'])||proof.active!==true||proof.now!==at||Object.entries(credential).some(([k,v])=>proof[k]!==v))throw Error();
    await fresh();current(at);if(!alive())throw Error();invalidate();if(signal.aborted||held||!alive())throw Error();
    const accepted=consumeOwnerContinuation(raw,input,current(at));adoptReplay?.(raw,input,current(at));await transition?.finish(raw,input,signal);current(at);if(signal.aborted||!alive())throw Error();adopted=true;want=Object.freeze({...accepted.owner});floor=accepted.after.revision;operation=accepted.after.operationId;return true;
   };
   return await Promise.race([work(),canceled]);
  }catch{held=true;abort.abort();return false;}finally{if(timer)clearTimeout(timer);if(!adopted&&typeof transition?.cancel==='function'){try{transition.cancel();}catch{held=true;}}continuing=false;}
 }});
}
export function createLocalCviCurrentOwnerEndpoint(
 binding:Parameters<typeof createLocalCviCredentialEndpoint>[0],flow:Parameters<typeof createLocalCviCredentialEndpoint>[1],replay:Parameters<typeof createLocalCviCredentialEndpoint>[2],lease:CviCredentialLease,native:import('./local-cvi-startup-checkpoint.ts').StartupOwnerPin,checkpoint:Pick<import('./local-cvi-startup-owner.ts').CurrentOwnerCheckpointPort,'inspectOwnerFresh'|'beginOwnerContinuation'>,authority:CviCredentialAuthority,clock=Date.now,deadlineMs=1000,
){const guard=createLocalCurrentOwnerCredentialAuthority(native,lease,checkpoint,authority,clock);return createLocalCviCredentialEndpoint(binding,flow,replay,lease,{stale:s=>guard.isStale(s),check:async(i,s)=>{const result=await guard.check(i,s);if(result===null){if(guard.isHeld())flow.end();else flow.interrupt();}return result;}},clock,deadlineMs);}
