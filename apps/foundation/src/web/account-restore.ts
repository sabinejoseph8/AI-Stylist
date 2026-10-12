import {createAccountStatusTransport} from './account-http.ts';
/** One explicit restoration attempt. No storage, background polling or retry of ambiguous refreshes. */
export function createAccountRestore(origin:string,send:typeof fetch){
 const call=createAccountStatusTransport(origin,send);
 return async(signal:AbortSignal):Promise<'signedIn'|'signedOut'>=>{
  const status=await call('/api/account/session',{},signal);
  if(status.http===200&&status.status==='signedIn')return 'signedIn';
  if(status.http!==401||status.status!=='signedOut')throw Error('Account unavailable');
  const refreshed=await call('/api/account/refresh',{},signal);
  if(refreshed.http!==200||refreshed.status!=='signedIn')throw Error('Account unavailable');
  const confirmed=await call('/api/account/session',{},signal);
  if(confirmed.http===200&&confirmed.status==='signedIn')return 'signedIn';
  if(confirmed.http===401&&confirmed.status==='signedOut')return 'signedOut';
  throw Error('Account unavailable');
 };
}
