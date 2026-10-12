import type {createAccountSecurity} from './account-security.ts';
import {createAccountJsonBoundary,accountJsonResponse} from './account-json.ts';
export interface RecoveryRequestPort {
 /** Trusted server adapter. Must not disclose whether email belongs to an account. Never automatic retry. */
 request(input:Readonly<{email:string;redirectTo:string;challenge:string;challengeMethod:'S256'}>,signal:AbortSignal):Promise<void>;
}
/** Disconnected request factory. No email adapter, provider call or server registration is installed. */
export function createRecoveryRequest(origin:string,security:ReturnType<typeof createAccountSecurity>,port:RecoveryRequestPort,deadlineMs=10000){
 if(typeof port?.request!=='function')throw Error('Recovery unavailable');
 const cleanup=new WeakMap<Response,()=>void>();
 const discardResponse=async(response:Response)=>{cleanup.get(response)?.();return true;};
 const handle=createAccountJsonBoundary(origin,'/api/account/recover',async(input,_request,signal)=>{
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).join(',')!=='email'||typeof (input as {email?:unknown}).email!=='string')return accountJsonResponse(400,'unavailable');
  const email=(input as {email:string}).email.trim();if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return accountJsonResponse(400,'unavailable');
  const flow=security.callbacks.begin('recovery');
  const binding=flow.cookie.split(';')[0]!.slice('__Host-stylist_flow='.length);
  const abandon=()=>{security.callbacks.consume(flow.state,binding,'recovery');};
  signal.addEventListener('abort',abandon,{once:true});
  try{
   if(signal.aborted){abandon();return accountJsonResponse(409,'unconfirmed');}
   await port.request(Object.freeze({email,redirectTo:flow.callbackUrl,challenge:flow.challenge,challengeMethod:flow.challengeMethod}),signal);
  }catch{abandon();}
  finally{signal.removeEventListener('abort',abandon);}
  if(signal.aborted){abandon();return accountJsonResponse(409,'unconfirmed');}
  // Same visible acknowledgment and cookie shape for absent accounts and provider failure.
  const response=accountJsonResponse(202,'recoveryRequested',[flow.cookie]);cleanup.set(response,abandon);return response;
 },deadlineMs,discardResponse);
 return Object.assign(handle,{discardResponse});
}
