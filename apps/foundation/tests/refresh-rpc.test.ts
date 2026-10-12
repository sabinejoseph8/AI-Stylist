import {it,expect,vi} from 'vitest';
import {createRefreshRpc} from '../src/server/refresh-rpc.ts';
import {createRefreshStore} from '../src/server/refresh-store.ts';
import {createRefreshEnvelopes} from '../src/server/refresh-envelope.ts';
import {randomBytes} from 'node:crypto';
const key='fixture-server-key-not-real-123456',project='https://example.supabase.co',signal=()=>new AbortController().signal;
it('allows only explicit refresh operations on the configured server destination',async()=>{
 const fetcher=vi.fn(async()=>new Response('true',{headers:{'content-type':'application/json'}})),rpc=createRefreshRpc(project,key,fetcher);
 await expect(rpc.call('stylist_auth_session_active',{},signal())).rejects.toThrow('Refresh storage unavailable');expect(fetcher).not.toHaveBeenCalled();
 expect(await rpc.call('stylist_hold_refresh',{},signal())).toBe(true);expect(fetcher).toHaveBeenCalledTimes(1);
});
it('composes encrypted adoption through the guarded HTTP RPC transport with simulated fetch',async()=>{
 const fetcher=vi.fn(async(_url:string,_init:RequestInit)=>new Response('true',{headers:{'content-type':'application/json'}})),rpc=createRefreshRpc(project,key,fetcher);
 const store=createRefreshStore(rpc,createRefreshEnvelopes(new Map([['fixture',randomBytes(32)]]),'fixture'));
 expect(await store.adopt('secret-fixture',{ownerId:'11111111-1111-4111-8111-111111111111',sessionId:'22222222-2222-4222-8222-222222222222',generation:1,expiresAt:Date.now()+60000},signal())).toBe('confirmed');
 const [url,init]=fetcher.mock.calls[0]!;expect(url).toBe(project+'/rest/v1/rpc/stylist_adopt_refresh');expect(init.body).not.toContain('secret-fixture');expect(init.redirect).toBe('error');
});
it('propagates cancellation and keeps ignored fetches admitted after timeout',async()=>{
 const controllers:AbortSignal[]=[],releases:Array<(r:Response)=>void>=[];
 const fetcher=vi.fn(async(_url:string,init:RequestInit)=>{controllers.push(init.signal as AbortSignal);return new Promise<Response>(resolve=>releases.push(resolve));});
 const rpc=createRefreshRpc(project,key,fetcher,20),control=new AbortController();
 const pending=rpc.call('stylist_hold_refresh',{},control.signal);const rejected=expect(pending).rejects.toThrow('Refresh storage unavailable');await Promise.resolve();await Promise.resolve();expect(fetcher).toHaveBeenCalledTimes(1);control.abort();await rejected;expect(controllers[0]?.aborted).toBe(true);
 const more=Array.from({length:3},()=>rpc.call('stylist_hold_refresh',{},signal()).catch(()=>null));await Promise.all(more);
 await expect(rpc.call('stylist_hold_refresh',{},signal())).rejects.toThrow();expect(fetcher).toHaveBeenCalledTimes(4);
 releases.forEach(resolve=>resolve(new Response('true',{headers:{'content-type':'application/json'}})));
});
