import {describe,it,expect,vi} from 'vitest';
import {createAccountRouteRegistry} from '../src/server/account-routes.ts';
function fixture(){const handle=vi.fn(async()=>new Response(null));const discardResponse=vi.fn(async()=>true);const route={handle,discardResponse};return {handle,discardResponse,handlers:{password:route,oauth:route,refresh:route,signOut:route,recover:route,reset:route,googleCallback:route,appleCallback:route,recoveryCallback:route}};}
describe('dormant account route registry',()=>{
 it('collects exact routes without invoking handlers and preserves delivery cleanup',async()=>{
  const x=fixture(),registry=createAccountRouteRegistry(x.handlers),routes=registry.routes();
  expect(routes.size).toBe(9);expect(x.handle).not.toHaveBeenCalled();
  const route=routes.get('/auth/callback/google')!;
  const response=await route.handle(new Request('https://app.test/auth/callback/google'),new AbortController().signal);
  await route.discardResponse!(response);expect(x.discardResponse).toHaveBeenCalledWith(response);
 });
 it('isolates registry snapshots and rejects missing or extra handlers',()=>{
  const x=fixture(),registry=createAccountRouteRegistry(x.handlers);
  (registry.routes() as Map<string,unknown>).clear();expect(registry.routes().size).toBe(9);
  expect(()=>createAccountRouteRegistry({...x.handlers,unexpected:x.handlers.password} as typeof x.handlers)).toThrow();
  expect(()=>createAccountRouteRegistry({...x.handlers,password:undefined} as unknown as typeof x.handlers)).toThrow();
 });
});
