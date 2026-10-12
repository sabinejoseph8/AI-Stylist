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
});
