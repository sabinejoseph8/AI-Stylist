/** Read-only startup inspection. Consistency never recreates a writer or signer. */
import {createPublicKey,randomBytes,verify} from 'node:crypto';
import {historyCanonical} from './local-cvi-history-authority.ts';
import {verifyLocalWitnessReply,witnessServiceDigest} from './local-cvi-witness-service.ts';
import {fullStateMetadata,fullStateProjection} from './local-cvi-full-state-reconciliation.ts';
import type {WitnessServicePin} from './local-cvi-witness-service.ts';
import type {AuthorityEvidence} from './local-cvi-mandatory-persistence.ts';
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
export function createLocalStartupCheckpointInspector(pin:StartupPin,registry:StartupRegistry,ports:StartupReadPorts,clock=Date.now,deadlineMs=5000){
 if(!safeJson(pin)||!safeJson(registry)||typeof clock!=='function'||!exact(pin,['authority','database','readerPrincipal','registryDigest','minimumRevision'])||!exact(pin.database,['keyId','publicKeyPem'])||typeof pin.database.keyId!=='string'||!/^fixture-key-[a-z0-9-]{1,40}$/.test(pin.database.keyId)||!hex(pin.readerPrincipal)||!hex(pin.registryDigest)||!int(pin.minimumRevision)||!int(deadlineMs)||deadlineMs<1||deadlineMs>8000||typeof ports?.authority!=='function'||typeof ports.database!=='function'||publicIdentity(pin.database.publicKeyPem)===publicIdentity(pin.authority.publicKeyPem)||pin.database.keyId===pin.authority.keyId||!exact(registry,['version','entries'])||registry.version!==1||!Array.isArray(registry.entries)||!registry.entries.length||registry.entries.length>128||witnessServiceDigest(registry)!==pin.registryDigest)throw Error('Startup checkpoint unavailable');
 const config=structuredClone(pin),known=structuredClone(registry),read=ports.authority.bind(ports),observe=ports.database.bind(ports),ids=new Set<string>();
 for(const e of known.entries){if(!exact(e,['operationId','target','projection'])||!hex(e.operationId)||ids.has(e.operationId)||!exact(e.target,['storeId','policyDigest','epochFloor','headFloor','observedClock','historyDigest'])||e.target.storeId!==config.authority.storeId||e.target.policyDigest!==config.authority.policyDigest||!int(e.target.epochFloor)||!int(e.target.observedClock)||!hex(e.target.headFloor)||!hex(e.target.historyDigest)||!exact(e.projection,['generation','fenced','owner','boot','head'])||!int(e.projection.generation)||typeof e.projection.fenced!=='boolean'||!hex(e.projection.owner)||!hex(e.projection.boot)||!hex(e.projection.head))throw Error('Startup checkpoint unavailable');ids.add(e.operationId);}
 if(Buffer.byteLength(historyCanonical({pin:config,registry:known}))>131072)throw Error('Startup checkpoint unavailable');
 let attempted=false,last=-1;
 const now=()=>{const n=clock();if(!int(n)||n<last)throw Error();last=n;return n;};
 return Object.freeze({async inspect(external:AbortSignal){
  if(attempted||external.aborted)throw Error('Startup checkpoint unavailable');attempted=true;
  const abort=new AbortController(),signal=AbortSignal.any([external,abort.signal]);let timer:ReturnType<typeof setTimeout>|undefined,onAbort:(()=>void)|undefined;
  try{
   now();const canceled=new Promise<never>((_,reject)=>{onAbort=()=>reject(Error());signal.addEventListener('abort',onAbort,{once:true});timer=setTimeout(()=>abort.abort(),deadlineMs);});
   const work=async()=>{
    const nonce=randomBytes(32).toString('hex'),e=structuredClone(await read(nonce,signal)),a=verifyLocalWitnessReply(config.authority,e.request,e.reply,now()) as any;
    if(signal.aborted||e.request.action!=='read'||e.request.challenge!==nonce||e.request.principalDigest!==config.readerPrincipal||!exact(a,['status','revision','current','pending'])||a.status!=='read'||!int(a.revision)||a.revision<config.minimumRevision||a.pending!==null)throw Error();
    const dbNonce=randomBytes(32).toString('hex'),raw=structuredClone(await observe(dbNonce,signal)),at=now();
    if(signal.aborted||!safeJson(raw)||!exact(raw,['body','signature'])||!exact(raw.body,['version','keyId','storeId','policyDigest','nonce','issuedAt','expiresAt','checkpoint'])||typeof raw.signature!=='string'||!/^[a-f0-9]{128}$/.test(raw.signature))throw Error();
    const b=raw.body;if(b.version!==1||b.keyId!==config.database.keyId||b.storeId!==config.authority.storeId||b.policyDigest!==config.authority.policyDigest||b.nonce!==dbNonce||!int(b.issuedAt)||!int(b.expiresAt)||b.issuedAt>at||at>=b.expiresAt||b.expiresAt-b.issuedAt>8000||!verify(null,Buffer.from(historyCanonical(b)),createPublicKey(config.database.publicKeyPem),Buffer.from(raw.signature,'hex')))throw Error();
    const c=b.checkpoint;
    if(!exact(c,['snapshot','projection','operationId','transactionId','claimHash','consumed','protected'])||c.consumed!==true||c.protected!==true||typeof c.operationId!=='string'||!/^[a-f0-9]{32}$/.test(c.operationId)||typeof c.transactionId!=='string'||!/^[1-9][0-9]{0,19}$/.test(c.transactionId)||!hex(c.claimHash))throw Error();
    const metadata=fullStateMetadata(c.snapshot),matches=known.entries.filter(x=>x.operationId.slice(0,32)===c.operationId&&equal(x.target,a.current));
    if(matches.length!==1||!equal(metadata,a.current)||!equal(c.projection,matches[0].projection)||!equal(fullStateProjection(c.snapshot),c.projection))throw Error();
    // Final authority read detects a participating transition during observation.
    const finalNonce=randomBytes(32).toString('hex'),f=structuredClone(await read(finalNonce,signal)),current=verifyLocalWitnessReply(config.authority,f.request,f.reply,now()) as any;
    if(signal.aborted||now()>=b.expiresAt||f.request.action!=='read'||f.request.challenge!==finalNonce||f.request.principalDigest!==config.readerPrincipal||current.status!=='read'||current.pending!==null||current.revision!==a.revision||!equal(current.current,a.current))throw Error();
    return Object.freeze({status:'checkpoint-consistent',revision:a.revision,operationId:matches[0].operationId,permissions:noPermission,reason:'fresh-owner-required'});
   };
   return await Promise.race([work(),canceled]);
  }catch{abort.abort();throw Error('Startup checkpoint unavailable');}
  finally{if(timer)clearTimeout(timer);if(onAbort)signal.removeEventListener('abort',onAbort);}
 }});
}
