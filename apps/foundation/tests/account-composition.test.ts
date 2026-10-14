import {describe,it,expect,vi} from 'vitest';
import {createSharedAccountAdmission} from '../src/server/account-admission-shared.ts';
import {createAccountAdmission} from '../src/server/account-admission.ts';
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

 it('limits factory requests before provider calls without consuming a rejected OAuth callback',async()=>{
  const {app,ports,security}=setup();let now=1000;
  const routes=createAccountAdmission(app.routes(),{limit:1,windowMs:1000},()=>now).routes();
  await routes.get('/api/account/password')!.handle(passwordRequest(),signal());
  expect(ports.password.password).toHaveBeenCalledTimes(1);
  const flow=security.callbacks.begin('google');
  const callback=new Request(flow.callbackUrl+'&code=synthetic',{headers:{cookie:flow.cookie.split(';')[0]!}});
  expect((await routes.get('/auth/callback/google')!.handle(callback,signal())).status).toBe(429);
  const recovery=new Request(origin+'/api/account/recover',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({email:'sample@example.test'})});
  expect((await routes.get('/api/account/recover')!.handle(recovery,signal())).status).toBe(429);
  expect(ports.exchange.exchange).not.toHaveBeenCalled();expect(ports.recoveryRequest.request).not.toHaveBeenCalled();
  now=2000;await routes.get('/auth/callback/google')!.handle(callback,signal());
  expect(ports.exchange.exchange).toHaveBeenCalledTimes(1);await app.close();
 });

 it('discards an undelivered recovery request transaction through the factory',async()=>{
  const {app,ports,security}=setup();const route=app.routes().get('/api/account/recover')!;
  const response=await route.handle(new Request(origin+'/api/account/recover',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({email:'sample@example.test'})}),signal());
  expect(response.status).toBe(202);const input=(ports.recoveryRequest.request.mock.calls as unknown as unknown[][])[0]![0] as unknown as {redirectTo:string};
  const cookie=response.headers.get('set-cookie')!.split(';')[0]!;
  await route.discardResponse!(response);await route.discardResponse!(response);
  expect(security.callbacks.fromRequest(new Request(input.redirectTo+'&code=synthetic',{headers:{cookie}}),'recovery')).toBeNull();
  expect(ports.recovery.exchange).not.toHaveBeenCalled();await app.close();
 });

});

describe('optional cross-device account composition',()=>{
 it('completes a reset on the receiving browser without the original PKCE cookie',async()=>{
  const f=setup(),discard=vi.fn(async()=>true),resetPassword=vi.fn(async()=>true),verifyToken=vi.fn(async()=>({ownerId:'11111111-1111-4111-8111-111111111111',expiresAt:Date.now()+60000,resetPassword,discard}));
  const app=createAccountComposition(origin,'https://example.supabase.co',f.security,{...f.ports,tokenRecovery:{verifyToken}}),routes=app.routes();expect(routes.size).toBe(11);
  const landing=await routes.get('/account/recovery')!.handle(new Request(origin+'/account/recovery?token_hash=proof'),signal()),html=await landing.text(),confirmation=html.match(/confirmation:'([A-Za-z0-9_-]{43})'/)![1]!;
  expect(verifyToken).not.toHaveBeenCalled();
  const confirmed=await routes.get('/api/account/recovery-confirm')!.handle(new Request(origin+'/api/account/recovery-confirm',{method:'POST',headers:{origin,'content-type':'application/json',cookie:landing.headers.getSetCookie()[0]!.split(';')[0]!},body:JSON.stringify({confirmation})}),signal());
  expect(await confirmed.json()).toEqual({status:'resetRequired'});const cookie=confirmed.headers.getSetCookie().find(x=>x.startsWith('__Host-stylist_reset='))!.split(';')[0]!;
  const result=await routes.get('/api/account/reset')!.handle(new Request(origin+'/api/account/reset',{method:'POST',headers:{origin,cookie,'content-type':'application/json'},body:JSON.stringify({password:'new-synthetic-password',confirmation:'new-synthetic-password'})}),signal());
  expect(await result.json()).toEqual({status:'resetComplete'});expect(resetPassword).toHaveBeenCalledTimes(1);expect(discard).toHaveBeenCalledTimes(1);expect(f.security.cookies.issue).not.toHaveBeenCalled();expect(await app.close()).toBe(true);await f.app.close();
 });
});

it('shares durable admission across the real dormant account factory and refuses provider work when denied',async()=>{
 const {app,ports}=setup();let allowed=false;
 const consume=vi.fn(async()=>({allowed,retryAfter:allowed?0:30}));
 const routes=createSharedAccountAdmission(app.routes(),{consume}).routes();
 expect((await routes.get('/api/account/password')!.handle(passwordRequest(),signal())).status).toBe(429);
 expect(ports.password.password).not.toHaveBeenCalled();
 allowed=true;await routes.get('/api/account/password')!.handle(passwordRequest(),signal());expect(ports.password.password).toHaveBeenCalledTimes(1);
 await app.close();await routes.get('/api/account/password')!.handle(passwordRequest(),signal());expect(ports.password.password).toHaveBeenCalledTimes(1);
});
it('keeps actual composed sign-out outside aggregate admission without bypassing its authorization',async()=>{
 const {app,ports}=setup();const consume=vi.fn(async()=>({allowed:false,retryAfter:60}));
 const routes=createSharedAccountAdmission(app.routes(),{consume}).routes();
 const request=new Request(origin+'/api/account/sign-out',{method:'POST',headers:{origin,'content-type':'application/json'},body:'{}'});
 await routes.get('/api/account/sign-out')!.handle(request,signal());expect(consume).not.toHaveBeenCalled();expect(ports.signOut.revoke).not.toHaveBeenCalled();await app.close();
});
