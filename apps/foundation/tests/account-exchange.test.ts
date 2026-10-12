import {describe,it,expect,vi,afterEach} from 'vitest';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {createAccountSecurity} from '../src/server/account-security.ts';
import {createAccountExchange,type PendingAccountSession} from '../src/server/account-exchange.ts';
import {createPasswordProviderHttp} from '../src/server/password-provider-http.ts';
import {createOAuthProvider} from '../src/server/oauth-provider.ts';
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
describe('prepared callback exchange orchestration',()=>{
 it('composes bound callback, PKCE transport, staging and verified cookie issuance',async()=>{
  const f=await fixture(),adopt=vi.fn(async()=>true),discard=vi.fn(async()=>true);
  const fetcher=vi.fn(async(_url:string,_init:RequestInit)=>Response.json({access_token:f.token,refresh_token:'synthetic-refresh',token_type:'bearer'}));
  const http=createPasswordProviderHttp(project,'synthetic-server-key-only',fetcher);
  const stage=vi.fn(async()=>({accessToken:f.token,adopt,discard}));
  const service=createAccountExchange(f.security,origin,createOAuthProvider(http,{stage}));
  const a=f.begin('apple'),result=await service.complete(a.request,'apple',signal());
  expect(result.status).toBe('ready');expect(adopt).toHaveBeenCalledOnce();
  expect(fetcher.mock.calls[0][0]).toBe(project+'/auth/v1/token?grant_type=pkce');
  expect(JSON.parse(fetcher.mock.calls[0][1].body as string)).toEqual({auth_code:'fixture-code',code_verifier:expect.stringMatching(/^[A-Za-z0-9_-]{43}$/)});
  expect(await service.complete(a.request,'apple',signal())).toEqual({status:'unavailable'});expect(fetcher).toHaveBeenCalledOnce();
  if(result.status!=='ready')throw Error('Missing verified result');
  expect(result.userId).toBe(owner);expect(result.setCookies[1]).toContain('Max-Age=0');expect(await result.discard()).toBe(true);
 });
 afterEach(()=>vi.useRealTimers());
 it('exchanges one bound code, verifies identity and prepares header-only cookies',async()=>{
  const f=await fixture(),discard=vi.fn(async()=>true),exchange=vi.fn(async(_input:unknown,_signal:AbortSignal)=>({accessToken:f.token,discard}));
  const service=createAccountExchange(f.security,origin,{exchange});const a=f.begin();
  const result=await service.complete(a.request,'google',signal());expect(result.status).toBe('ready');
  if(result.status!=='ready')throw Error();expect(result.userId).toBe(owner);expect(result.returnPath).toBe('/wardrobe');expect(result.setCookies[0]).toContain('HttpOnly; SameSite=Strict');expect(result.setCookies[1]).toContain('Max-Age=0');
  expect(exchange.mock.calls[0]?.[0]).toMatchObject({purpose:'google',code:'fixture-code',verifier:expect.stringMatching(/^[A-Za-z0-9_-]{43}$/)});
  expect(await service.complete(a.request,'google',signal())).toEqual({status:'unavailable'});expect(exchange).toHaveBeenCalledTimes(1);
  expect(await result.discard()).toBe(true);expect(await result.discard()).toBe(true);expect(discard).toHaveBeenCalledTimes(1);
 });
 it('discards rejected identity and returns no cookies',async()=>{
  const f=await fixture(),discard=vi.fn(async()=>true),exchange=vi.fn(async()=>({accessToken:'bad.token.value',discard}));
  const service=createAccountExchange(f.security,origin,{exchange});expect(await service.complete(f.begin().request,'google',signal())).toEqual({status:'unavailable'});expect(discard).toHaveBeenCalledTimes(1);expect(service.cleanupHeld()).toBe(false);
 });
 it('cleans up a session arriving after cancellation without restoring access',async()=>{
  const f=await fixture();let resolve!:(value:PendingAccountSession)=>void;let markDiscarded!:()=>void;const discarded=new Promise<void>(resolve=>{markDiscarded=resolve;});
  const discard=vi.fn(async()=>{markDiscarded();return true;}),exchange=vi.fn(()=>new Promise<PendingAccountSession>(r=>{resolve=r;}));
  const service=createAccountExchange(f.security,origin,{exchange}),controller=new AbortController();
  const work=service.complete(f.begin().request,'google',controller.signal);controller.abort();expect(await work).toEqual({status:'unavailable'});
  resolve({accessToken:f.token,discard});await discarded;expect(discard).toHaveBeenCalledTimes(1);expect(service.cleanupHeld()).toBe(false);
 });
 it('holds further exchange after failed cleanup or an ambiguous provider failure',async()=>{
  for(const kind of ['cleanup','transport'] as const){
   const f=await fixture(),exchange=vi.fn(async()=>{if(kind==='transport')throw Error('private-provider-error');return {accessToken:'bad.token.value',discard:async()=>false};});
   const service=createAccountExchange(f.security,origin,{exchange});expect(await service.complete(f.begin().request,'google',signal())).toEqual({status:'unavailable'});expect(service.cleanupHeld()).toBe(true);
   expect(await service.complete(f.begin().request,'google',signal())).toEqual({status:'unavailable'});expect(exchange).toHaveBeenCalledTimes(1);
  }
 });
 it('accepts explicit no-session proof without holding future work',async()=>{
  const f=await fixture(),exchange=vi.fn(async()=>({status:'notCreated' as const})),service=createAccountExchange(f.security,origin,{exchange});
  expect(await service.complete(f.begin().request,'google',signal())).toEqual({status:'unavailable'});expect(service.cleanupHeld()).toBe(false);
  await service.complete(f.begin().request,'google',signal());expect(exchange).toHaveBeenCalledTimes(2);
 });
 it('never exchanges canceled callbacks or recovery through normal account access',async()=>{
  const f=await fixture(),exchange=vi.fn(),service=createAccountExchange(f.security,origin,{exchange}),a=f.begin('apple');
  const canceled=new Request(a.flow.callbackUrl+'&error=access_denied',{headers:{cookie:a.flow.cookie.split(';')[0]!}});
  expect(await service.complete(canceled,'apple',signal())).toEqual({status:'canceled'});
  const recovery=f.begin('recovery');expect(await service.complete(recovery.request,'recovery',signal())).toEqual({status:'recoveryRequired'});
  expect(f.security.callbacks.fromRequest(recovery.request,'recovery')?.status).toBe('exchangeRequired');expect(exchange).not.toHaveBeenCalled();
 });
 it('bounds stalled exchange admission and releases it only when underlying work settles',async()=>{
  const f=await fixture();vi.useFakeTimers();const releases:Array<(value:{status:'notCreated'})=>void>=[];
  const exchange=vi.fn(()=>new Promise<{status:'notCreated'}>(resolve=>releases.push(resolve))),service=createAccountExchange(f.security,origin,{exchange},10);
  for(let i=0;i<4;i++){const work=service.complete(f.begin().request,'google',signal());await vi.advanceTimersByTimeAsync(11);expect(await work).toEqual({status:'unavailable'});}
  const fifth=f.begin();expect(await service.complete(fifth.request,'google',signal())).toEqual({status:'busy'});expect(exchange).toHaveBeenCalledTimes(4);
  releases[0]!({status:'notCreated'});await vi.advanceTimersByTimeAsync(0);const work=service.complete(fifth.request,'google',signal());expect(exchange).toHaveBeenCalledTimes(5);releases[4]!({status:'notCreated'});expect(await work).toEqual({status:'unavailable'});
  for(const release of releases.slice(1,4))release({status:'notCreated'});await vi.advanceTimersByTimeAsync(0);
 });
 it('bounds ignored cleanup cancellation and preserves its hold',async()=>{
  const f=await fixture(),exchange=async()=>({accessToken:'bad.token.value',discard:()=>new Promise<boolean>(()=>{})});vi.useFakeTimers();
  const service=createAccountExchange(f.security,origin,{exchange},10),work=service.complete(f.begin().request,'google',signal());
  await vi.advanceTimersByTimeAsync(21);expect(await work).toEqual({status:'unavailable'});expect(service.cleanupHeld()).toBe(true);
 });
 it('does not exchange an invalid callback or a request canceled before completion begins',async()=>{
  const f=await fixture(),exchange=vi.fn(),service=createAccountExchange(f.security,origin,{exchange}),a=f.begin();
  expect(await service.complete(new Request(origin+'/auth/callback/google?code=a'),'google',signal())).toEqual({status:'unavailable'});
  const controller=new AbortController();controller.abort();expect(await service.complete(a.request,'google',controller.signal)).toEqual({status:'unavailable'});expect(exchange).not.toHaveBeenCalled();
 });
 it('holds on malformed adapter cleanup capabilities without exposing an exception',async()=>{
  const f=await fixture(),exchange=async()=>Object.defineProperty({accessToken:f.token},'discard',{get(){throw Error('private');}}) as PendingAccountSession;
  const service=createAccountExchange(f.security,origin,{exchange});expect(await service.complete(f.begin().request,'google',signal())).toEqual({status:'unavailable'});expect(service.cleanupHeld()).toBe(true);
 });

});
