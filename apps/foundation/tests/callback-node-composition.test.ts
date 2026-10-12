import {it,expect,vi} from 'vitest';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {createServer,request as httpRequest} from 'node:http';
import type {AddressInfo} from 'node:net';
import {createAccountSecurity} from '../src/server/account-security.ts';
import {createIdentityVerifier} from '../src/server/verified-identity.ts';
import {createAccountExchange} from '../src/server/account-exchange.ts';
import {createOAuthCallbackHttp} from '../src/server/oauth-callback-http.ts';
import {createRecoveryProvider} from '../src/server/recovery-provider.ts';
import {createAccountRecovery} from '../src/server/account-recovery.ts';
import {createRecoveryBrowser} from '../src/server/recovery-browser.ts';
import {createRecoveryCallbackHttp} from '../src/server/recovery-callback-http.ts';
import {createAccountNodeListener,type AccountNodeRoute} from '../src/server/account-node.ts';
const origin='https://stylist.example',project='https://example.supabase.co';
const owner='11111111-1111-4111-8111-111111111111',sessionId='22222222-2222-4222-8222-222222222222';
async function fixture(){
 const pair=await generateKeyPair('ES256');let alive=true;
 const jwt=await new SignJWT({session_id:sessionId,role:'authenticated',is_anonymous:false,amr:[{method:'recovery',timestamp:Math.floor(Date.now()/1000)}]}).setProtectedHeader({alg:'ES256',kid:'fixture'}).setSubject(owner).setIssuer(project+'/auth/v1').setAudience('authenticated').setIssuedAt().setExpirationTime('5m').sign(pair.privateKey);
 const security=createAccountSecurity({appOrigin:origin,projectUrl:project,fetch:async()=>Response.json({keys:[{...await exportJWK(pair.publicKey),kid:'fixture'}]}),rpc:{call:async()=>alive}});
 return {jwt,security,verifier:createIdentityVerifier(project,async()=>pair.publicKey,{active:async()=>alive}),revoke:vi.fn(async()=>{alive=false;return true;}),presence:{confirm:async()=>alive?{status:'unconfirmed'}:{status:'revoked',ownerId:owner,sessionId}}};
}
async function harness(path:string,route:AccountNodeRoute){
 const server=createServer(createAccountNodeListener(origin,new Map([[path,route]])));
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=(server.address() as AddressInfo).port;
 const open=(url:string,cookie:string)=>httpRequest({host:'127.0.0.1',port,path:new URL(url).pathname+new URL(url).search,method:'GET',headers:{host:'stylist.example',cookie}});
 const send=(url:string,cookie:string)=>new Promise<{status:number;location:string|undefined;cookies:string[];body:string}>((resolve,reject)=>{
  const req=open(url,cookie);req.on('response',res=>{let body='';res.on('data',part=>body+=part);res.on('end',()=>resolve({status:res.statusCode!,location:res.headers.location,cookies:res.headers['set-cookie']??[],body}));});req.on('error',reject);req.end();
 });
 return {open,send,close:()=>new Promise<void>(resolve=>server.close(()=>resolve()))};
}
for(const provider of ['google','apple'] as const)it(`delivers verified ${provider} callback cookies over Node HTTP and refuses replay`,async()=>{
 const f=await fixture(),discard=vi.fn(async()=>true),adopt=vi.fn(async()=>true),exchange=vi.fn(async()=>({accessToken:f.jwt,adopt,discard}));
 const http=createOAuthCallbackHttp(origin,createAccountExchange(f.security,origin,{exchange}),f.security.callbacks);
 const h=await harness('/auth/callback/'+provider,{handle:(request,signal)=>http.handle(request,provider,signal),discardResponse:http.discardResponse});
 const flow=f.security.callbacks.begin(provider,'/wardrobe'),url=flow.callbackUrl+'&code=synthetic',cookie=flow.cookie.split(';')[0];
 try{
  const reply=await h.send(url,cookie);expect(reply.status).toBe(303);expect(reply.location).toBe('/wardrobe');expect(reply.cookies).toHaveLength(2);expect(reply.cookies[0]).toContain('HttpOnly; SameSite=Strict');expect(reply.body).toBe('');expect(adopt).toHaveBeenCalledOnce();
  const replay=await h.send(url,cookie);expect(replay.location).toBe('/account?status=unavailable');expect(exchange).toHaveBeenCalledOnce();expect(discard).not.toHaveBeenCalled();
 }finally{await h.close();}
});
it('delivers signed recovery only to a reset cookie over Node HTTP',async()=>{
 const f=await fixture(),browser=createRecoveryBrowser(origin),updatePassword=vi.fn(async()=>true);
 const provider=createRecoveryProvider({exchange:async()=>({access_token:f.jwt,token_type:'bearer'}),updatePassword,revoke:f.revoke},f.verifier,f.presence);
 const http=createRecoveryCallbackHttp(origin,createAccountRecovery(f.security,provider),browser,f.security.callbacks);
 const h=await harness('/auth/callback/recovery',http),flow=f.security.callbacks.begin('recovery');
 try{const reply=await h.send(flow.callbackUrl+'&code=synthetic',flow.cookie.split(';')[0]);expect(reply.location).toBe('/account/reset');expect(reply.cookies).toHaveLength(2);expect(reply.cookies.join('')).not.toContain('__Host-stylist_access');expect(reply.cookies[0]).toMatch(/^__Host-stylist_reset=/);expect(reply.body).toBe('');expect(updatePassword).not.toHaveBeenCalled();}
 finally{await h.close();expect(await browser.close()).toBe(true);expect(f.revoke).toHaveBeenCalledOnce();}
});
it('cleans a signed OAuth session arriving after the HTTP client disconnects',async()=>{
 const f=await fixture();let release!:(value:{accessToken:string;discard:()=>Promise<boolean>})=>void,started!:()=>void;
 const began=new Promise<void>(resolve=>started=resolve),discard=vi.fn(async()=>true);
 const exchange=vi.fn(()=>{started();return new Promise<{accessToken:string;discard:()=>Promise<boolean>}>(resolve=>release=resolve);});
 const service=createAccountExchange(f.security,origin,{exchange}),http=createOAuthCallbackHttp(origin,service,f.security.callbacks);
 const h=await harness('/auth/callback/google',{handle:(r,s)=>http.handle(r,'google',s),discardResponse:http.discardResponse}),flow=f.security.callbacks.begin('google');
 try{const req=h.open(flow.callbackUrl+'&code=synthetic',flow.cookie.split(';')[0]);req.on('error',()=>{});req.end();await began;req.destroy();await new Promise(resolve=>setTimeout(resolve,20));release({accessToken:f.jwt,discard});await vi.waitFor(()=>expect(discard).toHaveBeenCalledOnce());expect(service.cleanupHeld()).toBe(false);}
 finally{release?.({accessToken:f.jwt,discard});await h.close();}
});
it('revokes a late recovery result after disconnect without installing reset permission',async()=>{
 const f=await fixture(),browser=createRecoveryBrowser(origin),updatePassword=vi.fn(async()=>true);
 let release!:(value:unknown)=>void,started!:()=>void;const began=new Promise<void>(resolve=>started=resolve);
 const provider=createRecoveryProvider({exchange:()=>{started();return new Promise(resolve=>release=resolve);},updatePassword,revoke:f.revoke},f.verifier,f.presence);
 const recovery=createAccountRecovery(f.security,provider),http=createRecoveryCallbackHttp(origin,recovery,browser,f.security.callbacks);
 const h=await harness('/auth/callback/recovery',http),flow=f.security.callbacks.begin('recovery');
 try{
  const req=h.open(flow.callbackUrl+'&code=synthetic',flow.cookie.split(';')[0]);req.on('error',()=>{});req.end();await began;req.destroy();await new Promise(resolve=>setTimeout(resolve,20));release({access_token:f.jwt,token_type:'bearer'});
  await vi.waitFor(()=>expect(f.revoke).toHaveBeenCalledOnce());await new Promise(resolve=>setTimeout(resolve,20));expect(recovery.cleanupHeld()).toBe(false);expect(updatePassword).not.toHaveBeenCalled();
  // Independent cleanup identity verification correlates absence without restoring reset permission.
 }finally{release?.({access_token:f.jwt,token_type:'bearer'});await h.close();expect(await browser.close()).toBe(true);}
});
