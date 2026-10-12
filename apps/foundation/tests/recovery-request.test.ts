import {describe,it,expect,vi} from 'vitest';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {createAccountSecurity} from '../src/server/account-security.ts';
import {createRecoveryRequest} from '../src/server/recovery-request.ts';
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


const request=(input:unknown={email:' sample@example.test '},scope?:AbortSignal)=>new Request(origin+'/api/account/recover',{method:'POST',signal:scope,headers:{origin,'content-type':'application/json'},body:JSON.stringify(input)});
describe('disconnected recovery request acknowledgment',()=>{
 it('passes a fixed recovery callback and PKCE challenge only to a trusted adapter',async()=>{
  const f=await fixture(),send=vi.fn(async(_input:unknown,_signal:AbortSignal)=>{}),handler=createRecoveryRequest(origin,f.security,{request:send}),response=await handler(request(),signal());
  expect(response.status).toBe(202);expect(await response.json()).toEqual({status:'recoveryRequested'});expect(response.headers.get('set-cookie')).toContain('__Host-stylist_flow=');expect(response.headers.get('set-cookie')).not.toContain('stylist_access');
  expect(send.mock.calls[0]?.[0]).toMatchObject({email:'sample@example.test',redirectTo:expect.stringMatching(/^https:\/\/stylist.example\/auth\/callback\/recovery\?flow=/),challenge:expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),challengeMethod:'S256'});
 });
 it('returns the same body/status/header shape for absent account and provider failure',async()=>{
  for(const fail of [false,true]){
   const f=await fixture(),handler=createRecoveryRequest(origin,f.security,{request:async()=>{if(fail)throw Error('private-account-existence');}}),response=await handler(request(),signal());expect(response.status).toBe(202);expect(await response.text()).toBe('{"status":"recoveryRequested"}');expect(response.headers.get('set-cookie')).toMatch(/^__Host-stylist_flow=[A-Za-z0-9_-]{43};/);
  }
 });
 it('rejects malformed request without sending or accepting a caller-selected redirect',async()=>{
  const f=await fixture(),send=vi.fn(),handler=createRecoveryRequest(origin,f.security,{request:send});for(const input of [{email:'broken'},{email:'sample@example.test',redirectTo:'https://other.example'},[],null])expect((await handler(request(input),signal())).status).toBe(400);expect(send).not.toHaveBeenCalled();
 });
 it('cancellation abandons the bound callback and never retries email delivery',async()=>{
  const f=await fixture();let resolve!:()=>void,started!:()=>void;let sent!:{redirectTo:string};const began=new Promise<void>(r=>started=r),send=vi.fn((input:{email:string;redirectTo:string;challenge:string;challengeMethod:'S256'},_signal:AbortSignal)=>{sent=input;started();return new Promise<void>(r=>resolve=r);});const begin=vi.fn(f.security.callbacks.begin),security={...f.security,callbacks:{...f.security.callbacks,begin}};const handler=createRecoveryRequest(origin,security,{request:send}),controller=new AbortController(),work=handler(request(undefined,controller.signal),signal());await began;controller.abort();expect((await work).status).toBe(409);resolve();await Promise.resolve();expect(send).toHaveBeenCalledTimes(1);
  const callbacks=f.security.callbacks;expect(callbacks.fromRequest(new Request(sent.redirectTo+'&code=fixture-code',{headers:{cookie:begin.mock.results[0]!.value!.cookie.split(';')[0]!}}),'recovery')).toBeNull();
 });
});
