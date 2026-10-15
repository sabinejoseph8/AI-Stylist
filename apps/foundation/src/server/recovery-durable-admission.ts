import {randomBytes} from 'node:crypto';
import type {VerifiedRecovery,RecoveryPort} from './account-recovery.ts';
export type RecoveryAdmissionBinding=Readonly<{storeId:string;policyId:string}>;
export type RecoveryAdmissionReceipt=RecoveryAdmissionBinding&Readonly<{operationId:string}>;
export type RecoveryAdmissionContext=Readonly<{subjectKey:string;generation:number}>;
/** Trusted server port. Atomic decisions, durable before acknowledgment; never takes browser proof. */
export interface RecoveryAdmissionPort {
 reserve(input:RecoveryAdmissionReceipt&RecoveryAdmissionContext,signal:AbortSignal):Promise<unknown>;
 claimReset(input:RecoveryAdmissionReceipt,signal:AbortSignal):Promise<unknown>;
 settle(input:RecoveryAdmissionReceipt&Readonly<{outcome:'completed'|'rejected'|'held';cleanupVerified:boolean}>,signal:AbortSignal):Promise<unknown>;
}
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
/** Disconnected local candidate. Does not configure storage, routes, policy, identities or providers.
 * Returned capabilities must stay inside the existing reset-only owner and be explicitly discarded. */
