import type {createAccountSecurity} from './account-security.ts';
import {createAccountSessions,type AccountSessionReply,type AccountSessionResult} from './account-session.ts';
export interface AccountRefreshPort {
 /** Resolve and rotate only this verified session's server-held refresh material. Never read credentials from request JSON. */
 refresh(request:Request,ownerId:string,signal:AbortSignal):Promise<AccountSessionReply>;
}
/** Explicit refresh preparation. A separately injected refresh identity may accept signed expired access; protected resource authorization stays strict. */
export function createAccountRefresh(security:ReturnType<typeof createAccountSecurity>&{authorizeRefresh?:ReturnType<typeof createAccountSecurity>['authorize']},origin:string,port:AccountRefreshPort,deadlineMs=8000,shared?:ReturnType<typeof createAccountSessions>){
 const base=new URL(origin);
 if(base.origin!==origin||base.protocol!=='https:'||typeof port?.refresh!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Account refresh unavailable');
 const sessions=shared??createAccountSessions(security,origin,deadlineMs);
 let pending=0;
 const rotating=new Set<string>();
 return Object.freeze({
  cleanupHeld:sessions.cleanupHeld,
  async submit(request:Request,external:AbortSignal):Promise<AccountSessionResult>{
   const unavailable={status:'unavailable' as const};
   let url:URL;try{url=new URL(request.url);}catch{return unavailable;}
   if(request.method!=='POST'||url.origin!==origin||url.pathname!=='/api/account/refresh'||url.search||url.hash||request.headers.get('origin')!==origin||external.aborted||request.signal.aborted)return unavailable;
   if(pending>=4)return {status:'busy'};
   pending++;
   const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
   let stop!:()=>void;
   const canceled=new Promise<AccountSessionResult>(resolve=>{stop=()=>{controller.abort();resolve(unavailable);};external.addEventListener('abort',stop,{once:true});request.signal.addEventListener('abort',stop,{once:true});timer=setTimeout(stop,deadlineMs);});
   const work=(async():Promise<AccountSessionResult>=>{
    try{
     const identity=await (security.authorizeRefresh??security.authorize)(request,controller.signal);
     if(!identity||controller.signal.aborted||typeof identity.sessionId!=='string'||!/^[a-f0-9-]{36}$/.test(identity.sessionId))return unavailable;
     const key=identity.ownerId+':'+identity.sessionId;
     if(rotating.has(key))return {status:'busy'};
     rotating.add(key);let started=false;
     let result:AccountSessionResult;
     try{result=await sessions.run(async scope=>{started=true;try{return await port.refresh(request,identity.ownerId,scope);}finally{rotating.delete(key);}},controller.signal,{returnPath:'/',expectedOwner:identity.ownerId,expectedSessionId:identity.sessionId});}
     finally{if(!started)rotating.delete(key);}
     if(controller.signal.aborted&&result.status==='ready'){await result.discard();return unavailable;}
     return result;
    }catch{return unavailable;}finally{pending--;}
   })();
   try{return await Promise.race([work,canceled]);}finally{if(timer)clearTimeout(timer);external.removeEventListener('abort',stop);request.signal.removeEventListener('abort',stop);}
  },
 });
}
