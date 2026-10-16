/** Disconnected mandatory adapter. No optional authority or raw-write fallback. */
import {createLocalCviWitnessService,verifyLocalWitnessReply,witnessServiceDigest} from './local-cvi-witness-service.ts';
import type {WitnessServicePin,WitnessServiceRequest} from './local-cvi-witness-service.ts';
import {createPublicKey,verify} from 'node:crypto';
import {historyCanonical} from './local-cvi-history-authority.ts';
export type LeaseAuthorityRole='rotator'|'fencer'|'writer'|'signer';
export type MandatoryLeaseIntent=Readonly<{id:string;version:1;kind:'activate'|'renew'|'fence'|'apply'|'release';args:Record<string,unknown>;actor:Readonly<{principalDigest:string;role:LeaseAuthorityRole}>;now:number;from:Record<string,unknown>;to:Record<string,unknown>}>;
export type AuthorityEvidence=Readonly<{request:Omit<WitnessServiceRequest,'action'>&{action:string};reply:unknown}>;
export interface MonotonicLeaseAuthorityPort {advance(intent:MandatoryLeaseIntent,signal:AbortSignal):Promise<AuthorityEvidence>;claim(intent:MandatoryLeaseIntent,nonce:string,signal:AbortSignal):Promise<AuthorityEvidence>;read(nonce:string,signal:AbortSignal):Promise<AuthorityEvidence>;reconcile(intent:MandatoryLeaseIntent,signal:AbortSignal):Promise<AuthorityEvidence>}
export interface MandatoryLeasePersistencePort {execute(intent:MandatoryLeaseIntent,approval:AuthorityEvidence,authorize:(message:unknown)=>Promise<unknown>,signal:AbortSignal):Promise<unknown>}
const exact=(x:unknown,keys:string[]):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')===[...keys].sort().join(',');
const digest=(x:unknown):x is string=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const roles={activate:'rotator',renew:'rotator',fence:'fencer',apply:'writer',release:'signer'};
function freeze<T>(v:T):T{if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;}
export function createLocalMandatoryLeaseAdapter(pin:WitnessServicePin,actor:Readonly<{principalDigest:string;role:LeaseAuthorityRole}>,authority:MonotonicLeaseAuthorityPort,persistence:MandatoryLeasePersistencePort,clock=Date.now,deadlineMs=8000){
 if(!exact(pin,['authorityId','witnessId','storeId','policyDigest','keyId','publicKeyPem'])||!digest(pin.policyDigest)||createPublicKey(pin.publicKeyPem).asymmetricKeyType!=='ed25519'||!digest(actor.principalDigest)||!Object.values(roles).includes(actor.role)||!authority||!persistence||!['advance','claim','read','reconcile'].every(k=>typeof (authority as any)[k]==='function')||typeof persistence.execute!=='function'||!Number.isInteger(deadlineMs)||deadlineMs<1||deadlineMs>30000)throw Error('Mandatory persistence configuration unavailable');
 const scope=Object.freeze({...pin}),grant=Object.freeze({...actor}),a={advance:authority.advance.bind(authority),claim:authority.claim.bind(authority),read:authority.read.bind(authority),reconcile:authority.reconcile.bind(authority)},execute=persistence.execute.bind(persistence),used=new Set<string>();let busy=false,held=false,lastTime=-1;
 const now=()=>{const at=clock();if(!Number.isSafeInteger(at)||at<0||at<lastTime)throw Error();lastTime=at;return at;};
 return Object.freeze({isHeld:()=>held,async execute(input:MandatoryLeaseIntent,external:AbortSignal):Promise<unknown>{
  if(held||busy||external.aborted)throw Error('Mandatory persistence unavailable');busy=true;const abort=new AbortController(),signal=AbortSignal.any([external,abort.signal]);let timer:ReturnType<typeof setTimeout>|undefined,onAbort:(()=>void)|undefined;
  try{
   now();if(!exact(input,['id','version','kind','args','actor','now','from','to'])||input.version!==1||!digest(input.id)||!exact(input.actor,['principalDigest','role'])||input.actor.principalDigest!==grant.principalDigest||input.actor.role!==grant.role||roles[input.kind]!==grant.role||used.has(input.id)||used.size>=128)throw Error();
   const intent=freeze(structuredClone(input)),{id,...body}=intent;if(witnessServiceDigest(body)!==id||Buffer.byteLength(historyCanonical(intent))>65536||intent.from.storeId!==scope.storeId||intent.to.storeId!==scope.storeId||intent.from.policyDigest!==scope.policyDigest||intent.to.policyDigest!==scope.policyDigest)throw Error();used.add(id);
   const canceled=new Promise<never>((_,reject)=>{onAbort=()=>reject(Error());signal.addEventListener('abort',onAbort,{once:true});timer=setTimeout(()=>abort.abort(),deadlineMs);});
   const work=async()=>{
    const approval=freeze(structuredClone(await a.advance(intent,signal)));if(signal.aborted)throw Error();
    const advanced=verifyLocalWitnessReply(scope,approval.request,approval.reply,now()) as any;
    if(approval.request.action!=='advance'||approval.request.operationId!==id||approval.request.principalDigest!==grant.principalDigest||advanced.status!=='advanced'||advanced.operationId!==id||advanced.revision!==approval.request.expectedRevision+1||historyCanonical(advanced.current)!==historyCanonical(intent.to))throw Error();
    let claimed=false,reconciled=false,pendingReads=0,finalReads=0;
    const authorize=async(message:unknown)=>{
     if(signal.aborted)throw Error();
     if(exact(message,['stage','phase','nonce','operationId'])&&message.stage==='authority-read'&&message.operationId===id&&digest(message.nonce)&&['claim','pending','reconciled'].includes(String(message.phase))){
      if((message.phase==='reconciled')!==reconciled)throw Error();
      if(message.phase==='claim'){
       if(claimed||pendingReads)throw Error();const evidence=freeze(structuredClone(await a.claim(intent,message.nonce,signal))),result=verifyLocalWitnessReply(scope,evidence.request,evidence.reply,now()) as any;
       if(signal.aborted||evidence.request.action!=='claim-execution'||evidence.request.operationId!==id||evidence.request.principalDigest!==grant.principalDigest||evidence.request.challenge!==message.nonce||result.status!=='execution-claimed'||result.operationId!==id||result.revision!==advanced.revision||result.targetDigest!==witnessServiceDigest(intent.to)||result.grantHash!==witnessServiceDigest(approval.request))throw Error();claimed=true;return evidence;
      }
      if(!claimed)throw Error();const evidence=freeze(structuredClone(await a.read(message.nonce,signal)));const read=verifyLocalWitnessReply(scope,evidence.request,evidence.reply,now()) as any;
      if(signal.aborted||evidence.request.action!=='read'||evidence.request.challenge!==message.nonce||read.status!=='read'||read.revision!==advanced.revision+(reconciled?1:0)||read.pending!==(reconciled?null:id)||historyCanonical(read.current)!==historyCanonical(intent.to))throw Error();
      if(reconciled)finalReads++;else pendingReads++;return evidence;
     }
     if(exact(message,['stage','operationId'])&&message.stage==='reconcile'&&message.operationId===id&&!reconciled&&claimed&&pendingReads>=1){
      const evidence=await a.reconcile(intent,signal),done=verifyLocalWitnessReply(scope,evidence.request,evidence.reply,now()) as any;
      if(signal.aborted||evidence.request.action!=='reconcile'||evidence.request.operationId!==id||done.status!=='reconciled'||done.operationId!==id||done.revision!==advanced.revision+1||historyCanonical(done.current)!==historyCanonical(intent.to))throw Error();reconciled=true;return {ok:true};
     }
     throw Error();
    };
    const result=await execute(intent,approval,authorize,signal);now();if(signal.aborted||!claimed||!reconciled||pendingReads<1||finalReads<1)throw Error();return structuredClone(result);
   };
   return await Promise.race([work(),canceled]);
  }catch{held=true;abort.abort();throw Error('Mandatory persistence unavailable');}
  finally{if(timer)clearTimeout(timer);if(onAbort)signal.removeEventListener('abort',onAbort);busy=false;}
 }});
}

