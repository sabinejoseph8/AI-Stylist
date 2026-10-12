import {describe,it,expect,vi,afterEach} from 'vitest';
import {generateKeyPair,exportJWK,SignJWT,jwtVerify} from 'jose';
import {createAuthKeys} from '../src/server/auth-keys.ts';
describe('prepared public signing keys',()=>{
 afterEach(()=>vi.useRealTimers());
 it('uses only the fixed endpoint and caches a generated public key',async()=>{
  const pair=await generateKeyPair('ES256');const jwk={...await exportJWK(pair.publicKey),kid:'one',alg:'ES256'};
  const request=vi.fn(async()=>new Response(JSON.stringify({keys:[jwk]})));
  const keys=createAuthKeys('https://example.supabase.co',request);
  const token=await new SignJWT({}).setProtectedHeader({alg:'ES256',kid:'one'}).sign(pair.privateKey);
  await jwtVerify(token,keys);await jwtVerify(token,keys);
  expect(request).toHaveBeenCalledTimes(1);
  expect(request.mock.calls[0]).toEqual(['https://example.supabase.co/auth/v1/.well-known/jwks.json',expect.objectContaining({redirect:'error',credentials:'omit'})]);
 });
 it('rejects private keys, oversized bodies and failed responses',async()=>{
  for(const response of [new Response(JSON.stringify({keys:[{kty:'RSA',kid:'one',d:'secret'}]})),new Response('x'.repeat(65537)),new Response('',{status:503})]){
   const keys=createAuthKeys('https://example.supabase.co',async()=>response);
   await expect(keys({alg:'RS256',kid:'one'},{payload:'',signature:'',protected:''})).rejects.toThrow();
  }
 });
 it('rejects foreign configuration and unsupported headers without fetching',async()=>{
  expect(()=>createAuthKeys('https://attacker.test',fetch)).toThrow();
  const request=vi.fn();const keys=createAuthKeys('https://example.supabase.co',request);
  await expect(keys({alg:'HS256',kid:'one'},{payload:'',signature:'',protected:''})).rejects.toThrow();expect(request).not.toHaveBeenCalled();
 });
 it('refreshes rotated keys after cooldown and refuses unknown-key request storms',async()=>{
  const first=await generateKeyPair('ES256'),second=await generateKeyPair('ES256');
  const a={...await exportJWK(first.publicKey),kid:'one',alg:'ES256'},b={...await exportJWK(second.publicKey),kid:'two',alg:'ES256'};
  vi.useFakeTimers();
  const request=vi.fn().mockImplementationOnce(async()=>new Response(JSON.stringify({keys:[a]}))).mockImplementation(async()=>new Response(JSON.stringify({keys:[b]})));
  const keys=createAuthKeys('https://example.supabase.co',request);
  const token=await new SignJWT({}).setProtectedHeader({alg:'ES256',kid:'one'}).sign(first.privateKey);
  const rotated=await new SignJWT({}).setProtectedHeader({alg:'ES256',kid:'two'}).sign(second.privateKey);
  await jwtVerify(token,keys);
  await expect(jwtVerify(rotated,keys)).rejects.toThrow();expect(request).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(30001);await jwtVerify(rotated,keys);expect(request).toHaveBeenCalledTimes(2);
  await expect(jwtVerify(token,keys)).rejects.toThrow();expect(request).toHaveBeenCalledTimes(2);
 });
 it('bounds ignored cancellation and retains one underlying request',async()=>{
  vi.useFakeTimers();const request=vi.fn(()=>new Promise<Response>(()=>{}));
  const keys=createAuthKeys('https://example.supabase.co',request,10);
  const token={payload:'',signature:'',protected:''};
  const first=expect(keys({alg:'RS256',kid:'one'},token)).rejects.toThrow();
  await vi.advanceTimersByTimeAsync(11);await first;
  const second=expect(keys({alg:'RS256',kid:'one'},token)).rejects.toThrow();
  await vi.advanceTimersByTimeAsync(11);await second;expect(request).toHaveBeenCalledTimes(1);
 });
 it('bounds stalled response bodies',async()=>{
  vi.useFakeTimers();const request=vi.fn(async()=>new Response(new ReadableStream({start(){}})));
  const keys=createAuthKeys('https://example.supabase.co',request,10);
  const result=expect(keys({alg:'RS256',kid:'one'},{payload:'',signature:'',protected:''})).rejects.toThrow();
  await vi.advanceTimersByTimeAsync(11);await result;expect(request).toHaveBeenCalledTimes(1);
 });

});
