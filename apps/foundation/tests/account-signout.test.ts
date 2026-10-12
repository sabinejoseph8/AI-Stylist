import {describe,it,expect,vi,afterEach} from 'vitest';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {createAccountSecurity} from '../src/server/account-security.ts';
import {createAccountSignOut} from '../src/server/account-signout.ts';
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


const request=(token:string,extra:Record<string,string>={})=>new Request(origin+'/api/account/sign-out',{method:'POST',headers:{origin,cookie:'__Host-stylist_access='+token,...extra}});
describe('disconnected account sign-out',()=>{
 afterEach(()=>vi.useRealTimers());
 it('requires verified identity and explicit revocation proof, clearing both cookies',async()=>{
  const f=await fixture(),revoke=vi.fn(async(_request:Request,_owner:string,_signal:AbortSignal)=>true),service=createAccountSignOut(f.security,origin,{revoke});
  const result=await service.submit(request(f.token),signal());expect(result.status).toBe('signedOut');expect(result.setCookies).toHaveLength(2);expect(result.setCookies.every(c=>c.includes('Max-Age=0'))).toBe(true);expect(revoke.mock.calls[0]?.[1]).toBe(owner);
 });
 it('clears local cookies but never reports remote success for invalid identity or failed revocation',async()=>{
  const f=await fixture(),revoke=vi.fn(async()=>false),service=createAccountSignOut(f.security,origin,{revoke});
  expect((await service.submit(request('bad.token.value'),signal())).status).toBe('remoteUnconfirmed');expect(revoke).not.toHaveBeenCalled();
  const result=await service.submit(request(f.token),signal());expect(result.status).toBe('remoteUnconfirmed');expect(result.setCookies).toHaveLength(2);expect(revoke).toHaveBeenCalledTimes(1);
 });
 it('refuses cross-origin or non-POST work without clearing cookies',async()=>{
  const f=await fixture(),revoke=vi.fn(),service=createAccountSignOut(f.security,origin,{revoke});
  for(const r of [request(f.token,{origin:'https://other.example'}),new Request(origin+'/api/account/sign-out'),new Request(origin+'/api/account/sign-out?extra=1',{method:'POST',headers:{origin}})])expect(await service.submit(r,signal())).toEqual({status:'unavailable',setCookies:[]});expect(revoke).not.toHaveBeenCalled();
 });
 it('bounds non-cooperative revocation and does not promote late success',async()=>{
  const f=await fixture();const identity=await f.security.authorize(request(f.token),signal());expect(identity).not.toBeNull();const security={...f.security,authorize:async()=>identity};vi.useFakeTimers();const releases:Array<(v:boolean)=>void>=[];const revoke=vi.fn(()=>new Promise<boolean>(r=>releases.push(r))),service=createAccountSignOut(security,origin,{revoke},20);
  const work=Array.from({length:4},()=>service.submit(request(f.token),signal()));await vi.advanceTimersByTimeAsync(21);expect((await Promise.all(work)).every(x=>x.status==='remoteUnconfirmed')).toBe(true);
  expect((await service.submit(request(f.token),signal())).status).toBe('remoteUnconfirmed');expect(revoke).toHaveBeenCalledTimes(4);
  releases.forEach(r=>r(true));await vi.advanceTimersByTimeAsync(0);
 });
});