export function createDurableRecoveryAdmission<Input>(binding:RecoveryAdmissionBinding,port:RecoveryAdmissionPort,provider:{exchange(input:Input,signal:AbortSignal):ReturnType<RecoveryPort['exchange']>},deadlineMs=8000){
 if(!binding||Object.keys(binding).sort().join(',')!=='policyId,storeId'||!uuid.test(binding.storeId)||!/^([a-f0-9]{64})$/.test(binding.policyId)||typeof port?.reserve!=='function'||typeof port?.claimReset!=='function'||typeof port?.settle!=='function'||typeof provider?.exchange!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Recovery unavailable');
 const selected=Object.freeze({...binding});let held=false,closed=false,pending=0;
 const controllers=new Set<AbortController>(),leases=new Set<VerifiedRecovery>();
 const absent=()=>Object.freeze({status:'notCreated' as const});
 function ack(value:unknown,receipt:RecoveryAdmissionReceipt,status:string){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!=='operationId,policyId,status,storeId')return false;
  const x=value as Record<string,unknown>;return x.status===status&&x.storeId===receipt.storeId&&x.policyId===receipt.policyId&&x.operationId===receipt.operationId;
 }
 async function independent<T>(work:(signal:AbortSignal)=>Promise<T>):Promise<T>{
  const scope=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  try{return await Promise.race([Promise.resolve().then(()=>work(scope.signal)),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{scope.abort();reject(Error('Recovery unavailable'));},deadlineMs);})]);}
  finally{if(timer)clearTimeout(timer);}
 }
 async function settle(receipt:RecoveryAdmissionReceipt,outcome:'completed'|'rejected'|'held',cleanupVerified:boolean){
  try{const result=await independent(s=>port.settle(Object.freeze({...receipt,outcome,cleanupVerified}),s));
   if(!ack(result,receipt,outcome)||outcome==='held'||!cleanupVerified){held=true;return false;}return true;
  }catch{held=true;return false;}
 }
 return Object.freeze({
  cleanupHeld:()=>held,
  async close(){closed=true;for(const c of controllers)c.abort();const results=await Promise.all([...leases].map(value=>value.discard(new AbortController().signal)));return results.every(Boolean)&&!held;},
  async exchange(context:RecoveryAdmissionContext,input:Input,external:AbortSignal):ReturnType<RecoveryPort['exchange']>{
   if(closed||held||external.aborted||pending>=4||leases.size>=128||!context||Object.keys(context).sort().join(',')!=='generation,subjectKey'||!/^([a-f0-9]{64})$/.test(context.subjectKey)||!Number.isSafeInteger(context.generation)||context.generation<1)return absent();
   const receipt=Object.freeze({...selected,operationId:'fixture-operation-'+randomBytes(16).toString('hex')}),request=Object.freeze({...receipt,subjectKey:context.subjectKey,generation:context.generation});
   const scope=new AbortController(),stop=()=>scope.abort();controllers.add(scope);pending++;
   external.addEventListener('abort',stop,{once:true});let timer:ReturnType<typeof setTimeout>|undefined;
   const canceled=new Promise<ReturnType<typeof absent>>(resolve=>{scope.signal.addEventListener('abort',()=>{held=true;resolve(absent());},{once:true});timer=setTimeout(stop,deadlineMs);});
   const work=(async()=>{
    let response:unknown;try{if(scope.signal.aborted)return absent();response=await port.reserve(request,scope.signal);}catch{held=true;return absent();}
    if(ack(response,receipt,'denied'))return absent();
    if(!ack(response,receipt,'reserved')){held=true;return absent();}
    if(scope.signal.aborted||closed){await settle(receipt,'held',false);return absent();}
    let raw:Awaited<ReturnType<RecoveryPort['exchange']>>;
    try{raw=await provider.exchange(input,scope.signal);}catch{await settle(receipt,'held',false);return absent();}
    if(raw&&'status' in raw&&raw.status==='notCreated'&&Object.keys(raw).length===1){await settle(receipt,scope.signal.aborted?'held':'rejected',!scope.signal.aborted);return absent();}
    const value=raw as VerifiedRecovery;
    if(!value||typeof value.discard!=='function'){await settle(receipt,'held',false);return absent();}
    let used=false,disposed=false,outcome:'completed'|'rejected'|'held'='rejected',cleanup:Promise<boolean>|undefined;
    let resetScope:AbortController|undefined;
    const wrapped:VerifiedRecovery=Object.freeze({ownerId:value.ownerId,expiresAt:value.expiresAt,
     async resetPassword(password:string,s:AbortSignal){
      if(used||disposed||closed||held||s.aborted||Date.now()>=value.expiresAt||typeof password!=='string'||password.length<1||password.length>4096)return false;
      used=true;resetScope=new AbortController();const relay=()=>resetScope!.abort();s.addEventListener('abort',relay,{once:true});
      try{
       const claimed=await independent(check=>port.claimReset(receipt,AbortSignal.any([check,resetScope!.signal])));
       if(!ack(claimed,receipt,'resetting')){outcome='held';held=true;return false;}
       if(resetScope.signal.aborted||disposed||closed||held||Date.now()>=value.expiresAt)return false;
       // Uncertain/canceled/failed changes conservatively retain a durable hold.
       outcome='held';
       const changed=await independent(check=>value.resetPassword(password,AbortSignal.any([check,resetScope!.signal])));
       if(changed!==true||resetScope.signal.aborted||disposed||closed||held){held=true;return false;}
       outcome='completed';return true;
      }catch{outcome='held';held=true;return false;}finally{s.removeEventListener('abort',relay);resetScope=undefined;}
     },
     discard(_ignored:AbortSignal){
      if(cleanup)return cleanup;disposed=true;
      if(resetScope){resetScope.abort();outcome='held';}
      cleanup=(async()=>{
       let cleaned=false;try{cleaned=await independent(s=>value.discard(s))===true;}catch{}
       const finalOutcome=cleaned?outcome:'held',stored=await settle(receipt,finalOutcome,cleaned);
       leases.delete(wrapped);return cleaned&&stored;
      })();return cleanup;
     },
    });
    leases.add(wrapped);
    if(scope.signal.aborted||closed||!uuid.test(value.ownerId)||!Number.isSafeInteger(value.expiresAt)||value.expiresAt<=Date.now()||typeof value.resetPassword!=='function'){
     if(scope.signal.aborted)outcome='held';await wrapped.discard(new AbortController().signal);return absent();
    }
    return wrapped;
   })().catch(()=>{held=true;return absent();}).finally(()=>{pending--;});
   try{return await Promise.race([work,canceled]);}
   finally{if(timer)clearTimeout(timer);external.removeEventListener('abort',stop);controllers.delete(scope);}
  },
 });
}
