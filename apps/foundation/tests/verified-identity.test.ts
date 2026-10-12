import {it,expect,vi} from 'vitest';
import {generateKeyPair,SignJWT,createLocalJWKSet,exportJWK} from 'jose';
import {createIdentityVerifier} from '../src/server/verified-identity.ts';
const owner='00000000-0000-0000-0000-000000000001',session='00000000-0000-0000-0000-000000000002';
const url='https://fixture.supabase.co',issuer=url+'/auth/v1';
const pair=await generateKeyPair('ES256');const jwk=await exportJWK(pair.publicKey);jwk.kid='fixture';
const keys=createLocalJWKSet({keys:[jwk]});const signal=()=>new AbortController().signal;
it('requires signed fresh recovery authentication rather than ordinary account access',async()=>{
 const verify=createIdentityVerifier(url,keys,{active:async()=>true}),now=Math.floor(Date.now()/1000);
 for(const amr of [undefined,[],[{method:'password',timestamp:now}],[{method:'recovery',timestamp:now-301}],[{method:'recovery',timestamp:now+60}],[{method:'recovery',timestamp:'now'}]]){
  expect(await verify.verifyRecovery(await token({amr}),signal())).toBeNull();
 }
 const signed=await token({amr:[{method:'recovery',timestamp:now}]});
 const proof=await verify.verifyRecovery(signed,signal());expect(proof?.ownerId).toBe(owner);expect(proof?.sessionId).toBe(session);expect(proof?.expiresAt).toBe((now+300)*1000);expect(await proof?.isCurrent(signal())).toBe(true);
});
it('expires recovery authority independently of a longer-lived access token',async()=>{
 const now=Math.floor(Date.now()/1000),verify=createIdentityVerifier(url,keys,{active:async()=>true});
 const proof=await verify.verifyRecovery(await token({exp:now+3600,amr:[{method:'recovery',timestamp:now-299}]}),signal());expect(proof).not.toBeNull();
 vi.useFakeTimers();try{vi.setSystemTime((now+2)*1000);expect(await proof?.isCurrent(signal())).toBe(false);}finally{vi.useRealTimers();}
});
async function token(changes:Record<string,unknown>={},kid='fixture'){
 const now=Math.floor(Date.now()/1000);
 return new SignJWT({iss:issuer,aud:'authenticated',sub:owner,session_id:session,role:'authenticated',is_anonymous:false,iat:now,exp:now+300,...changes})
 .setProtectedHeader({alg:'ES256',kid}).sign(pair.privateKey);
}
it('verifies an actual asymmetric signature and binds authoritative session lookup',async()=>{
 const active=vi.fn(async()=>true);const verified=await createIdentityVerifier(url,keys,{active}).verify(await token(),signal());
 expect(verified?.ownerId).toBe(owner);expect(verified?.sessionId).toBe(session);expect(await verified?.isCurrent(signal())).toBe(true);
 expect(active).toHaveBeenCalledWith(owner,session,expect.any(AbortSignal));expect(Object.keys(verified!)).toEqual(['ownerId','sessionId','isCurrent']);
});
it('denies wrong issuer/audience/role, malformed IDs, anonymous and expired claims',async()=>{
 const active=vi.fn(async()=>true);const verify=createIdentityVerifier(url,keys,{active});
 for(const claims of [{iss:'https://wrong.example'}, {aud:'anon'}, {role:'service_role'}, {sub:'bad'}, {session_id:'bad'},
  {is_anonymous:true}, {is_anonymous:'false'}, {is_anonymous:null}, {exp:1}, {iat:Math.floor(Date.now()/1000)+300}, {exp:null}])expect(await verify.verify(await token(claims),signal())).toBeNull();
 expect(active).not.toHaveBeenCalled();
});
it('rejects forged signatures, unknown keys and unsupported signing algorithms',async()=>{
 const verify=createIdentityVerifier(url,keys,{active:async()=>true});const signed=await token();const parts=signed.split('.');
 parts[1]=Buffer.from(JSON.stringify({sub:owner})).toString('base64url');expect(await verify.verify(parts.join('.'),signal())).toBeNull();
 expect(await verify.verify(await token({},'unknown'),signal())).toBeNull();
 const symmetric=await new SignJWT({sub:owner}).setProtectedHeader({alg:'HS256'}).sign(new Uint8Array(32));
 expect(await verify.verify(symmetric,signal())).toBeNull();
});
it('rechecks sign-out/revocation and refuses uncertain session authority',async()=>{
 let alive=true;const verify=createIdentityVerifier(url,keys,{active:async()=>alive});const result=await verify.verify(await token(),signal());
 alive=false;expect(await result?.isCurrent(signal())).toBe(false);expect(await verify.verify(await token(),signal())).toBeNull();
 expect(await createIdentityVerifier(url,keys,{active:async()=>{throw Error('secret');}}).verify(await token(),signal())).toBeNull();
});
it('bounds stuck authority calls and respects cancellation',async()=>{
 const verify=createIdentityVerifier(url,keys,{active:()=>new Promise(()=>{})},5);
 expect(await verify.verify(await token(),signal())).toBeNull();const stop=new AbortController();stop.abort();expect(await verify.verify(await token(),stop.signal)).toBeNull();
});
it('fails closed on configuration and non-token input',async()=>{
 for(const origin of ['http://fixture.supabase.co','https://wrong.example','https://fixture.supabase.co/path'])expect(()=>createIdentityVerifier(origin,keys,{active:async()=>true})).toThrow();
 const verify=createIdentityVerifier(url,keys,{active:async()=>true});for(const raw of ['','abc','x'.repeat(20000)])expect(await verify.verify(raw,signal())).toBeNull();
});

