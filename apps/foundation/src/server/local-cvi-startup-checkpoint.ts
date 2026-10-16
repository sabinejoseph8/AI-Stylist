/** Read-only startup inspection. Consistency never recreates a writer or signer. */
import {createPublicKey,randomBytes,verify} from 'node:crypto';
import {historyCanonical} from './local-cvi-history-authority.ts';
import {verifyLocalWitnessReply,witnessServiceDigest} from './local-cvi-witness-service.ts';
import {fullStateMetadata,fullStateProjection} from './local-cvi-full-state-reconciliation.ts';
import type {WitnessServicePin} from './local-cvi-witness-service.ts';
import type {AuthorityEvidence} from './local-cvi-mandatory-persistence.ts';
import {captureGateFinishBinding,gateFinishChallenges,gateFinishProofDeadline,gateFinishJson,verifyLocalGateFinishProof} from './local-cvi-gate-finish-proof.ts';
import type {GateFinishBinding,GateFinishProofPack} from './local-cvi-gate-finish-proof.ts';
export type StartupOwnerPin=Readonly<{storeId:string;generation:number;ownerDigest:string;bootDigest:string;expiresAt:number;minimumRevision:number}>;
export type StartupRegistry=Readonly<{version:1;entries:readonly Readonly<{operationId:string;target:Record<string,unknown>;projection:Record<string,unknown>}>[]}>;
export type StartupPin=Readonly<{authority:WitnessServicePin;database:Readonly<{keyId:string;publicKeyPem:string}>;readerPrincipal:string;registryDigest:string;minimumRevision:number}>;
export interface StartupReadPorts {authority(nonce:string,signal:AbortSignal):Promise<AuthorityEvidence>;database(nonce:string,signal:AbortSignal):Promise<unknown>}
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const int=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const hex=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const equal=(a:any,b:any)=>historyCanonical(a)===historyCanonical(b);
const publicIdentity=(pem:string)=>{const k=createPublicKey(pem);if(k.asymmetricKeyType!=='ed25519')throw Error();return k.export({type:'spki',format:'der'}).toString('hex');};
function safeJson(v:unknown,depth=0):boolean{if(depth>20)return false;if(v===null||typeof v==='string'||typeof v==='boolean')return true;if(typeof v==='number')return Number.isFinite(v)&&Math.abs(v)<=Number.MAX_SAFE_INTEGER;if(Array.isArray(v))return v.every(x=>safeJson(x,depth+1));return !!v&&typeof v==='object'&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null)&&Object.values(v).every(x=>safeJson(x,depth+1));}
const noPermission=Object.freeze({write:false,reconcile:false,sign:false,resume:false});
const finishProofs=new WeakMap<object,{binding:GateFinishBinding;fingerprint:string;pack:GateFinishProofPack;summary:string;observedAt:number;expiresAt:number;used:boolean;valid():boolean}>();
/** Original completed inspection only; JSON/state cannot reconstruct this claim. */
export function claimLocalGateFinishInspection(raw:unknown,binding:GateFinishBinding,now:number):GateFinishProofPack{
 const r=raw&&typeof raw==='object'?finishProofs.get(raw):undefined;
 if(!r||r.used||!r.valid()||r.binding!==binding||!gateFinishJson(binding)||historyCanonical(binding as any)!==r.fingerprint||!int(now)||now<r.observedAt||now>=r.expiresAt||historyCanonical(raw as any)!==r.summary)throw Error('Original gate finish inspection unavailable');
 r.used=true;return structuredClone(r.pack);
}
export function createLocalStartupCheckpointInspector(pin:StartupPin,registry:StartupRegistry,ports:StartupReadPorts,clock=Date.now,deadlineMs=5000,gateFinish?:GateFinishBinding){
 if(!safeJson(pin)||!safeJson(registry)||typeof clock!=='function'||!exact(pin,['authority','database','readerPrincipal','registryDigest','minimumRevision'])||!exact(pin.database,['keyId','publicKeyPem'])||typeof pin.database.keyId!=='string'||!/^fixture-key-[a-z0-9-]{1,40}$/.test(pin.database.keyId)||!hex(pin.readerPrincipal)||!hex(pin.registryDigest)||!int(pin.minimumRevision)||!int(deadlineMs)||deadlineMs<1||deadlineMs>8000||typeof ports?.authority!=='function'||typeof ports.database!=='function'||publicIdentity(pin.database.publicKeyPem)===publicIdentity(pin.authority.publicKeyPem)||pin.database.keyId===pin.authority.keyId||!exact(registry,['version','entries'])||registry.version!==1||!Array.isArray(registry.entries)||!registry.entries.length||registry.entries.length>128||witnessServiceDigest(registry)!==pin.registryDigest)throw Error('Startup checkpoint unavailable');
 const config=structuredClone(pin),known=structuredClone(registry),read=ports.authority.bind(ports),observe=ports.database.bind(ports),ids=new Set<string>();
 for(const e of known.entries){if(!exact(e,['operationId','target','projection'])||!hex(e.operationId)||ids.has(e.operationId)||!exact(e.target,['storeId','policyDigest','epochFloor','headFloor','observedClock','historyDigest'])||e.target.storeId!==config.authority.storeId||e.target.policyDigest!==config.authority.policyDigest||!int(e.target.epochFloor)||!int(e.target.observedClock)||!hex(e.target.headFloor)||!hex(e.target.historyDigest)||!exact(e.projection,['generation','fenced','owner','boot','head'])||!int(e.projection.generation)||typeof e.projection.fenced!=='boolean'||!hex(e.projection.owner)||!hex(e.projection.boot)||!hex(e.projection.head))throw Error('Startup checkpoint unavailable');ids.add(e.operationId);}
 if(Buffer.byteLength(historyCanonical({pin:config,registry:known}))>131072)throw Error('Startup checkpoint unavailable');
 const finishContext=gateFinish===undefined?undefined:captureGateFinishBinding(gateFinish),finishNonces=finishContext?gateFinishChallenges(finishContext.prepared):undefined;
 if(finishContext&&(!equal(finishContext.pin,{authority:config.authority,database:config.database,readerPrincipal:config.readerPrincipal})||finishContext.owner.minimumRevision<config.minimumRevision||!known.entries.some(e=>e.operationId===finishContext.plan.id&&equal(e.target,finishContext.plan.to))))throw Error('Gate finish checkpoint unavailable');
 let attempted=false,held=false,last=-1;
 const now=()=>{const n=clock();if(!int(n)||n<last)throw Error();last=n;return n;};
 async function inspect(external:AbortSignal,owner?:StartupOwnerPin){
  if(attempted||external.aborted||finishContext&&(!owner||!equal(owner,finishContext.owner)))throw Error('Startup checkpoint unavailable');attempted=true;
  const abort=new AbortController(),signal=AbortSignal.any([external,abort.signal]);let timer:ReturnType<typeof setTimeout>|undefined,onAbort:(()=>void)|undefined;
  try{
   const started=now();if(finishContext&&(started<finishContext.prepared.issuedAt||started>=finishContext.prepared.expiresAt))throw Error();
   const canceled=new Promise<never>((_,reject)=>{onAbort=()=>reject(Error());signal.addEventListener('abort',onAbort,{once:true});timer=setTimeout(()=>abort.abort(),Math.min(deadlineMs,finishContext?finishContext.prepared.expiresAt-started:deadlineMs));});
   const work=async()=>{
    const nonce=finishNonces?.before??randomBytes(32).toString('hex'),e=structuredClone(await read(nonce,signal)),a=verifyLocalWitnessReply(config.authority,e.request,e.reply,now()) as any;
    if(signal.aborted||e.request.action!=='read'||e.request.challenge!==nonce||e.request.principalDigest!==config.readerPrincipal||!exact(a,['status','revision','current','pending'])||a.status!=='read'||!int(a.revision)||a.revision<config.minimumRevision||a.pending!==null)throw Error();
    const dbNonce=finishNonces?.database??randomBytes(32).toString('hex'),raw=structuredClone(await observe(dbNonce,signal)),at=now();
    if(signal.aborted||!safeJson(raw)||!exact(raw,['body','signature'])||!exact(raw.body,['version','keyId','storeId','policyDigest','nonce','issuedAt','expiresAt','checkpoint'])||typeof raw.signature!=='string'||!/^[a-f0-9]{128}$/.test(raw.signature))throw Error();
    const b=raw.body;if(b.version!==1||b.keyId!==config.database.keyId||b.storeId!==config.authority.storeId||b.policyDigest!==config.authority.policyDigest||b.nonce!==dbNonce||!int(b.issuedAt)||!int(b.expiresAt)||b.issuedAt>at||at>=b.expiresAt||b.expiresAt-b.issuedAt>8000||!verify(null,Buffer.from(historyCanonical(b)),createPublicKey(config.database.publicKeyPem),Buffer.from(raw.signature,'hex')))throw Error();
    const c=b.checkpoint;
    if(!exact(c,['snapshot','projection','operationId','transactionId','claimHash','consumed','protected'])||c.consumed!==true||c.protected!==true||typeof c.operationId!=='string'||!/^[a-f0-9]{32}$/.test(c.operationId)||typeof c.transactionId!=='string'||!/^[1-9][0-9]{0,19}$/.test(c.transactionId)||!hex(c.claimHash))throw Error();
    const metadata=fullStateMetadata(c.snapshot),matches=known.entries.filter(x=>x.operationId.slice(0,32)===c.operationId&&equal(x.target,a.current));
    if(matches.length!==1||!equal(metadata,a.current)||!equal(c.projection,matches[0].projection)||!equal(fullStateProjection(c.snapshot),c.projection))throw Error();
    // Final authority read detects a participating transition during observation.
    const finalNonce=finishNonces?.after??randomBytes(32).toString('hex'),f=structuredClone(await read(finalNonce,signal)),current=verifyLocalWitnessReply(config.authority,f.request,f.reply,now()) as any;
    if(signal.aborted||now()>=b.expiresAt||f.request.action!=='read'||f.request.challenge!==finalNonce||f.request.principalDigest!==config.readerPrincipal||current.status!=='read'||current.pending!==null||current.revision!==a.revision||!equal(current.current,a.current))throw Error();
    const finished=now();if(finished>=b.expiresAt||finished>=f.request.expiresAt)throw Error();
    if(owner){
     const snapshot=c.snapshot as any,g=snapshot.gate[0],active=snapshot.grants.filter((x:any)=>x[6]==='active'),grant=active[0];
     if(g[3]!=='active'||active.length!==1||grant[0]!==g[2]||!int(grant[4])||!int(grant[5])||grant[4]>finished||finished>=grant[5]||grant[5]<=grant[4]||!hex(grant[3])||a.revision<owner.minimumRevision)throw Error();
     const actual={storeId:g[0],generation:g[2],ownerDigest:grant[1],bootDigest:grant[2],expiresAt:grant[5]}, {minimumRevision,...wanted}=owner;
     if(!equal(actual,wanted))throw Error();
     const result=Object.freeze({status:'owner-current',revision:a.revision,operationId:matches[0].operationId,owner:Object.freeze(actual),permissions:noPermission});
     if(finishContext&&gateFinish){
      const pack={before:e,database:raw,after:f};verifyLocalGateFinishProof(finishContext,pack,now());
      const observedAt=now(),expiresAt=gateFinishProofDeadline(finishContext,pack);if(signal.aborted||observedAt>=expiresAt)throw Error();
      finishProofs.set(result,{binding:gateFinish,fingerprint:historyCanonical(finishContext as any),pack:structuredClone(pack),summary:historyCanonical(result),observedAt,expiresAt,used:false,valid:()=>!held&&!signal.aborted});
     }
     return result;
    }
    return Object.freeze({status:'checkpoint-consistent',revision:a.revision,operationId:matches[0].operationId,permissions:noPermission,reason:'fresh-owner-required'});
   };
   return await Promise.race([work(),canceled]);
  }catch{held=true;abort.abort();throw Error('Startup checkpoint unavailable');}
  finally{if(timer)clearTimeout(timer);if(onAbort)signal.removeEventListener('abort',onAbort);}
 }
 return Object.freeze({inspect:(signal:AbortSignal)=>inspect(signal),inspectOwner:(owner:StartupOwnerPin,signal:AbortSignal)=>{
  if(!safeJson(owner)||!exact(owner,['storeId','generation','ownerDigest','bootDigest','expiresAt','minimumRevision'])||owner.storeId!==config.authority.storeId||!int(owner.generation)||owner.generation<1||!hex(owner.ownerDigest)||!hex(owner.bootDigest)||!int(owner.expiresAt)||owner.expiresAt<1||!int(owner.minimumRevision))throw Error('Startup owner unavailable');
  return inspect(signal,structuredClone(owner));
 }});
}
