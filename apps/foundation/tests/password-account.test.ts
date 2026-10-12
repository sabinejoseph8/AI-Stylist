import {describe,it,expect,vi,afterEach} from 'vitest';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
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
 return {security,token,begin};
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
