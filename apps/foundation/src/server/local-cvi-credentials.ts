import {createHash} from 'node:crypto';
import {createLocalCviEndpoint} from './local-cvi-endpoint.ts';
import type {CviReplayPort} from './local-cvi-endpoint.ts';
import type {createLocalCviStyling} from './local-cvi-styling.ts';
export type CviCredentialLease=Readonly<{storeId:string;scopeDigest:string;bindingDigest:string;bootDigest:string;generation:number}>;
export interface CviCredentialAuthority {check(input:CviCredentialLease & {now:number},signal:AbortSignal):Promise<unknown>}
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
export function cviCredentialDigests(binding:{origin:string;conversation:string;secret:string;expiresAt:number}){
 return Object.freeze({scopeDigest:hash(JSON.stringify([binding.origin,binding.conversation,binding.expiresAt])),bindingDigest:hash(JSON.stringify([binding.origin,binding.conversation,binding.secret,binding.expiresAt]))});
}
/** Local lifecycle candidate. Activation/rotation is NOT available from request input.
 * Authority and replay storage are mandatory. No provider or live route imports this. */
export function createLocalCviCredentialEndpoint(
 binding:{origin:string;conversation:string;secret:string;expiresAt:number},flow:ReturnType<typeof createLocalCviStyling>,
 replay:CviReplayPort,lease:CviCredentialLease,authority:CviCredentialAuthority,clock=Date.now,deadlineMs=1000,
){
 const d=cviCredentialDigests(binding);
 if(!replay||!authority||typeof authority.check!=='function'||!lease||Object.keys(lease).sort().join(',')!=='bindingDigest,bootDigest,generation,scopeDigest,storeId'||
  !/^[a-f0-9-]{36}$/.test(lease.storeId)||!Number.isSafeInteger(lease.generation)||lease.generation<1||
  !/^[a-f0-9]{64}$/.test(lease.bootDigest)||lease.scopeDigest!==d.scopeDigest||lease.bindingDigest!==d.bindingDigest)throw Error('Local credential authority required');
 const captured=Object.freeze({...lease});
 return createLocalCviEndpoint(binding,flow,clock,deadlineMs,replay,{async check(signal,now){
  if(signal.aborted)return false;
  const raw=await authority.check(Object.freeze({...captured,now}),signal);
  if(signal.aborted||!raw||typeof raw!=='object'||Array.isArray(raw))return false;
  const x=raw as Record<string,unknown>;
  return Object.keys(x).sort().join(',')==='active,bindingDigest,bootDigest,generation,now,scopeDigest,storeId'&&x.active===true&&x.now===now&&
   Object.entries(captured).every(([key,value])=>x[key]===value);
 }});
}

export interface CviCredentialBootAuthority extends CviCredentialAuthority {
 activate(input:Readonly<{storeId:string;scopeDigest:string;bindingDigest:string;bootDigest:string;previous:number;now:number}>,signal:AbortSignal):Promise<unknown>;
}
/** Startup must commit fresh binding+boot digests before constructing an owner.
 * Unknown activation returns null; never reuse the previous credential or retry. */
export async function startLocalCviCredentialEndpoint(
 binding:{origin:string;conversation:string;secret:string;expiresAt:number},flow:ReturnType<typeof createLocalCviStyling>,replay:CviReplayPort,
 boot:{storeId:string;previous:number;bootDigest:string},authority:CviCredentialBootAuthority,clock=Date.now,deadlineMs=1000,requestDeadlineMs=deadlineMs,
){
 if(!authority||typeof authority.activate!=='function'||typeof authority.check!=='function'||!replay||
  !Number.isInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000||!Number.isInteger(requestDeadlineMs)||requestDeadlineMs<1||requestDeadlineMs>8000||!Number.isSafeInteger(boot?.previous)||boot.previous<0||
  !/^[a-f0-9]{64}$/.test(boot.bootDigest)||!/^[a-f0-9-]{36}$/.test(boot.storeId))return null;
 const abort=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
 try{
  const u=new URL(binding.origin);
  if(u.origin!==binding.origin||u.protocol!=='https:'||!/^fixture-[a-z0-9-]{1,60}$/.test(binding.conversation)||!/^([a-f0-9]{64})$/.test(binding.secret)||!Number.isSafeInteger(binding.expiresAt))return null;
  const now=clock();if(!Number.isSafeInteger(now)||now<0||now>=binding.expiresAt)return null;
  const input=Object.freeze({...cviCredentialDigests(binding),storeId:boot.storeId,bootDigest:boot.bootDigest,previous:boot.previous,now});
  const raw=await Promise.race([Promise.resolve().then(()=>authority.activate(input,abort.signal)),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{abort.abort();reject(Error());},deadlineMs);})]);
  if(abort.signal.aborted||!raw||typeof raw!=='object'||Array.isArray(raw))return null;
  const lease=raw as CviCredentialLease;
  if(Object.keys(lease).sort().join(',')!=='bindingDigest,bootDigest,generation,scopeDigest,storeId'||lease.generation!==input.previous+1||
   lease.storeId!==input.storeId||lease.scopeDigest!==input.scopeDigest||lease.bindingDigest!==input.bindingDigest||lease.bootDigest!==input.bootDigest)return null;
  return createLocalCviCredentialEndpoint(binding,flow,replay,lease,authority,clock,requestDeadlineMs);
 }catch{abort.abort();return null;}finally{if(timer)clearTimeout(timer);}
}
