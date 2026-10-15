import {decodeJwt} from 'jose';
import type {RecoveryPort,VerifiedRecovery} from './account-recovery.ts';
import type {createIdentityVerifier} from './verified-identity.ts';
import type {RevocationAuthority} from './refresh-reconciliation.ts';
interface RecoveryOperations{
 exchange(input:Readonly<{code:string;verifier:string}>,signal:AbortSignal):Promise<unknown>;
 updatePassword(jwt:string,password:string,signal:AbortSignal):Promise<boolean>;
 revoke(jwt:string,scope:'local',signal:AbortSignal):Promise<boolean>;
}
/** Prepared reset-only adapter. Account recovery owner bounds work and cleans late capabilities. */
function createRecoveryProviderCore<Input>(operations:Omit<RecoveryOperations,'exchange'>&{exchange(input:Input,signal:AbortSignal):Promise<unknown>},verifier:Pick<ReturnType<typeof createIdentityVerifier>,'verify'|'verifyRecovery'>,presence:RevocationAuthority){
 if(typeof operations?.exchange!=='function'||typeof operations?.updatePassword!=='function'||typeof operations?.revoke!=='function'||typeof verifier?.verifyRecovery!=='function'||typeof verifier?.verify!=='function'||typeof presence?.confirm!=='function')throw Error('Recovery provider unavailable');
 return Object.freeze({async exchange(input:Input,signal:AbortSignal):Promise<VerifiedRecovery>{
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

/** Original PKCE entry point retained for existing integrations. */
export function createRecoveryProvider(operations:RecoveryOperations,verifier:Pick<ReturnType<typeof createIdentityVerifier>,'verify'|'verifyRecovery'>,presence:RevocationAuthority):RecoveryPort{
 return createRecoveryProviderCore(operations,verifier,presence);
}
/** Cross-device email proof enters exactly the same reset-only verification and cleanup lifecycle. */
export function createRecoveryTokenProvider(operations:Omit<RecoveryOperations,'exchange'>&{verifyRecoveryToken(tokenHash:string,signal:AbortSignal):Promise<unknown>},verifier:Pick<ReturnType<typeof createIdentityVerifier>,'verify'|'verifyRecovery'>,presence:RevocationAuthority){
 if(typeof operations?.verifyRecoveryToken!=='function'||typeof operations?.updatePassword!=='function'||typeof operations?.revoke!=='function')throw Error('Recovery provider unavailable');
 const core=createRecoveryProviderCore<string>({
  exchange:(tokenHash,signal)=>{
   if(typeof tokenHash!=='string'||!/^[-_A-Za-z0-9]{1,256}$/.test(tokenHash))return Promise.reject(Error('Recovery provider unavailable'));
   return operations.verifyRecoveryToken(tokenHash,signal);
  },
  updatePassword:(jwt,password,signal)=>operations.updatePassword(jwt,password,signal),
  revoke:(jwt,scope,signal)=>operations.revoke(jwt,scope,signal),
 },verifier,presence);
 return Object.freeze({verifyToken:core.exchange});
}

/** Disconnected local candidate. Opaque attempts are server-only, never browser JSON.
 * The existing signed recovery-purpose requirement remains mandatory, including for code replies. */
export function createRecoveryCodeProvider(operations:Omit<RecoveryOperations,'exchange'>&{verifyRecoveryCode(input:Readonly<{email:string;code:string}>,signal:AbortSignal):Promise<unknown>},verifier:Pick<ReturnType<typeof createIdentityVerifier>,'verify'|'verifyRecovery'>,presence:RevocationAuthority){
 if(typeof operations?.verifyRecoveryCode!=='function'||typeof operations?.updatePassword!=='function'||typeof operations?.revoke!=='function'||typeof verifier?.verify!=='function'||typeof verifier?.verifyRecovery!=='function'||typeof presence?.confirm!=='function')throw Error('Recovery provider unavailable');
 const attempts=new Map<object,{email:string;started:number;expires:number;claimed:boolean;canceled:boolean}>();
 const sessions=new Map<string,{expires:number;invalidated:boolean}>();let closed=false;
 const sweep=()=>{const now=Date.now();for(const [key,value] of attempts)if(value.expires<=now)attempts.delete(key);for(const [key,value] of sessions)if(value.expires<=now)sessions.delete(key);};
 const unavailable=()=>Object.freeze({status:'notCreated' as const});
 return Object.freeze({
  begin(email:unknown){
   sweep();if(closed||attempts.size>=128||typeof email!=='string'||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||/[\u0000-\u001f\u007f]/.test(email))throw Error('Recovery provider unavailable');
   const attempt=Object.freeze({purpose:'recovery-candidate' as const}),started=Date.now();
   attempts.set(attempt,{email,started,expires:started+300000,claimed:false,canceled:false});return attempt;
  },
  cancel(attempt:object){const entry=attempts.get(attempt);if(entry)entry.canceled=true;attempts.delete(attempt);},
  close(){closed=true;attempts.clear();},
  async verifyCode(input:unknown,signal:AbortSignal):ReturnType<RecoveryPort['exchange']>{
   sweep();if(closed||signal.aborted||!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).sort().join(',')!=='attempt,code,email')return unavailable();
   const x=input as Record<string,unknown>,attempt=x.attempt;
   if(!attempt||typeof attempt!=='object'||Array.isArray(attempt))return unavailable();
   const entry=attempts.get(attempt);if(!entry||entry.claimed)return unavailable();
   // Claim synchronously before any provider work; failed validation also consumes the attempt.
   entry.claimed=true;
   if(x.email!==entry.email||typeof x.code!=='string'||!/^\d{6}$/.test(x.code)||sessions.size>=128){attempts.delete(attempt);return unavailable();}
   const email=entry.email,code=x.code;
   const core=createRecoveryProviderCore<undefined>({
    exchange:(_unused,s)=>operations.verifyRecoveryCode(Object.freeze({email,code}),s),
    updatePassword:(jwt,password,s)=>operations.updatePassword(jwt,password,s),
    revoke:(jwt,scope,s)=>operations.revoke(jwt,scope,s),
   },{
    verify:(jwt,s)=>verifier.verify(jwt,s),
    async verifyRecovery(jwt,s){
     const proof=await verifier.verifyRecovery(jwt,s);
     if(!proof||closed||entry.canceled||s.aborted||Date.now()>=entry.expires)return null;
     // Decode only after the original verifier has checked the signature and recovery purpose.
     const claims=decodeJwt(jwt),now=Math.floor(Date.now()/1000);
     if(claims.email!==email||!Number.isSafeInteger(claims.iat)||(claims.iat as number)<Math.floor(entry.started/1000)||(claims.iat as number)>now||!Number.isSafeInteger(proof.expiresAt)||proof.expiresAt!<=Date.now())return null;
     const key=proof.ownerId+'/'+proof.sessionId;sweep();
     const previous=sessions.get(key);if(previous){previous.invalidated=true;return null;}if(sessions.size>=128)return null;
     const expiresAt=Math.min(entry.expires,proof.expiresAt!),receipt={expires:proof.expiresAt!,invalidated:false};sessions.set(key,receipt);
     return Object.freeze({...proof,expiresAt,async isCurrent(check:AbortSignal){
      return !closed&&!entry.canceled&&!receipt.invalidated&&!check.aborted&&Date.now()<expiresAt&&await proof.isCurrent(check)&&!closed&&!entry.canceled&&!receipt.invalidated&&!check.aborted&&Date.now()<expiresAt;
     }});
    },
   },presence);
   try{return await core.exchange(undefined,signal);}finally{attempts.delete(attempt);}
  },
 });
}
