import {describe,it,expect,vi,afterEach} from 'vitest';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {createAccountSecurity} from '../src/server/account-security.ts';
import {createAccountRecovery,type VerifiedRecovery} from '../src/server/account-recovery.ts';
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
describe('scoped disconnected recovery',()=>{
 afterEach(()=>vi.useRealTimers());
 it('permits one password reset but produces no normal account access',async()=>{
  const f=await fixture(),value=lease(),exchange=vi.fn(async()=>value),service=createAccountRecovery(f.security,{exchange});
  const a=f.begin('recovery'),result=await service.complete(a.request,signal());expect(result.status).toBe('resetRequired');if(result.status!=='resetRequired')throw Error();
  expect(Object.keys(result).sort()).toEqual(['discard','reset','status']);expect(await result.reset('new-made-up-password',signal())).toEqual({status:'resetComplete'});
  expect(await result.reset('another',signal())).toEqual({status:'unconfirmed'});expect(value.resetPassword).toHaveBeenCalledTimes(1);expect(value.discard).toHaveBeenCalledTimes(1);
  expect(await service.complete(a.request,signal())).toEqual({status:'unavailable'});
 });
 it('refuses expired grants and invalid input without changing a password',async()=>{
  const f=await fixture(),value=lease(),service=createAccountRecovery(f.security,{exchange:async()=>value});const result=await service.complete(f.begin('recovery').request,signal());if(result.status!=='resetRequired')throw Error();
  expect(await result.reset({},signal())).toEqual({status:'unconfirmed'});vi.useFakeTimers();vi.setSystemTime(Date.now()+60001);expect(await result.reset('new',signal())).toEqual({status:'unconfirmed'});expect(value.resetPassword).not.toHaveBeenCalled();expect(value.discard).toHaveBeenCalledTimes(1);
 });
 it('never accepts an ordinary access token as recovery proof',async()=>{
  const f=await fixture(),discard=vi.fn(async()=>true),service=createAccountRecovery(f.security,{exchange:async()=>({accessToken:f.token,discard}) as unknown as VerifiedRecovery});
  expect(await service.complete(f.begin('recovery').request,signal())).toEqual({status:'unavailable'});expect(discard).toHaveBeenCalledTimes(1);
 });
 it('requires reset and cleanup confirmation and holds after failed cleanup',async()=>{
  const f=await fixture(),value={...lease(),discard:vi.fn(async()=>false)},service=createAccountRecovery(f.security,{exchange:async()=>value});const result=await service.complete(f.begin('recovery').request,signal());if(result.status!=='resetRequired')throw Error();
  expect(await result.reset('new',signal())).toEqual({status:'unconfirmed'});expect(service.cleanupHeld()).toBe(true);expect(await service.complete(f.begin('recovery').request,signal())).toEqual({status:'unavailable'});
 });
 it('discards a late canceled exchange without returning reset permission',async()=>{
  const f=await fixture(),value=lease();let resolve!:(v:VerifiedRecovery)=>void,started!:()=>void,cleaned!:()=>void;const began=new Promise<void>(r=>started=r),done=new Promise<void>(r=>cleaned=r);value.discard=vi.fn(async()=>{cleaned();return true;});
  const service=createAccountRecovery(f.security,{exchange:()=>{started();return new Promise(r=>resolve=r);}}),controller=new AbortController();const work=service.complete(f.begin('recovery').request,controller.signal);await began;controller.abort();expect(await work).toEqual({status:'unavailable'});resolve(value);await done;expect(value.resetPassword).not.toHaveBeenCalled();
 });
 it('does not exchange canceled or wrong-purpose callbacks',async()=>{
  const f=await fixture(),exchange=vi.fn(),service=createAccountRecovery(f.security,{exchange}),a=f.begin('recovery');const canceled=new Request(a.flow.callbackUrl+'&error=access_denied',{headers:{cookie:a.flow.cookie.split(';')[0]!}});
  expect(await service.complete(canceled,signal())).toEqual({status:'canceled'});expect(await service.complete(f.begin('google').request,signal())).toEqual({status:'unavailable'});expect(exchange).not.toHaveBeenCalled();
 });
 it('retains admission for timed-out exchanges and preserves a busy callback',async()=>{
  const f=await fixture();vi.useFakeTimers();const releases:Array<(v:{status:'notCreated'})=>void>=[];const exchange=vi.fn(()=>new Promise<{status:'notCreated'}>(r=>releases.push(r))),service=createAccountRecovery(f.security,{exchange},20);
  const work=Array.from({length:4},()=>service.complete(f.begin('recovery').request,signal()));await vi.advanceTimersByTimeAsync(21);expect(await Promise.all(work)).toEqual(Array.from({length:4},()=>({status:'unavailable'})));
  const a=f.begin('recovery');expect(await service.complete(a.request,signal())).toEqual({status:'busy'});expect(exchange).toHaveBeenCalledTimes(4);
  releases.forEach(r=>r({status:'notCreated'}));await vi.advanceTimersByTimeAsync(0);
  const attempt=service.complete(a.request,signal());await vi.advanceTimersByTimeAsync(0);expect(exchange).toHaveBeenCalledTimes(5);releases[4]!({status:'notCreated'});expect(await attempt).toEqual({status:'unavailable'});
 });
 it('never retries a timed-out password change and cleans up its late result',async()=>{
  const f=await fixture(),value=lease();let resolve!:(v:boolean)=>void;value.resetPassword=vi.fn(()=>new Promise<boolean>(r=>resolve=r));const service=createAccountRecovery(f.security,{exchange:async()=>value},20);const result=await service.complete(f.begin('recovery').request,signal());if(result.status!=='resetRequired')throw Error();
  vi.useFakeTimers();const work=result.reset('new',signal());await vi.advanceTimersByTimeAsync(21);expect(await work).toEqual({status:'unconfirmed'});expect(await result.reset('retry',signal())).toEqual({status:'unconfirmed'});resolve(true);await vi.advanceTimersByTimeAsync(0);expect(value.discard).toHaveBeenCalledTimes(1);expect(value.resetPassword).toHaveBeenCalledTimes(1);
 });

 it('discarding permission aborts an in-flight password reset and forbids late completion',async()=>{
  const f=await fixture(),value=lease();let resolve!:(v:boolean)=>void,started!:()=>void;let scope!:AbortSignal;const began=new Promise<void>(r=>started=r);value.resetPassword=vi.fn((_password:string,signal:AbortSignal)=>{scope=signal;started();return new Promise<boolean>(r=>resolve=r);});
  const service=createAccountRecovery(f.security,{exchange:async()=>value});const result=await service.complete(f.begin('recovery').request,signal());if(result.status!=='resetRequired')throw Error();
  const work=result.reset('new',signal());await began;expect(await result.discard()).toBe(true);expect(scope.aborted).toBe(true);expect(await work).toEqual({status:'unconfirmed'});resolve(true);await Promise.resolve();expect(value.discard).toHaveBeenCalledTimes(1);expect(await result.reset('again',signal())).toEqual({status:'unconfirmed'});
 });
 it('does not reuse a discarded adapter capability',async()=>{
  const f=await fixture(),value=lease(),service=createAccountRecovery(f.security,{exchange:async()=>value});const result=await service.complete(f.begin('recovery').request,signal());if(result.status!=='resetRequired')throw Error();await result.discard();
  expect(await service.complete(f.begin('recovery').request,signal())).toEqual({status:'unavailable'});expect(value.discard).toHaveBeenCalledTimes(1);
 });

});
