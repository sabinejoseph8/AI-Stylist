/** Disconnected signed bridge. Does not finalize the full database/domain target. */
import {createPublicKey,randomBytes,verify} from 'node:crypto';
import {historyCanonical} from './local-cvi-history-authority.ts';
import {verifyLocalWitnessReply,witnessServiceDigest} from './local-cvi-witness-service.ts';
import type {WitnessServicePin} from './local-cvi-witness-service.ts';
import type {AuthorityEvidence,MandatoryLeaseIntent,MonotonicLeaseAuthorityPort} from './local-cvi-mandatory-persistence.ts';
export type DatabaseBinding=Readonly<{intent:Record<string,unknown>;connection:Readonly<{principal:string;transactionId:string}>}>;
export type DatabaseIdentityPin=Readonly<{keyId:string;publicKeyPem:string}>;
export type DatabaseProofRequest=Readonly<{operationId:string;storeId:string;policyDigest:string;bindingDigest:string;nonce:string}>;
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const hex=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const integer=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const clone=<T>(v:T):T=>structuredClone(v);
const equal=(a:unknown,b:unknown)=>historyCanonical(a as Record<string,unknown>)===historyCanonical(b as Record<string,unknown>);
function jsonValue(v:unknown,depth=0):boolean{
 if(depth>20)return false;if(v===null||typeof v==='string'||typeof v==='boolean')return true;
 if(typeof v==='number')return Number.isFinite(v)&&Math.abs(v)<=Number.MAX_SAFE_INTEGER;
 if(Array.isArray(v))return v.every(x=>jsonValue(x,depth+1));
 return !!v&&typeof v==='object'&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null)&&Object.values(v).every(x=>jsonValue(x,depth+1));
}
const keyIdentity=(pem:string)=>{const key=createPublicKey(pem);if(key.asymmetricKeyType!=='ed25519')throw Error();return key.export({type:'spki',format:'der'}).toString('hex');};
export function createLocalSignedDatabaseBridge(
 pin:WitnessServicePin,identityPin:DatabaseIdentityPin,principal:string,intent:MandatoryLeaseIntent,
 approval:AuthorityEvidence,command:Record<string,unknown>,authority:Pick<MonotonicLeaseAuthorityPort,'claim'|'read'>,
 observe:(request:DatabaseProofRequest,signal:AbortSignal)=>Promise<unknown>,clock=Date.now,deadlineMs=8000){
 if(!principal||!/^[a-z][a-z0-9_]{0,62}$/.test(principal)||!exact(identityPin,['keyId','publicKeyPem'])||typeof identityPin.keyId!=='string'||identityPin.keyId===pin.keyId||keyIdentity(identityPin.publicKeyPem)===keyIdentity(pin.publicKeyPem)||typeof authority?.claim!=='function'||typeof authority.read!=='function'||typeof observe!=='function'||!integer(deadlineMs)||deadlineMs<1||deadlineMs>30000)throw Error('Signed database bridge unavailable');
 const scope=clone(pin),dbPin=clone(identityPin),plan=clone(intent),grant=clone(approval),expectedCommand=clone(command),claim=authority.claim.bind(authority),read=authority.read.bind(authority),proofSource=observe;
 const {id,...body}=plan;
 if(!jsonValue(plan)||!jsonValue(expectedCommand)||!hex(id)||witnessServiceDigest(body)!==id||!exact(expectedCommand,['operationId','kind','previous','target','recordHash','expiresAt'])||expectedCommand.kind!==plan.kind||typeof expectedCommand.operationId!=='string'||!/^[a-f0-9]{32}$/.test(expectedCommand.operationId)||!integer(expectedCommand.expiresAt)||Buffer.byteLength(historyCanonical({plan,command:expectedCommand}))>65536||plan.from.storeId!==scope.storeId||plan.to.storeId!==scope.storeId||plan.from.policyDigest!==scope.policyDigest||plan.to.policyDigest!==scope.policyDigest)throw Error('Signed database bridge unavailable');
 let held=false,busy=false,attempted=false,confirmed=false,last=-1,bound:DatabaseBinding|undefined,claimHash:string|undefined;
 const now=()=>{const n=clock();if(!integer(n)||n<last)throw Error();last=n;return n;};
 const advanced=()=>{const result=verifyLocalWitnessReply(scope,grant.request,grant.reply,now()) as any;
  if(grant.request.action!=='advance'||grant.request.operationId!==id||grant.request.principalDigest!==plan.actor.principalDigest||result.status!=='advanced'||result.operationId!==id||result.revision!==grant.request.expectedRevision+1||!equal(result.current,plan.to))throw Error();return result;};
 const binding=(raw:unknown):DatabaseBinding=>{
  if(!jsonValue(raw)||!exact(raw,['intent','connection'])||!exact(raw.connection,['principal','transactionId'])||raw.connection.principal!==principal||typeof raw.connection.transactionId!=='string'||!/^[1-9][0-9]{0,19}$/.test(raw.connection.transactionId)||!equal(raw.intent,expectedCommand))throw Error();
  return clone(raw) as DatabaseBinding;
 };
 const proof=async(b:DatabaseBinding,signal:AbortSignal)=>{
  const request:DatabaseProofRequest={operationId:id,storeId:scope.storeId,policyDigest:scope.policyDigest,bindingDigest:witnessServiceDigest(b),nonce:randomBytes(32).toString('hex')};
  const raw=await proofSource(clone(request),signal),at=now();
  if(signal.aborted||!exact(raw,['body','signature'])||!exact(raw.body,['version','keyId','operationId','storeId','policyDigest','bindingDigest','nonce','issuedAt','expiresAt'])||typeof raw.signature!=='string'||!/^[a-f0-9]{128}$/.test(raw.signature))throw Error();
  const body=raw.body;if(body.version!==1||body.keyId!==dbPin.keyId||!integer(body.issuedAt)||!integer(body.expiresAt)||body.issuedAt>at||at>=body.expiresAt||body.expiresAt-body.issuedAt>8000||Object.entries(request).some(([k,v])=>body[k]!==v)||!verify(null,Buffer.from(historyCanonical(body)),createPublicKey(dbPin.publicKeyPem),Buffer.from(raw.signature,'hex')))throw Error();
  return {challenge:witnessServiceDigest({databaseProof:body,operationId:id,grantHash:witnessServiceDigest(grant.request)}),expiresAt:body.expiresAt};
 };
 async function bounded<T>(external:AbortSignal,work:(s:AbortSignal)=>Promise<T>):Promise<T>{
  if(held||busy||external.aborted)throw Error('Signed database bridge unavailable');busy=true;
  const controller=new AbortController(),signal=AbortSignal.any([external,controller.signal]);let timer:ReturnType<typeof setTimeout>|undefined,onAbort:(()=>void)|undefined;
  try{now();const canceled=new Promise<never>((_,reject)=>{onAbort=()=>reject(Error());signal.addEventListener('abort',onAbort,{once:true});timer=setTimeout(()=>controller.abort(),deadlineMs);});return await Promise.race([work(signal),canceled]);}
  catch{held=true;controller.abort();throw Error('Signed database bridge unavailable');}
  finally{if(timer)clearTimeout(timer);if(onAbort)signal.removeEventListener('abort',onAbort);busy=false;}
 }
 return Object.freeze({isHeld:()=>held,
  admit:(raw:unknown,signal:AbortSignal)=>bounded(signal,async s=>{
   if(attempted)throw Error();attempted=true;const b=binding(raw),a=advanced();if(now()>=Number(expectedCommand.expiresAt))throw Error();
   const observed=await proof(b,s),e=clone(await claim(clone(plan),observed.challenge,s)),result=verifyLocalWitnessReply(scope,e.request,e.reply,now()) as any;
   if(s.aborted||now()>=observed.expiresAt||now()>=Number(expectedCommand.expiresAt)||e.request.action!=='claim-execution'||e.request.challenge!==observed.challenge||e.request.operationId!==id||e.request.principalDigest!==plan.actor.principalDigest||result.status!=='execution-claimed'||result.operationId!==id||result.revision!==a.revision||result.targetDigest!==witnessServiceDigest(plan.to)||result.grantHash!==witnessServiceDigest(grant.request))throw Error();
   bound=clone(b);claimHash=witnessServiceDigest(e.request);return {binding:clone(b),claimHash};
  }),
  confirm:(raw:unknown,hash:unknown,signal:AbortSignal)=>bounded(signal,async s=>{
   const b=binding(raw);if(!bound||!claimHash||hash!==claimHash||confirmed||!equal(bound,b))throw Error();confirmed=true;const a=advanced(),observed=await proof(b,s),e=clone(await read(observed.challenge,s)),result=verifyLocalWitnessReply(scope,e.request,e.reply,now()) as any;
   if(s.aborted||now()>=observed.expiresAt||now()>=Number(expectedCommand.expiresAt)||e.request.action!=='read'||e.request.challenge!==observed.challenge||result.status!=='read'||result.revision!==a.revision||result.pending!==id||!equal(result.current,plan.to))throw Error();return true;
  })
 });
}
