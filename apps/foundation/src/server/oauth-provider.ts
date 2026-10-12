import type {AccountExchangePort} from './account-exchange.ts';
import {stageProviderReply,type PasswordSessionStager} from './password-provider.ts';
interface OAuthOperations{
 exchange(input:Parameters<AccountExchangePort['exchange']>[0],signal:AbortSignal):Promise<unknown>;
 revoke(jwt:string,scope:'local',signal:AbortSignal):Promise<boolean>;
}
/** Prepared only: shared callback/session owner supplies admission and late-result cleanup. */
export function createOAuthProvider(operations:OAuthOperations,stager:PasswordSessionStager):AccountExchangePort{
 if(typeof operations?.exchange!=='function'||typeof operations?.revoke!=='function'||typeof stager?.stage!=='function')throw Error('Account provider unavailable');
 return Object.freeze({async exchange(input:Parameters<AccountExchangePort['exchange']>[0],signal:AbortSignal){
  if(signal.aborted)throw Error('Account provider unavailable');
  let reply:unknown;try{reply=await operations.exchange(input,signal);}catch{throw Error('Account provider unavailable');}
  const staged=await stageProviderReply(reply,signal,stager,(jwt,s)=>operations.revoke(jwt,'local',s));
  if('status' in staged)throw Error('Account provider unavailable');
  return staged;
 }});
}
