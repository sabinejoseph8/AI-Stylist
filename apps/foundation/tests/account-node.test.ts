import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {createAccountSecurity} from '../src/server/account-security.ts';
import {createPasswordAccounts} from '../src/server/password-account.ts';
import {createPasswordHttp} from '../src/server/password-http.ts';
import {it,expect,vi} from 'vitest';
import {createServer,request as httpRequest} from 'node:http';
import type {AddressInfo} from 'node:net';
import {createAccountNodeListener} from '../src/server/account-node.ts';
import {createAccountJsonBoundary,accountJsonResponse} from '../src/server/account-json.ts';
const origin='https://stylist.example',path='/api/account/password';
async function harness(handle:(r:Request,s:AbortSignal)=>Promise<Response>,discardResponse:(response:Response)=>Promise<unknown>=vi.fn(async()=>true),deadlineMs=10000){
 const server=createServer(createAccountNodeListener(origin,new Map([[path,{handle,discardResponse}]]),deadlineMs));
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const port=(server.address() as AddressInfo).port;
 const send=(body='{}',host='stylist.example',source=origin)=>new Promise<{status:number;body:string;cookies:string[]}>((resolve,reject)=>{
  const req=httpRequest({host:'127.0.0.1',port,path,method:'POST',headers:{host,origin:source,'content-type':'application/json'}},res=>{let text='';res.setEncoding('utf8');res.on('data',part=>text+=part);res.on('end',()=>resolve({status:res.statusCode!,body:text,cookies:res.headers['set-cookie']??[]}));});req.on('error',reject);req.end(body);
 });
 return {send,port,discardResponse,close:()=>new Promise<void>(resolve=>server.close(()=>resolve()))};
}
it('preserves separate cookie headers and JSON over actual local HTTP',async()=>{
 const operation=vi.fn(async()=>accountJsonResponse(200,'signedIn',['a=one; Secure; HttpOnly','b=two; Secure; HttpOnly']));
 const h=await harness(createAccountJsonBoundary(origin,path,operation));
 try{const reply=await h.send();expect(reply.status).toBe(200);expect(JSON.parse(reply.body)).toEqual({status:'signedIn'});expect(reply.cookies).toHaveLength(2);expect(h.discardResponse).not.toHaveBeenCalled();}finally{await h.close();}
});
it('refuses wrong Host and Origin before handler provider work',async()=>{
 const operation=vi.fn(async()=>accountJsonResponse(200,'signedIn'));const h=await harness(createAccountJsonBoundary(origin,path,operation));
 try{expect((await h.send('{}','foreign.example')).status).toBe(400);expect((await h.send('{}','stylist.example','https://foreign.example')).status).toBe(400);expect(operation).not.toHaveBeenCalled();}finally{await h.close();}
});
it('discards a late returned response after the HTTP client disconnects',async()=>{
 let release!:(r:Response)=>void,started!:()=>void;const began=new Promise<void>(r=>started=r);
 const h=await harness(async()=>{started();return new Promise(r=>release=r);});
 try{
  const req=httpRequest({host:'127.0.0.1',port:h.port,path,method:'POST',headers:{host:'stylist.example',origin,'content-type':'application/json'}});req.on('error',()=>{});req.end('{}');await began;req.destroy();
  await new Promise(r=>setTimeout(r,20));release(accountJsonResponse(200,'signedIn'));await vi.waitFor(()=>expect(h.discardResponse).toHaveBeenCalledTimes(1));
 }finally{await h.close();}
});

it('bounds stalled response delivery and discards its session once',async()=>{
 const canceled=vi.fn(),cleanup=vi.fn(async()=>true);
 const h=await harness(async()=>new Response(new ReadableStream({cancel:canceled})),cleanup,30);
 try{await expect(h.send()).rejects.toThrow();await vi.waitFor(()=>expect(cleanup).toHaveBeenCalledTimes(1));expect(canceled).toHaveBeenCalledTimes(1);}finally{await h.close();}
});

