import {describe,it,expect,vi} from 'vitest';
import {createAccountComposition} from '../src/server/account-composition.ts';
import {createAccountCallbacks} from '../src/server/account-callback.ts';
import type {createAccountSecurity} from '../src/server/account-security.ts';
const origin='https://stylist.test';
function setup(){
 const security={callbacks:createAccountCallbacks(origin),cookies:{issue:vi.fn(),clear:()=>''},authorize:vi.fn()} as unknown as ReturnType<typeof createAccountSecurity>;
 const ports={password:{password:vi.fn(async()=>({status:'notCreated' as const}))},exchange:{exchange:vi.fn(async()=>({status:'notCreated' as const}))},refresh:{refresh:vi.fn(async()=>({status:'notCreated' as const}))},signOut:{revoke:vi.fn(async()=>false)},recovery:{exchange:vi.fn(async()=>({status:'notCreated' as const}))},recoveryRequest:{request:vi.fn(async()=>{})}};
 return {security,ports,app:createAccountComposition(origin,'https://example.supabase.co',security,ports)};
}
const signal=()=>new AbortController().signal;
function passwordRequest(){return new Request(origin+'/api/account/password',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({method:'signIn',email:'sample@example.test',password:'synthetic'})});}
describe('explicit dormant account composition',()=>{
 it('constructs all handlers without provider calls and closes admission idempotently',async()=>{
  const {app,ports}=setup();expect(app.routes().size).toBe(9);expect(ports.password.password).not.toHaveBeenCalled();
  const first=app.close();expect(app.close()).toBe(first);expect(await first).toBe(true);
  expect((await app.routes().get('/api/account/password')!.handle(passwordRequest(),signal())).status).toBe(503);
  expect(ports.password.password).not.toHaveBeenCalled();
 });
 it('shares password admission with OAuth and cancels pending work on shutdown',async()=>{
  const {app,ports,security}=setup();const releases:(()=>void)[]=[];
  ports.password.password.mockImplementation(()=>new Promise(resolve=>releases.push(()=>resolve({status:'notCreated'}))));
  const pending=Array.from({length:4},()=>app.routes().get('/api/account/password')!.handle(passwordRequest(),signal()));
  await vi.waitFor(()=>expect(ports.password.password).toHaveBeenCalledTimes(4));
  const flow=security.callbacks.begin('google');
  const callback=new Request(flow.callbackUrl+'&code=synthetic',{headers:{cookie:flow.cookie.split(';')[0]!}});
  const busy=await app.routes().get('/auth/callback/google')!.handle(callback,signal());
  expect(busy.headers.get('location')).toContain('busy');expect(ports.exchange.exchange).not.toHaveBeenCalled();
  await app.close();await Promise.all(pending);for(const release of releases)release();
 });
 it('revokes a delivered reset grant at shutdown and exposes uncertain cleanup',async()=>{
  const {app,ports,security}=setup();
  const discard=vi.fn(async()=>false),resetPassword=vi.fn(async()=>true);
  ports.recovery.exchange.mockImplementation((async()=>({ownerId:'11111111-1111-4111-8111-111111111111',expiresAt:Date.now()+60000,resetPassword,discard})) as never);
  const flow=security.callbacks.begin('recovery');
  const callback=new Request(flow.callbackUrl+'&code=synthetic',{headers:{cookie:flow.cookie.split(';')[0]!}});
  const response=await app.routes().get('/auth/callback/recovery')!.handle(callback,signal());
  expect(response.status).toBe(303);expect(response.headers.get('location')).toBe('/account/reset');
  const cookie=response.headers.getSetCookie().find(x=>x.startsWith('__Host-stylist_reset='))!;
  expect(cookie).toBeTruthy();expect(await app.close()).toBe(false);
  expect(discard).toHaveBeenCalledTimes(1);expect(app.cleanupHeld()).toBe(true);
  const reset=new Request(origin+'/api/account/reset',{method:'POST',headers:{origin,cookie:cookie.split(';')[0]!,'content-type':'application/json'},body:JSON.stringify({password:'synthetic',confirmation:'synthetic'})});
  expect((await app.routes().get('/api/account/reset')!.handle(reset,signal())).status).toBe(503);
  expect(resetPassword).not.toHaveBeenCalled();await response.body?.cancel();
 });
 it('shares password capacity with authenticated refresh',async()=>{
  const {app,ports,security}=setup();const releases:(()=>void)[]=[];
  ports.password.password.mockImplementation(()=>new Promise(resolve=>releases.push(()=>resolve({status:'notCreated'}))));
  vi.mocked(security.authorize).mockResolvedValue({ownerId:'11111111-1111-4111-8111-111111111111',sessionId:'22222222-2222-4222-8222-222222222222',isCurrent:async()=>true});
  const pending=Array.from({length:4},()=>app.routes().get('/api/account/password')!.handle(passwordRequest(),signal()));
  await vi.waitFor(()=>expect(ports.password.password).toHaveBeenCalledTimes(4));
  const request=new Request(origin+'/api/account/refresh',{method:'POST',headers:{origin,'content-type':'application/json'},body:'{}'});
  expect((await app.routes().get('/api/account/refresh')!.handle(request,signal())).status).toBe(429);
  expect(ports.refresh.refresh).not.toHaveBeenCalled();await app.close();await Promise.all(pending);for(const release of releases)release();
 });

 it('exposes expired recovery cleanup without another customer request',async()=>{
  const {app,ports,security}=setup();const discard=vi.fn(async()=>true);
  ports.recovery.exchange.mockImplementation((async()=>({ownerId:'11111111-1111-4111-8111-111111111111',expiresAt:Date.now()+60000,resetPassword:async()=>true,discard})) as never);
  const flow=security.callbacks.begin('recovery');
  const response=await app.routes().get('/auth/callback/recovery')!.handle(new Request(flow.callbackUrl+'&code=synthetic',{headers:{cookie:flow.cookie.split(';')[0]!}}),signal());
  expect(response.headers.get('location')).toBe('/account/reset');
  vi.useFakeTimers();
  try{vi.setSystemTime(Date.now()+60001);expect(await app.expireRecovery()).toBe(true);expect(discard).toHaveBeenCalledTimes(1);expect(await app.expireRecovery()).toBe(true);expect(discard).toHaveBeenCalledTimes(1);}
  finally{vi.useRealTimers();await app.close();}
 });

});
