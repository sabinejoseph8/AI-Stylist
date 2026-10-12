import {it,expect,vi} from 'vitest';
import {createSharedAccountAdmission,createSharedAdmissionPort} from '../src/server/account-admission-shared.ts';
const request=()=>new Request('https://stylist.test/api/account/password');const signal=()=>new AbortController().signal;
it('uses the fixed empty service RPC and shares durable decisions across separate guards',async()=>{
 let used=0;const call=vi.fn(async()=>({allowed:++used<=1,retryAfter:used<=1?0:60}));const port=createSharedAdmissionPort({call});const handle=vi.fn(async()=>new Response(null));
 const routes=new Map([['/api/account/password',{handle}]]);
 const one=createSharedAccountAdmission(routes,port).routes(),two=createSharedAccountAdmission(routes,port).routes();
 expect((await one.get('/api/account/password')!.handle(request(),signal())).status).toBe(200);
 const blocked=await two.get('/api/account/password')!.handle(request(),signal());expect(blocked.status).toBe(429);expect(blocked.headers.get('retry-after')).toBe('60');expect(handle).toHaveBeenCalledTimes(1);
 expect(call.mock.calls[0]?.slice(0,2)).toEqual(['stylist_consume_account_admission',{}]);
});
it('fails closed for invalid, throwing or canceled acknowledgments without provider calls',async()=>{
 const handle=vi.fn(async()=>new Response(null)),routes=new Map([['password',{handle}]]);
 for(const value of [null,true,{allowed:true,retryAfter:1},{allowed:false,retryAfter:0},{allowed:false,retryAfter:61},{allowed:true,retryAfter:0,extra:true}]){
  const guarded=createSharedAccountAdmission(routes,{consume:async()=>value}).routes().get('password')!;expect((await guarded.handle(request(),signal())).status).toBe(503);
 }
 const guarded=createSharedAccountAdmission(routes,{consume:async()=>{throw Error('private');}}).routes().get('password')!;expect((await guarded.handle(request(),signal())).status).toBe(503);
 const stop=new AbortController();stop.abort();expect((await guarded.handle(request(),stop.signal)).status).toBe(409);expect(handle).not.toHaveBeenCalled();
});
it('retains all four underlying slots after timeout and refuses late provider admission',async()=>{
 const resolvers:Array<(x:unknown)=>void>=[],handle=vi.fn(async()=>new Response(null));
 const guarded=createSharedAccountAdmission(new Map([['password',{handle}]]),{consume:()=>new Promise(resolve=>resolvers.push(resolve))},5).routes().get('password')!;
 const results=await Promise.all(Array.from({length:4},()=>guarded.handle(request(),signal())));expect(results.every(x=>x.status===503)).toBe(true);
 expect((await guarded.handle(request(),signal())).status).toBe(503);expect(resolvers).toHaveLength(4);
 for(const resolve of resolvers)resolve({allowed:true,retryAfter:0});await new Promise(resolve=>setTimeout(resolve,0));expect(handle).not.toHaveBeenCalled();
});
it('keeps sign-out cleanup available and forwards delivery cleanup for admitted responses',async()=>{
 const handle=vi.fn(async()=>new Response(null)),discardResponse=vi.fn(async()=>true),consume=vi.fn(async()=>({allowed:false,retryAfter:60}));
 const routes=createSharedAccountAdmission(new Map([['/api/account/sign-out',{handle,discardResponse}]]),{consume}).routes();
 const response=await routes.get('/api/account/sign-out')!.handle(request(),signal());expect(response.status).toBe(200);expect(consume).not.toHaveBeenCalled();await routes.get('/api/account/sign-out')!.discardResponse!(response);expect(discardResponse).toHaveBeenCalledWith(response);
});
