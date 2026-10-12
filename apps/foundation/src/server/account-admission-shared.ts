import type {AccountNodeRoute} from './account-node.ts';
import {accountJsonResponse} from './account-json.ts';
export interface AccountAdmissionRpc {call(name:string,payload:Record<string,unknown>,signal?:AbortSignal):Promise<unknown>}
/** Fixed service-only operation. No client identifiers or request content leave this boundary. */
export function createSharedAdmissionPort(rpc:AccountAdmissionRpc){
 if(typeof rpc?.call!=='function')throw Error('Account admission unavailable');
 return Object.freeze({consume:(signal:AbortSignal)=>rpc.call('stylist_consume_account_admission',{},signal)});
}
/** Dormant shared guard. A timed-out operation retains local admission until it settles.
 * Sign-out remains available for cleanup; its own bounded listener/provider protections still apply. */
export function createSharedAccountAdmission(routes:ReadonlyMap<string,AccountNodeRoute>,port:Readonly<{consume(signal:AbortSignal):Promise<unknown>}>,deadlineMs=8000){
 if(typeof port?.consume!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Account admission unavailable');
 let pending=0;const guarded=new Map<string,AccountNodeRoute>();
 for(const [path,route] of routes){
  if(typeof route?.handle!=='function')throw Error('Account admission unavailable');
  if(path==='/api/account/sign-out'){guarded.set(path,route);continue;}
  guarded.set(path,Object.freeze({discardResponse:route.discardResponse,async handle(request:Request,external:AbortSignal){
   if(external.aborted||request.signal.aborted)return accountJsonResponse(409,'unconfirmed');
   if(pending>=4)return accountJsonResponse(503,'unavailable');
   pending++;const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;let stop!:()=>void;
   const canceled=new Promise<undefined>(resolve=>{stop=()=>{controller.abort();resolve(undefined);};external.addEventListener('abort',stop,{once:true});request.signal.addEventListener('abort',stop,{once:true});timer=setTimeout(stop,deadlineMs);});
   const work=Promise.resolve().then(()=>{if(controller.signal.aborted)return undefined;return port.consume(controller.signal);}).catch(()=>undefined).finally(()=>{pending--;});
   let value:unknown;
   try{value=await Promise.race([work,canceled]);}finally{if(timer)clearTimeout(timer);external.removeEventListener('abort',stop);request.signal.removeEventListener('abort',stop);}
   if(controller.signal.aborted||external.aborted||request.signal.aborted)return accountJsonResponse(503,'unavailable');
   if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!=='allowed,retryAfter')return accountJsonResponse(503,'unavailable');
   const result=value as {allowed:unknown;retryAfter:unknown};
   if(result.allowed===true&&result.retryAfter===0)return route.handle(request,external);
   if(result.allowed===false&&typeof result.retryAfter==='number'&&Number.isSafeInteger(result.retryAfter)&&result.retryAfter>=1&&result.retryAfter<=60){const response=accountJsonResponse(429,'busy');response.headers.set('retry-after',String(result.retryAfter));return response;}
   return accountJsonResponse(503,'unavailable');
  }}));
 }
 return Object.freeze({routes:():ReadonlyMap<string,AccountNodeRoute>=>new Map(guarded),pending:()=>pending});
}
