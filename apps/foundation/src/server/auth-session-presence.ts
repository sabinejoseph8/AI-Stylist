import type {AuthSessionRpc} from './auth-session.ts';
import type {RevocationAuthority} from './refresh-reconciliation.ts';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
/** Primary Auth database only. Missing rows are evidence; lookup failures are not. No route installs this. */
export function createAuthSessionPresence(rpc:AuthSessionRpc,deadlineMs=8000):RevocationAuthority{
 if(typeof rpc?.call!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Session presence unavailable');
 let pending=0;
 return Object.freeze({async confirm(ownerId:string,sessionId:string,external:AbortSignal){
  const unknown=Object.freeze({status:'unconfirmed'});
  if(typeof ownerId!=='string'||!uuid.test(ownerId)||typeof sessionId!=='string'||!uuid.test(sessionId)||external.aborted||pending>=4)return unknown;
  pending++;
  let canceled=false,timer:ReturnType<typeof setTimeout>|undefined,stop!:()=>void;
  const cancellation=new Promise<typeof unknown>(resolve=>{stop=()=>{canceled=true;resolve(unknown);};external.addEventListener('abort',stop,{once:true});timer=setTimeout(stop,deadlineMs);});
  const work=(async()=>{
   try{
    const value=await rpc.call('stylist_auth_session_presence',{p_owner:ownerId,p_session:sessionId});
    return !canceled&&!external.aborted&&value==='absent'?Object.freeze({status:'revoked',ownerId,sessionId}):unknown;
   }catch{return unknown;}finally{pending--;}
  })();
  try{return await Promise.race([work,cancellation]);}finally{if(timer)clearTimeout(timer);external.removeEventListener('abort',stop);}
 }});
}
