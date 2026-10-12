import {describe,it,expect,vi} from 'vitest';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {createAccountSecurity} from '../src/server/account-security.ts';
import {createPasswordAccounts} from '../src/server/password-account.ts';
import {createPasswordHttp} from '../src/server/password-http.ts';
import {createAccountSignOut} from '../src/server/account-signout.ts';
import {createSignOutHttp} from '../src/server/signout-http.ts';
import {createRecoveryRequest} from '../src/server/recovery-request.ts';
import {createAccountHttp} from '../src/web/account-http.ts';
import {createAccountFlow} from '../src/web/account-flow.ts';
const origin='https://stylist.example',project='https://example.supabase.co';
const owner='11111111-1111-4111-8111-111111111111',sessionId='22222222-2222-4222-8222-222222222222';
const signal=()=>new AbortController().signal;
async function fixture(){
 const pair=await generateKeyPair('ES256');
 const token=await new SignJWT({session_id:sessionId,role:'authenticated',is_anonymous:false}).setProtectedHeader({alg:'ES256',kid:'test'}).setSubject(owner).setIssuer(project+'/auth/v1').setAudience('authenticated').setIssuedAt().setExpirationTime('5m').sign(pair.privateKey);
 let active=true;
 const security=createAccountSecurity({appOrigin:origin,projectUrl:project,fetch:async()=>new Response(JSON.stringify({keys:[{...await exportJWK(pair.publicKey),kid:'test'}]})),rpc:{call:async()=>active}});
 const begin=(purpose:'google'|'apple'|'recovery'='google')=>{const flow=security.callbacks.begin(purpose,'/wardrobe');return {flow,request:new Request(flow.callbackUrl+'&code=fixture-code',{headers:{cookie:flow.cookie.split(';')[0]!}})};};
 return {security,token,begin,revoke:()=>{active=false;}};
}



const input={method:'signIn' as const,email:'sample@example.test',password:'made-up'};
async function harness(confirm=true){
 const f=await fixture(),jar=new Map<string,string>(),sendRecovery=vi.fn(async()=>{});
 const password=createPasswordHttp(origin,createPasswordAccounts(f.security,origin,{password:async request=>request.method==='signUp'?{status:'confirmationRequired'}:{accessToken:f.token,discard:async()=>{f.revoke();return true;}}}));
 const out=createSignOutHttp(origin,createAccountSignOut(f.security,origin,{revoke:async()=>{if(confirm)f.revoke();return confirm;}})),recover=createRecoveryRequest(origin,f.security,{request:sendRecovery});
 // Simulated browser Origin/cookie/header handling, not actual browser cookie acceptance.
 const send:typeof fetch=async(url,init)=>{
  const headers=new Headers(init?.headers);headers.set('origin',origin);if(jar.size)headers.set('cookie',Array.from(jar).map(([k,v])=>k+'='+v).join('; '));
  const request=new Request(String(url),{...init,headers}),path=new URL(String(url)).pathname;
  const response=path==='/api/account/password'?await password.handle(request,request.signal):path==='/api/account/sign-out'?await out(request,request.signal):await recover(request,request.signal);
  for(const cookie of response.headers.getSetCookie()){const pair=cookie.split(';')[0]!,at=pair.indexOf('='),key=pair.slice(0,at),value=pair.slice(at+1);if(value)jar.set(key,value);else jar.delete(key);}
  return response;
 };
 return {f,jar,sendRecovery,flow:createAccountFlow(createAccountHttp(origin,send))};
}
describe('simulated browser transport and server composition',()=>{
 it('signs in through verified cookies and signs out with simulated revocation',async()=>{
  const h=await harness();await h.flow.submit(input);expect(h.flow.snapshot().status).toBe('signedIn');expect(h.flow.snapshot().userId).toBeNull();expect(h.jar.has('__Host-stylist_access')).toBe(true);
  await h.flow.signOut();expect(h.flow.snapshot().status).toBe('signedOut');expect(h.flow.snapshot().message).toBe('You are signed out.');expect(h.jar.has('__Host-stylist_access')).toBe(false);
  expect(await h.f.security.authorize(new Request(origin+'/api/profile',{headers:{cookie:'__Host-stylist_access='+h.f.token}}),signal())).toBeNull();
 });
 it('registration and recovery never create account access',async()=>{
  const h=await harness();await h.flow.submit({...input,method:'signUp'});expect(h.flow.snapshot().status).toBe('confirmationRequired');expect(h.jar.has('__Host-stylist_access')).toBe(false);
  await h.flow.submit({method:'recover',email:input.email});expect(h.flow.snapshot().status).toBe('recoveryRequested');expect(h.jar.has('__Host-stylist_access')).toBe(false);expect(h.sendRecovery).toHaveBeenCalledTimes(1);
 });
 it('closes local access while preserving unconfirmed remote revocation',async()=>{
  const h=await harness(false);await h.flow.submit(input);await h.flow.signOut();expect(h.flow.snapshot().status).toBe('signedOut');expect(h.flow.snapshot().message).toBe('Local access is closed. Server sign-out could not be confirmed.');expect(h.jar.has('__Host-stylist_access')).toBe(false);
  expect(await h.f.security.authorize(new Request(origin+'/api/profile',{headers:{cookie:'__Host-stylist_access='+h.f.token}}),signal())).not.toBeNull();
 });
});
