import type {AccountNodeRoute} from './account-node.ts';
import {accountJsonResponse} from './account-json.ts';
/** Explicit process-local aggregate guard. No IP/email tracking, proxy trust or persistent state.
 * A future host must add accepted durable multi-process/provider abuse controls. */
export function createAccountAdmission(routes:ReadonlyMap<string,AccountNodeRoute>,policy:Readonly<{limit:number;windowMs:number}>,clock:()=>number=Date.now){
 if(!Number.isSafeInteger(policy.limit)||policy.limit<1||policy.limit>10000||!Number.isSafeInteger(policy.windowMs)||policy.windowMs<1000||policy.windowMs>3600000||typeof clock!=='function')throw Error('Account admission unavailable');
 const limit=policy.limit,windowMs=policy.windowMs;
 let started=clock(),last=started,count=0;
 if(!Number.isSafeInteger(started)||started<0)throw Error('Account admission unavailable');
 const guarded=new Map<string,AccountNodeRoute>();
 for(const [path,route] of routes){
  if(typeof route?.handle!=='function')throw Error('Account admission unavailable');
  guarded.set(path,Object.freeze({discardResponse:route.discardResponse,
   async handle(request:Request,signal:AbortSignal){
    if(signal.aborted||request.signal.aborted)return accountJsonResponse(409,'unconfirmed');
    let now:number;try{now=clock();}catch{return accountJsonResponse(503,'unavailable');}
    // Clock regression never replenishes admission.
    if(!Number.isSafeInteger(now)||now<last)return accountJsonResponse(503,'unavailable');
    last=now;if(now-started>=windowMs){started=now;count=0;}
    if(count>=limit){const response=accountJsonResponse(429,'busy');response.headers.set('retry-after',String(Math.max(1,Math.ceil((started+windowMs-now)/1000))));return response;}
    count++;return route.handle(request,signal);
   },
  }));
 }
 return Object.freeze({routes:():ReadonlyMap<string,AccountNodeRoute>=>new Map(guarded)});
}
