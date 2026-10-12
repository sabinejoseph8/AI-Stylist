import {describe,it,expect,vi,afterEach} from 'vitest';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {createRefreshHttp} from '../src/server/refresh-http.ts';
import {createAccountRefresh} from '../src/server/account-refresh.ts';
import {createAccountSecurity} from '../src/server/account-security.ts';
import {createAccountAccess} from '../src/server/account-access.ts';
import type {AccountSessionReply} from '../src/server/account-session.ts';
const origin='https://stylist.example',project='https://example.supabase.co';
const owner='11111111-1111-4111-8111-111111111111',sessionId='22222222-2222-4222-8222-222222222222';
const signal=()=>new AbortController().signal;
async function fixture(){
 const pair=await generateKeyPair('ES256');
 const token=await new SignJWT({session_id:sessionId,role:'authenticated',is_anonymous:false}).setProtectedHeader({alg:'ES256',kid:'test'}).setSubject(owner).setIssuer(project+'/auth/v1').setAudience('authenticated').setIssuedAt().setExpirationTime('5m').sign(pair.privateKey);
 const security=createAccountSecurity({appOrigin:origin,projectUrl:project,fetch:async()=>new Response(JSON.stringify({keys:[{...await exportJWK(pair.publicKey),kid:'test'}]})),rpc:{call:async()=>true}});
 const begin=(purpose:'google'|'apple'|'recovery'='google')=>{const flow=security.callbacks.begin(purpose,'/wardrobe');return {flow,request:new Request(flow.callbackUrl+'&code=fixture-code',{headers:{cookie:flow.cookie.split(';')[0]!}})};};
 return {security,token,begin,tokenFor:async(subject:string,session=sessionId)=>new SignJWT({session_id:session,role:'authenticated',is_anonymous:false}).setProtectedHeader({alg:'ES256',kid:'test'}).setSubject(subject).setIssuer(project+'/auth/v1').setAudience('authenticated').setIssuedAt().setExpirationTime('5m').sign(pair.privateKey)};
}

