import {it,expect,vi} from 'vitest';
import {createServer,request as httpRequest} from 'node:http';
import type {AddressInfo} from 'node:net';
import {createAccountNodeListener} from '../src/server/account-node.ts';
import {createAccountJsonBoundary,accountJsonResponse} from '../src/server/account-json.ts';
const origin='https://stylist.example',path='/api/account/password';
async function harness(handle:(r:Request,s:AbortSignal)=>Promise<Response>,discardResponse=vi.fn(async()=>true)){
 const server=createServer(createAccountNodeListener(origin,new Map([[path,{handle,discardResponse}]])));
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
