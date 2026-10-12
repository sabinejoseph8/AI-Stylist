import type {createAccountSecurity} from './account-security.ts';
export interface AccountRevocationPort {
 /** Trusted adapter must revoke exactly this verified session and remove its refresh material. True means confirmed. */
 revoke(request:Request,ownerId:string,signal:AbortSignal):Promise<boolean>;
}
/** Disconnected POST coordinator. Results are server-only; cookies belong in headers, never JSON. */
export function createAccountSignOut(security:ReturnType<typeof createAccountSecurity>,origin:string,port:AccountRevocationPort,deadlineMs=8000){
 const base=new URL(origin);
 if(base.origin!==origin||base.protocol!=='https:'||typeof port?.revoke!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Sign-out unavailable');
 let pending=0;
 return Object.freeze({
  async submit(request:Request,signal:AbortSignal):Promise<Readonly<{status:'unavailable'|'remoteUnconfirmed'|'signedOut';setCookies:readonly string[]}>>{
   const unavailable=Object.freeze({status:'unavailable' as const,setCookies:Object.freeze([] as string[])});
   let url:URL;try{url=new URL(request.url);}catch{return unavailable;}
   if(request.method!=='POST'||url.origin!==origin||url.pathname!=='/api/account/sign-out'||url.search||url.hash||request.headers.get('origin')!==origin||signal.aborted)return unavailable;
   // Clearing this browser's access is independent of whether remote revocation succeeds.
   const cookies=Object.freeze([security.cookies.clear(),security.callbacks.clear()]);
   const unconfirmed=Object.freeze({status:'remoteUnconfirmed' as const,setCookies:cookies});
   if(pending>=4)return unconfirmed;
   pending++;
   const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
   let stop!:()=>void;
   const canceled=new Promise<typeof unconfirmed>(resolve=>{stop=()=>{controller.abort();resolve(unconfirmed);};signal.addEventListener('abort',stop,{once:true});timer=setTimeout(stop,deadlineMs);});
   const work=(async()=>{
    try{
     const identity=await security.authorize(request,controller.signal);
     if(!identity||controller.signal.aborted)return unconfirmed;
     const confirmed=await port.revoke(request,identity.ownerId,controller.signal);
     if(confirmed!==true||controller.signal.aborted)return unconfirmed;
     return Object.freeze({status:'signedOut' as const,setCookies:cookies});
    }catch{return unconfirmed;}finally{pending--;}
   })();
   try{return await Promise.race([work,canceled]);}finally{if(timer)clearTimeout(timer);signal.removeEventListener('abort',stop);}
  },
 });
}
