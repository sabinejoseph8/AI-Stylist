import type {createAccountSecurity} from './account-security.ts';
type Security=ReturnType<typeof createAccountSecurity>;
/** Trusted server adapter owns any refresh material and cleanup bookkeeping. Never a browser/provider JSON object. */
export interface PendingAccountSession {
 accessToken:string;
 /** Idempotently revoke the newly created session and remove any adapter-held refresh material. */
 discard(signal:AbortSignal):Promise<boolean>;
}
export type AccountSessionReply=PendingAccountSession|Readonly<{status:'notCreated'|'confirmationRequired'}>;
export type AccountSessionResult=
 |Readonly<{status:'unavailable'|'busy'|'confirmationRequired'}>
 |Readonly<{status:'ready';userId:string;returnPath:string;setCookies:readonly string[];
 /** Server-only: invoke if response delivery or session adoption fails. */
 discard():Promise<boolean>}>;
/** Shared disconnected session verification, admission and cleanup lifecycle for account methods. */
export function createAccountSessions(security:Security,appOrigin:string,deadlineMs=8000){
 const base=new URL(appOrigin);
 if(base.protocol!=='https:'||base.origin!==appOrigin||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Account session unavailable');
 let admitted=0,held=false;
 const claimed=new WeakSet<PendingAccountSession>();
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
  availability:()=>held?'unavailable' as const:admitted>=4?'busy' as const:null,
  async run(start:(signal:AbortSignal)=>Promise<AccountSessionReply>,external:AbortSignal,
   options:Readonly<{returnPath:string;registration?:boolean;clearFlow?:boolean}>,requestSignal?:AbortSignal):Promise<AccountSessionResult>{
   if(external.aborted||requestSignal?.aborted||held)return {status:'unavailable'};
   if(admitted>=4)return {status:'busy'};
   if(!['/','/wardrobe','/saved-looks','/profile'].includes(options.returnPath))return {status:'unavailable'};
   admitted++;
   const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
   let stop!:()=>void;
   const aborted=new Promise<AccountSessionResult>(resolve=>{
    stop=()=>{controller.abort();resolve({status:'unavailable'});};
    external.addEventListener('abort',stop,{once:true});requestSignal?.addEventListener('abort',stop,{once:true});timer=setTimeout(stop,deadlineMs);
   });
   const work=(async():Promise<AccountSessionResult>=>{
    let session:PendingAccountSession|undefined,started=false;
    try{
     if(controller.signal.aborted)throw Error();
     started=true;
     const value=await start(controller.signal);
     if(value&&typeof value==='object'&&'status' in value&&value.status==='notCreated'&&Object.keys(value).length===1)return {status:'unavailable'};
     if(value&&typeof value==='object'&&'status' in value&&value.status==='confirmationRequired'&&Object.keys(value).length===1)return {status:options.registration?'confirmationRequired':'unavailable'};
     session=value as PendingAccountSession;
     if(!session||typeof session!=='object'||typeof session.discard!=='function'){held=true;throw Error();}
     if(claimed.has(session))return {status:'unavailable'};
     claimed.add(session);
     if(controller.signal.aborted||cleanups.has(session)||typeof session.accessToken!=='string')throw Error();
     const cookie=await security.cookies.issue(session.accessToken,controller.signal);
     if(!cookie||controller.signal.aborted)throw Error();
     const identity=await security.authorize(new Request(appOrigin+'/api/account',{headers:{cookie:cookie.split(';')[0]!}}),controller.signal);
     if(!identity||controller.signal.aborted)throw Error();
     return Object.freeze({status:'ready' as const,userId:identity.ownerId,returnPath:options.returnPath,
      setCookies:Object.freeze(options.clearFlow?[cookie,security.callbacks.clear()]:[cookie]),discard:()=>discard(session!)});
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
   }catch{held=true;return {status:'unavailable'};}finally{if(timer)clearTimeout(timer);external.removeEventListener('abort',stop);requestSignal?.removeEventListener('abort',stop);}
  },
 });
}
