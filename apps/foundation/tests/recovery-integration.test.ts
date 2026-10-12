import {describe,it,expect,vi,afterEach} from 'vitest';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {createAccountSecurity} from '../src/server/account-security.ts';
import {createAccountRecovery} from '../src/server/account-recovery.ts';
import {createRecoveryBrowser} from '../src/server/recovery-browser.ts';
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


const lease=()=>({ownerId:owner,expiresAt:Date.now()+60000,resetPassword:vi.fn(async(_password:string,_signal:AbortSignal)=>true),discard:vi.fn(async()=>true)});

const input={password:'made-up-reset',confirmation:'made-up-reset'};
const request=(cookie:string,abort?:AbortSignal)=>new Request(origin+'/api/account/reset',{method:'POST',signal:abort,headers:{origin,cookie}});
describe('disconnected recovery owner and browser delivery composition',()=>{
 afterEach(()=>vi.useRealTimers());
 it('resets once through a bound callback and separate cookie without account access',async()=>{
  const f=await fixture(),value=lease(),recovery=createAccountRecovery(f.security,{exchange:async()=>value}),browser=createRecoveryBrowser(origin);
  const result=await recovery.complete(f.begin('recovery').request,signal());if(result.status!=='resetRequired')throw Error();const delivery=browser.install(result),cookie=delivery.setCookie.split(';')[0]!;
  expect(await f.security.authorize(new Request(origin+'/api/profile',{headers:{cookie}}),signal())).toBeNull();
  expect(await browser.submit(request(cookie),input,signal())).toMatchObject({status:'resetComplete',setCookie:expect.stringContaining('Max-Age=0')});
  expect((await browser.submit(request(cookie),input,signal())).status).toBe('unavailable');expect(value.resetPassword).toHaveBeenCalledTimes(1);expect(value.discard).toHaveBeenCalledTimes(1);
 });
 it('discards verified permission when response adoption fails',async()=>{
  const f=await fixture(),value=lease(),recovery=createAccountRecovery(f.security,{exchange:async()=>value}),browser=createRecoveryBrowser(origin);
  const result=await recovery.complete(f.begin('recovery').request,signal());if(result.status!=='resetRequired')throw Error();const delivery=browser.install(result);expect(await delivery.discard()).toBe(true);
  expect((await browser.submit(request(delivery.setCookie.split(';')[0]!),input,signal())).status).toBe('unavailable');expect(await result.reset(input.password,signal())).toEqual({status:'unconfirmed'});expect(value.resetPassword).not.toHaveBeenCalled();expect(value.discard).toHaveBeenCalledTimes(1);
 });
 it('propagates request cancellation into the real reset owner and cleans late success once',async()=>{
  const f=await fixture(),value=lease();let resolve!:(v:boolean)=>void,started!:()=>void,scope!:AbortSignal;const began=new Promise<void>(r=>started=r);value.resetPassword=vi.fn((_password:string,s:AbortSignal)=>{scope=s;started();return new Promise<boolean>(r=>resolve=r);});
  const recovery=createAccountRecovery(f.security,{exchange:async()=>value}),browser=createRecoveryBrowser(origin),grant=await recovery.complete(f.begin('recovery').request,signal());if(grant.status!=='resetRequired')throw Error();
  const delivery=browser.install(grant),controller=new AbortController(),work=browser.submit(request(delivery.setCookie.split(';')[0]!,controller.signal),input,signal());await began;controller.abort();expect((await work).status).toBe('unconfirmed');expect(scope.aborted).toBe(true);resolve(true);await Promise.resolve();expect(value.discard).toHaveBeenCalledTimes(1);
 });
 it('rejects expired browser delivery and propagates actual owner cleanup holds',async()=>{
  const f=await fixture(),value={...lease(),discard:vi.fn(async()=>false)},recovery=createAccountRecovery(f.security,{exchange:async()=>value}),browser=createRecoveryBrowser(origin),grant=await recovery.complete(f.begin('recovery').request,signal());if(grant.status!=='resetRequired')throw Error();
  const delivery=browser.install(grant);vi.useFakeTimers();vi.setSystemTime(Date.now()+60001);expect((await browser.submit(request(delivery.setCookie.split(';')[0]!),input,signal())).status).toBe('unavailable');expect(value.resetPassword).not.toHaveBeenCalled();expect(value.discard).toHaveBeenCalledTimes(1);expect(recovery.cleanupHeld()).toBe(true);expect(browser.cleanupHeld()).toBe(true);
 });
});
