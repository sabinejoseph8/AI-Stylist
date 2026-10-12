import {it,expect,vi} from 'vitest';
import {createServer,request as httpRequest} from 'node:http';
import type {AddressInfo} from 'node:net';
import {createAccountWebsite} from '../src/server/account-website.ts';
const origin='https://stylist.test',project='https://fixture.supabase.co',html='<html><head><meta name="stylist-project-origin" content=""></head></html>';
it('serves bounded immutable pages/assets with strict host, routes and headers; delegates only other routes',async()=>{
 const asset=new Uint8Array([65]),handle=vi.fn(async(_q,r)=>{r.writeHead(404);r.end();});
 const listener=createAccountWebsite(origin,project,{handle},html,new Map([['/assets/test-123.js',asset]]));asset[0]=66;
 const server=createServer(listener);await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const send=(path:string,method='GET',host='stylist.test')=>new Promise<{status:number;body:string;headers:Record<string,unknown>}>((resolve,reject)=>{const req=httpRequest({host:'127.0.0.1',port:(server.address() as AddressInfo).port,path,method,headers:{host}},res=>{let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>resolve({status:res.statusCode!,body,headers:res.headers}));});req.on('error',reject);req.end();});
 try{
  for(const path of ['/account','/account/reset','/account?status=canceled']){const reply=await send(path);expect(reply.status).toBe(200);expect(reply.body).toContain(project);expect(reply.headers['cache-control']).toBe('no-store');expect(reply.headers['content-security-policy']).toContain("frame-ancestors 'none'");}
  expect((await send('/assets/test-123.js')).body).toBe('A');expect((await send('/account','HEAD')).body).toBe('');
  for(const path of ['/account/reset?token=secret','/assets/test-123.js?x=1','/account?status=other','/account/../account'])expect((await send(path)).status).toBe(400);
  expect((await send('/account','POST')).status).toBe(405);expect((await send('/account','GET','foreign.test')).status).toBe(400);expect(handle).not.toHaveBeenCalled();
  expect((await send('/account/recovery?token_hash=synthetic')).status).toBe(404);expect(handle).toHaveBeenCalledOnce();
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
it('rejects unsafe configuration, oversized builds and arbitrary asset paths',()=>{
 const host={handle:vi.fn()};for(const path of ['/secret.env','/assets/../secret.js','/assets/test.js.map'])expect(()=>createAccountWebsite(origin,project,host,html,new Map([[path,new Uint8Array([1])]]))).toThrow();
 expect(()=>createAccountWebsite(origin,project,host,html.replace('content=""','content="unknown"'),new Map([['/assets/test.js',new Uint8Array([1])]]))).toThrow();
 expect(()=>createAccountWebsite(origin,'https://foreign.test',host,html,new Map([['/assets/test.js',new Uint8Array([1])]]))).toThrow();
});
