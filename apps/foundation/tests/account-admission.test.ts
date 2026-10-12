import {it,expect,vi} from 'vitest';
import {createAccountAdmission} from '../src/server/account-admission.ts';
const request=()=>new Request('https://stylist.test/api/account/password');
const signal=()=>new AbortController().signal;
it('shares an aggregate allowance across routes and forwards delivery cleanup',async()=>{
 let now=1000;const handle=vi.fn(async()=>new Response(null)),discardResponse=vi.fn(async()=>true);
 const guard=createAccountAdmission(new Map([['password',{handle,discardResponse}],['oauth',{handle,discardResponse}]]),{limit:2,windowMs:1000},()=>now);
 const routes=guard.routes();const first=await routes.get('password')!.handle(request(),signal());await routes.get('oauth')!.handle(request(),signal());
 const blocked=await routes.get('oauth')!.handle(request(),signal());expect(blocked.status).toBe(429);expect(blocked.headers.get('retry-after')).toBe('1');expect(handle).toHaveBeenCalledTimes(2);
 await routes.get('password')!.discardResponse!(first);expect(discardResponse).toHaveBeenCalledWith(first);
 now=2000;expect((await routes.get('password')!.handle(request(),signal())).status).toBe(200);
});
it('rejects invalid policy, clock regression and canceled work without provider calls',async()=>{
 const handle=vi.fn(async()=>new Response(null)),routes=new Map([['password',{handle}]]);let now=2000;
 expect(()=>createAccountAdmission(routes,{limit:0,windowMs:1000})).toThrow();
 const guard=createAccountAdmission(routes,{limit:1,windowMs:1000},()=>now).routes().get('password')!;
 now=1000;expect((await guard.handle(request(),signal())).status).toBe(503);
 now=2000;const controller=new AbortController();controller.abort();expect((await guard.handle(request(),controller.signal)).status).toBe(409);
 expect(handle).not.toHaveBeenCalled();expect((await guard.handle(request(),signal())).status).toBe(200);
});
