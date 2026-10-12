import {describe,it,expect,vi} from 'vitest';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {createAccountSecurity} from '../src/server/account-security.ts';
import {createPasswordAccounts} from '../src/server/password-account.ts';
import {createPasswordHttp} from '../src/server/password-http.ts';
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


const input={method:'signIn',email:'sample@example.test',password:'made-up'};
const request=(value:unknown=input,scope?:AbortSignal)=>new Request(origin+'/api/account/password',{method:'POST',signal:scope,headers:{origin,'content-type':'application/json'},body:JSON.stringify(value)});
describe('disconnected password HTTP composition',()=>{
 it('returns only signed-in status with verified cookies in headers and failed-delivery cleanup',async()=>{
  const f=await fixture(),discard=vi.fn(async()=>true),accounts=createPasswordAccounts(f.security,origin,{password:async()=>({accessToken:f.token,discard})}),http=createPasswordHttp(origin,accounts);
  const response=await http.handle(request(),signal());expect(response.status).toBe(200);expect(await response.json()).toEqual({status:'signedIn'});expect(response.headers.get('set-cookie')).toContain('HttpOnly; SameSite=Strict');expect(response.headers.get('cache-control')).toBe('no-store');expect(discard).not.toHaveBeenCalled();expect(await http.discardResponse(response)).toBe(true);expect(await http.discardResponse(response)).toBe(true);expect(discard).toHaveBeenCalledTimes(1);
 });
 it('registration confirmation produces no authenticated cookie',async()=>{
  const f=await fixture(),accounts=createPasswordAccounts(f.security,origin,{password:async()=>({status:'confirmationRequired'})}),http=createPasswordHttp(origin,accounts);
  const response=await http.handle(request({...input,method:'signUp'}),signal());expect(await response.json()).toEqual({status:'confirmationRequired'});expect(response.headers.has('set-cookie')).toBe(false);
 });
 it('refuses malformed input before any provider session creation',async()=>{
  const f=await fixture(),password=vi.fn(),http=createPasswordHttp(origin,createPasswordAccounts(f.security,origin,{password}));
  for(const value of [{...input,email:'invalid'},{...input,extra:true},{...input,password:''}])expect((await http.handle(request(value),signal())).status).toBe(400);expect(password).not.toHaveBeenCalled();
 });
 it('canceled HTTP delivery cleans a late session and never returns an account cookie',async()=>{
  const f=await fixture();let resolve!:(v:AccountSessionReply)=>void,started!:()=>void,cleaned!:()=>void;const began=new Promise<void>(r=>started=r),done=new Promise<void>(r=>cleaned=r),discard=vi.fn(async()=>{cleaned();return true;});
  const accounts=createPasswordAccounts(f.security,origin,{password:()=>{started();return new Promise(r=>resolve=r);}}),http=createPasswordHttp(origin,accounts),controller=new AbortController();
  const work=http.handle(request(input,controller.signal),signal());await began;controller.abort();const response=await work;expect(response.status).toBe(409);expect(response.headers.has('set-cookie')).toBe(false);resolve({accessToken:f.token,discard});await done;expect(discard).toHaveBeenCalledTimes(1);
 });
});
