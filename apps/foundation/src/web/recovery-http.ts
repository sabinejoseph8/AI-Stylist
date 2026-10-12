import {createAccountStatusTransport} from './account-http.ts';
import type {ResetProvider} from './recovery-flow.ts';
/** Explicit reset-only browser transport. Cookie authority stays with the server; never signs in. */
export function createRecoveryHttp(origin:string,send:typeof fetch,deadlineMs=15000):ResetProvider{
 const call=createAccountStatusTransport(origin,send,deadlineMs);let used=false;
 return Object.freeze({async reset(password:string,signal:AbortSignal){
  if(used||signal.aborted||typeof password!=='string'||password.length<1||password.length>4096)throw Error('Recovery unavailable');
  used=true;
  const result=await call('/api/account/reset',{password,confirmation:password},signal);
  if(result.http===200&&result.status==='resetComplete')return {status:'resetComplete' as const};
  if(result.http===409&&result.status==='unconfirmed')return {status:'unconfirmed' as const};
  throw Error('Recovery unavailable');
 }});
}
