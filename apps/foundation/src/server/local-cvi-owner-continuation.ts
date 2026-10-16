import {isOriginalLocalGatedExecution,claimLocalGatedExecution} from './local-cvi-gated-execution.ts';
import type {LocalGatedExecutionContext} from './local-cvi-gated-execution.ts';
/** Disabled authenticated continuation. Ports are trusted server composition.
 * No HTTP activation, token recovery, environment access or raw-write fallback. */
import {randomBytes} from 'node:crypto';
import {historyCanonical} from './local-cvi-history-authority.ts';
import {verifyLocalWitnessReply,witnessServiceDigest} from './local-cvi-witness-service.ts';
import type {WitnessServicePin} from './local-cvi-witness-service.ts';
import type {MandatoryLeaseIntent,AuthorityEvidence} from './local-cvi-mandatory-persistence.ts';
import type {StartupOwnerPin} from './local-cvi-startup-checkpoint.ts';
export type OwnerContinuationInput=Readonly<{owner:StartupOwnerPin;operationId:string;revision:number;bindingDigest:string;applicationExpiresAt:number}>;
export interface OwnerContinuationPort {renew(input:OwnerContinuationInput,signal:AbortSignal):Promise<unknown>}
type NativeLease=Readonly<{storeId:string;policyDigest:string;generation:number;ownerDigest:string;bootDigest:string;token:string;issuedAt:number;expiresAt:number}>;
type Result={before:OwnerContinuationInput;owner:StartupOwnerPin;after:{operationId:string;revision:number};expiresAt:number;observedAt:number;used:boolean;contextClaimed?:boolean;replayClaimed?:boolean;replayLease:NativeLease;execution?:LocalGatedExecutionContext;valid():boolean;accept():void};
const handoffs=new WeakMap<object,Result>();
const exact=(v:any,keys:string[])=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const int=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const hex=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const same=(a:any,b:any)=>historyCanonical(a)===historyCanonical(b);
/** The original transient handoff only, never a reconstructed JSON record. */
export function inspectOwnerContinuation(raw:unknown,input:OwnerContinuationInput,now:number){
 const r=raw&&typeof raw==='object'?handoffs.get(raw):undefined;
 if(!r||r.used||!r.valid()||!int(now)||now<r.observedAt||now>=r.expiresAt||!same(r.before,input))throw Error('Owner continuation unavailable');
 r.observedAt=now;return {owner:structuredClone(r.owner),after:{...r.after}};
}
export function consumeOwnerContinuation(raw:unknown,input:OwnerContinuationInput,now:number){const result=inspectOwnerContinuation(raw,input,now),r=handoffs.get(raw as object)!;r.used=true;r.accept();return result;}
/** Complete one notebook adoption only after the original guard consumed it. */
export function claimOwnerContinuationContext(raw:unknown,input:OwnerContinuationInput,now:number){
 const r=raw&&typeof raw==='object'?handoffs.get(raw):undefined;
 if(!r||!r.used||r.contextClaimed||!r.valid()||!int(now)||now<r.observedAt||now>=r.expiresAt||!same(r.before,input))throw Error('Owner continuation unavailable');
 r.observedAt=now;r.contextClaimed=true;return {owner:structuredClone(r.owner),after:{...r.after}};
}
/** Private replay adoption requires the original already-consumed handoff. */
export function claimLocalContinuationReplayLease(raw:unknown,input:OwnerContinuationInput,now:number){
 const r=raw&&typeof raw==='object'?handoffs.get(raw):undefined;
 if(!r||!r.used||r.replayClaimed||!r.valid()||!int(now)||now<r.observedAt||now>=r.expiresAt||!same(r.before,input))throw Error('Replay continuation unavailable');
 r.replayClaimed=true;r.observedAt=now;return {lease:structuredClone(r.replayLease),execution:r.execution,owner:structuredClone(r.owner),after:{...r.after}};
}
export interface OwnerCheckpointTransition {
 inspect(raw:unknown,input:OwnerContinuationInput,signal:AbortSignal):Promise<unknown>;
 finish(raw:unknown,input:OwnerContinuationInput,signal:AbortSignal):void|Promise<void>;
 cancel():void;
}
export function createLocalDurableOwnerContinuation(
 pin:WitnessServicePin,initial:NativeLease,bindingDigest:string,applicationExpiresAt:number,
 actor:Readonly<{principalDigest:string;readerPrincipal:string}>,ports:Readonly<{
 plan(args:Readonly<{lease:NativeLease;ttl:number;token:string;issuedAt:number}>,signal:AbortSignal):Promise<MandatoryLeaseIntent>;
 execute(intent:MandatoryLeaseIntent,signal:AbortSignal):Promise<unknown>;
 read(nonce:string,signal:AbortSignal):Promise<AuthorityEvidence>;
 }>,clock=Date.now,requestedMs=8000,
):OwnerContinuationPort & {isHeld():boolean}{
 if(!exact(initial,['storeId','policyDigest','generation','ownerDigest','bootDigest','token','issuedAt','expiresAt'])||initial.storeId!==pin.storeId||initial.policyDigest!==pin.policyDigest||!int(initial.generation)||initial.generation<1||!['ownerDigest','bootDigest','token'].every(k=>hex((initial as any)[k]))||!int(initial.issuedAt)||!int(initial.expiresAt)||initial.expiresAt<=initial.issuedAt||!hex(bindingDigest)||!int(applicationExpiresAt)||applicationExpiresAt<initial.expiresAt||!exact(actor,['principalDigest','readerPrincipal'])||!hex(actor.principalDigest)||!hex(actor.readerPrincipal)||typeof ports?.plan!=='function'||typeof ports.execute!=='function'||typeof ports.read!=='function'||typeof clock!=='function'||!int(requestedMs)||requestedMs<1||requestedMs>8000)throw Error('Owner continuation unavailable');
 const scope=structuredClone(pin),principal={...actor},plan=ports.plan.bind(ports),execute=ports.execute.bind(ports),read=ports.read.bind(ports);
 let lease=structuredClone(initial),busy=false,held=false,last=-1,attempts=0;
 return Object.freeze({isHeld:()=>held,async renew(raw:OwnerContinuationInput,external:AbortSignal){
  if(held||busy||external.aborted||attempts>=128)throw Error('Owner continuation unavailable');busy=true;attempts++;
  const abort=new AbortController(),signal=AbortSignal.any([external,abort.signal]);let timer:ReturnType<typeof setTimeout>|undefined;
  try{
   const before=structuredClone(raw),original=structuredClone(lease);
   if(!exact(before,['owner','operationId','revision','bindingDigest','applicationExpiresAt'])||!exact(before.owner,['storeId','generation','ownerDigest','bootDigest','expiresAt','minimumRevision'])||!int(before.revision)||before.revision>Number.MAX_SAFE_INTEGER-2||before.owner.minimumRevision!==before.revision||!hex(before.operationId)||before.bindingDigest!==bindingDigest||before.applicationExpiresAt!==applicationExpiresAt||['storeId','generation','ownerDigest','bootDigest','expiresAt'].some(k=>(before.owner as any)[k]!== (original as any)[k]))throw Error();
   let deadline=Number.MAX_SAFE_INTEGER;
   const now=()=>{const at=clock();if(signal.aborted||!int(at)||at<last||at<original.issuedAt||at>=original.expiresAt||at>=applicationExpiresAt||at>=deadline)throw Error();last=at;return at;};
   const started=now();deadline=Math.min(original.expiresAt,applicationExpiresAt,started+8000);
   const canceled=new Promise<never>((_,reject)=>{signal.addEventListener('abort',()=>reject(Error()),{once:true});timer=setTimeout(()=>abort.abort(),deadline-started);});void canceled.catch(()=>{});
   const fresh=async(revision:number,current?:Record<string,unknown>)=>{
    const nonce=randomBytes(32).toString('hex'),e=structuredClone(await read(nonce,signal)),r=verifyLocalWitnessReply(scope,e.request,e.reply,now()) as any;
    if(e.request.action!=='read'||e.request.challenge!==nonce||e.request.principalDigest!==principal.readerPrincipal||!exact(r,['status','revision','current','pending'])||r.status!=='read'||r.revision!==revision||r.pending!==null||current&&!same(r.current,current))throw Error();
    return {current:r.current,expiresAt:e.request.expiresAt};
   };
   const work=async()=>{
    const baseline=await fresh(before.revision),issuedAt=now(),ttl=Math.min(requestedMs,applicationExpiresAt-issuedAt),token=randomBytes(32).toString('hex');
    const p=structuredClone(await plan({lease:structuredClone(original),ttl,token,issuedAt},signal));now();
    if(!exact(p,['id','version','kind','args','actor','now','from','to'])||p.version!==1||p.kind!=='renew'||!hex(p.id)||p.actor.role!=='rotator'||p.actor.principalDigest!==principal.principalDigest||p.now!==issuedAt||!same(p.from,baseline.current)||!exact(p.args,['lease','ttl','token'])||!same(p.args.lease,original)||p.args.ttl!==ttl||p.args.token!==token||p.to.storeId!==scope.storeId||p.to.policyDigest!==scope.policyDigest||p.to.epochFloor!==original.generation)throw Error();
    const {id,...body}=p;if(witnessServiceDigest(body)!==id)throw Error();
    const originalExecution=await execute(structuredClone(p),signal),execution=isOriginalLocalGatedExecution(originalExecution)?claimLocalGatedExecution(originalExecution,p,now()):undefined;
    const next=structuredClone(originalExecution) as NativeLease;const at=now();
    if(!exact(next,['storeId','policyDigest','generation','ownerDigest','bootDigest','token','issuedAt','expiresAt'])||['storeId','policyDigest','generation','ownerDigest','bootDigest'].some(k=>(next as any)[k]!== (original as any)[k])||next.token!==token||next.token===original.token||next.issuedAt!==issuedAt||!int(next.expiresAt)||next.expiresAt<=original.expiresAt||next.expiresAt>issuedAt+ttl||next.expiresAt>applicationExpiresAt||next.expiresAt<=at)throw Error();
    const proof=await fresh(before.revision+2,p.to),finished=now(),expiresAt=Math.min(deadline,baseline.expiresAt,proof.expiresAt);if(finished>=expiresAt)throw Error();
    const owner={...before.owner,expiresAt:next.expiresAt,minimumRevision:before.revision+2},after={operationId:id,revision:before.revision+2},result=Object.freeze({status:'owner-continuation'});
    handoffs.set(result,{before,owner,after,expiresAt,observedAt:finished,used:false,replayLease:structuredClone(next),execution,valid:()=>!signal.aborted&&!held,accept(){lease=structuredClone(next);busy=false;}});
    return result;
   };
   return await Promise.race([work(),canceled]);
  }catch{held=true;busy=false;abort.abort();throw Error('Owner continuation unavailable');}
  finally{if(timer)clearTimeout(timer);}
 }});
}
