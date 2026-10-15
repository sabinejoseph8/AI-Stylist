/** Synthetic feasibility investigation. No real accounts, provider requests or trusted Render proxy. */
import {expect,it,vi} from 'vitest';
import {generateKeyPair,exportJWK,createLocalJWKSet,SignJWT} from 'jose';
import {createIdentityVerifier} from '../src/server/verified-identity.ts';
import {createServer,request as httpRequest} from 'node:http';
import type {AddressInfo} from 'node:net';
import {createAccountNodeListener} from '../src/server/account-node.ts';
import {createAccountTransport} from '../src/server/account-transport.ts';
import {createAccountJsonBoundary,accountJsonResponse} from '../src/server/account-json.ts';
import {createRecoveryProviderHttp} from '../src/server/recovery-provider-http.ts';
const origin='https://stylist.example',path='/api/account/recovery-code';
const email='sample@example.test',code='012345',key='synthetic-code-investigation-key';
const signal=()=>new AbortController().signal;
it('keeps recovery proof in a fixed-purpose POST body and contains provider tokens on the server',async()=>{
 const fetcher=vi.fn(async(_url:string,_init:RequestInit)=>Response.json({access_token:'synthetic-private-token',refresh_token:'synthetic-private-refresh'}));
 const provider=createRecoveryProviderHttp('https://example.supabase.co',origin,key,fetcher);
 const operation=vi.fn(async(input:unknown)=>{
  await provider.verifyRecoveryCode(input as {email:string;code:string},signal());
  // Investigation only: no grant, account session or reset authority is created.
  return accountJsonResponse(200,'investigationOnly');
 });
 const handle=createAccountJsonBoundary(origin,path,operation);
 const response=await handle(new Request(origin+path,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({email,code})}),signal());
 const [url,init]=fetcher.mock.calls[0];
 expect(url).toBe('https://example.supabase.co/auth/v1/verify');
 expect(JSON.parse(init.body as string)).toEqual({email,token:code,type:'recovery'});
 expect(init.method).toBe('POST');expect(init.redirect).toBe('error');expect(init.credentials).toBe('omit');
 expect(await response.text()).toBe('{"status":"investigationOnly"}');
 expect(response.headers.get('set-cookie')).toBeNull();expect(response.headers.get('cache-control')).toBe('no-store');
});
it.each(['', '12345','1234567','１２３４５６','123 45','123456\n'])('rejects malformed code %j before simulated provider work',async invalid=>{
 const fetcher=vi.fn(),provider=createRecoveryProviderHttp('https://example.supabase.co',origin,key,fetcher);
 await expect(provider.verifyRecoveryCode({email,code:invalid},signal())).rejects.toThrow('Supabase operation unavailable');expect(fetcher).not.toHaveBeenCalled();
});
it('rejects caller-selected purpose, redirect, identity fields and malformed email',async()=>{
 const fetcher=vi.fn(),provider=createRecoveryProviderHttp('https://example.supabase.co',origin,key,fetcher);
 for(const input of [{email,code,type:'email'},{email,code,redirect_to:'https://other.test'},{email,code,token_hash:'fixture'},{email:'sample\n@example.test',code},{email:'no-address',code}])await expect(provider.verifyRecoveryCode(input,signal())).rejects.toThrow('Supabase operation unavailable');
 expect(fetcher).not.toHaveBeenCalled();
});
it('rejects GET, URL proof, foreign/null Origin and wrong Host before verification',async()=>{
 const operation=vi.fn(async()=>accountJsonResponse(200,'investigationOnly')),handle=createAccountJsonBoundary(origin,path,operation);
 for(const [method,url,headers] of [
  ['GET',origin+path,{origin}],['POST',origin+path+'?code='+code,{origin}],['POST',origin+path+'#code='+code,{origin}],
  ['POST',origin+path,{origin:'https://other.test'}],['POST',origin+path,{origin:'null'}],['POST',origin+path,{origin,host:'other.test'}],
 ] as Array<[string,string,Record<string,string>]>) {
  const response=await handle(new Request(url,{method,headers:{...headers,'content-type':'application/json'},...(method==='POST'?{body:JSON.stringify({email,code})}:{})}),signal());expect(response.status).toBe(400);
 }
 expect(operation).not.toHaveBeenCalled();
});
it('retains cancellation, response bounds and generic provider failure for code requests',async()=>{
 const canceled=new AbortController();canceled.abort();const fetcher=vi.fn();
 await expect(createRecoveryProviderHttp('https://example.supabase.co',origin,key,fetcher).verifyRecoveryCode({email,code},canceled.signal)).rejects.toThrow();expect(fetcher).not.toHaveBeenCalled();
 for(const response of [Response.json({error:'synthetic-sensitive-error'},{status:400}),Response.json({value:'x'.repeat(70000)})])await expect(createRecoveryProviderHttp('https://example.supabase.co',origin,key,async()=>response).verifyRecoveryCode({email,code},signal())).rejects.toThrow('Supabase operation unavailable');
});
async function loopback(guarded:boolean){
 const operation=vi.fn(async(_input:unknown,request:Request)=>{
  expect(request.url).toBe(origin+path);return accountJsonResponse(200,'investigationOnly');
 });
 const listener=createAccountNodeListener(origin,new Map([[path,{handle:createAccountJsonBoundary(origin,path,operation)}]]));
 // Bare adapter deliberately demonstrates URL canonicalization is NOT transport security.
 const server=createServer(guarded?createAccountTransport(origin,listener):listener);
 await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>{server.removeListener('error',reject);resolve();});});
 const send=(host='stylist.example',source=origin)=>new Promise<number>((resolve,reject)=>{
  const req=httpRequest({host:'127.0.0.1',port:(server.address() as AddressInfo).port,path,method:'POST',headers:{host,origin:source,'content-type':'application/json','x-forwarded-host':'evil.example','x-forwarded-proto':'https',forwarded:'host=evil.example;proto=https'}},response=>{response.resume();response.on('end',()=>resolve(response.statusCode!));});
  req.on('error',reject);req.end(JSON.stringify({email,code}));
 });
 return {operation,send,close:()=>new Promise<void>(resolve=>server.close(()=>resolve()))};
}
it('uses configured origin despite forged forwarded headers, but bare adapter admits plaintext',async()=>{
 const h=await loopback(false);try{expect(await h.send()).toBe(200);expect(h.operation).toHaveBeenCalledOnce();}finally{await h.close();}
});
it('refuses foreign Host and Origin in the fixed-origin adapter',async()=>{
 const h=await loopback(false);try{expect(await h.send('evil.example')).toBe(400);expect(await h.send('stylist.example','https://evil.example')).toBe(400);expect(h.operation).not.toHaveBeenCalled();}finally{await h.close();}
});
it('keeps plaintext refused with the real transport guard even when HTTPS is claimed',async()=>{
 const h=await loopback(true);try{expect(await h.send()).toBe(400);expect(h.operation).not.toHaveBeenCalled();}finally{await h.close();}
});

it('does not equate a signed ordinary OTP identity with recovery-specific authority',async()=>{
 const pair=await generateKeyPair('ES256'),jwk=await exportJWK(pair.publicKey);jwk.kid='local-investigation';
 const verifier=createIdentityVerifier('https://example.supabase.co',createLocalJWKSet({keys:[jwk]}),{active:async()=>true});
 const now=Math.floor(Date.now()/1000);
 for(const method of ['otp','recovery']){
  const token=await new SignJWT({session_id:'00000000-0000-4000-8000-000000000002',role:'authenticated',is_anonymous:false,amr:[{method,timestamp:now}]})
   .setProtectedHeader({alg:'ES256',kid:jwk.kid}).setIssuer('https://example.supabase.co/auth/v1').setAudience('authenticated')
   .setSubject('00000000-0000-4000-8000-000000000001').setIssuedAt(now).setExpirationTime(now+300).sign(pair.privateKey);
  expect(await verifier.verify(token,signal())).not.toBeNull();
  expect((await verifier.verifyRecovery(token,signal()))!==null).toBe(method==='recovery');
 }
});
