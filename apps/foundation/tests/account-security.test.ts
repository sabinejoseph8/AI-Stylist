import {describe,it,expect,vi} from 'vitest';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {createAccountSecurity} from '../src/server/account-security.ts';
const origin='https://stylist.example',project='https://example.supabase.co';
const owner='11111111-1111-4111-8111-111111111111',session='22222222-2222-4222-8222-222222222222';
const signal=()=>new AbortController().signal;
async function fixture(){
 const pair=await generateKeyPair('ES256');let active=true;
 const fetcher=vi.fn(async()=>new Response(JSON.stringify({keys:[{...await exportJWK(pair.publicKey),kid:'one',alg:'ES256'}]})));
 const call=vi.fn(async(name:string,args:Record<string,unknown>)=>name==='stylist_auth_session_active'&&args.p_owner===owner&&args.p_session===session&&active);
 const security=createAccountSecurity({appOrigin:origin,projectUrl:project,fetch:fetcher,rpc:{call}});
 const sign=(claims:Record<string,unknown>={})=>new SignJWT({session_id:session,role:'authenticated',is_anonymous:false,...claims}).setProtectedHeader({alg:'ES256',kid:'one'}).setSubject(owner).setIssuer(project+'/auth/v1').setAudience('authenticated').setIssuedAt().setExpirationTime('5m').sign(pair.privateKey);
 return {security,fetcher,call,sign,revoke(){active=false;}};
}
describe('composed local account security',()=>{
 it('verifies a generated token, issues a cookie and authorizes only its current owned session',async()=>{
  const f=await fixture(),token=await f.sign(),cookie=await f.security.cookies.issue(token,signal());
  expect(cookie).not.toBeNull();expect(cookie).toContain('HttpOnly; SameSite=Strict');
  const request=new Request(origin+'/api/media',{headers:{cookie:cookie!.split(';')[0]!,'x-owner-id':'attacker'}});
  const identity=await f.security.authorize(request,signal());expect(identity?.ownerId).toBe(owner);expect(await identity?.isCurrent(signal())).toBe(true);
  expect(f.fetcher).toHaveBeenCalledTimes(1);expect(f.call).toHaveBeenCalledWith('stylist_auth_session_active',{p_owner:owner,p_session:session});
  f.revoke();expect(await identity?.isCurrent(signal())).toBe(false);expect(await f.security.authorize(request,signal())).toBeNull();expect(await f.security.cookies.issue(token,signal())).toBeNull();
 });
 it('rejects forged, anonymous and cross-site identity before granting a cookie or access',async()=>{
  const f=await fixture();expect(await f.security.cookies.issue('aaa.bbb.ccc',signal())).toBeNull();
  expect(await f.security.cookies.issue(await f.sign({is_anonymous:true}),signal())).toBeNull();
  const token=await f.sign(),before=f.call.mock.calls.length;
  expect(await f.security.authorize(new Request(origin+'/api/media',{headers:{cookie:'__Host-stylist_access='+token,'sec-fetch-site':'cross-site'}}),signal())).toBeNull();expect(f.call.mock.calls.length).toBe(before);
 });
 it('consumes a bound callback once without treating it as authenticated identity',async()=>{
  const f=await fixture(),flow=f.security.callbacks.begin('google','/profile');
  const request=new Request(flow.callbackUrl+'&code=simulated-code',{headers:{cookie:flow.cookie.split(';')[0]!}});
  expect(f.security.callbacks.fromRequest(request,'google')).toMatchObject({purpose:'google',returnPath:'/profile',code:'simulated-code'});
  expect(f.security.callbacks.fromRequest(request,'google')).toBeNull();
  expect(await f.security.authorize(new Request(origin+'/api/media',{headers:{cookie:flow.cookie.split(';')[0]!}}),signal())).toBeNull();expect(f.fetcher).not.toHaveBeenCalled();expect(f.call).not.toHaveBeenCalled();
 });
});
