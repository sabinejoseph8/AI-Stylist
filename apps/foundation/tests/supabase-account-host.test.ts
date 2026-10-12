import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {createRefreshEnvelopes} from '../src/server/refresh-envelope.ts';
import {it,expect,vi} from 'vitest';
import {createServer,request as httpRequest} from 'node:http';
import type {AddressInfo} from 'node:net';
import {createSupabaseAccountHost} from '../src/server/supabase-account-host.ts';
const origin='https://stylist.test',project='https://fixture.supabase.co';
function setup(){
 const calls:Array<{url:string;init:RequestInit}>=[];
 const fetcher=vi.fn(async(input:RequestInfo|URL,init?:RequestInit)=>{
  const url=String(input);calls.push({url,init:init!});
  if(url.endsWith('/rpc/stylist_expire_media_receipts'))return Response.json(0);
  if(url.endsWith('/rpc/stylist_consume_account_admission'))return Response.json({allowed:true,retryAfter:0});
  if(url.includes('/auth/v1/recover?'))return Response.json({});
  if(url.endsWith('/auth/v1/signup'))return Response.json({id:'11111111-1111-4111-8111-111111111111'});
  throw Error('Unexpected request');
 });
 const options={appOrigin:origin,projectUrl:project,serviceKey:'synthetic-service-key-only',fetch:fetcher,refreshKeyring:new Map([['test',new Uint8Array(32).fill(7)]]),activeRefreshKeyId:'test',initialExpiry:()=>Date.now()+60000,rotatedExpiry:()=>Date.now()+60000};
 return {calls,fetcher,options,host:createSupabaseAccountHost(options)};
}
async function harness(host:ReturnType<typeof createSupabaseAccountHost>){
 const server=createServer(host.handle);await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const send=(path:string,body:unknown)=>new Promise<{status:number;body:string;cookies:string[]}>((resolve,reject)=>{
  const req=httpRequest({host:'127.0.0.1',port:(server.address() as AddressInfo).port,path,method:'POST',headers:{host:'stylist.test',origin,'content-type':'application/json'}},res=>{let text='';res.on('data',chunk=>text+=chunk);res.on('end',()=>resolve({status:res.statusCode!,body:text,cookies:res.headers['set-cookie']??[]}));});req.on('error',reject);req.end(JSON.stringify(body));
 });return {send,close:()=>new Promise<void>(resolve=>server.close(()=>resolve()))};
}
it('constructs without work, defaults to approved lifetime, and rejects malformed policies',async()=>{
 const {options,host,fetcher}=setup();expect(fetcher).not.toHaveBeenCalled();expect(host.health().status).toBe('inactive');
 expect(Object.keys(host).sort()).toEqual(['close','handle','health','maintain','start']);
 expect(()=>createSupabaseAccountHost({...options,initialExpiry:null!})).toThrow('expiry');expect(()=>createSupabaseAccountHost({...options,rotatedExpiry:null!})).toThrow('expiry');await host.close();expect(fetcher).not.toHaveBeenCalled();
});
it('gates actual HTTP and composes admitted recovery with fixed server-only transport',async()=>{
 const {host,calls}=setup();const h=await harness(host);
 try{
  expect((await h.send('/api/account/recover',{email:'sample@example.test'})).status).toBe(503);expect(calls).toHaveLength(0);
  expect(await host.start()).toBe(true);
  const result=await h.send('/api/account/recover',{email:'sample@example.test'});expect(result.status).toBe(202);expect(result.body).not.toContain('synthetic-service-key');
  expect(calls.map(c=>new URL(c.url).pathname)).toEqual(['/rest/v1/rpc/stylist_expire_media_receipts','/rest/v1/rpc/stylist_consume_account_admission','/auth/v1/recover']);
  const recovery=calls[2];expect(recovery.init.redirect).toBe('error');expect(recovery.init.headers).toBeDefined();expect(JSON.parse(String(recovery.init.body))).toMatchObject({email:'sample@example.test',code_challenge_method:'S256'});
  expect(await host.close()).toBe(true);expect((await h.send('/api/account/recover',{email:'sample@example.test'})).status).toBe(503);expect(calls).toHaveLength(3);
 }finally{await host.close();await h.close();}
});
it('fails closed on maintenance errors before any provider operation',async()=>{
 const {options}=setup();const fetcher=vi.fn(async()=>Response.json({error:'private'}, {status:500}));const host=createSupabaseAccountHost({...options,fetch:fetcher});const h=await harness(host);
 try{expect(await host.start()).toBe(false);expect((await h.send('/api/account/recover',{email:'sample@example.test'})).status).toBe(503);expect(fetcher).toHaveBeenCalledOnce();}finally{await host.close();await h.close();}
});