it('composes actual password verification and cookie delivery over loopback HTTP',async()=>{
 const {security,token,owner,session}=await identityFixture();
 const discard=vi.fn(async()=>true),http=createPasswordHttp(origin,createPasswordAccounts(security,origin,{password:async()=>({accessToken:token,discard})}));
 const h=await harness(http.handle,vi.fn(http.discardResponse));
 try{
  const reply=await h.send(JSON.stringify({method:'signIn',email:'sample@example.test',password:'made-up'}));
  expect(reply.status).toBe(200);expect(JSON.parse(reply.body)).toEqual({status:'signedIn'});expect(reply.body).not.toContain(token);
  expect(reply.cookies).toHaveLength(1);expect(reply.cookies[0]).toContain('Secure; HttpOnly; SameSite=Strict');
  const identity=await security.authorize(new Request(origin+'/api/profile',{headers:{cookie:reply.cookies[0]!.split(';')[0]!}}),new AbortController().signal);
  expect(identity?.ownerId).toBe(owner);expect(identity?.sessionId).toBe(session);expect(discard).not.toHaveBeenCalled();
 }finally{await h.close();}
});
it('retains admission for timed-out handlers until they actually settle',async()=>{
 const releases:Array<(response:Response)=>void>=[],cleanup=vi.fn(async()=>true);
 const h=await harness(async()=>new Promise(resolve=>releases.push(resolve)),cleanup,50);
 try{
  const pending=Array.from({length:4},()=>h.send().catch(()=>null));
  await vi.waitFor(()=>expect(releases).toHaveLength(4));await Promise.all(pending);
  expect((await h.send()).status).toBe(429);expect(releases).toHaveLength(4);
  releases.forEach(resolve=>resolve(accountJsonResponse(200,'signedIn')));
  await vi.waitFor(()=>expect(cleanup).toHaveBeenCalledTimes(4));
 }finally{releases.forEach(resolve=>resolve(accountJsonResponse(400,'unavailable')));await h.close();}
});

async function identityFixture(){
 const pair=await generateKeyPair('ES256'),owner='11111111-1111-4111-8111-111111111111',session='22222222-2222-4222-8222-222222222222',project='https://example.supabase.co';
 const token=await new SignJWT({session_id:session,role:'authenticated',is_anonymous:false}).setProtectedHeader({alg:'ES256',kid:'test'}).setSubject(owner).setIssuer(project+'/auth/v1').setAudience('authenticated').setIssuedAt().setExpirationTime('5m').sign(pair.privateKey);
 const security=createAccountSecurity({appOrigin:origin,projectUrl:project,fetch:async()=>new Response(JSON.stringify({keys:[{...await exportJWK(pair.publicKey),kid:'test'}]})),rpc:{call:async()=>true}});
 return {security,token,owner,session};
}

it('cleans late adopted state after a real HTTP disconnect during sign-in',async()=>{
 const {security,token,session}=await identityFixture(),storage=new Map<string,string>();
 let release!:(value:boolean)=>void,started!:()=>void;const began=new Promise<void>(resolve=>started=resolve);
 const discard=vi.fn(async()=>{storage.clear();return true;}),adopt=vi.fn(async()=>{started();await new Promise<boolean>(resolve=>release=resolve);storage.set(session,'late-fixture');return true;});
 const http=createPasswordHttp(origin,createPasswordAccounts(security,origin,{password:async()=>({accessToken:token,adopt,discard})}));
 const h=await harness(http.handle,vi.fn(http.discardResponse));
 try{
  const req=httpRequest({host:'127.0.0.1',port:h.port,path,method:'POST',headers:{host:'stylist.example',origin,'content-type':'application/json'}});req.on('error',()=>{});
  req.end(JSON.stringify({method:'signIn',email:'sample@example.test',password:'made-up'}));await began;req.destroy();
  await new Promise(resolve=>setTimeout(resolve,20));expect(discard).not.toHaveBeenCalled();release(true);
  await vi.waitFor(()=>expect(discard).toHaveBeenCalledTimes(1));expect(storage.size).toBe(0);expect(adopt).toHaveBeenCalledTimes(1);
 }finally{release?.(false);await h.close();}
});