/** Logical operation permissions are checked before durable admission, then again
 * in the validated transition source. No caller-selected replacement target. */
export function createLocalLeaseAuthorityService(pin:WitnessServicePin,principals:readonly Readonly<{principalDigest:string;keyId:string;publicKeyPem:string;role:LeaseAuthorityRole|'observer'|'reconciler'}>[],lookup:(id:string)=>MandatoryLeaseIntent|undefined,store:Parameters<typeof createLocalCviWitnessService>[2],proofSources:Pick<Parameters<typeof createLocalCviWitnessService>[3],'database'|'fence'>,proofPins:Parameters<typeof createLocalCviWitnessService>[4],sign:Parameters<typeof createLocalCviWitnessService>[5],clock=Date.now){
 if(typeof lookup!=='function')throw Error('Lease authority configuration unavailable');
 const grants=principals.map(p=>Object.freeze({...p})),byId=new Map(grants.map(p=>[p.principalDigest,p]));
 if(byId.size!==grants.length||grants.some(p=>!['rotator','fencer','writer','signer','observer','reconciler'].includes(p.role)))throw Error('Lease authority configuration unavailable');
 const permitted=(principal:string,id:string)=>{const a=byId.get(principal),p=lookup(id);if(!a||!p||p.actor.principalDigest!==a.principalDigest||p.actor.role!==a.role||roles[p.kind]!==a.role)throw Error();return freeze(structuredClone(p));};
 const inner=createLocalCviWitnessService(pin,grants.map(p=>({...p,role:(p.role==='observer'||p.role==='reconciler'?p.role:'writer') as 'observer'|'writer'|'reconciler'})),store,{database:proofSources.database.bind(proofSources),fence:proofSources.fence.bind(proofSources),transition:async(a,id,current)=>{const p=permitted(a.principalDigest,id);if(historyCanonical(p.from)!==historyCanonical(current))throw Error();return {from:p.from,to:p.to};}},proofPins,sign,clock,8000);
 return Object.freeze({async handle(raw:unknown,signal:AbortSignal){try{
  if(!exact(raw,['request','signature'])||!raw.request||typeof raw.request!=='object'||typeof raw.signature!=='string'||!/^[a-f0-9]{128}$/.test(raw.signature))throw Error();const r=structuredClone(raw.request) as any,a=byId.get(r.principalDigest);
  if(!a||r.keyId!==a.keyId||!verify(null,Buffer.from(historyCanonical(r)),createPublicKey(a.publicKeyPem),Buffer.from(raw.signature,'hex')))throw Error();
  if(r.action==='claim-execution'){
   const p=permitted(a.principalDigest,r.operationId),at=clock();
   if(!exact(r,['version','authorityId','witnessId','storeId','policyDigest','principalDigest','keyId','action','operationId','expectedRevision','challenge','issuedAt','expiresAt'])||r.version!==1||(['authorityId','witnessId','storeId','policyDigest'] as const).some(k=>r[k]!==pin[k])||!digest(r.challenge)||typeof r.expectedRevision!=='number'||!Number.isSafeInteger(r.expectedRevision)||r.expectedRevision<0||typeof r.issuedAt!=='number'||typeof r.expiresAt!=='number'||!Number.isSafeInteger(r.issuedAt)||!Number.isSafeInteger(r.expiresAt)||r.issuedAt>at||at>=r.expiresAt||r.expiresAt-r.issuedAt>8000)throw Error();
   const result=await store.apply({...a,role:'writer'},'claim-execution',{operationId:p.id,revision:r.expectedRevision,challenge:r.challenge,issuedAt:r.issuedAt,expiresAt:r.expiresAt},signal) as any;
   if(signal.aborted||clock()>=r.expiresAt||!exact(result,['status','operationId','revision','targetDigest','grantHash'])||result.status!=='execution-claimed'||result.operationId!==p.id||result.revision!==r.expectedRevision||result.targetDigest!==witnessServiceDigest(p.to)||!digest(result.grantHash))throw Error();
   const body={version:1,authorityId:pin.authorityId,witnessId:pin.witnessId,storeId:pin.storeId,policyDigest:pin.policyDigest,keyId:pin.keyId,principalDigest:a.principalDigest,challenge:r.challenge,requestHash:witnessServiceDigest(r),result};const signature=await sign(historyCanonical(body));
   if(signal.aborted||clock()>=r.expiresAt||typeof signature!=='string'||!verify(null,Buffer.from(historyCanonical(body)),createPublicKey(pin.publicKeyPem),Buffer.from(signature,'hex')))throw Error();return {body,signature};
  }
  if(r.action==='advance')permitted(a.principalDigest,r.operationId);else if(r.action==='reconcile'&&a.role!=='reconciler')throw Error();
  return await inner.handle({request:r,signature:raw.signature},signal);
 }catch{throw Error('Lease authority unavailable');}}});
}
