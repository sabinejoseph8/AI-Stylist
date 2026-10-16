import {validState,actorValid,domainHistoryHash,domainPolicyHash,projectDomainHistory} from './local-cvi-domain-history.ts';
import type {DomainHistory,DomainActor,DomainCommand} from './local-cvi-domain-history.ts';
export type TransactionProjection=Readonly<{storeId:string;policyDigest:string;epoch:number;head:string;at:number;expiresAt:number;token:string;snapshot:DomainHistory}>;
export type TransactionPermit=Omit<TransactionProjection,'snapshot'>;
export interface CviTransactionPort {
 project(signal:AbortSignal):Promise<unknown>;
 commit(input:Readonly<{projection:TransactionPermit;command:DomainCommand}>,signal:AbortSignal):Promise<unknown>;
}
const integer=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const digest=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
/** Disconnected contract only. Actual backend must bind an authenticated actor and
 * validate/commit inside one durable transaction. This wrapper cannot prove that. */
export function createLocalCviTransactionAdapter(actor:DomainActor,policyDigest:string,port:CviTransactionPort,minimumEpoch=0,clock=Date.now,deadlineMs=1000){
 if(!digest(policyDigest)||!integer(minimumEpoch)||typeof port?.project!=='function'||typeof port.commit!=='function'||!Number.isInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Local transaction configuration unavailable');
 const grant=Object.freeze({...actor});let held=false,busy=false,lastTime=-1,knownEpoch=minimumEpoch,knownHead:string|undefined;
 const permits=new WeakSet<object>();
 const hold=()=>{held=true;return null;};
 const now=()=>{const n=clock();if(!integer(n)||n<lastTime)throw Error();lastTime=n;return n;};
 async function bounded<T>(work:(signal:AbortSignal)=>Promise<T>):Promise<T>{
  const c=new AbortController();let t:ReturnType<typeof setTimeout>|undefined;
  try{return await Promise.race([Promise.resolve().then(()=>work(c.signal)),new Promise<never>((_,reject)=>{t=setTimeout(()=>{c.abort();reject(Error());},deadlineMs);})]);}
  finally{if(t)clearTimeout(t);}
 }
 return Object.freeze({isHeld:()=>held,
  async project():Promise<TransactionProjection|null>{
   if(held||busy)return null;busy=true;
   try{
    if(grant.role==='observer')return hold();
    now();const raw=await bounded(s=>port.project(s));const at=now();
    if(held||!exact(raw,['status','storeId','policyDigest','epoch','head','at','expiresAt','token','snapshot'])||raw.status!=='projected'||
     raw.storeId!==grant.storeId||raw.policyDigest!==policyDigest||!integer(raw.epoch)||raw.epoch<knownEpoch||!digest(raw.head)||
     !integer(raw.at)||!integer(raw.expiresAt)||raw.at>at||at>=raw.expiresAt||raw.expiresAt-raw.at>8000||!digest(raw.token))return hold();
    const state=structuredClone(raw.snapshot) as DomainHistory;
    if(!validState(state)||!actorValid(state,grant)||state.storeId!==grant.storeId||domainPolicyHash(state)!==policyDigest||domainHistoryHash(state)!==raw.head||state.epoch!==raw.epoch||
     raw.at<state.clock||raw.expiresAt>state.expiresAt||(raw.epoch===knownEpoch&&knownHead!==undefined&&raw.head!==knownHead))return hold();
    for(const x of state.credentials)Object.freeze(x);for(const x of state.requests)Object.freeze(x);Object.freeze(state.credentials);Object.freeze(state.requests);Object.freeze(state);
    const result=Object.freeze({storeId:grant.storeId,policyDigest,epoch:raw.epoch,head:raw.head,at:raw.at,expiresAt:raw.expiresAt,token:raw.token,snapshot:state});
    knownEpoch=result.epoch;knownHead=result.head;permits.add(result);return result;
   }catch{return hold();}finally{busy=false;}
  },
  async commit(projection:TransactionProjection,command:DomainCommand):Promise<Readonly<{epoch:number;head:string;at:number;snapshot:DomainHistory}>|null>{
   if(held||busy)return null;busy=true;
   try{
    if(!permits.has(projection))return hold();permits.delete(projection);
    const at=now();if(at<projection.at||at>=projection.expiresAt||!projectDomainHistory(projection.snapshot,grant,command,at))return hold();
    const {snapshot,...permit}=projection;const captured=Object.freeze({...command});
    const raw=await bounded(s=>port.commit(Object.freeze({projection:Object.freeze(permit),command:captured}),s));const received=now();
    if(held||!exact(raw,['status','storeId','policyDigest','previousEpoch','previousHead','epoch','head','at'])||raw.status!=='committed'||raw.storeId!==grant.storeId||raw.policyDigest!==policyDigest||
     raw.previousEpoch!==projection.epoch||raw.previousHead!==projection.head||raw.epoch!==projection.epoch+1||!integer(raw.at)||raw.at<projection.at||raw.at>received||raw.at>=projection.expiresAt||!digest(raw.head))return hold();
    const next=projectDomainHistory(snapshot,grant,captured,raw.at);
    if(!next||domainHistoryHash(next)!==raw.head||domainPolicyHash(next)!==policyDigest)return hold();
    knownEpoch=next.epoch;knownHead=raw.head;return Object.freeze({epoch:next.epoch,head:raw.head,at:raw.at,snapshot:next});
   }catch{return hold();}finally{busy=false;}
  },
 });
}
