import {createAccountStatusTransport} from './account-http.ts';
import {createRecoveryHttp} from './recovery-http.ts';
import type {RecoveryConfiguration} from './recovery-panel.tsx';
/** Metadata enables presentation only. Actual reset still requires the server-owned cookie. */
export function createRecoveryConfiguration(origin:string,send:typeof fetch){
 const call=createAccountStatusTransport(origin,send);
 return async(signal:AbortSignal):Promise<RecoveryConfiguration>=>{
  const result=await call('/api/account/reset-ready',{},signal);
  if(signal.aborted||result.http!==200||result.status!=='resetReady'||result.expiresAt===undefined)throw Error('Recovery unavailable');
  return Object.freeze({provider:createRecoveryHttp(origin,send),expiresAt:result.expiresAt});
 };
}
