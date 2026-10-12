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
 expiresAt:number;
 /** Server-only, never serialize this result. The future browser binding must be separate from account access. */
 reset(password:unknown,signal:AbortSignal):Promise<Readonly<{status:'resetComplete'|'unconfirmed'}>>;
 discard():Promise<boolean>;
}>;
/** Disconnected process-local recovery owner. No normal account cookie is ever issued. */
function createRecoveryOwner<Input>(exchange:(input:Input,signal:AbortSignal)=>ReturnType<RecoveryPort['exchange']>,deadlineMs=8000){
 if(typeof exchange!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Recovery unavailable');
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
  busy:()=>pending>=4||grants.size>=128,
  async complete(input:Input,external:AbortSignal):Promise<RecoveryGrant|Readonly<{status:'unavailable'|'busy'|'canceled'}>>{
   if(held||external.aborted)return {status:'unavailable'};
   for(const [grant,expires] of grants)if(expires<=Date.now())void discard(grant);
   if(pending>=4||grants.size>=128)return {status:'busy'};
   const controller=new AbortController();const stop=()=>controller.abort();external.addEventListener('abort',stop,{once:true});
   try{const result=await bounded<RecoveryGrant|Readonly<{status:'unavailable'}>>(async signal=>{
    let value:VerifiedRecovery|undefined;
    try{
     if(signal.aborted)return {status:'unavailable' as const};
     const reply=await exchange(input,signal);
     if(reply&&'status' in reply&&reply.status==='notCreated'&&Object.keys(reply).length===1)return {status:'unavailable' as const};
     value=reply as VerifiedRecovery;
     if(!value||typeof value.discard!=='function'){held=true;throw Error();}
     if(signal.aborted||typeof value.resetPassword!=='function'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.ownerId)||!Number.isSafeInteger(value.expiresAt)||value.expiresAt<=Date.now())throw Error();
     if(cleanups.has(value)||grants.has(value))throw Error();
     const grant=value,expires=Math.min(grant.expiresAt,Date.now()+300000);let used=false;let resetController:AbortController|undefined;grants.set(grant,expires);
     return Object.freeze({status:'resetRequired' as const,expiresAt:expires,discard:()=>{used=true;resetController?.abort();return discard(grant);},
      async reset(password:unknown,signal:AbortSignal){
       if(used||held||signal.aborted||typeof password!=='string'||password.length<1||password.length>4096)return {status:'unconfirmed' as const};
       if(Date.now()>=expires){used=true;await discard(grant);return {status:'unconfirmed' as const};}
       if(pending>=4)return {status:'unconfirmed' as const};
       used=true;resetController=new AbortController();const resetScope=resetController;const stopReset=()=>resetScope.abort();signal.addEventListener('abort',stopReset,{once:true});
       try{return await bounded(async scope=>{
        let changed=false;try{if(!scope.aborted)changed=await grant.resetPassword(password,scope)===true;}catch{held=true;}
        const cleaned=await discard(grant);
        return {status:changed&&cleaned&&!scope.aborted?'resetComplete' as const:'unconfirmed' as const};
       },resetScope.signal,{status:'unconfirmed' as const});}finally{signal.removeEventListener('abort',stopReset);}
      }});
    }catch{if(value&&typeof value.discard==='function')await discard(value);else held=true;return {status:'unavailable' as const};}
   },controller.signal,{status:'unavailable' as const});if(controller.signal.aborted&&result.status==='resetRequired'){await result.discard();return {status:'unavailable'};}return result;}finally{external.removeEventListener('abort',stop);}
  },
 });
}

/** Existing browser-bound PKCE flow uses the same bounded capability owner. */
export function createAccountRecovery(security:ReturnType<typeof createAccountSecurity>,port:RecoveryPort,deadlineMs=8000){
 if(typeof port?.exchange!=='function')throw Error('Recovery unavailable');
 const owner=createRecoveryOwner((input:Readonly<{code:string;verifier:string}>,signal)=>port.exchange(input,signal),deadlineMs);
 return Object.freeze({cleanupHeld:owner.cleanupHeld,async complete(request:Request,external:AbortSignal){
  if(owner.cleanupHeld()||external.aborted||request.signal.aborted)return {status:'unavailable' as const};
  if(owner.busy())return {status:'busy' as const};
  // Preserve an unconsumed callback when underlying work has reached admission capacity.
  const callback=security.callbacks.fromRequest(request,'recovery');
  if(!callback)return {status:'unavailable' as const};
  if(callback.status==='canceled')return {status:'canceled' as const};
  return owner.complete({code:callback.code,verifier:callback.verifier},AbortSignal.any([external,request.signal]));
 }});
}
/** Server-only. The receiving-browser confirmation handler must authenticate its own binding before calling this owner. */
export function createTokenRecoveryOwner(port:{verifyToken(tokenHash:string,signal:AbortSignal):ReturnType<RecoveryPort['exchange']>},deadlineMs=8000){
 if(typeof port?.verifyToken!=='function')throw Error('Recovery unavailable');
 const owner=createRecoveryOwner((tokenHash:string,signal)=>port.verifyToken(tokenHash,signal),deadlineMs);
 return Object.freeze({cleanupHeld:owner.cleanupHeld,async confirm(tokenHash:unknown,signal:AbortSignal){
  if(typeof tokenHash!=='string'||!/^[-_A-Za-z0-9]{1,256}$/.test(tokenHash))return {status:'unavailable' as const};
  return owner.complete(tokenHash,signal);
 }});
}