const input={method:'signIn',email:' sample@example.test ',password:'made-up'};
describe('disconnected password account orchestration',()=>{
 afterEach(()=>vi.useRealTimers());
 it('verifies a signed session and normalizes only email whitespace',async()=>{
  const f=await fixture(),discard=vi.fn(async()=>true),password=vi.fn(async(_input:unknown,_signal:AbortSignal)=>({accessToken:f.token,discard}));
  const service=createAccountAccess(f.security,origin,{password,exchange:vi.fn()});
  const result=await service.password.submit(input,signal());expect(result.status).toBe('ready');
  if(result.status!=='ready')throw Error();expect(result.userId).toBe(owner);expect(result.returnPath).toBe('/');expect(result.setCookies).toHaveLength(1);expect(result.setCookies[0]).toContain('HttpOnly; SameSite=Strict');
  expect(password.mock.calls[0]?.[0]).toEqual({...input,email:'sample@example.test'});
  expect(Object.isFrozen(password.mock.calls[0]?.[0])).toBe(true);
  await result.discard();await result.discard();expect(discard).toHaveBeenCalledTimes(1);
 });
 it('refuses reuse of a discarded adapter session',async()=>{
  const f=await fixture(),discard=vi.fn(async()=>true),lease={accessToken:f.token,discard};
  const service=createAccountAccess(f.security,origin,{password:async()=>lease,exchange:vi.fn()});
  const first=await service.password.submit(input,signal());expect(first.status).toBe('ready');
  if(first.status!=='ready')throw Error();await first.discard();
  expect(await service.password.submit(input,signal())).toEqual({status:'unavailable'});
  expect(discard).toHaveBeenCalledTimes(1);expect(service.cleanupHeld()).toBe(false);
 });
 it('claims a shared adapter session once across concurrent submissions',async()=>{
  const f=await fixture(),discard=vi.fn(async()=>true),lease={accessToken:f.token,discard};
  const service=createAccountAccess(f.security,origin,{password:async()=>lease,exchange:vi.fn()});
  const results=await Promise.all([service.password.submit(input,signal()),service.password.submit(input,signal())]);
  expect(results.map(r=>r.status).sort()).toEqual(['ready','unavailable']);
  expect(discard).not.toHaveBeenCalled();
  const ready=results.find(r=>r.status==='ready');if(!ready||ready.status!=='ready')throw Error();
  await ready.discard();expect(discard).toHaveBeenCalledTimes(1);
 });
 it('returns confirmation only for registration and never returns account cookies',async()=>{
  const f=await fixture(),password=vi.fn(async()=>({status:'confirmationRequired' as const}));const service=createAccountAccess(f.security,origin,{password,exchange:vi.fn()});
  expect(await service.password.submit({...input,method:'signUp'},signal())).toEqual({status:'confirmationRequired'});
  expect(await service.password.submit(input,signal())).toEqual({status:'unavailable'});expect(service.cleanupHeld()).toBe(false);
 });
 it('rejects invalid inputs without provider work',async()=>{
  const f=await fixture(),password=vi.fn(),service=createAccountAccess(f.security,origin,{password,exchange:vi.fn()});
  for(const value of [null,[],{...input,extra:true},{...input,email:'broken'},{...input,password:''},{...input,password:'a'.repeat(4097)},{...input,method:'recover'},{...input,method:{toString:()=> 'signIn'}}])expect(await service.password.submit(value,signal())).toEqual({status:'unavailable'});
  expect(password).not.toHaveBeenCalled();
 });
 it('shares uncertainty holds across callback and password methods',async()=>{
  for(const first of ['password','callback']){
   const f=await fixture(),password=vi.fn(async()=>{throw Error('private');}),exchange=vi.fn(async()=>{throw Error('private');});const service=createAccountAccess(f.security,origin,{password,exchange});
   if(first==='password')await service.password.submit(input,signal());else await service.callback.complete(f.begin().request,'google',signal());
   expect(service.cleanupHeld()).toBe(true);await service.password.submit(input,signal());await service.callback.complete(f.begin().request,'google',signal());
   expect(password.mock.calls.length+exchange.mock.calls.length).toBe(1);
  }
 });
 it('cleans up canceled late sessions and never restores access',async()=>{
  const f=await fixture();let resolve!:(v:AccountSessionReply)=>void,done!:()=>void;const cleaned=new Promise<void>(r=>done=r),discard=vi.fn(async()=>{done();return true;});
  const service=createAccountAccess(f.security,origin,{password:()=>new Promise(r=>resolve=r),exchange:vi.fn()});const controller=new AbortController();
  const work=service.password.submit(input,controller.signal);controller.abort();expect(await work).toEqual({status:'unavailable'});resolve({accessToken:f.token,discard});await cleaned;expect(discard).toHaveBeenCalledTimes(1);
 });
 it('shares bounded outstanding admission and preserves a busy callback transaction',async()=>{
  const f=await fixture();vi.useFakeTimers();const releases:Array<(v:AccountSessionReply)=>void>=[];
  const password=vi.fn(()=>new Promise<AccountSessionReply>(r=>releases.push(r))),exchange=vi.fn(async()=>({status:'notCreated' as const}));const service=createAccountAccess(f.security,origin,{password,exchange},20);
  const pending=Array.from({length:4},()=>service.password.submit(input,signal()));await vi.advanceTimersByTimeAsync(21);expect(await Promise.all(pending)).toEqual(Array.from({length:4},()=>({status:'unavailable'})));
  const a=f.begin();expect(await service.callback.complete(a.request,'google',signal())).toEqual({status:'busy'});expect(exchange).not.toHaveBeenCalled();
  releases.forEach(r=>r({status:'notCreated'}));await vi.advanceTimersByTimeAsync(0);expect(await service.callback.complete(a.request,'google',signal())).toEqual({status:'unavailable'});expect(exchange).toHaveBeenCalledTimes(1);
 });
});


