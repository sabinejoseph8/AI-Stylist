/** Disconnected local admission. All ports are trusted server configuration.
 * No listener, credentials lookup, provider request or raw-write fallback. */
import {randomBytes} from 'node:crypto';
import {historyCanonical} from './local-cvi-history-authority.ts';
import {verifyLocalWitnessReply,witnessServiceDigest} from './local-cvi-witness-service.ts';
import type {WitnessServicePin} from './local-cvi-witness-service.ts';
import type {MandatoryLeaseIntent,AuthorityEvidence} from './local-cvi-mandatory-persistence.ts';
import type {FreshOwnerAdmissionInput,FreshOwnerAdmissionPort} from './local-cvi-startup-owner.ts';
export const localStartupOwnerBoot=(input:FreshOwnerAdmissionInput)=>witnessServiceDigest({purpose:'local-startup-owner-boot-v1',boot:input.bootDigest,admission:witnessServiceDigest(input)});
const replayHandoffs=new WeakMap<object,{input:FreshOwnerAdmissionInput;permit:unknown;lease:Record<string,unknown>;expiresAt:number;observedAt:number;used:boolean;valid():boolean}>();
/** Original transient startup permission only; never recovered from JSON/state. */
export function claimLocalStartupReplayLease(raw:unknown,input:FreshOwnerAdmissionInput,now:number){
 const r=raw&&typeof raw==='object'?replayHandoffs.get(raw):undefined;
 if(!r||r.used||!r.valid()||!Number.isSafeInteger(now)||now<r.observedAt||now>=r.expiresAt||historyCanonical(input)!==historyCanonical(r.input)||historyCanonical(raw as Record<string,unknown>)!==historyCanonical(r.permit as Record<string,unknown>))throw Error('Startup replay handoff unavailable');
 r.used=true;r.observedAt=now;return {lease:structuredClone(r.lease),permit:structuredClone(r.permit)};
}
type StartupScope=Omit<FreshOwnerAdmissionInput,'nonce'|'issuedAt'|'expiresAt'>;
export interface DurableStartupPorts {
 plan(input:FreshOwnerAdmissionInput,signal:AbortSignal):Promise<MandatoryLeaseIntent>;
 execute(intent:MandatoryLeaseIntent,signal:AbortSignal):Promise<unknown>;
 read(nonce:string,signal:AbortSignal):Promise<AuthorityEvidence>;
}
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const hex=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const int=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const same=(a:any,b:any)=>historyCanonical(a)===historyCanonical(b);
export function createLocalDurableStartupAdmission(
 pin:WitnessServicePin,expected:StartupScope,baseline:Record<string,unknown>,
 actor:Readonly<{principalDigest:string;readerPrincipal:string;ownerDigest:string}>,ports:DurableStartupPorts,clock=Date.now,
):FreshOwnerAdmissionPort & {isHeld():boolean}{
 if(!exact(expected,['checkpoint','credentialStoreId','replayStoreId','previous','bootDigest','scopeDigest','bindingDigest'])||!exact(expected.checkpoint,['storeId','operationId','revision'])||expected.checkpoint.storeId!==pin.storeId||!hex(expected.checkpoint.operationId)||!int(expected.checkpoint.revision)||expected.checkpoint.revision>Number.MAX_SAFE_INTEGER-2||!int(expected.previous)||expected.previous>=Number.MAX_SAFE_INTEGER||!hex(expected.bootDigest)||!hex(expected.scopeDigest)||!hex(expected.bindingDigest)||!exact(baseline,['storeId','policyDigest','epochFloor','headFloor','observedClock','historyDigest'])||baseline.storeId!==pin.storeId||baseline.policyDigest!==pin.policyDigest||baseline.epochFloor!==expected.previous||!hex(baseline.headFloor)||!hex(baseline.historyDigest)||!int(baseline.observedClock)||!exact(actor,['principalDigest','readerPrincipal','ownerDigest'])||!hex(actor.principalDigest)||!hex(actor.readerPrincipal)||!hex(actor.ownerDigest)||typeof ports?.plan!=='function'||typeof ports.execute!=='function'||typeof ports.read!=='function'||typeof clock!=='function')throw Error('Local startup admission unavailable');
 const scope=structuredClone(expected),base=structuredClone(baseline),publicPin=structuredClone(pin),principal={...actor},plan=ports.plan.bind(ports),execute=ports.execute.bind(ports),read=ports.read.bind(ports);
 let used=false,held=false,last=-1;
 return Object.freeze({isHeld:()=>held,async admit(raw:FreshOwnerAdmissionInput,external:AbortSignal){
  if(used||external.aborted)throw Error('Local startup admission unavailable');used=true;
  const abort=new AbortController(),signal=AbortSignal.any([external,abort.signal]);let timer:ReturnType<typeof setTimeout>|undefined,onAbort:(()=>void)|undefined;
  try{
   const input=structuredClone(raw);
   if(!exact(input,['checkpoint','credentialStoreId','replayStoreId','previous','bootDigest','scopeDigest','bindingDigest','nonce','issuedAt','expiresAt'])||!hex(input.nonce)||!int(input.issuedAt)||!int(input.expiresAt)||input.expiresAt<=input.issuedAt||input.expiresAt-input.issuedAt>8000)throw Error();
   const {nonce:_,issuedAt:__,expiresAt:___,...bound}=input;if(!same(bound,scope))throw Error();
   const now=()=>{const at=clock();if(!int(at)||at<last||at<input.issuedAt||at>=input.expiresAt||signal.aborted)throw Error();last=at;return at;};
   const started=now(),canceled=new Promise<never>((_,reject)=>{onAbort=()=>reject(Error());signal.addEventListener('abort',onAbort,{once:true});timer=setTimeout(()=>abort.abort(),input.expiresAt-started);});
   const fresh=async(revision:number,current:Record<string,unknown>)=>{
    const nonce=randomBytes(32).toString('hex'),e=structuredClone(await read(nonce,signal)),r=verifyLocalWitnessReply(publicPin,e.request,e.reply,now()) as any;
    if(e.request.action!=='read'||e.request.challenge!==nonce||e.request.principalDigest!==principal.readerPrincipal||!exact(r,['status','revision','current','pending'])||r.status!=='read'||r.revision!==revision||r.pending!==null||!same(r.current,current))throw Error();
    return e.request.expiresAt;
   };
   const work=async()=>{
    await fresh(scope.checkpoint.revision,base);
    const p=structuredClone(await plan(structuredClone(input),signal));now();
    if(!exact(p,['id','version','kind','args','actor','now','from','to'])||p.version!==1||p.kind!=='activate'||!hex(p.id)||!exact(p.actor,['role','principalDigest'])||p.actor.role!=='rotator'||p.actor.principalDigest!==principal.principalDigest||p.now!==input.issuedAt||!same(p.from,base)||!exact(p.args,['previous','owner','boot','ttl','token'])||p.args.previous!==input.previous||p.args.owner!==principal.ownerDigest||p.args.boot!==localStartupOwnerBoot(input)||!hex(p.args.token)||p.args.ttl!==input.expiresAt-input.issuedAt||p.to.storeId!==publicPin.storeId||p.to.policyDigest!==publicPin.policyDigest||p.to.epochFloor!==input.previous+1)throw Error();
    const {id,...body}=p;if(witnessServiceDigest(body)!==id)throw Error();
    const lease=structuredClone(await execute(p,signal));const at=now();
    if(!exact(lease,['storeId','policyDigest','generation','ownerDigest','bootDigest','token','issuedAt','expiresAt'])||lease.storeId!==publicPin.storeId||lease.policyDigest!==publicPin.policyDigest||lease.generation!==input.previous+1||lease.ownerDigest!==p.args.owner||lease.bootDigest!==p.args.boot||lease.token!==p.args.token||lease.issuedAt!==input.issuedAt||!int(lease.expiresAt)||lease.expiresAt>input.expiresAt||lease.expiresAt<=at)throw Error();
    const proofExpiry=await fresh(scope.checkpoint.revision+2,p.to),finished=now();if(finished>=proofExpiry||finished>=lease.expiresAt)throw Error();
    const permit={status:'authorized',authorizationId:id,ownerExpiresAt:lease.expiresAt,owner:{storeId:publicPin.storeId,generation:lease.generation,ownerDigest:lease.ownerDigest,bootDigest:lease.bootDigest,expiresAt:lease.expiresAt,minimumRevision:scope.checkpoint.revision+2},input:structuredClone(input),after:{storeId:publicPin.storeId,operationId:id,revision:scope.checkpoint.revision+2}};
    replayHandoffs.set(permit,{input:structuredClone(input),permit:structuredClone(permit),lease:structuredClone(lease),expiresAt:Math.min(proofExpiry,input.expiresAt,lease.expiresAt),observedAt:finished,used:false,valid:()=>!signal.aborted&&!held});
    return permit;
   };
   return await Promise.race([work(),canceled]);
  }catch{held=true;abort.abort();throw Error('Local startup admission unavailable');}
  finally{if(timer)clearTimeout(timer);if(onAbort)signal.removeEventListener('abort',onAbort);}
 }});
}
