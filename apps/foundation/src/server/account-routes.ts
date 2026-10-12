import type {AccountNodeRoute} from './account-node.ts';
/** Dormant registry: no environment lookup, listener or provider activation.
 * Owners must be composed explicitly; response cleanup stays attached to its handler. */
export function createAccountRouteRegistry(handlers:Readonly<{
 password:AccountNodeRoute;oauth:AccountNodeRoute;refresh:AccountNodeRoute;
 signOut:AccountNodeRoute;recover:AccountNodeRoute;reset:AccountNodeRoute;
 googleCallback:AccountNodeRoute;appleCallback:AccountNodeRoute;recoveryCallback:AccountNodeRoute;
}>){
 const names={password:'/api/account/password',oauth:'/api/account/oauth',refresh:'/api/account/refresh',
 signOut:'/api/account/sign-out',recover:'/api/account/recover',reset:'/api/account/reset',
 googleCallback:'/auth/callback/google',appleCallback:'/auth/callback/apple',recoveryCallback:'/auth/callback/recovery'} as const;
 if(Object.keys(handlers).sort().join(',')!==Object.keys(names).sort().join(','))throw Error('Account routes unavailable');
 const routes=new Map<string,AccountNodeRoute>();
 for(const name of Object.keys(names) as (keyof typeof names)[]){
  const handler=handlers[name];
  if(!handler||typeof handler.handle!=='function'||(handler.discardResponse!==undefined&&typeof handler.discardResponse!=='function'))throw Error('Account routes unavailable');
  routes.set(names[name],Object.freeze({handle:handler.handle,...(handler.discardResponse?{discardResponse:handler.discardResponse}:{})}));
 }
 return Object.freeze({routes:():ReadonlyMap<string,AccountNodeRoute>=>new Map(routes)});
}
