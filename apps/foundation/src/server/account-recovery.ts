import type {createAccountSecurity} from './account-security.ts';
/** A trusted server adapter must verify provider recovery purpose, identity and expiry before returning this capability.
 * An ordinary signed access token alone is insufficient. Refresh material stays in the adapter. */
export interface VerifiedRecovery {
 readonly ownerId:string;
 readonly expiresAt:number;
 resetPassword(password:string,signal:AbortSignal):Promise<boolean>;
 discard(signal:AbortSignal):Promise<boolean>;
}
export interface RecoveryPort {
 exchange(input:Readonly<{code:string;verifier:string}>,signal:AbortSignal):Promise<VerifiedRecovery|Readonly<{status:'notCreated'}>>;
}
export type RecoveryGrant=Readonly<{
 status:'resetRequired';
 /** Server-only, never serialize this result. The future browser binding must be separate from account access. */
 reset(password:unknown,signal:AbortSignal):Promise<Readonly<{status:'resetComplete'|'unconfirmed'}>>;
 discard():Promise<boolean>;
}>;
/** Disconnected process-local recovery owner. No normal account cookie is ever issued. */
export function createAccountRecovery(security:ReturnType<typeof createAccountSecurity>,port:RecoveryPort,deadlineMs=8000){
 if(typeof port?.exchange!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Recovery unavailable');
 let held=false,pending=0;
 const grants=new Map<VerifiedRecovery,number>(),cleanups=new WeakMap<VerifiedRecovery,Promise<boolean>>();
 async function discard(value:VerifiedRecovery){
  const previous=cleanups.get(value);if(previous)return previous;
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  const result=Promise.race([Promise.resolve().then(()=>value.discard(controller.signal)).then(v=>v===true),new Promise<boolean>(resolve=>{timer=setTimeout(()=>{controller.abort();resolve(false);},deadlineMs);})]).catch(()=>false).then(ok=>{grants.delete(value);if(!ok)held=true;return ok;}).finally(()=>{if(timer)clearTimeout(timer);});
  cleanups.set(value,result);return result;
 }
 async function bounded<T>(operation:(signal:AbortSignal)=>Promise<T>,external:AbortSignal,fallback:T):Promise<T>{
  pending++;const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;let stop!:()=>void;
  const canceled=new Promise<T>(resolve=>{stop=()=>{controller.abort();resolve(fallback);};external.addEventListener('abort',stop,{once:true});timer=setTimeout(stop,deadlineMs);});
  const work=Promise.resolve().then(()=>operation(controller.signal)).catch(()=>{held=true;return fallback;}).finally(()=>{pending--;});
  try{return await Promise.race([work,canceled]);}finally{if(timer)clearTimeout(timer);external.removeEventListener('abort',stop);}
 }
 return Object.freeze({
  cleanupHeld:()=>held,
  async complete(request:Request,external:AbortSignal):Promise<RecoveryGrant|Readonly<{status:'unavailable'|'busy'|'canceled'}>>{
   if(held||external.aborted||request.signal.aborted)return {status:'unavailable'};
   for(const [grant,expires] of grants)if(expires<=Date.now())void discard(grant);
   if(pending>=4||grants.size>=128)return {status:'busy'};
   const callback=security.callbacks.fromRequest(request,'recovery');if(!callback)return {status:'unavailable'};
   if(callback.status==='canceled')return {status:'canceled'};
   const controller=new AbortController();const stop=()=>controller.abort();external.addEventListener('abort',stop,{once:true});request.signal.addEventListener('abort',stop,{once:true});
   try{return await bounded(async signal=>{
    let value:VerifiedRecovery|undefined;
    try{
     if(signal.aborted)return {status:'unavailable' as const};
     const reply=await port.exchange({code:callback.code,verifier:callback.verifier},signal);
     if(reply&&'status' in reply&&reply.status==='notCreated'&&Object.keys(reply).length===1)return {status:'unavailable' as const};
     value=reply as VerifiedRecovery;
     if(!value||typeof value.discard!=='function'){held=true;throw Error();}
     if(signal.aborted||typeof value.resetPassword!=='function'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.ownerId)||!Number.isSafeInteger(value.expiresAt)||value.expiresAt<=Date.now())throw Error();
     const grant=value,expires=Math.min(grant.expiresAt,Date.now()+300000);let used=false;grants.set(grant,expires);
     return Object.freeze({status:'resetRequired' as const,discard:()=>{used=true;return discard(grant);},
      async reset(password:unknown,signal:AbortSignal){
       if(used||held||signal.aborted||typeof password!=='string'||password.length<1||password.length>4096)return {status:'unconfirmed' as const};
       if(Date.now()>=expires){used=true;await discard(grant);return {status:'unconfirmed' as const};}
       if(pending>=4)return {status:'unconfirmed' as const};
       used=true;
       return bounded(async scope=>{
        let changed=false;try{if(!scope.aborted)changed=await grant.resetPassword(password,scope)===true;}catch{held=true;}
        const cleaned=await discard(grant);
        return {status:changed&&cleaned&&!scope.aborted?'resetComplete' as const:'unconfirmed' as const};
       },signal,{status:'unconfirmed' as const});
      }});
    }catch{if(value&&typeof value.discard==='function')await discard(value);else held=true;return {status:'unavailable' as const};}
   },controller.signal,{status:'unavailable' as const});}finally{external.removeEventListener('abort',stop);request.signal.removeEventListener('abort',stop);}
  },
 });
}
