import {expect,it,vi} from 'vitest';
import {generateKeyPair,exportJWK,createLocalJWKSet,SignJWT} from 'jose';
import {createIdentityVerifier} from '../src/server/verified-identity.ts';
import {createRecoveryCodeProvider} from '../src/server/recovery-provider.ts';
import {createCodeRecoveryOwner} from '../src/server/account-recovery.ts';
const project='https://purpose.supabase.co',email='sample@example.test';
const ownerId='00000000-0000-4000-8000-000000000001',sessionId='00000000-0000-4000-8000-000000000002';
const pair=await generateKeyPair('ES256'),jwk=await exportJWK(pair.publicKey);jwk.kid='purpose-fixture';
const keys=createLocalJWKSet({keys:[jwk]}),signal=()=>new AbortController().signal;
async function token(changes:Record<string,unknown>={}){
 const now=Math.floor(Date.now()/1000);
 return new SignJWT({iss:project+'/auth/v1',aud:'authenticated',sub:ownerId,session_id:sessionId,role:'authenticated',is_anonymous:false,email,iat:now,exp:now+600,amr:[{method:'recovery',timestamp:now}],...changes}).setProtectedHeader({alg:'ES256',kid:jwk.kid}).sign(pair.privateKey);
}
async function fixture(changes:Record<string,unknown>={},deadline=1000){
 let active=true,absent=true;const jwt=await token(changes);
 const operations={verifyRecoveryCode:vi.fn(async(_input:Readonly<{email:string;code:string}>,_signal:AbortSignal)=>({access_token:jwt,token_type:'bearer'})),updatePassword:vi.fn(async()=>true),revoke:vi.fn(async()=>true)};
 const verifier=createIdentityVerifier(project,keys,{active:async()=>active});
 const presence={confirm:vi.fn(async()=>({status:absent?'revoked':'unconfirmed',ownerId,sessionId}))};
 const provider=createRecoveryCodeProvider(operations,verifier,presence),owner=createCodeRecoveryOwner(provider,deadline);
 const input=()=>({attempt:provider.begin(email),email,code:'012345'});
 return {provider,owner,operations,presence,input,jwt,setActive:(value:boolean)=>active=value,setAbsent:(value:boolean)=>absent=value};
}
it('grants only one reset after server-bound signed purpose checks and independently confirmed cleanup',async()=>{
 const f=await fixture(),input=f.input(),grant=await f.owner.confirm(input,signal());
 expect(grant.status).toBe('resetRequired');if(grant.status!=='resetRequired')throw Error();
 expect(Object.keys(grant).sort()).toEqual(['discard','expiresAt','reset','status']);
 expect(f.operations.verifyRecoveryCode).toHaveBeenCalledExactlyOnceWith({email,code:'012345'},expect.any(AbortSignal));
 expect((await grant.reset('made-up',signal())).status).toBe('resetComplete');
 expect((await grant.reset('again',signal())).status).toBe('unconfirmed');expect(f.operations.updatePassword).toHaveBeenCalledOnce();
 expect(f.operations.revoke).toHaveBeenCalledOnce();expect(f.presence.confirm).toHaveBeenCalledOnce();
 expect((await f.owner.confirm(input,signal())).status).toBe('unavailable');
});
it.each(['otp','password','magiclink'])('refuses signed %s authority and still cleans up',async method=>{
 const now=Math.floor(Date.now()/1000),f=await fixture({amr:[{method,timestamp:now}]});
 expect((await f.owner.confirm(f.input(),signal())).status).toBe('unavailable');
 expect(f.operations.updatePassword).not.toHaveBeenCalled();expect(f.operations.revoke).toHaveBeenCalledOnce();expect(f.owner.cleanupHeld()).toBe(false);
});
it('refuses fabricated, serialized, canceled and foreign-instance attempt receipts before provider work',async()=>{
 const f=await fixture(),other=await fixture(),input=f.input(),canceled=f.input();f.provider.cancel(canceled.attempt);
 for(const attempt of [{purpose:'recovery-candidate'},JSON.parse(JSON.stringify(input.attempt)),other.input().attempt,canceled.attempt])expect((await f.owner.confirm({...input,attempt},signal())).status).toBe('unavailable');
 expect(f.operations.verifyRecoveryCode).not.toHaveBeenCalled();
});
it('consumes email mismatch and malformed code attempts without allowing correction/replay',async()=>{
 const f=await fixture();
 for(const change of [{email:'other@example.test'},{code:'12345'},{code:'123456\n'}]){
  const input=f.input();expect((await f.owner.confirm({...input,...change},signal())).status).toBe('unavailable');expect((await f.owner.confirm(input,signal())).status).toBe('unavailable');
 }
 expect(f.operations.verifyRecoveryCode).not.toHaveBeenCalled();
});
it('rejects injected purpose, bearer token and redirect fields before provider work',async()=>{
 const f=await fixture();for(const extra of [{type:'recovery'},{access_token:f.jwt},{redirect_to:'https://other.test'}])expect((await f.owner.confirm({...f.input(),...extra},signal())).status).toBe('unavailable');expect(f.operations.verifyRecoveryCode).not.toHaveBeenCalled();
});
it('requires signed email to match the immutable server attempt',async()=>{
 const f=await fixture({email:'other@example.test'});expect((await f.owner.confirm(f.input(),signal())).status).toBe('unavailable');expect(f.operations.updatePassword).not.toHaveBeenCalled();expect(f.operations.revoke).toHaveBeenCalledOnce();
});
it('refuses stale and future-issued signed tokens even when recovery purpose is fresh',async()=>{
 const now=Math.floor(Date.now()/1000);
 for(const iat of [now-10,now+20]){const f=await fixture({iat});expect((await f.owner.confirm(f.input(),signal())).status).toBe('unavailable');expect(f.operations.updatePassword).not.toHaveBeenCalled();expect(f.operations.revoke).toHaveBeenCalledOnce();}
});
it('does not reuse one provider session for a second server attempt',async()=>{
 const f=await fixture(),first=await f.owner.confirm(f.input(),signal());expect(first.status).toBe('resetRequired');
 expect((await f.owner.confirm(f.input(),signal())).status).toBe('unavailable');
 if(first.status==='resetRequired'){expect((await first.reset('made-up',signal())).status).toBe('unconfirmed');await first.discard();}expect(f.operations.updatePassword).not.toHaveBeenCalled();
});
it('claims an attempt before async work so competing submissions cannot both reach the provider',async()=>{
 const f=await fixture(),input=f.input();let release!:(value:{access_token:string;token_type:string})=>void;
 f.operations.verifyRecoveryCode.mockImplementationOnce(()=>new Promise(r=>release=r));
 const first=f.owner.confirm(input,signal());await vi.waitFor(()=>expect(f.operations.verifyRecoveryCode).toHaveBeenCalledOnce());
 expect((await f.owner.confirm(input,signal())).status).toBe('unavailable');release({access_token:f.jwt,token_type:'bearer'});
 const grant=await first;if(grant.status==='resetRequired')await grant.discard();else throw Error();
});
it('snapshots email/code before asynchronous verification',async()=>{
 const f=await fixture(),input=f.input(),pending=f.owner.confirm(input,signal());
 await vi.waitFor(()=>expect(f.operations.verifyRecoveryCode).toHaveBeenCalledOnce());input.email='other@example.test';input.code='999999';
 const grant=await pending;expect(f.operations.verifyRecoveryCode.mock.calls[0][0]).toEqual({email,code:'012345'});if(grant.status==='resetRequired')await grant.discard();else throw Error();
});
it('expires attempts before provider work and bounds unconsumed attempts',async()=>{
 const f=await fixture();vi.useFakeTimers();try{
  const input=f.input();vi.advanceTimersByTime(300001);expect((await f.owner.confirm(input,signal())).status).toBe('unavailable');
  for(let n=0;n<128;n++)f.provider.begin(email);expect(()=>f.provider.begin(email)).toThrow('Recovery provider unavailable');
  vi.advanceTimersByTime(300001);expect(()=>f.provider.begin(email)).not.toThrow();
 }finally{vi.useRealTimers();}expect(f.operations.verifyRecoveryCode).not.toHaveBeenCalled();
});
it('rechecks active session and expiry at reset rather than trusting earlier verification',async()=>{
 const f=await fixture(),grant=await f.owner.confirm(f.input(),signal());if(grant.status!=='resetRequired')throw Error();
 f.setActive(false);expect((await grant.reset('made-up',signal())).status).toBe('unconfirmed');expect(f.operations.updatePassword).not.toHaveBeenCalled();expect(f.operations.revoke).toHaveBeenCalledOnce();
});
it('holds after unconfirmed cleanup and never reports reset complete merely on revoke acknowledgment',async()=>{
 const f=await fixture();f.setAbsent(false);const grant=await f.owner.confirm(f.input(),signal());if(grant.status!=='resetRequired')throw Error();
 expect((await grant.reset('made-up',signal())).status).toBe('unconfirmed');expect(f.owner.cleanupHeld()).toBe(true);
 expect((await f.owner.confirm(f.input(),signal())).status).toBe('unavailable');expect(f.operations.verifyRecoveryCode).toHaveBeenCalledOnce();
});
it('cleans a late provider response after cancellation without releasing a grant',async()=>{
 const f=await fixture();let release!:(value:{access_token:string;token_type:string})=>void;
 f.operations.verifyRecoveryCode.mockImplementationOnce(()=>new Promise(r=>release=r));const stop=new AbortController();
 const pending=f.owner.confirm(f.input(),stop.signal);await vi.waitFor(()=>expect(f.operations.verifyRecoveryCode).toHaveBeenCalledOnce());stop.abort();expect((await pending).status).toBe('unavailable');
 release({access_token:f.jwt,token_type:'bearer'});await vi.waitFor(()=>expect(f.operations.revoke).toHaveBeenCalledOnce());expect(f.operations.updatePassword).not.toHaveBeenCalled();
});
it('canceling a claimed attempt denies a late grant while retaining cleanup',async()=>{
 const f=await fixture(),input=f.input();let release!:(value:{access_token:string;token_type:string})=>void;
 f.operations.verifyRecoveryCode.mockImplementationOnce(()=>new Promise(r=>release=r));const pending=f.owner.confirm(input,signal());await vi.waitFor(()=>expect(f.operations.verifyRecoveryCode).toHaveBeenCalledOnce());f.provider.cancel(input.attempt);release({access_token:f.jwt,token_type:'bearer'});
 expect((await pending).status).toBe('unavailable');expect(f.operations.revoke).toHaveBeenCalledOnce();
});
it('shutdown prevents new attempts and use of an already returned candidate',async()=>{
 const f=await fixture(),grant=await f.owner.confirm(f.input(),signal());if(grant.status!=='resetRequired')throw Error();f.provider.close();
 expect(()=>f.provider.begin(email)).toThrow();expect((await grant.reset('made-up',signal())).status).toBe('unconfirmed');expect(f.operations.updatePassword).not.toHaveBeenCalled();expect(f.operations.revoke).toHaveBeenCalledOnce();
});
it('retains a hold when the returned token is forged and cleanup identity cannot be established',async()=>{
 const f=await fixture();const parts=f.jwt.split('.');parts[1]=Buffer.from(JSON.stringify({sub:ownerId,email})).toString('base64url');f.operations.verifyRecoveryCode.mockResolvedValueOnce({access_token:parts.join('.'),token_type:'bearer'});
 expect((await f.owner.confirm(f.input(),signal())).status).toBe('unavailable');expect(f.owner.cleanupHeld()).toBe(true);expect(f.operations.revoke).toHaveBeenCalledOnce();expect(f.operations.updatePassword).not.toHaveBeenCalled();
});
it('expires an issued candidate independently of a longer-lived signed access token',async()=>{
 const f=await fixture(),grant=await f.owner.confirm(f.input(),signal());if(grant.status!=='resetRequired')throw Error();
 vi.useFakeTimers();try{vi.setSystemTime(grant.expiresAt);expect((await grant.reset('made-up',signal())).status).toBe('unconfirmed');}finally{vi.useRealTimers();}
 expect(f.operations.updatePassword).not.toHaveBeenCalled();expect(f.operations.revoke).toHaveBeenCalledOnce();
});
it('does not upgrade a token response with the wrong token type',async()=>{
 const f=await fixture();f.operations.verifyRecoveryCode.mockResolvedValueOnce({access_token:f.jwt,token_type:'ordinary'});
 expect((await f.owner.confirm(f.input(),signal())).status).toBe('unavailable');expect(f.operations.revoke).toHaveBeenCalledOnce();expect(f.operations.updatePassword).not.toHaveBeenCalled();
});
it.each([{iss:'https://other.supabase.co/auth/v1'},{aud:'anon'},{is_anonymous:true}])('refuses invalid signed identity %j and holds when cleanup cannot be independently verified',async changes=>{
 const f=await fixture(changes);expect((await f.owner.confirm(f.input(),signal())).status).toBe('unavailable');expect(f.owner.cleanupHeld()).toBe(true);expect(f.operations.updatePassword).not.toHaveBeenCalled();expect(f.operations.revoke).toHaveBeenCalledOnce();
});
it('keeps stuck verification within the shared four-operation limit after deadlines',async()=>{
 const f=await fixture({},10),releases:Array<(value:{access_token:string;token_type:string})=>void>=[];
 f.operations.verifyRecoveryCode.mockImplementation(()=>new Promise(r=>releases.push(r)));
 await Promise.all(Array.from({length:4},async()=>expect((await f.owner.confirm(f.input(),signal())).status).toBe('unavailable')));
 expect((await f.owner.confirm(f.input(),signal())).status).toBe('busy');expect(f.operations.verifyRecoveryCode).toHaveBeenCalledTimes(4);
 releases.forEach(release=>release({access_token:f.jwt,token_type:'bearer'}));
 await vi.waitFor(()=>expect(f.operations.revoke).toHaveBeenCalledTimes(4));expect(f.operations.updatePassword).not.toHaveBeenCalled();
});
it('holds when cleanup of a canceled late result is uncertain',async()=>{
 const f=await fixture();f.setAbsent(false);let release!:(value:{access_token:string;token_type:string})=>void;
 f.operations.verifyRecoveryCode.mockImplementationOnce(()=>new Promise(r=>release=r));const stop=new AbortController(),pending=f.owner.confirm(f.input(),stop.signal);
 await vi.waitFor(()=>expect(f.operations.verifyRecoveryCode).toHaveBeenCalledOnce());stop.abort();await pending;release({access_token:f.jwt,token_type:'bearer'});
 await vi.waitFor(()=>expect(f.owner.cleanupHeld()).toBe(true));expect((await f.owner.confirm(f.input(),signal())).status).toBe('unavailable');expect(f.operations.verifyRecoveryCode).toHaveBeenCalledOnce();
});
