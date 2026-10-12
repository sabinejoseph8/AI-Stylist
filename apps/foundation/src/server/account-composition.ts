import type {createAccountSecurity} from './account-security.ts';
import {createAccountSessions} from './account-session.ts';
import {createPasswordAccounts,type PasswordAccountPort} from './password-account.ts';
import {createAccountExchange,type AccountExchangePort} from './account-exchange.ts';
import {createAccountRefresh,type AccountRefreshPort} from './account-refresh.ts';
import {createAccountSignOut,type AccountRevocationPort} from './account-signout.ts';
import {createAccountRecovery,type RecoveryPort} from './account-recovery.ts';
import {createRecoveryBrowser} from './recovery-browser.ts';
import {createRecoveryRequest,type RecoveryRequestPort} from './recovery-request.ts';
import {createOAuthStart} from './oauth-start.ts';
import {createOAuthStartHttp} from './oauth-start-http.ts';
import {createOAuthCallbackHttp} from './oauth-callback-http.ts';
import {createRecoveryCallbackHttp} from './recovery-callback-http.ts';
import {createPasswordHttp} from './password-http.ts';
import {createRefreshHttp} from './refresh-http.ts';
import {createSignOutHttp} from './signout-http.ts';
import {createRecoveryHttp} from './recovery-http.ts';
import {createAccountRouteRegistry} from './account-routes.ts';
import {accountJsonResponse} from './account-json.ts';
import type {AccountNodeRoute} from './account-node.ts';
/** Explicit local preparation only. No environment lookup, listener or hosted activation.
 * Shutdown cancels admitted requests; unresolved cleanup remains visible rather than claiming remote termination. */
export function createAccountComposition(origin:string,projectUrl:string,security:ReturnType<typeof createAccountSecurity>,ports:Readonly<{
 password:PasswordAccountPort;exchange:AccountExchangePort;refresh:AccountRefreshPort;
 signOut:AccountRevocationPort;recovery:RecoveryPort;recoveryRequest:RecoveryRequestPort;
}>){
 const sessions=createAccountSessions(security,origin);
 const browser=createRecoveryBrowser(origin);
 const recovery=createAccountRecovery(security,ports.recovery);
 const exchange=createAccountExchange(security,origin,ports.exchange,8000,sessions);
 const oauth=createOAuthCallbackHttp(origin,exchange,security.callbacks);
 const reset=createRecoveryCallbackHttp(origin,recovery,browser,security.callbacks);
 const registry=createAccountRouteRegistry({
  password:createPasswordHttp(origin,createPasswordAccounts(security,origin,ports.password,8000,sessions)),
  oauth:createOAuthStartHttp(origin,createOAuthStart(projectUrl,security.callbacks)),
  refresh:createRefreshHttp(origin,createAccountRefresh(security,origin,ports.refresh,8000,sessions)),
  signOut:{handle:createSignOutHttp(origin,createAccountSignOut(security,origin,ports.signOut))},
  recover:{handle:createRecoveryRequest(origin,security,ports.recoveryRequest)},
  reset:{handle:createRecoveryHttp(origin,browser)},
  googleCallback:{handle:(request,signal)=>oauth.handle(request,'google',signal),discardResponse:oauth.discardResponse},
  appleCallback:{handle:(request,signal)=>oauth.handle(request,'apple',signal),discardResponse:oauth.discardResponse},
  recoveryCallback:reset,
 });
 let closed=false;let closure:Promise<boolean>|undefined;
 const active=new Set<AbortController>();
 const routes=new Map<string,AccountNodeRoute>();
 for(const [path,route] of registry.routes())routes.set(path,Object.freeze({
  discardResponse:route.discardResponse,
  async handle(request:Request,signal:AbortSignal){
   if(closed)return accountJsonResponse(503,'unavailable');
   const controller=new AbortController();const stop=()=>controller.abort();
   signal.addEventListener('abort',stop,{once:true});if(signal.aborted)stop();active.add(controller);
   try{return await route.handle(request,controller.signal);}
   finally{active.delete(controller);signal.removeEventListener('abort',stop);}
  },
 }));
 return Object.freeze({
  routes:():ReadonlyMap<string,AccountNodeRoute>=>new Map(routes),
  cleanupHeld:()=>sessions.cleanupHeld()||recovery.cleanupHeld()||browser.cleanupHeld(),
  /** Future host must schedule this maintenance explicitly; no timer starts here. */
  expireRecovery:()=>browser.expire(),
  /** Result confirms browser reset-grant cleanup only, never remote provider termination. */
  close(){if(closure)return closure;closed=true;for(const controller of active)controller.abort();closure=browser.close();return closure;},
 });
}
