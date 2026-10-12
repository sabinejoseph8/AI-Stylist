import {it,expect,vi,afterEach} from 'vitest';
import {createRecoveryHttp} from '../src/server/recovery-http.ts';
const origin='https://stylist.example',signal=()=>new AbortController().signal;
const input={password:'made-up',confirmation:'made-up'};
const request=(body=JSON.stringify(input),headers:Record<string,string>={})=>new Request(origin+'/api/account/reset',{method:'POST',headers:{origin,'content-type':'application/json',...headers},body});
afterEach(()=>vi.useRealTimers());
it('returns only status JSON and sends reset clearing only through response headers',async()=>{
 const submit=vi.fn(async()=>({status:'resetComplete' as const,setCookie:'__Host-stylist_reset=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0'})),handler=createRecoveryHttp(origin,{submit});
 const r=await handler(request(),signal());expect(r.status).toBe(200);expect(await r.json()).toEqual({status:'resetComplete'});expect(r.headers.get('set-cookie')).toContain('HttpOnly');expect(r.headers.get('cache-control')).toBe('no-store');expect(r.headers.has('access-control-allow-origin')).toBe(false);
});
it('rejects hostile origins, wrong content types, oversized or malformed input before delivery',async()=>{
 const submit=vi.fn(),handler=createRecoveryHttp(origin,{submit});
 for(const r of [request(undefined,{origin:'https://other.example'}),request(undefined,{'content-type':'text/plain'}),request(undefined,{'content-length':'99999'}),request('x'.repeat(16385)),request('{broken'),request(JSON.stringify({...input,extra:true})),request(JSON.stringify({...input,confirmation:'different'}))])expect((await handler(r,signal())).status).toBe(400);expect(submit).not.toHaveBeenCalled();
});
it('hides provider failures and sends no cookie through JSON',async()=>{
 const handler=createRecoveryHttp(origin,{submit:async()=>{throw Error('private-provider-error');}}),r=await handler(request(),signal());expect(await r.text()).toBe('{"status":"unavailable"}');expect(r.headers.has('set-cookie')).toBe(false);
});
it('bounds stalled bodies and cancels their readers',async()=>{
 vi.useFakeTimers();const cancel=vi.fn(),stream=new ReadableStream<Uint8Array>({cancel}),submit=vi.fn(),handler=createRecoveryHttp(origin,{submit},20);
 const r=new Request(origin+'/api/account/reset',{method:'POST',headers:{origin,'content-type':'application/json'},body:stream,duplex:'half'} as RequestInit);const work=handler(r,signal());await vi.advanceTimersByTimeAsync(21);expect((await work).status).toBe(409);expect(cancel).toHaveBeenCalledTimes(1);expect(submit).not.toHaveBeenCalled();
});
it('retains admission while canceled delivery ignores abort',async()=>{
 vi.useFakeTimers();const releases:Array<(v:{status:'unconfirmed';setCookie:string})=>void>=[];const submit=vi.fn(()=>new Promise<{status:'unconfirmed';setCookie:string}>(r=>releases.push(r))),handler=createRecoveryHttp(origin,{submit},20);
 const work=Array.from({length:4},()=>handler(request(),signal()));await vi.advanceTimersByTimeAsync(21);expect((await Promise.all(work)).every(r=>r.status===409)).toBe(true);expect(submit).toHaveBeenCalledTimes(4);expect((await handler(request(),signal())).status).toBe(429);releases.forEach(r=>r({status:'unconfirmed',setCookie:'__Host-stylist_reset=; Max-Age=0'}));await vi.advanceTimersByTimeAsync(0);
});
