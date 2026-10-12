import type {RecoveryPort,VerifiedRecovery} from './account-recovery.ts';
import type {createIdentityVerifier} from './verified-identity.ts';
import type {RevocationAuthority} from './refresh-reconciliation.ts';
interface RecoveryOperations{
 exchange(input:Readonly<{code:string;verifier:string}>,signal:AbortSignal):Promise<unknown>;
 updatePassword(jwt:string,password:string,signal:AbortSignal):Promise<boolean>;
 revoke(jwt:string,scope:'local',signal:AbortSignal):Promise<boolean>;
}
/** Prepared reset-only adapter. Account recovery owner bounds work and cleans late capabilities. */
export function createRecoveryProvider(operations:RecoveryOperations,verifier:Pick<ReturnType<typeof createIdentityVerifier>,'verify'|'verifyRecovery'>,presence:RevocationAuthority):RecoveryPort{
 if(typeof operations?.exchange!=='function'||typeof operations?.updatePassword!=='function'||typeof operations?.revoke!=='function'||typeof verifier?.verifyRecovery!=='function'||typeof verifier?.verify!=='function'||typeof presence?.confirm!=='function')throw Error('Recovery provider unavailable');
 return Object.freeze({async exchange(input:Readonly<{code:string;verifier:string}>,signal:AbortSignal):Promise<VerifiedRecovery>{
  if(signal.aborted)throw Error('Recovery provider unavailable');
  let reply:unknown;try{reply=await operations.exchange(input,signal);}catch{throw Error('Recovery provider unavailable');}
  if(!reply||typeof reply!=='object'||Array.isArray(reply))throw Error('Recovery provider unavailable');
  const x=reply as Record<string,unknown>;
  if(typeof x.access_token!=='string'||x.access_token.length<1||Buffer.byteLength(x.access_token)>3800||/[\s\u0000-\u001f\u007f]/.test(x.access_token))throw Error('Recovery provider unavailable');
  const jwt=x.access_token;
  // Preserve cleanup even when verification fails or cancellation arrives after exchange.
  let identity:Awaited<ReturnType<typeof verifier.verify>>=null;
  let proof:Awaited<ReturnType<typeof verifier.verifyRecovery>>=null;
  try{identity=await verifier.verify(jwt,signal);}catch{}
  try{if(x.token_type==='bearer')proof=await verifier.verifyRecovery(jwt,signal);}catch{}
  if(!identity||proof?.ownerId!==identity.ownerId||proof?.sessionId!==identity.sessionId)proof=null;
  let used=false,disposed=false,cleanup:Promise<boolean>|undefined;
  return Object.freeze({ownerId:proof?.ownerId??'',expiresAt:proof?.expiresAt??0,
   async resetPassword(password:string,s:AbortSignal){
    if(used||disposed||s.aborted||!proof||typeof password!=='string'||password.length<1||password.length>4096)return false;
    used=true;
    try{if(!await proof.isCurrent(s)||s.aborted)return false;return await operations.updatePassword(jwt,password,s)===true&&!s.aborted;}catch{return false;}
   },
   discard(s:AbortSignal){
    disposed=true;
    return cleanup??=(async()=>{
     if(s.aborted)return false;
     // A late result may arrive after the request signal was canceled. Cleanup has its own
     // bounded signal and may verify identity solely to correlate primary absence.
     let cleanupIdentity=identity;
     if(!cleanupIdentity)try{cleanupIdentity=await verifier.verify(jwt,s);}catch{}
     try{await operations.revoke(jwt,'local',s);}catch{}
     if(!cleanupIdentity?.sessionId||s.aborted)return false;
     try{
      const value=await presence.confirm(cleanupIdentity.ownerId,cleanupIdentity.sessionId,s);
      if(!value||typeof value!=='object'||Array.isArray(value))return false;
      const result=value as Record<string,unknown>;
      return !s.aborted&&Object.keys(result).sort().join(',')==='ownerId,sessionId,status'&&result.status==='revoked'&&result.ownerId===cleanupIdentity.ownerId&&result.sessionId===cleanupIdentity.sessionId;
     }catch{return false;}
    })();
   },
  });
 }});
}
