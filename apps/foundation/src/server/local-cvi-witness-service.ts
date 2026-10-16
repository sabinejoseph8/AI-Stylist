/** Disconnected authenticated witness-service contract. No URL, app route or key storage.
 * Store, transition validator and independent proof issuers are trusted setup ports.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {historyCanonical} from './local-cvi-history-authority.ts';
export type WitnessMetadata=Readonly<{storeId:string;policyDigest:string;epochFloor:number;headFloor:string;observedClock:number;historyDigest:string}>;
export type WitnessServicePin=Readonly<{authorityId:string;witnessId:string;storeId:string;policyDigest:string;keyId:string;publicKeyPem:string}>;
export type WitnessPrincipal=Readonly<{principalDigest:string;keyId:string;role:'observer'|'writer'|'signer'|'reconciler';publicKeyPem:string}>;
export type WitnessServiceRequest=Readonly<{version:1;authorityId:string;witnessId:string;storeId:string;policyDigest:string;principalDigest:string;keyId:string;action:'read'|'advance'|'reconcile';operationId:string;expectedRevision:number;challenge:string;issuedAt:number;expiresAt:number}>;
export type WitnessProofBinding=Readonly<{witnessId:string;storeId:string;policyDigest:string;operationId:string;revision:number;targetDigest:string;ownerDigest:string;nonce:string}>;
export interface WitnessServiceStore {admit(actor:WitnessPrincipal,request:WitnessServiceRequest,requestHash:string,signal:AbortSignal):Promise<unknown>;inspect(actor:WitnessPrincipal,signal:AbortSignal):Promise<any>;apply(actor:WitnessPrincipal,action:string,args:Record<string,unknown>,signal:AbortSignal):Promise<unknown>}
export interface WitnessServiceSources {transition(actor:WitnessPrincipal,operationId:string,current:WitnessMetadata,signal:AbortSignal):Promise<unknown>;database(binding:WitnessProofBinding,signal:AbortSignal):Promise<unknown>;fence(binding:WitnessProofBinding,signal:AbortSignal):Promise<unknown>}
export type WitnessProofPin=Readonly<{keyId:string;publicKeyPem:string}>;
const exact=(x:unknown,keys:string[]):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')===[...keys].sort().join(',');
const integer=(x:unknown):x is number=>Number.isSafeInteger(x)&&Number(x)>=0;
const digest=(x:unknown):x is string=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
export const witnessServiceDigest=(x:Record<string,unknown>)=>createHash('sha256').update(historyCanonical(x)).digest('hex');
const requestFields=['version','authorityId','witnessId','storeId','policyDigest','principalDigest','keyId','action','operationId','expectedRevision','challenge','issuedAt','expiresAt'];
function metadata(x:unknown):x is WitnessMetadata{return exact(x,['storeId','policyDigest','epochFloor','headFloor','observedClock','historyDigest'])&&typeof x.storeId==='string'&&digest(x.policyDigest)&&digest(x.headFloor)&&digest(x.historyDigest)&&integer(x.epochFloor)&&integer(x.observedClock);}
function signature(body:Record<string,unknown>,sig:unknown,pem:string){return typeof sig==='string'&&/^[a-f0-9]{128}$/.test(sig)&&verify(null,Buffer.from(historyCanonical(body)),createPublicKey(pem),Buffer.from(sig,'hex'));}
function proof(raw:unknown,kind:'database'|'fence',binding:WitnessProofBinding,pin:WitnessProofPin,at:number){
 if(!exact(raw,['body','signature'])||!exact(raw.body,['version','kind','state','keyId','witnessId','storeId','policyDigest','operationId','revision','targetDigest','ownerDigest','nonce','issuedAt','expiresAt']))throw Error();
 const b=raw.body;if(b.version!==1||b.kind!==kind||b.state!==(kind==='database'?'target-committed':'writers-fenced')||b.keyId!==pin.keyId||!integer(b.issuedAt)||!integer(b.expiresAt)||b.issuedAt>at||at>=b.expiresAt||b.expiresAt-b.issuedAt>8000||Object.entries(binding).some(([k,v])=>b[k]!==v)||!signature(b,raw.signature,pin.publicKeyPem))throw Error();
 return b.expiresAt;
}
export function verifyLocalWitnessReply(pin:WitnessServicePin,request:Omit<WitnessServiceRequest,'action'>&{action:string},raw:unknown,at:number):unknown{
 if(!integer(at)||at<request.issuedAt||at>=request.expiresAt||!exact(raw,['body','signature'])||!exact(raw.body,['version','authorityId','witnessId','storeId','policyDigest','keyId','principalDigest','challenge','requestHash','result']))throw Error('Witness reply unavailable');
 const b=raw.body;if(b.version!==1||b.keyId!==pin.keyId||b.principalDigest!==request.principalDigest||b.challenge!==request.challenge||b.requestHash!==witnessServiceDigest(request)||(['authorityId','witnessId','storeId','policyDigest'] as const).some(k=>b[k]!==pin[k])||!signature(b,raw.signature,pin.publicKeyPem))throw Error('Witness reply unavailable');return structuredClone(b.result);
}
export function createLocalCviWitnessService(pin:WitnessServicePin,principals:readonly WitnessPrincipal[],store:WitnessServiceStore,sources:WitnessServiceSources,proofPins:{database:WitnessProofPin;fence:WitnessProofPin},sign:(body:string)=>Promise<string>|string,clock=Date.now,deadlineMs=1000){
 const captured=Object.freeze({...pin}),grants=new Map<string,WitnessPrincipal>(),pins={database:Object.freeze({...proofPins.database}),fence:Object.freeze({...proofPins.fence})};
 if(!/^fixture-authority-[a-z0-9-]{1,40}$/.test(pin.authorityId)||!/^fixture-key-[a-z0-9-]{1,40}$/.test(pin.keyId)||!/^[a-f0-9-]{36}$/.test(pin.witnessId)||!/^[a-f0-9-]{36}$/.test(pin.storeId)||!integer(deadlineMs)||deadlineMs<1||deadlineMs>8000||!digest(pin.policyDigest)||typeof sign!=='function'||!principals.length||principals.length>8)throw Error('Witness service configuration unavailable');
 const identities=new Set<string>(),keyIds=new Set<string>();
 for(const p of principals){if(!/^fixture-key-[a-z0-9-]{1,40}$/.test(p.keyId)||!digest(p.principalDigest)||!['observer','writer','signer','reconciler'].includes(p.role)||typeof p.keyId!=='string'||grants.has(p.principalDigest)||createPublicKey(p.publicKeyPem).asymmetricKeyType!=='ed25519')throw Error('Witness service configuration unavailable');const identity=createPublicKey(p.publicKeyPem).export({type:'spki',format:'der'}).toString('hex');if(identities.has(identity)||keyIds.has(p.keyId))throw Error('Witness service configuration unavailable');identities.add(identity);keyIds.add(p.keyId);grants.set(p.principalDigest,Object.freeze({...p}));}
 for(const p of [captured,...Object.values(pins)]){const key=createPublicKey(p.publicKeyPem),identity=key.export({type:'spki',format:'der'}).toString('hex');if(key.asymmetricKeyType!=='ed25519'||identities.has(identity)||keyIds.has(p.keyId))throw Error('Witness service configuration unavailable');identities.add(identity);keyIds.add(p.keyId);}
 let lastTime=-1;
 const now=()=>{const at=clock();if(!integer(at)||at<lastTime)throw Error();lastTime=at;return at;};
 return Object.freeze({async handle(raw:unknown,external:AbortSignal):Promise<unknown>{
  const controller=new AbortController(),signal=AbortSignal.any([external,controller.signal]);let timer:ReturnType<typeof setTimeout>|undefined,onAbort:(()=>void)|undefined;
  try{
   const at=now();if(signal.aborted||!exact(raw,['request','signature'])||!exact(raw.request,requestFields))throw Error();
   const r=structuredClone(raw.request) as WitnessServiceRequest,actor=grants.get(r.principalDigest);
   if(!actor||r.keyId!==actor.keyId||r.version!==1||(['authorityId','witnessId','storeId','policyDigest'] as const).some(k=>r[k]!==captured[k])||!['read','advance','reconcile'].includes(r.action)||!digest(r.challenge)||!digest(r.operationId)||!integer(r.expectedRevision)||!integer(r.issuedAt)||!integer(r.expiresAt)||r.issuedAt>at||at>=r.expiresAt||r.expiresAt-r.issuedAt>8000||Buffer.byteLength(historyCanonical(r))>8192||!signature(r,raw.signature,actor.publicKeyPem)||(r.action==='advance'&&actor.role!=='writer')||(r.action==='reconcile'&&actor.role!=='reconciler'))throw Error();
   const end=Math.min(r.expiresAt,at+deadlineMs);if(!integer(end))throw Error();
   const canceled=new Promise<never>((_,reject)=>{onAbort=()=>reject(Error());signal.addEventListener('abort',onAbort,{once:true});timer=setTimeout(()=>controller.abort(),end-at);});
   const check=()=>{const t=now();if(signal.aborted||t>=end)throw Error();return t;};
   const work=async()=>{
    const ticket=await store.admit(actor,r,witnessServiceDigest(r),signal);check();if(!exact(ticket,['token'])||!digest(ticket.token))throw Error();
    let result:unknown,proofEnd=end,expectedMetadata:WitnessMetadata|undefined;
    if(r.action==='read')result=await store.apply(actor,'read',{token:ticket.token},signal);
    else{
     const s=await store.inspect(actor,signal);check();if(!s||!metadata(s.current)||!integer(s.revision)||s.current.storeId!==captured.storeId||s.current.policyDigest!==captured.policyDigest||s.revision!==r.expectedRevision)throw Error();
     if(r.action==='advance'){
      if(s.pending!==null)throw Error();const t=await sources.transition(actor,r.operationId,structuredClone(s.current),signal);check();
      if(!exact(t,['from','to'])||!metadata(t.from)||!metadata(t.to)||historyCanonical(t.from)!==historyCanonical(s.current)||t.to.storeId!==captured.storeId||t.to.policyDigest!==captured.policyDigest||t.to.epochFloor<t.from.epochFloor||t.to.observedClock<t.from.observedClock||t.to.observedClock>now()||(t.to.epochFloor===t.from.epochFloor&&t.to.headFloor!==t.from.headFloor)||t.to.historyDigest===t.from.historyDigest)throw Error();expectedMetadata=structuredClone(t.to);
      result=await store.apply(actor,'advance',{token:ticket.token,from:structuredClone(t.from),to:structuredClone(t.to)},signal);
     }else{
      const op=Array.isArray(s.operations)?s.operations.find((o:any)=>o.id===r.operationId&&o.status==='prepared'):undefined;
      if(!op||s.pending!==r.operationId||op.revision!==s.revision||!metadata(op.to)||historyCanonical(op.to)!==historyCanonical(s.current)||!digest(op.principalDigest))throw Error();
      expectedMetadata=structuredClone(op.to);const binding:WitnessProofBinding=Object.freeze({witnessId:captured.witnessId,storeId:captured.storeId,policyDigest:captured.policyDigest,operationId:r.operationId,revision:s.revision,targetDigest:witnessServiceDigest(op.to),ownerDigest:op.principalDigest,nonce:r.challenge});
      const db=await sources.database(binding,signal);check();const fence=await sources.fence(binding,signal);const received=check();
      proofEnd=Math.min(proofEnd,proof(db,'database',binding,pins.database,received),proof(fence,'fence',binding,pins.fence,received));
      result=await store.apply(actor,'reconcile',{token:ticket.token,targetDigest:binding.targetDigest,ownerDigest:binding.ownerDigest,revision:binding.revision,validUntil:proofEnd},signal);
     }
    }
    check();if(now()>=proofEnd)throw Error();
    if(exact(result,['status'])&&result.status==='held'){}
    else if(r.action==='read'){if(!exact(result,['status','revision','current','pending'])||result.status!=='read'||!integer(result.revision)||!metadata(result.current)||result.current.storeId!==captured.storeId||result.current.policyDigest!==captured.policyDigest||!(result.pending===null||digest(result.pending)))throw Error();}
    else if(!exact(result,['status','revision','current','operationId'])||result.status!==(r.action==='advance'?'advanced':'reconciled')||result.revision!==r.expectedRevision+1||result.operationId!==r.operationId||!metadata(result.current)||!expectedMetadata||historyCanonical(result.current)!==historyCanonical(expectedMetadata))throw Error();
    const body={version:1,authorityId:captured.authorityId,witnessId:captured.witnessId,storeId:captured.storeId,policyDigest:captured.policyDigest,keyId:captured.keyId,principalDigest:r.principalDigest,challenge:r.challenge,requestHash:witnessServiceDigest(r),result:structuredClone(result)};
    const signed=await sign(historyCanonical(body));check();if(now()>=proofEnd||!signature(body,signed,captured.publicKeyPem))throw Error();return {body,signature:signed};
   };
   return await Promise.race([work(),canceled]);
  }catch{controller.abort();throw Error('Witness service unavailable');}
  finally{if(timer)clearTimeout(timer);if(onAbort)signal.removeEventListener('abort',onAbort);}
 }});
}
