import {createHash,createPublicKey,randomBytes,verify} from 'node:crypto';
import {historyCanonical} from './local-cvi-history-authority.ts';
import {createLocalCviTransactionAdapter} from './local-cvi-transaction.ts';
import type {CviTransactionPort,TransactionProjection,TransactionPermit} from './local-cvi-transaction.ts';
import type {DomainActor,DomainCommand} from './local-cvi-domain-history.ts';
export type HostedAckPin=Readonly<{authorityId:string;storeId:string;policyDigest:string;principalDigest:string;keyId:string;publicKeyPem:string}>;
export type HostedAckRequest=Readonly<{version:1;authorityId:string;storeId:string;policyDigest:string;principalDigest:string;action:'project'|'commit';challenge:string;issuedAt:number;expiresAt:number;input:unknown}>;
export interface HostedAckWire {exchange(request:HostedAckRequest,signal:AbortSignal):Promise<unknown>}
const digest=(x:unknown):x is string=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const exact=(x:unknown,keys:string[]):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')===[...keys].sort().join(',');
const integer=(x:unknown):x is number=>Number.isSafeInteger(x)&&Number(x)>=0;
const hash=(x:Record<string,unknown>)=>createHash('sha256').update(historyCanonical(x)).digest('hex');
export const hostedPrincipalDigest=(actor:DomainActor)=>hash(actor);
function freeze<T>(x:T):T{if(x&&typeof x==='object'){for(const v of Object.values(x))freeze(v);Object.freeze(x);}return x;}
function validPin(pin:Omit<HostedAckPin,'publicKeyPem'>){return /^fixture-authority-[a-z0-9-]{1,40}$/.test(pin.authorityId)&&/^[a-f0-9-]{36}$/.test(pin.storeId)&&digest(pin.policyDigest)&&digest(pin.principalDigest)&&/^fixture-key-[a-z0-9-]{1,40}$/.test(pin.keyId);}
/** Disabled proposal. No HTTP URL, credential, provider SDK or hosted configuration. */
export function createLocalCviSignedTransactionPort(pin:HostedAckPin,wire:HostedAckWire,clock=Date.now,deadlineMs=1000):CviTransactionPort&{isHeld():boolean}{
 const captured=Object.freeze({...pin}),key=createPublicKey(pin.publicKeyPem);if(!validPin(pin)||key.asymmetricKeyType!=='ed25519'||typeof wire?.exchange!=='function'||!Number.isInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Hosted proposal configuration unavailable');
 let held=false,busy=false,lastTime=-1,count=0;
 const now=()=>{const n=clock();if(!integer(n)||n<lastTime)throw Error();lastTime=n;return n;};
 async function call(action:'project'|'commit',input:unknown,external:AbortSignal){
  if(held||busy||external.aborted)throw Error('Hosted proposal unavailable');busy=true;const abort=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  try{
   const at=now();if(++count>128||!integer(at+deadlineMs))throw Error();
   const request=freeze({version:1 as const,authorityId:captured.authorityId,storeId:captured.storeId,policyDigest:captured.policyDigest,principalDigest:captured.principalDigest,
    action,challenge:randomBytes(32).toString('hex'),issuedAt:at,expiresAt:at+deadlineMs,input:structuredClone(input)});
   if(Buffer.byteLength(historyCanonical(request))>65536)throw Error();const requestHash=hash(request);
   const signal=AbortSignal.any([external,abort.signal]);
   const canceled=new Promise<never>((_,reject)=>signal.addEventListener('abort',()=>reject(Error()),{once:true}));
   const raw=await Promise.race([Promise.resolve().then(()=>wire.exchange(request,signal)),canceled,new Promise<never>((_,reject)=>{timer=setTimeout(()=>{abort.abort();reject(Error());},deadlineMs);})]);
   if(signal.aborted||held||now()>=request.expiresAt||!exact(raw,['body','signature'])||typeof raw.signature!=='string'||!/^[a-f0-9]{128}$/.test(raw.signature)||
    !exact(raw.body,['version','authorityId','storeId','policyDigest','principalDigest','keyId','action','challenge','requestHash','result']))throw Error();
   const b=raw.body;
   if(b.version!==1||b.authorityId!==captured.authorityId||b.storeId!==captured.storeId||b.policyDigest!==captured.policyDigest||b.principalDigest!==captured.principalDigest||b.keyId!==captured.keyId||
    b.action!==action||b.challenge!==request.challenge||b.requestHash!==requestHash||Buffer.byteLength(historyCanonical(b))>65536||!verify(null,Buffer.from(historyCanonical(b)),key,Buffer.from(raw.signature,'hex')))throw Error();
   return structuredClone(b.result);
  }catch{held=true;abort.abort();throw Error('Hosted proposal unavailable');}finally{if(timer)clearTimeout(timer);busy=false;}
 }
 return Object.freeze({isHeld:()=>held,project:(s:AbortSignal)=>call('project',null,s),commit:(r:Readonly<{projection:TransactionPermit;command:DomainCommand}>,s:AbortSignal)=>call('commit',r,s)});
}
/** Local signer-role model. Trusted actor/port setup is never an incoming role claim.
 * Only server-constructed results can be signed; successful commit precedes signing. */
export function createLocalCviAckGateway(pin:Omit<HostedAckPin,'publicKeyPem'>,actor:DomainActor,backend:CviTransactionPort,sign:(message:string)=>string,clock=Date.now,deadlineMs=1000):HostedAckWire{
 if(!validPin(pin)||pin.storeId!==actor.storeId||pin.principalDigest!==hostedPrincipalDigest(actor)||typeof sign!=='function')throw Error('Hosted proposal configuration unavailable');
 const captured=Object.freeze({...pin}),adapter=createLocalCviTransactionAdapter(actor,pin.policyDigest,backend,0,clock,deadlineMs);
 const seen=new Set<string>(),projections=new Map<string,TransactionProjection>();let busy=false,lastTime=-1;
 return Object.freeze({async exchange(request:HostedAckRequest,signal:AbortSignal){
  if(busy)throw Error('Hosted proposal unavailable');busy=true;
  try{
   request=freeze(structuredClone(request));
   const at=clock();
   if(!integer(at)||at<lastTime||signal.aborted||!exact(request,['version','authorityId','storeId','policyDigest','principalDigest','action','challenge','issuedAt','expiresAt','input'])||request.version!==1||
    request.authorityId!==captured.authorityId||request.storeId!==captured.storeId||request.policyDigest!==captured.policyDigest||request.principalDigest!==captured.principalDigest||
    !['project','commit'].includes(request.action)||!digest(request.challenge)||seen.has(request.challenge)||seen.size>=128||!integer(request.issuedAt)||!integer(request.expiresAt)||
    request.issuedAt>at||at>=request.expiresAt||request.expiresAt-request.issuedAt>8000||Buffer.byteLength(historyCanonical(request))>65536)throw Error();
   lastTime=at;seen.add(request.challenge);let result:unknown={status:'unavailable'};
   if(request.action==='project'){
    if(request.input!==null)throw Error();const p=await adapter.project();if(p){projections.set(p.token,p);result={status:'projected',...p};}
   }else{
    if(!exact(request.input,['projection','command'])||!exact(request.input.projection,['storeId','policyDigest','epoch','head','at','expiresAt','token']))throw Error();
    const input=request.input.projection,p=typeof input.token==='string'?projections.get(input.token):undefined;
    if(p){projections.delete(p.token);const {snapshot,...permit}=p;
     if(historyCanonical(input)!==historyCanonical(permit))throw Error();
     const committed=await adapter.commit(p,request.input.command as DomainCommand);
     if(committed)result={status:'committed',storeId:p.storeId,policyDigest:p.policyDigest,previousEpoch:p.epoch,previousHead:p.head,epoch:committed.epoch,head:committed.head,at:committed.at};
    }
   }
   const finishedAt=clock();if(signal.aborted||!integer(finishedAt)||finishedAt<lastTime||finishedAt>=request.expiresAt)throw Error();lastTime=finishedAt;
   const body={version:1,authorityId:captured.authorityId,storeId:captured.storeId,policyDigest:captured.policyDigest,principalDigest:captured.principalDigest,keyId:captured.keyId,
    action:request.action,challenge:request.challenge,requestHash:hash(request),result};
   return {body,signature:sign(historyCanonical(body))};
  }catch{throw Error('Hosted proposal unavailable');}finally{busy=false;}
 }});
}
