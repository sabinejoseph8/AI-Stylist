import {it,expect,vi} from 'vitest';
import {createServer,request as httpRequest} from 'node:http';
import type {AddressInfo} from 'node:net';
import {createAccountHost} from '../src/server/account-host.ts';
const origin='https://stylist.test';
function setup(){
 const handle=vi.fn(async()=>new Response(JSON.stringify({status:'signedIn'}),{headers:{'content-type':'application/json'}}));
 const accounts={routes:()=>new Map([['/api/account/password',{handle}],['/api/account/sign-out',{handle}]]),expireRecovery:vi.fn(async()=>true),close:vi.fn(async()=>true),cleanupHeld:vi.fn(()=>false)};
 const call=vi.fn(async(name:string):Promise<unknown>=>name==='stylist_expire_media_receipts'?0:{allowed:true,retryAfter:0});
 return {accounts,call,operation:handle,host:createAccountHost(origin,accounts,{call},{intervalMs:1000,deadlineMs:30})};
}
async function harness(host:ReturnType<typeof createAccountHost>){
 const server=createServer(host.handle);await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const send=(path='/api/account/password')=>new Promise<number>((resolve,reject)=>{const req=httpRequest({host:'127.0.0.1',port:(server.address() as AddressInfo).port,path,method:'POST',headers:{host:'stylist.test',origin,'content-type':'application/json'}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode!));});req.on('error',reject);req.end('{}');});
 return {send,close:()=>new Promise<void>(resolve=>server.close(()=>resolve()))};
}
it('does no work on construction, gates HTTP on successful initial maintenance and closes idempotently',async()=>{
 const {host,accounts,call,operation}=setup();const h=await harness(host);
 try{
  expect(host.health().status).toBe('inactive');expect(await host.maintain()).toBe(false);expect(call).not.toHaveBeenCalled();expect(accounts.expireRecovery).not.toHaveBeenCalled();expect(await h.send()).toBe(503);expect(operation).not.toHaveBeenCalled();
  expect(await host.start()).toBe(true);expect(host.health().status).toBe('ready');expect(call).toHaveBeenCalledWith('stylist_expire_media_receipts',{p_limit:100},expect.any(AbortSignal));expect(await h.send()).toBe(200);
  const closing=host.close();expect(host.close()).toBe(closing);expect(await closing).toBe(true);expect(await h.send()).toBe(503);expect(host.health().status).toBe('closed');expect(await host.start()).toBe(false);
 }finally{await host.close();await h.close();}
});
it('fails closed after maintenance failure while sign-out remains available',async()=>{
 const {host,call,operation}=setup();const h=await harness(host);
 try{
  await host.start();call.mockImplementation(async()=>{throw Error('private');});expect(await host.maintain()).toBe(false);expect(await h.send()).toBe(503);
  // Sign-out does not consume the failed durable limiter; its account handler still authorizes it.
  expect(await h.send('/api/account/sign-out')).toBe(200);expect(operation).toHaveBeenCalledTimes(1);
 }finally{await host.close();await h.close();}
});
it('retains non-cooperative maintenance ownership, refuses overlap and reports uncertain shutdown',async()=>{
 const {accounts,call}=setup();let release!:(x:unknown)=>void;
 const port={call:vi.fn(()=>new Promise<unknown>(resolve=>release=resolve))};const host=createAccountHost(origin,accounts,port,{deadlineMs:5});
 expect(await host.start()).toBe(false);expect(host.health().cleanupUnconfirmed).toBe(true);expect(await host.maintain()).toBe(false);expect(port.call).toHaveBeenCalledTimes(1);expect(await host.close()).toBe(false);
 release(0);await new Promise(resolve=>setTimeout(resolve,0));expect(host.health().status).toBe('closed');expect(call).not.toHaveBeenCalled();
});
it('schedules bounded nonoverlapping maintenance only after explicit start and stops on close',async()=>{
 vi.useFakeTimers();try{
  const {host,accounts}=setup();await host.start();expect(accounts.expireRecovery).toHaveBeenCalledTimes(1);await vi.advanceTimersByTimeAsync(1000);expect(accounts.expireRecovery).toHaveBeenCalledTimes(2);await host.close();await vi.advanceTimersByTimeAsync(2000);expect(accounts.expireRecovery).toHaveBeenCalledTimes(2);
 }finally{vi.useRealTimers();}
});
it('refuses a cleanup hold and invalid expiry acknowledgments',async()=>{
 const {host,accounts,call}=setup();accounts.cleanupHeld.mockReturnValue(true);expect(await host.start()).toBe(false);accounts.cleanupHeld.mockReturnValue(false);call.mockResolvedValue(101);expect(await host.maintain()).toBe(false);call.mockResolvedValue(0);expect(await host.maintain()).toBe(true);expect(await host.close()).toBe(true);
});

it('cancels a waiting admission on shutdown and refuses its late acknowledgment',async()=>{
 const {accounts,call,operation}=setup();let release!:(x:unknown)=>void,admissionSignal:AbortSignal|undefined;
 const host=createAccountHost(origin,accounts,{call:async(name,payload,signal)=>name==='stylist_expire_media_receipts'?0:new Promise(resolve=>{admissionSignal=signal;release=resolve;})},{deadlineMs:100});
 const h=await harness(host);try{
  await host.start();const pending=h.send();await vi.waitFor(()=>expect(admissionSignal).toBeDefined());expect(await host.close()).toBe(false);expect(admissionSignal!.aborted).toBe(true);expect(await pending).toBe(503);release({allowed:true,retryAfter:0});await new Promise(resolve=>setTimeout(resolve,0));expect(operation).not.toHaveBeenCalled();expect(call).not.toHaveBeenCalled();
 }finally{await host.close();await h.close();}
});
