/** Full logical state validation and signed reconciliation. No hosted driver. */
import {validState,domainHistoryHash,domainPolicyHash} from './local-cvi-domain-history.ts';
import {historyCanonical} from './local-cvi-history-authority.ts';
import {verifyLocalWitnessReply,witnessServiceDigest} from './local-cvi-witness-service.ts';
import type {WitnessServicePin} from './local-cvi-witness-service.ts';
import type {AuthorityEvidence,MandatoryLeaseIntent} from './local-cvi-mandatory-persistence.ts';
const exact=(v:any,keys:string[])=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const int=(v:unknown)=>Number.isSafeInteger(v)&&Number(v)>=0;
const hex=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const equal=(a:any,b:any)=>historyCanonical(a)===historyCanonical(b);
export function fullStateMetadata(s:any){
 if(!exact(s,['version','history','projections','receipts','gate','grants','releases'])||s.version!==1)throw Error('Full state unavailable');
 for(const [name,width] of Object.entries({history:4,projections:7,receipts:6,gate:5,grants:7,releases:5}))if(!Array.isArray(s[name])||s[name].length>128||s[name].some((r:any)=>!Array.isArray(r)||r.length!==width))throw Error('Full state unavailable');
 if(s.history.length!==1||s.gate.length!==1)throw Error('Full state unavailable');
 const [payload,head,policy,observed]=s.history[0],domain=JSON.parse(payload),[store,gatePolicy,generation,state,at]=s.gate[0];
 if(typeof payload!=='string'||!validState(domain)||domainHistoryHash(domain)!==head||domainPolicyHash(domain)!==policy||!int(observed)||observed<domain.clock||store!==domain.storeId||gatePolicy!==policy||!int(generation)||!int(at)||!['active','fenced'].includes(state))throw Error('Full state unavailable');
 const domainMetadata={storeId:store,policyDigest:policy,epochFloor:domain.epoch,headFloor:head,observedClock:observed,historyDigest:witnessServiceDigest({history:s.history,projections:s.projections,receipts:s.receipts})};
 const gate={storeId:store,policyDigest:policy,generation,state,observedClock:at};
 return {storeId:store,policyDigest:policy,epochFloor:generation,headFloor:witnessServiceDigest({storeId:store,policyDigest:policy,generation}),observedClock:Math.max(at,observed),historyDigest:witnessServiceDigest({domain:domainMetadata,gate,grants:s.grants,releases:s.releases})};
}
export function fullStateProjection(s:any){fullStateMetadata(s);const g=s.gate[0],grant=s.grants.find((r:any)=>r[0]===g[2]);return {generation:g[2],fenced:g[3]==='fenced',owner:grant?.[1]??'0'.repeat(64),boot:grant?.[2]??'0'.repeat(64),head:s.history[0][1]};}
export function assertCommittedFullState(observed:any,plan:MandatoryLeaseIntent,target:any,command:any,claimHash:string,transactionId:string){
 if(!exact(observed,['snapshot','projection','operationId','transactionId','claimHash','consumed','protected'])||observed.consumed!==true||observed.protected!==true||observed.operationId!==command.operationId||typeof observed.transactionId!=='string'||!/^[1-9][0-9]{0,19}$/.test(observed.transactionId)||observed.transactionId!==transactionId||observed.claimHash!==claimHash||!hex(claimHash)||!equal(observed.snapshot,target)||!equal(fullStateMetadata(observed.snapshot),plan.to)||!equal(observed.projection,fullStateProjection(target))||!equal(observed.projection,command.target))throw Error('Committed full state unavailable');
 return fullStateMetadata(observed.snapshot);
}
export function createLocalFullStateReconciler(pin:WitnessServicePin,plan:MandatoryLeaseIntent,target:any,command:any,claimHash:string,transactionId:string,
 reconcile:(signal:AbortSignal)=>Promise<AuthorityEvidence>,read:(nonce:string,signal:AbortSignal)=>Promise<AuthorityEvidence>,clock=Date.now){
 const scope=structuredClone(pin),p=structuredClone(plan),snapshot=structuredClone(target),cmd=structuredClone(command),recover=reconcile,observe=read;
 if(!equal(fullStateMetadata(snapshot),p.to)||!equal(fullStateProjection(snapshot),cmd.target)||!hex(claimHash)||!/^[1-9][0-9]{0,19}$/.test(transactionId)||typeof recover!=='function'||typeof observe!=='function')throw Error('Full reconciliation unavailable');
 let attempted=false,last=-1;const now=()=>{const at=clock();if(!int(at)||at<last||!int(cmd.expiresAt)||at>=cmd.expiresAt)throw Error();last=at;return at;};
 return Object.freeze({async finalize(signal:AbortSignal){
  if(attempted||signal.aborted)throw Error('Full reconciliation unavailable');attempted=true;
  try{now();const e=await recover(signal),done=verifyLocalWitnessReply(scope,e.request,e.reply,now()) as any;
   if(signal.aborted||e.request.action!=='reconcile'||e.request.operationId!==p.id||done.status!=='reconciled'||done.operationId!==p.id||done.revision!==e.request.expectedRevision+1||!equal(done.current,p.to))throw Error();
   // A fresh read binds the completed reconciliation to the original full target.
   const {randomBytes}=await import('node:crypto'),nonce=randomBytes(32).toString('hex'),r=await observe(nonce,signal),current=verifyLocalWitnessReply(scope,r.request,r.reply,now()) as any;
   if(signal.aborted||r.request.action!=='read'||r.request.challenge!==nonce||current.status!=='read'||current.revision!==done.revision||current.pending!==null||!equal(current.current,p.to))throw Error();
   return {status:'reconciled',operationId:cmd.operationId,targetDigest:witnessServiceDigest(p.to)};
  }catch{throw Error('Full reconciliation unavailable');}
 }});
}
