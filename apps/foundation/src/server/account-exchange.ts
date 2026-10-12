import type {AccountPurpose} from './account-callback.ts';
import type {createAccountSecurity} from './account-security.ts';
type Security=ReturnType<typeof createAccountSecurity>;
/** Trusted server adapter owns any refresh material and cleanup bookkeeping. Never a browser/provider JSON object. */
export interface PendingAccountSession {
 accessToken:string;
 /** Idempotently revoke the newly created session and remove any adapter-held refresh material. */
 discard(signal:AbortSignal):Promise<boolean>;
}
export interface AccountExchangePort {
 exchange(input:Readonly<{purpose:'google'|'apple';code:string;verifier:string}>,signal:AbortSignal):Promise<PendingAccountSession|Readonly<{status:'notCreated'}>>;
}
export type AccountExchangeResult=
 |Readonly<{status:'unavailable'|'canceled'|'busy'|'recoveryRequired'}>
 |Readonly<{status:'ready';userId:string;returnPath:string;setCookies:readonly string[];
 /** Server must invoke if response delivery/session adoption fails. Never serialize this object to a customer. */
 discard():Promise<boolean>}>;
/** Disconnected callback orchestration. Real recovery and provider transport are deliberately separate ports. */
export function createAccountExchange(security:Security,appOrigin:string,port:AccountExchangePort,deadlineMs=8000){
 const base=new URL(appOrigin);
 if(base.protocol!=='https:'||base.origin!==appOrigin||typeof port?.exchange!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Account exchange unavailable');
 let admitted=0,held=false;
 const cleanups=new WeakMap<PendingAccountSession,Promise<boolean>>();
 async function discard(session:PendingAccountSession){
  const previous=cleanups.get(session);if(previous)return previous;
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  const work=Promise.race([Promise.resolve().then(()=>session.discard(controller.signal)).then(value=>value===true),new Promise<boolean>(resolve=>{timer=setTimeout(()=>{controller.abort();resolve(false);},deadlineMs);})])
   .catch(()=>false).then(ok=>{if(!ok)held=true;return ok;}).finally(()=>{if(timer)clearTimeout(timer);});
  cleanups.set(session,work);return work;
 }
 return Object.freeze({
  cleanupHeld:()=>held,
  async complete(request:Request,purpose:AccountPurpose,external:AbortSignal):Promise<AccountExchangeResult>{
   if(external.aborted||request.signal.aborted||held)return {status:'unavailable'};
   if(admitted>=4)return {status:'busy'};
   if(purpose==='recovery')return {status:'recoveryRequired'};
   const callback=security.callbacks.fromRequest(request,purpose);
   if(!callback)return {status:'unavailable'};
   if(callback.status==='canceled')return {status:'canceled'};
   // A recovery code never grants the normal account cookie through this path.
   if(callback.purpose==='recovery')return {status:'recoveryRequired'};
   const exchangePurpose=callback.purpose;
   admitted++;
   const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
   let stop!:()=>void;
   const aborted=new Promise<AccountExchangeResult>(resolve=>{
    stop=()=>{controller.abort();resolve({status:'unavailable'});};
    external.addEventListener('abort',stop,{once:true});request.signal.addEventListener('abort',stop,{once:true});timer=setTimeout(stop,deadlineMs);
   });
   const work=(async():Promise<AccountExchangeResult>=>{
    let session:PendingAccountSession|undefined,started=false;
    try{
     if(controller.signal.aborted)throw Error();
     started=true;
     const value=await port.exchange({purpose:exchangePurpose,code:callback.code,verifier:callback.verifier},controller.signal);
     if(value&&typeof value==='object'&&'status' in value&&value.status==='notCreated'&&Object.keys(value).length===1)return {status:'unavailable'};
     session=value as PendingAccountSession;
     if(!session||typeof session!=='object'||typeof session.discard!=='function'){held=true;throw Error();}
     if(controller.signal.aborted||typeof session.accessToken!=='string')throw Error();
     const cookie=await security.cookies.issue(session.accessToken,controller.signal);
     if(!cookie||controller.signal.aborted)throw Error();
     const identity=await security.authorize(new Request(appOrigin+'/api/account',{headers:{cookie:cookie.split(';')[0]!}}),controller.signal);
     if(!identity||controller.signal.aborted)throw Error();
     return Object.freeze({status:'ready' as const,userId:identity.ownerId,returnPath:callback.returnPath,
      setCookies:Object.freeze([cookie,security.callbacks.clear()]),discard:()=>discard(session!)});
    }catch{
     if(session&&typeof session.discard==='function')await discard(session);
     else if(started)held=true;
     return {status:'unavailable'};
    }finally{admitted--;}
   })();
   try{
    const result=await Promise.race([work,aborted]);
    if(controller.signal.aborted&&result.status==='ready'){await result.discard();return {status:'unavailable'};}
    return result;
   }catch{held=true;return {status:'unavailable'};}finally{if(timer)clearTimeout(timer);external.removeEventListener('abort',stop);request.signal.removeEventListener('abort',stop);}
  },
 });
}
