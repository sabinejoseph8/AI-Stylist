/** Disabled signed finish-proof contract. Verification is not publication permission. */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {historyCanonical} from './local-cvi-history-authority.ts';
import {verifyLocalWitnessReply,witnessServiceDigest} from './local-cvi-witness-service.ts';
import {fullStateMetadata,fullStateProjection} from './local-cvi-full-state-reconciliation.ts';
import type {WitnessServicePin,WitnessMetadata} from './local-cvi-witness-service.ts';
import type {MandatoryLeaseIntent,AuthorityEvidence} from './local-cvi-mandatory-persistence.ts';
import type {StartupOwnerPin} from './local-cvi-startup-checkpoint.ts';
export type GateFinishPrepared=Readonly<{status:'transition-finish-prepared';operationId:string;scopeDigest:string;targetDigest:string;challenge:string;issuedAt:number;expiresAt:number}>;
export type GateTransitionMarker=Readonly<{version:1;operationId:string;intentDigest:string;storeId:string;bindingDigest:string;nativeStoreId:string;applicationExpiresAt:number;expiresAt:number;issuedAt:number;expectedNativeDigest:string;targetNativeDigest:string;replayStateDigest:string;initialJournalDigest:string}>;
export type GateFinishPin=Readonly<{authority:WitnessServicePin;database:Readonly<{keyId:string;publicKeyPem:string}>;readerPrincipal:string}>;
export type GateFinishBinding=Readonly<{marker:GateTransitionMarker;prepared:GateFinishPrepared;plan:MandatoryLeaseIntent;pin:GateFinishPin;writerPrincipal:string;owner:StartupOwnerPin;commit:Readonly<{operationId:string;transactionId:string;claimHash:string}>}>;
export type GateFinishContext=Omit<GateFinishBinding,'commit'>;
export type GateFinishProofPack=Readonly<{before:AuthorityEvidence;database:unknown;after:AuthorityEvidence}>;
const exact=(v:unknown,keys:string[]):v is Record<string,any>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const int=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const hex=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const uuid=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
const equal=(a:any,b:any)=>historyCanonical(a)===historyCanonical(b);
export function gateFinishJson(v:unknown,depth=0):boolean{if(depth>20)return false;if(v===null||typeof v==='string'||typeof v==='boolean')return true;if(typeof v==='number')return Number.isFinite(v)&&Math.abs(v)<=Number.MAX_SAFE_INTEGER;if(Array.isArray(v))return v.every(x=>gateFinishJson(x,depth+1));return !!v&&typeof v==='object'&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null)&&Object.values(v).every(x=>gateFinishJson(x,depth+1));}
const metadata=(v:unknown):v is WitnessMetadata=>exact(v,['storeId','policyDigest','epochFloor','headFloor','observedClock','historyDigest'])&&uuid(v.storeId)&&['policyDigest','headFloor','historyDigest'].every(k=>hex(v[k]))&&int(v.epochFloor)&&int(v.observedClock);
const publicIdentity=(pem:string)=>{const key=createPublicKey(pem);if(key.asymmetricKeyType!=='ed25519')throw Error();return key.export({type:'spki',format:'der'}).toString('hex');};
export function gateFinishScope(marker:GateTransitionMarker){const {storeId,bindingDigest,nativeStoreId,applicationExpiresAt,expiresAt}=marker;return {storeId,bindingDigest,nativeStoreId,applicationExpiresAt,expiresAt};}
/** Capture trusted server configuration. No pin/plan is selected from a request. */
export function captureGateFinishContext(raw:GateFinishContext):GateFinishContext{
 try{
  if(!gateFinishJson(raw)||Buffer.byteLength(historyCanonical(raw as any))>1048576||!exact(raw,['marker','prepared','plan','pin','writerPrincipal','owner']))throw Error();
  const b=structuredClone(raw),m=b.marker,n=b.prepared,p=b.plan,o=b.owner,pin=b.pin;
  if(!exact(m,['version','operationId','intentDigest','storeId','bindingDigest','nativeStoreId','applicationExpiresAt','expiresAt','issuedAt','expectedNativeDigest','targetNativeDigest','replayStateDigest','initialJournalDigest'])||m.version!==1||!uuid(m.storeId)||!uuid(m.nativeStoreId)||!['operationId','intentDigest','bindingDigest','expectedNativeDigest','targetNativeDigest','replayStateDigest','initialJournalDigest'].every(k=>hex((m as any)[k]))||!['applicationExpiresAt','expiresAt','issuedAt'].every(k=>int((m as any)[k]))||!(m.issuedAt<m.expiresAt&&m.expiresAt<=m.applicationExpiresAt&&m.expiresAt-m.issuedAt<=8000))throw Error();
  if(!exact(n,['status','operationId','scopeDigest','targetDigest','challenge','issuedAt','expiresAt'])||n.status!=='transition-finish-prepared'||n.operationId!==m.operationId||!hex(n.challenge)||n.scopeDigest!==witnessServiceDigest(gateFinishScope(m))||n.targetDigest!==m.targetNativeDigest||!int(n.issuedAt)||n.issuedAt<m.issuedAt||n.issuedAt>=n.expiresAt||n.expiresAt!==m.expiresAt)throw Error();
  if(!exact(pin,['authority','database','readerPrincipal'])||!exact(pin.authority,['authorityId','witnessId','storeId','policyDigest','keyId','publicKeyPem'])||!exact(pin.database,['keyId','publicKeyPem'])||!hex(pin.readerPrincipal)||!hex(b.writerPrincipal)||pin.authority.storeId!==m.nativeStoreId||!uuid(pin.authority.witnessId)||!hex(pin.authority.policyDigest)||!/^fixture-authority-[a-z0-9-]{1,40}$/.test(pin.authority.authorityId)||![pin.authority.keyId,pin.database.keyId].every(k=>/^fixture-key-[a-z0-9-]{1,40}$/.test(k))||pin.authority.keyId===pin.database.keyId||publicIdentity(pin.authority.publicKeyPem)===publicIdentity(pin.database.publicKeyPem))throw Error();
  if(!exact(p,['id','version','kind','args','actor','now','from','to'])||p.version!==1||!['activate','renew'].includes(p.kind)||p.id!==m.operationId||!exact(p.actor,['principalDigest','role'])||p.actor.role!=='rotator'||p.actor.principalDigest!==b.writerPrincipal||p.now!==m.issuedAt||!metadata(p.from)||!metadata(p.to)||p.from.storeId!==m.nativeStoreId||p.to.storeId!==m.nativeStoreId||p.from.policyDigest!==pin.authority.policyDigest||p.to.policyDigest!==pin.authority.policyDigest||m.intentDigest!==witnessServiceDigest(p as any)||m.expectedNativeDigest!==witnessServiceDigest(p.from)||m.targetNativeDigest!==witnessServiceDigest(p.to)||equal(p.from,p.to)||p.from.historyDigest===p.to.historyDigest||p.from.observedClock>p.to.observedClock||p.to.observedClock>p.now)throw Error();
  const {id,...body}=p;if(witnessServiceDigest(body)!==id)throw Error();
  if(!exact(o,['storeId','generation','ownerDigest','bootDigest','expiresAt','minimumRevision'])||o.storeId!==m.nativeStoreId||!int(o.generation)||o.generation<1||!hex(o.ownerDigest)||!hex(o.bootDigest)||!int(o.expiresAt)||o.expiresAt<=n.issuedAt||o.expiresAt>m.applicationExpiresAt||!int(o.minimumRevision)||o.minimumRevision<2||o.generation!==p.to.epochFloor)throw Error();
  const a=p.args;if(!int(a.ttl)||a.ttl<1||a.ttl>8000||!hex(a.token)||!int(p.now+a.ttl)||p.now+a.ttl>m.applicationExpiresAt||o.expiresAt>p.now+a.ttl)throw Error();
  if(p.kind==='activate'){
   if(!exact(a,['previous','owner','boot','ttl','token'])||!int(a.previous)||a.previous>=Number.MAX_SAFE_INTEGER||p.from.epochFloor!==a.previous||o.generation!==a.previous+1||a.owner!==o.ownerDigest||a.boot!==o.bootDigest)throw Error();
  }else{
   const l=a.lease;if(!exact(a,['lease','ttl','token'])||!exact(l,['storeId','policyDigest','generation','ownerDigest','bootDigest','token','issuedAt','expiresAt'])||l.storeId!==o.storeId||l.policyDigest!==pin.authority.policyDigest||l.generation!==o.generation||p.from.epochFloor!==o.generation||l.ownerDigest!==o.ownerDigest||l.bootDigest!==o.bootDigest||!hex(l.token)||l.token===a.token||!int(l.issuedAt)||!int(l.expiresAt)||l.issuedAt>p.now||l.expiresAt<=p.now||m.expiresAt>l.expiresAt||o.expiresAt<=l.expiresAt)throw Error();
  }
  return b;
 }catch{throw Error('Gate finish binding unavailable');}
}
/** Commit identity is supplied only after the original deferred admission. */
export function captureGateFinishBinding(raw:GateFinishBinding):GateFinishBinding{
 try{
  if(!gateFinishJson(raw)||Buffer.byteLength(historyCanonical(raw as any))>1048576||!exact(raw,['marker','prepared','plan','pin','writerPrincipal','owner','commit']))throw Error();
  const {commit,...context}=structuredClone(raw),b=captureGateFinishContext(context),c=commit;
  if(!exact(c,['operationId','transactionId','claimHash'])||c.operationId!==b.plan.id.slice(0,32)||typeof c.transactionId!=='string'||!/^[1-9][0-9]{0,19}$/.test(c.transactionId)||!hex(c.claimHash))throw Error();
  return {...b,commit:c};
 }catch{throw Error('Gate finish binding unavailable');}
}
/** Distinct challenge domains from the original prepared backend nonce. */
export function gateFinishChallenges(prepared:GateFinishPrepared){
 const part=(part:string)=>witnessServiceDigest({purpose:'local-cvi-gate-finish-challenge-v1',...prepared,part});
 return Object.freeze({before:part('authority-before'),database:part('database'),after:part('authority-after')});
}
export function gateFinishProofDeadline(binding:GateFinishBinding,pack:GateFinishProofPack){const db=pack.database as any;return Math.min(binding.prepared.expiresAt,binding.owner.expiresAt,pack.before.request.expiresAt,db.body.expiresAt,pack.after.request.expiresAt);}
/** Offline verification of the exact original final inspection. No extra read. */
export function verifyLocalGateFinishProof(rawBinding:GateFinishBinding,rawPack:GateFinishProofPack,now:number){
 try{
  const b=captureGateFinishBinding(rawBinding),{marker:m,prepared:n,plan:p,pin,owner:o,commit:c}=b;
  if(!int(now)||now<n.issuedAt||now>=n.expiresAt||now>=o.expiresAt||!gateFinishJson(rawPack)||Buffer.byteLength(historyCanonical(rawPack as any))>1048576||!exact(rawPack,['before','database','after']))throw Error();
  const pack=structuredClone(rawPack),ch=gateFinishChallenges(n);
  const authority=(e:AuthorityEvidence,nonce:string)=>{
   if(!exact(e,['request','reply'])||!exact(e.request,['version','authorityId','witnessId','storeId','policyDigest','principalDigest','keyId','action','operationId','expectedRevision','challenge','issuedAt','expiresAt']))throw Error();
   const r=e.request;
   if(r.version!==1||r.authorityId!==pin.authority.authorityId||r.witnessId!==pin.authority.witnessId||r.storeId!==m.nativeStoreId||r.policyDigest!==pin.authority.policyDigest||r.action!=='read'||r.principalDigest!==pin.readerPrincipal||r.challenge!==nonce||!hex(r.operationId)||!/^fixture-key-[a-z0-9-]{1,40}$/.test(r.keyId)||!int(r.expectedRevision)||!int(r.issuedAt)||!int(r.expiresAt)||r.issuedAt<n.issuedAt||r.issuedAt>now||r.expiresAt<=now||r.expiresAt-r.issuedAt>8000)throw Error();
   const v=verifyLocalWitnessReply(pin.authority,r,e.reply,now) as any;
   if(!exact(v,['status','revision','current','pending'])||v.status!=='read'||v.revision!==o.minimumRevision||v.pending!==null||!equal(v.current,p.to))throw Error();return v;
  };
  authority(pack.before,ch.before);
  const db=pack.database;if(!exact(db,['body','signature'])||!exact(db.body,['version','keyId','storeId','policyDigest','nonce','issuedAt','expiresAt','checkpoint'])||typeof db.signature!=='string'||!/^[a-f0-9]{128}$/.test(db.signature))throw Error();
  const d=db.body;
  if(d.version!==1||d.keyId!==pin.database.keyId||d.storeId!==m.nativeStoreId||d.policyDigest!==pin.authority.policyDigest||d.nonce!==ch.database||!int(d.issuedAt)||!int(d.expiresAt)||d.issuedAt<n.issuedAt||d.issuedAt<pack.before.request.issuedAt||d.issuedAt>now||d.expiresAt<=now||d.expiresAt-d.issuedAt>8000||!verify(null,Buffer.from(historyCanonical(d)),createPublicKey(pin.database.publicKeyPem),Buffer.from(db.signature,'hex')))throw Error();
  const cp=d.checkpoint;
  if(!exact(cp,['snapshot','projection','operationId','transactionId','claimHash','consumed','protected'])||cp.operationId!==c.operationId||cp.transactionId!==c.transactionId||cp.claimHash!==c.claimHash||cp.consumed!==true||cp.protected!==true||!equal(fullStateMetadata(cp.snapshot),p.to)||!equal(cp.projection,fullStateProjection(cp.snapshot)))throw Error();
  const g=cp.snapshot.gate[0],active=cp.snapshot.grants.filter((v:any)=>v[6]==='active'),grant=active[0];
  if(g[3]!=='active'||active.length!==1||g[2]!==o.generation||grant[0]!==o.generation||grant[1]!==o.ownerDigest||grant[2]!==o.bootDigest||grant[3]!==createHash('sha256').update(p.args.token as string).digest('hex')||grant[4]!==p.now||grant[5]!==o.expiresAt||now<grant[4]||now>=grant[5])throw Error();
  authority(pack.after,ch.after);if(pack.after.request.issuedAt<d.issuedAt||now>=gateFinishProofDeadline(b,pack))throw Error();
  return Object.freeze({status:'transition-finish-verified' as const,operationId:p.id,targetDigest:m.targetNativeDigest,challenge:n.challenge});
 }catch{throw Error('Signed gate finish unavailable');}
}
