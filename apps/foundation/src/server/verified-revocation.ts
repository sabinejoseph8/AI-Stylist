import type {createIdentityVerifier} from './verified-identity.ts';
import type {RevocationAuthority} from './refresh-reconciliation.ts';
/** Capture trusted identity before logout. HTTP acceptance alone is not absence evidence. */
export function createVerifiedRevocation(verifier:Pick<ReturnType<typeof createIdentityVerifier>,'verify'>,presence:RevocationAuthority,revoke:(jwt:string,scope:'local',signal:AbortSignal)=>Promise<boolean>,deadlineMs=8000){
 if(typeof verifier?.verify!=='function'||typeof presence?.confirm!=='function'||typeof revoke!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Revocation unavailable');
 let pending=0;
 return async(jwt:string,external:AbortSignal):Promise<boolean>=>{
  if(external.aborted||pending>=4||typeof jwt!=='string'||jwt.length<1||jwt.length>16384)return false;
  pending++;
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;let stop!:()=>void;
  const canceled=new Promise<false>(resolve=>{stop=()=>{controller.abort();resolve(false);};external.addEventListener('abort',stop,{once:true});timer=setTimeout(stop,deadlineMs);});
  const work=(async()=>{
   try{
    const identity=await verifier.verify(jwt,controller.signal).catch(()=>null);
    if(controller.signal.aborted)return false;
    const accepted=await revoke(jwt,'local',controller.signal);
    if(!accepted||!identity||typeof identity.ownerId!=='string'||typeof identity.sessionId!=='string'||controller.signal.aborted)return false;
    const proof=await presence.confirm(identity.ownerId,identity.sessionId,controller.signal);
    if(controller.signal.aborted||!proof||typeof proof!=='object'||Array.isArray(proof))return false;
    const value=proof as Record<string,unknown>;
    return Object.keys(value).sort().join(',')==='ownerId,sessionId,status'&&value.status==='revoked'&&value.ownerId===identity.ownerId&&value.sessionId===identity.sessionId;
   }catch{return false;}finally{pending--;}
  })();
  try{return await Promise.race([work,canceled]);}finally{if(timer)clearTimeout(timer);external.removeEventListener('abort',stop);}
 };
}