it('composes registration confirmation without issuing a browser session',async()=>{
 const {host,calls}=setup();const h=await harness(host);
 try{await host.start();const result=await h.send('/api/account/password',{method:'signUp',email:'sample@example.test',password:'synthetic-password'});expect(result.status).toBe(200);expect(JSON.parse(result.body)).toEqual({status:'confirmationRequired'});expect(calls.map(c=>new URL(c.url).pathname)).toEqual(['/rest/v1/rpc/stylist_expire_media_receipts','/rest/v1/rpc/stylist_consume_account_admission','/auth/v1/signup']);}finally{await host.close();await h.close();}
});

it('verifies a signed current identity and encrypts initial refresh ownership before cookie delivery',async()=>{
 const {options}=setup(),owner='11111111-1111-4111-8111-111111111111',session='22222222-2222-4222-8222-222222222222';
 const pair=await generateKeyPair('ES256'),key={...await exportJWK(pair.publicKey),kid:'fixture'};
 const token=await new SignJWT({session_id:session,role:'authenticated',is_anonymous:false}).setProtectedHeader({alg:'ES256',kid:'fixture'}).setSubject(owner).setIssuer(project+'/auth/v1').setAudience('authenticated').setIssuedAt().setExpirationTime('5m').sign(pair.privateKey);
 const requests:Array<{path:string;body:Record<string,unknown>}>=[];let adopted:Record<string,unknown>|undefined;
 const fetcher=vi.fn(async(input:RequestInfo|URL,init?:RequestInit)=>{
  const url=new URL(String(input)),body=init?.body?JSON.parse(String(init.body)):{};requests.push({path:url.pathname,body});
  if(url.pathname.endsWith('/stylist_expire_media_receipts'))return Response.json(0);
  if(url.pathname.endsWith('/stylist_consume_account_admission'))return Response.json({allowed:true,retryAfter:0});
  if(url.pathname==='/auth/v1/token')return Response.json({access_token:token,refresh_token:'synthetic-refresh-secret',token_type:'bearer'});
  if(url.pathname.endsWith('/.well-known/jwks.json'))return Response.json({keys:[key]});
  if(url.pathname.endsWith('/stylist_auth_session_active')){expect(body).toEqual({p_owner:owner,p_session:session});return Response.json(true);}
  if(url.pathname.endsWith('/stylist_inspect_refresh'))return Response.json(null);
  if(url.pathname.endsWith('/stylist_adopt_refresh')){adopted=body;return Response.json(true);}
  throw Error('Unexpected synthetic operation');
 });
 const before=Date.now(),host=createSupabaseAccountHost({...options,fetch:fetcher,initialExpiry:undefined,rotatedExpiry:undefined});const h=await harness(host);
 try{
  expect(await host.start()).toBe(true);const reply=await h.send('/api/account/password',{method:'signIn',email:'sample@example.test',password:'synthetic-password'});
  expect(reply.status).toBe(200);expect(JSON.parse(reply.body)).toEqual({status:'signedIn'});expect(reply.cookies.some(cookie=>cookie.startsWith('__Host-stylist_access='+token+';'))).toBe(true);
  expect(reply.body).not.toContain(token);expect(reply.body).not.toContain('synthetic-refresh-secret');
  const expiry=adopted!.p_expiry as number;expect(expiry).toBeGreaterThanOrEqual(before+604800000);expect(expiry).toBeLessThanOrEqual(Date.now()+604800000);expect(reply.cookies.some(cookie=>/Max-Age=604[78][0-9]{2}; Expires=/.test(cookie))).toBe(true);
  expect(adopted).toMatchObject({p_owner:owner,p_session:session,p_expiry:expiry});expect(JSON.stringify(adopted)).not.toContain('synthetic-refresh-secret');
  const codec=createRefreshEnvelopes(options.refreshKeyring,options.activeRefreshKeyId);expect(codec.open(adopted!.p_envelope,{ownerId:owner,sessionId:session,generation:1,expiresAt:expiry})).toBe('synthetic-refresh-secret');
  const paths=requests.map(r=>r.path);expect(paths.indexOf('/rest/v1/rpc/stylist_auth_session_active')).toBeLessThan(paths.indexOf('/rest/v1/rpc/stylist_adopt_refresh'));
 }finally{await host.close();await h.close();}
});
