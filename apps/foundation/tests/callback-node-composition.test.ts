import {createAccountComposition} from '../src/server/account-composition.ts';
import {it,expect,vi} from 'vitest';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {createServer,request as httpRequest} from 'node:http';
import type {AddressInfo} from 'node:net';
import {createAccountSecurity} from '../src/server/account-security.ts';
import {createIdentityVerifier} from '../src/server/verified-identity.ts';
import {createRecoveryProvider} from '../src/server/recovery-provider.ts';
import {createAccountNodeListener,type AccountNodeRoute} from '../src/server/account-node.ts';
const origin='https://stylist.example',project='https://example.supabase.co';
const owner='11111111-1111-4111-8111-111111111111',sessionId='22222222-2222-4222-8222-222222222222';
async function fixture(){
 const pair=await generateKeyPair('ES256');let alive=true;
 const jwt=await new SignJWT({session_id:sessionId,role:'authenticated',is_anonymous:false,amr:[{method:'recovery',timestamp:Math.floor(Date.now()/1000)}]}).setProtectedHeader({alg:'ES256',kid:'fixture'}).setSubject(owner).setIssuer(project+'/auth/v1').setAudience('authenticated').setIssuedAt().setExpirationTime('5m').sign(pair.privateKey);
 const security=createAccountSecurity({appOrigin:origin,projectUrl:project,fetch:async()=>Response.json({keys:[{...await exportJWK(pair.publicKey),kid:'fixture'}]}),rpc:{call:async()=>alive}});
 return {jwt,security,verifier:createIdentityVerifier(project,async()=>pair.publicKey,{active:async()=>alive}),revoke:vi.fn(async()=>{alive=false;return true;}),presence:{confirm:async()=>alive?{status:'unconfirmed'}:{status:'revoked',ownerId:owner,sessionId}}};
}
function composition(security:Awaited<ReturnType<typeof fixture>>['security'],overrides:Partial<Parameters<typeof createAccountComposition>[3]>){
 const unexpected=async()=>{throw Error('Unexpected provider operation');};
 return createAccountComposition(origin,project,security,{password:{password:unexpected},exchange:{exchange:unexpected},refresh:{refresh:unexpected},signOut:{revoke:unexpected},recovery:{exchange:unexpected},recoveryRequest:{request:unexpected},...overrides});
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
it('delivers signed recovery only to a reset cookie over Node HTTP',async()=>{
 const f=await fixture(),updatePassword=vi.fn(async()=>true);
 const provider=createRecoveryProvider({exchange:async()=>({access_token:f.jwt,token_type:'bearer'}),updatePassword,revoke:f.revoke},f.verifier,f.presence);
 const app=composition(f.security,{recovery:provider});
 const h=await harness('/auth/callback/recovery',app.routes().get('/auth/callback/recovery')!),flow=f.security.callbacks.begin('recovery');
 try{const reply=await h.send(flow.callbackUrl+'&code=synthetic',flow.cookie.split(';')[0]);expect(reply.location).toBe('/account/reset');expect(reply.cookies).toHaveLength(2);expect(reply.cookies.join('')).not.toContain('__Host-stylist_access');expect(reply.cookies[0]).toMatch(/^__Host-stylist_reset=/);expect(reply.body).toBe('');expect(updatePassword).not.toHaveBeenCalled();}
 finally{await h.close();expect(await app.close()).toBe(true);expect(f.revoke).toHaveBeenCalledOnce();}
});
for(const mode of ['disconnect','shutdown'] as const)it(`revokes late factory recovery after ${mode} without reset permission`,async()=>{
 const f=await fixture(),updatePassword=vi.fn(async()=>true);
 let release!:(value:unknown)=>void,started!:()=>void;const began=new Promise<void>(resolve=>started=resolve);
 const provider=createRecoveryProvider({exchange:()=>{started();return new Promise(resolve=>release=resolve);},updatePassword,revoke:f.revoke},f.verifier,f.presence);
 const app=composition(f.security,{recovery:provider});
 const h=await harness('/auth/callback/recovery',app.routes().get('/auth/callback/recovery')!),flow=f.security.callbacks.begin('recovery');
 try{
  const req=h.open(flow.callbackUrl+'&code=synthetic',flow.cookie.split(';')[0]);req.on('error',()=>{});req.end();await began;if(mode==='shutdown')await app.close();req.destroy();await new Promise(resolve=>setTimeout(resolve,20));release({access_token:f.jwt,token_type:'bearer'});
  await vi.waitFor(()=>expect(f.revoke).toHaveBeenCalledOnce());await new Promise(resolve=>setTimeout(resolve,20));expect(app.cleanupHeld()).toBe(false);expect(updatePassword).not.toHaveBeenCalled();
  // Independent cleanup identity verification correlates absence without restoring reset permission.
 }finally{release?.({access_token:f.jwt,token_type:'bearer'});await h.close();expect(await app.close()).toBe(true);}
});
it.each(['google','apple'])('MVP composition mounts no %s callback and cannot exchange its credential',async(provider)=>{
 const f=await fixture(),exchange=vi.fn(),app=composition(f.security,{exchange:{exchange}});
 expect(app.routes().has('/auth/callback/apple')).toBe(false);expect(app.routes().has('/auth/callback/google')).toBe(false);
 const h=await harness('/auth/callback/recovery',app.routes().get('/auth/callback/recovery')!);
 try{const reply=await h.send(origin+'/auth/callback/'+provider+'?code=synthetic','');expect(reply.status).toBe(404);expect(exchange).not.toHaveBeenCalled();}finally{await h.close();await app.close();}
});