describe('disconnected early account refresh',()=>{
 it('requires verified same-origin access and returns server-only cookie ownership',async()=>{
  const f=await fixture(),discard=vi.fn(async()=>true),refresh=vi.fn(async()=>({accessToken:f.token,discard}));
  const service=createAccountRefresh(f.security,origin,{refresh});
  const request=new Request(origin+'/api/account/refresh',{method:'POST',headers:{origin,cookie:'__Host-stylist_access='+f.token}});
  const result=await service.submit(request,signal());expect(result.status).toBe('ready');
  expect(refresh.mock.calls).toHaveLength(1);if(result.status!=='ready')throw Error();
  expect(result.userId).toBe(owner);await result.discard();expect(discard).toHaveBeenCalledTimes(1);
 });
 it('discards a rotated session belonging to a different signed owner',async()=>{
  const f=await fixture(),discard=vi.fn(async()=>true),other=await f.tokenFor('33333333-3333-4333-8333-333333333333');
  const service=createAccountRefresh(f.security,origin,{refresh:async()=>({accessToken:other,discard})});
  const result=await service.submit(new Request(origin+'/api/account/refresh',{method:'POST',headers:{origin,cookie:'__Host-stylist_access='+f.token}}),signal());
  expect(result).toEqual({status:'unavailable'});expect(discard).toHaveBeenCalledTimes(1);
 });
 it('cleans a late rotated session after cancellation without restoring access',async()=>{
  const f=await fixture(),discard=vi.fn(async()=>true);let release!:(value:AccountSessionReply)=>void,started!:()=>void;
  const began=new Promise<void>(resolve=>started=resolve);
  const service=createAccountRefresh(f.security,origin,{refresh:async()=>{started();return new Promise(resolve=>release=resolve);}});
  const controller=new AbortController();
  const work=service.submit(new Request(origin+'/api/account/refresh',{method:'POST',headers:{origin,cookie:'__Host-stylist_access='+f.token}}),controller.signal);
  await began;controller.abort();expect(await work).toEqual({status:'unavailable'});
  release({accessToken:f.token,discard});await vi.waitFor(()=>expect(discard).toHaveBeenCalledTimes(1));
 });
 it('refuses absent or foreign-origin access before rotation',async()=>{
  const f=await fixture(),refresh=vi.fn(),service=createAccountRefresh(f.security,origin,{refresh});
  for(const headers of [new Headers({origin}),new Headers({origin:'https://foreign.example',cookie:'__Host-stylist_access='+f.token})]){
   expect(await service.submit(new Request(origin+'/api/account/refresh',{method:'POST',headers}),signal())).toEqual({status:'unavailable'});
  }
  expect(refresh).not.toHaveBeenCalled();
 });
});


describe('local refresh rotation and HTTP composition',()=>{
 it('blocks overlapping rotation for the same verified session until the provider settles',async()=>{
  const f=await fixture();let release!:(value:AccountSessionReply)=>void,started!:()=>void;
  const began=new Promise<void>(resolve=>started=resolve),refresh=vi.fn(async()=>{started();return new Promise<AccountSessionReply>(resolve=>release=resolve);});
  const service=createAccountRefresh(f.security,origin,{refresh});
  const request=()=>new Request(origin+'/api/account/refresh',{method:'POST',headers:{origin,cookie:'__Host-stylist_access='+f.token}});
  const controller=new AbortController(),first=service.submit(request(),controller.signal);await began;
  expect(await service.submit(request(),signal())).toEqual({status:'busy'});
  controller.abort();expect(await first).toEqual({status:'unavailable'});
  expect(await service.submit(request(),signal())).toEqual({status:'busy'});expect(refresh).toHaveBeenCalledTimes(1);
  release({status:'notCreated'});
 });
 it('delivers only status JSON and header cookies, with explicit failed-delivery cleanup',async()=>{
  const f=await fixture(),discard=vi.fn(async()=>true),refresh=vi.fn(async()=>({accessToken:f.token,discard}));
  const http=createRefreshHttp(origin,createAccountRefresh(f.security,origin,{refresh}));
  const request=(body:unknown)=>new Request(origin+'/api/account/refresh',{method:'POST',headers:{origin,cookie:'__Host-stylist_access='+f.token,'content-type':'application/json'},body:JSON.stringify(body)});
  const bad=await http.handle(request({refreshToken:'not-accepted'}),signal());expect(bad.status).toBe(400);expect(refresh).not.toHaveBeenCalled();
  const response=await http.handle(request({}),signal());expect(response.status).toBe(200);expect(await response.json()).toEqual({status:'signedIn'});
  expect(response.headers.get('set-cookie')).toContain('HttpOnly');expect(response.headers.get('cache-control')).toBe('no-store');
  await http.discardResponse(response);await http.discardResponse(response);expect(discard).toHaveBeenCalledTimes(1);
 });
});

it('refuses a refresh token response for another session of the same customer',async()=>{
 const f=await fixture(),discard=vi.fn(async()=>true),other=await f.tokenFor(owner,'44444444-4444-4444-8444-444444444444');
 const service=createAccountRefresh(f.security,origin,{refresh:async()=>({accessToken:other,discard})});
 const result=await service.submit(new Request(origin+'/api/account/refresh',{method:'POST',headers:{origin,cookie:'__Host-stylist_access='+f.token}}),signal());
 expect(result).toEqual({status:'unavailable'});expect(discard).toHaveBeenCalledTimes(1);
});