it('keeps timed-out underlying work within the four-request admission cap',async()=>{
 const active=vi.fn(()=>new Promise<boolean>(()=>{}));const verify=createIdentityVerifier(url,keys,{active},5);const signed=await token();
 for(let i=0;i<6;i++)expect(await verify.verify(signed,signal())).toBeNull();
 expect(active).toHaveBeenCalledTimes(4);
});
it('verifies the second approved asymmetric algorithm with its own public key',async()=>{
 const rsa=await generateKeyPair('RS256');const publicKey=await exportJWK(rsa.publicKey);publicKey.kid='rsa-fixture';
 const now=Math.floor(Date.now()/1000);const signed=await new SignJWT({iss:issuer,aud:'authenticated',sub:owner,session_id:session,role:'authenticated',is_anonymous:false,iat:now,exp:now+60})
 .setProtectedHeader({alg:'RS256',kid:'rsa-fixture'}).sign(rsa.privateKey);
 const verify=createIdentityVerifier(url,createLocalJWKSet({keys:[publicKey]}),{active:async()=>true});
 expect((await verify.verify(signed,signal()))?.ownerId).toBe(owner);
});

it('accepts a signed expired token only for refresh identity while preserving primary-session checks',async()=>{
 const now=Math.floor(Date.now()/1000),active=vi.fn(async()=>true),verifier=createIdentityVerifier(url,keys,{active});
 const jwt=await token({iat:now-3600,exp:now-1});
 expect(await verifier.verify(jwt,signal())).toBeNull();expect(await verifier.verifyRecovery(jwt,signal())).toBeNull();
 const proof=await verifier.verifyRefresh(jwt,signal());expect(proof?.ownerId).toBe(owner);expect(await proof?.isCurrent(signal())).toBe(true);
 active.mockResolvedValue(false);expect(await proof?.isCurrent(signal())).toBe(false);expect(await verifier.verifyRefresh(jwt,signal())).toBeNull();
});
it('refuses old, future-not-before and invalid lifetime refresh identities',async()=>{
 const now=Math.floor(Date.now()/1000),active=vi.fn(async()=>true),verifier=createIdentityVerifier(url,keys,{active});
 for(const claims of [{iat:now-604800,exp:now-604700},{iat:now-100,exp:now-200},{iat:now-100,exp:now-1,nbf:now+1}])expect(await verifier.verifyRefresh(await token(claims),signal())).toBeNull();
 expect(active).not.toHaveBeenCalled();
});
