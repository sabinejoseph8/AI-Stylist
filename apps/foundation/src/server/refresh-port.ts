import type {createAccountSecurity} from './account-security.ts';
import type {createRefreshStore} from './refresh-store.ts';
import type {createRefreshRotation} from './refresh-rotation.ts';
import type {AccountRefreshPort} from './account-refresh.ts';
/** Explicit server composition only. No credentials, environment reads or route registration. */
export function createStoredRefreshPort(security:ReturnType<typeof createAccountSecurity>&{authorizeRefresh?:ReturnType<typeof createAccountSecurity>['authorize']},store:ReturnType<typeof createRefreshStore>,rotation:ReturnType<typeof createRefreshRotation>,origin:string):AccountRefreshPort{
 const base=new URL(origin);if(base.origin!==origin||base.protocol!=='https:')throw Error('Account refresh unavailable');
 return Object.freeze({async refresh(request:Request,expectedOwner:string,signal:AbortSignal){
  const url=new URL(request.url);
  if(signal.aborted||request.signal.aborted||request.method!=='POST'||url.origin!==origin||url.pathname!=='/api/account/refresh'||url.search||url.hash||request.headers.get('origin')!==origin)return {status:'notCreated' as const};
  const identity=await (security.authorizeRefresh??security.authorize)(request,signal);
  if(!identity||signal.aborted||identity.ownerId!==expectedOwner||typeof identity.sessionId!=='string')return {status:'notCreated' as const};
  const current=await store.inspect(identity.ownerId,identity.sessionId,signal);
  if(current.status==='unconfirmed')throw Error('Account refresh unavailable');
  if(current.status!=='found'||current.state!=='ready'||current.scope.expiresAt<=Date.now()||signal.aborted)return {status:'notCreated' as const};
  if(!await identity.isCurrent(signal)||signal.aborted)return {status:'notCreated' as const};
  return rotation.stage(current.scope,signal);
 }});
}
