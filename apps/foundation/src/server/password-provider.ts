import type {PasswordAccountPort,PasswordAccountRequest} from './password-account.ts';
import type {PendingAccountSession} from './account-session.ts';
export interface PasswordProviderOperations {
 password(input:PasswordAccountRequest,signal:AbortSignal):Promise<unknown>;
 revoke(accessToken:string,scope:'local',signal:AbortSignal):Promise<boolean>;
}
export interface PasswordSessionStager {
 /** Owns durable adoption and cleanup; verifies identity before adoption. */
 stage(input:Readonly<{accessToken:string;refreshSecret:string}>,signal:AbortSignal):Promise<PendingAccountSession>;
}
/** Disconnected normalized bridge. Shared account owner bounds work and cleans late results. */
export function createPasswordProvider(operations:PasswordProviderOperations,stager:PasswordSessionStager):PasswordAccountPort{
 if(typeof operations?.password!=='function'||typeof operations?.revoke!=='function'||typeof stager?.stage!=='function')throw Error('Account provider unavailable');

 return Object.freeze({async password(input:PasswordAccountRequest,signal:AbortSignal){
  if(signal.aborted)throw Error('Account provider unavailable');
  let reply:unknown;try{reply=await operations.password(input,signal);}catch{throw Error('Account provider unavailable');}
  return stageProviderReply(reply,signal,stager,(jwt,s)=>operations.revoke(jwt,'local',s),input.method==='signUp');
 }});
}

/** Shared token normalization and cleanup ownership for initial account sessions. */
export async function stageProviderReply(reply:unknown,signal:AbortSignal,stager:PasswordSessionStager,revoke:(jwt:string,signal:AbortSignal)=>Promise<boolean>,confirmationAllowed=false){
 const token=(x:unknown,max:number):x is string=>typeof x==='string'&&x.length>0&&Buffer.byteLength(x,'utf8')<=max&&!/[\s\u0000-\u001f\u007f]/.test(x);
  if(!reply||typeof reply!=='object'||Array.isArray(reply))throw Error('Account provider unavailable');
  const x=reply as Record<string,unknown>;
  if(confirmationAllowed&&Object.keys(x).length===1&&x.status==='confirmationRequired')return Object.freeze({status:'confirmationRequired' as const});
  if(!token(x.access_token,3800))throw Error('Account provider unavailable');
  const accessToken=x.access_token;let cleanup:Promise<boolean>|undefined;
  const discard=(s:AbortSignal)=>cleanup??=Promise.resolve().then(()=>revoke(accessToken,s)).then(v=>v===true).catch(()=>false);
  const failed=()=>Object.freeze({accessToken,adopt:async()=>false,discard});
  if(!token(x.refresh_token,8192)||x.token_type!=='bearer')return failed();
  try{
   const result=await stager.stage(Object.freeze({accessToken,refreshSecret:x.refresh_token}),signal);
   if(!result||result.accessToken!==accessToken||typeof result.adopt!=='function'||typeof result.discard!=='function')throw Error();
   return result;
  }catch{
   // Staging may have partially persisted ownership. Revocation alone cannot prove local cleanup.
   return Object.freeze({accessToken,adopt:async()=>false,discard:async(s:AbortSignal)=>{await discard(s);return false;}});
  }
}
