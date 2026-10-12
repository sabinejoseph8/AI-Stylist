import {describe,it,expect,vi} from 'vitest';
import {generateKeyPair,exportJWK,createLocalJWKSet,SignJWT} from 'jose';
import {createIdentityVerifier} from '../src/server/verified-identity.ts';
import {createRequestIdentity} from '../src/server/request-identity.ts';
const origin='https://stylist.example';const cookie='__Host-stylist_access=aaa.bbb.ccc';
const signal=()=>new AbortController().signal;
describe('prepared request account identity',()=>{
 it('passes only the cookie token to the trusted verifier',async()=>{
  const identity={ownerId:'signed-owner',isCurrent:async()=>true};const verify=vi.fn(async()=>identity);
  const gate=createRequestIdentity(origin,{verify});
  expect(await gate(new Request(origin+'/api/media',{headers:{cookie,'sec-fetch-site':'same-origin'}}),signal())).toBe(identity);
  expect(verify).toHaveBeenCalledWith('aaa.bbb.ccc',expect.any(AbortSignal));
 });
 it('refuses cross-site, foreign-origin, ambiguous and malformed credentials before verification',async()=>{
  const verify=vi.fn();const gate=createRequestIdentity(origin,{verify});
  const requests=[
   new Request('https://other.example/api',{headers:{cookie}}),
   new Request(origin+'/api?access_token=aaa.bbb.ccc',{headers:{cookie}}),
   ...([{'sec-fetch-site':'cross-site'},{'sec-fetch-site':'same-site'},{origin:'https://other.example'},{origin:'null'},{host:'other.example'},{authorization:'Bearer aaa.bbb.ccc'},{cookie:cookie+'; '+cookie},{cookie:'__Host-stylist_access=%61aa.bbb.ccc'},{cookie:'__Host-stylist_access="aaa.bbb.ccc"'},{cookie:'__Host-stylist_access='},{cookie:'broken; '+cookie}] as Record<string,string>[]).map(headers=>new Request(origin+'/api',{headers:{cookie,...headers}})),
   new Request(origin+'/api'),
  ];
  for(const request of requests)expect(await gate(request,signal())).toBeNull();
  expect(verify).not.toHaveBeenCalled();
 });
 it('requires an exact origin on mutations and ignores supplied owner headers',async()=>{
  const verify=vi.fn(async()=>({ownerId:'verified',isCurrent:async()=>true}));const gate=createRequestIdentity(origin,{verify});
  expect(await gate(new Request(origin+'/api',{method:'POST',headers:{cookie}}),signal())).toBeNull();
  expect((await gate(new Request(origin+'/api',{method:'POST',headers:{cookie,origin,'x-owner-id':'attacker','x-forwarded-host':'attacker'}}),signal()))?.ownerId).toBe('verified');
 });
 it('fails closed on errors and cancellation before and after verification',async()=>{
  const controller=new AbortController();const request=new Request(origin+'/api',{headers:{cookie}});
  const gate=createRequestIdentity(origin,{verify:async()=>{controller.abort();return {ownerId:'owner',isCurrent:async()=>true};}});
  expect(await gate(request,controller.signal)).toBeNull();
  const verify=vi.fn();expect(await createRequestIdentity(origin,{verify})(request,controller.signal)).toBeNull();expect(verify).not.toHaveBeenCalled();
  expect(await createRequestIdentity(origin,{verify:async()=>{throw Error('private');}})(request,signal())).toBeNull();
  expect(()=>createRequestIdentity('http://stylist.example',{verify})).toThrow();
 });
 it('uses a generated signed identity and rejects it after session revocation',async()=>{
  const owner='11111111-1111-4111-8111-111111111111',session='22222222-2222-4222-8222-222222222222';
  const pair=await generateKeyPair('ES256');let active=true;
  const verifier=createIdentityVerifier('https://example.supabase.co',createLocalJWKSet({keys:[{...await exportJWK(pair.publicKey),kid:'test'}]}),{active:async()=>active});
  const token=await new SignJWT({session_id:session,role:'authenticated',is_anonymous:false}).setProtectedHeader({alg:'ES256',kid:'test'}).setSubject(owner).setIssuer('https://example.supabase.co/auth/v1').setAudience('authenticated').setIssuedAt().setExpirationTime('5m').sign(pair.privateKey);
  const gate=createRequestIdentity(origin,verifier);const request=new Request(origin+'/api',{headers:{cookie:'__Host-stylist_access='+token}});
  expect((await gate(request,signal()))?.ownerId).toBe(owner);
  active=false;expect(await gate(request,signal())).toBeNull();
 });

});
