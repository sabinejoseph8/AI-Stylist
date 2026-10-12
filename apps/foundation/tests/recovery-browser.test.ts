import {it,expect,vi,afterEach} from 'vitest';
import {createRecoveryBrowser} from '../src/server/recovery-browser.ts';
const origin='https://stylist.example',signal=()=>new AbortController().signal;
const grant=()=>({status:'resetRequired' as const,expiresAt:Date.now()+60000,reset:vi.fn(async()=>({status:'resetComplete' as const})),discard:vi.fn(async()=>true)});
const input={password:'made-up',confirmation:'made-up'};
const request=(cookie:string,headers:Record<string,string>={})=>new Request(origin+'/api/account/reset',{method:'POST',headers:{origin,cookie,...headers}});
afterEach(()=>vi.useRealTimers());
it('issues a separate secure opaque cookie and consumes permission once',async()=>{
 const owner=createRecoveryBrowser(origin),g=grant(),delivery=owner.install(g);expect(delivery.setCookie).toMatch(/^__Host-stylist_reset=[A-Za-z0-9_-]{43}; Path=\/; Secure; HttpOnly; SameSite=Strict; Max-Age=/);
 const r=request(delivery.setCookie.split(';')[0]!);expect((await owner.submit(r,input,signal())).status).toBe('resetComplete');expect((await owner.submit(r,input,signal())).status).toBe('unavailable');expect(g.reset).toHaveBeenCalledTimes(1);expect(g.discard).toHaveBeenCalledTimes(1);
});
it('rejects hostile origin, duplicate cookies and normal account cookies without consuming the grant',async()=>{
 const owner=createRecoveryBrowser(origin),g=grant(),d=owner.install(g),cookie=d.setCookie.split(';')[0]!;
 for(const r of [request(cookie,{origin:'https://other.example'}),request(cookie,{'sec-fetch-site':'same-site'}),request(cookie+'; '+cookie),request(cookie.replace('stylist_reset','stylist_access'))])expect((await owner.submit(r,input,signal())).status).toBe('unavailable');expect(g.reset).not.toHaveBeenCalled();expect((await owner.submit(request(cookie),input,signal())).status).toBe('resetComplete');
});
it('rejects mismatched input before consuming valid permission',async()=>{
 const owner=createRecoveryBrowser(origin),g=grant(),d=owner.install(g),r=request(d.setCookie.split(';')[0]!);expect((await owner.submit(r,{...input,confirmation:'different'},signal())).status).toBe('unavailable');expect((await owner.submit(r,input,signal())).status).toBe('resetComplete');
});
it('discards expired or abandoned delivery without resetting',async()=>{
 const owner=createRecoveryBrowser(origin),g=grant(),d=owner.install(g);vi.useFakeTimers();vi.setSystemTime(Date.now()+60001);expect((await owner.submit(request(d.setCookie.split(';')[0]!),input,signal())).status).toBe('unavailable');expect(g.reset).not.toHaveBeenCalled();expect(g.discard).toHaveBeenCalledTimes(1);await d.discard();expect(g.discard).toHaveBeenCalledTimes(1);
});
it('holds further delivery after failed cleanup',async()=>{
 const owner=createRecoveryBrowser(origin),g={...grant(),discard:vi.fn(async()=>false)},d=owner.install(g);expect((await owner.submit(request(d.setCookie.split(';')[0]!),input,signal())).status).toBe('unconfirmed');expect(owner.cleanupHeld()).toBe(true);expect(()=>owner.install(grant())).toThrow();
});
it('admits only one simultaneous reset and clears the cookie after an adapter error',async()=>{
 const owner=createRecoveryBrowser(origin),g=grant();let reject!:(error:Error)=>void;g.reset=vi.fn(()=>new Promise<{status:'resetComplete'}>((_resolve,r)=>reject=r));const d=owner.install(g),r=request(d.setCookie.split(';')[0]!);
 const first=owner.submit(r,input,signal());expect((await owner.submit(r,input,signal())).status).toBe('unavailable');reject(Error('private-provider-message'));const result=await first;expect(result.status).toBe('unconfirmed');expect(result.setCookie).toContain('Max-Age=0');expect(JSON.stringify(result)).not.toContain('private-provider-message');expect(g.discard).toHaveBeenCalledTimes(1);
});
it('refuses duplicate installation and caps retained delivery grants',async()=>{
 const owner=createRecoveryBrowser(origin),g=grant();owner.install(g);expect(()=>owner.install(g)).toThrow();for(let i=1;i<128;i++)owner.install(grant());expect(()=>owner.install(grant())).toThrow();
});

it('explicit expiry cleans retained grants without admitting a reset',async()=>{
 const owner=createRecoveryBrowser(origin),g=grant(),d=owner.install(g);vi.useFakeTimers();vi.setSystemTime(Date.now()+60001);expect(await owner.expire()).toBe(true);expect(g.discard).toHaveBeenCalledTimes(1);expect((await owner.submit(request(d.setCookie.split(';')[0]!),input,signal())).status).toBe('unavailable');
});
it('shutdown permanently closes delivery and deduplicates grant cleanup',async()=>{
 const owner=createRecoveryBrowser(origin),g=grant(),d=owner.install(g);expect(await owner.close()).toBe(true);expect(await owner.close()).toBe(true);expect(()=>owner.install(grant())).toThrow();expect((await owner.submit(request(d.setCookie.split(';')[0]!),input,signal())).status).toBe('unavailable');expect(g.discard).toHaveBeenCalledTimes(1);
});
it('shutdown remains bounded and unconfirmed when grant cleanup stalls',async()=>{
 vi.useFakeTimers();const owner=createRecoveryBrowser(origin,20),g={...grant(),discard:vi.fn(()=>new Promise<boolean>(()=>{}))};owner.install(g);const work=owner.close();await vi.advanceTimersByTimeAsync(21);expect(await work).toBe(false);expect(owner.cleanupHeld()).toBe(true);expect(await owner.close()).toBe(false);expect(g.discard).toHaveBeenCalledTimes(1);
});

it('returns only reset expiry without consuming permission and refuses hostile readiness requests',async()=>{
 const owner=createRecoveryBrowser(origin),g=grant(),d=owner.install(g),cookie=d.setCookie.split(';')[0]!;
 const ready=(headers:Record<string,string>={})=>new Request(origin+'/api/account/reset-ready',{method:'POST',headers:{origin,cookie,...headers}});
 expect(await owner.readiness(ready(),signal())).toEqual({status:'resetReady',expiresAt:g.expiresAt});
 expect(await owner.readiness(ready(),signal())).toEqual({status:'resetReady',expiresAt:g.expiresAt});expect(g.reset).not.toHaveBeenCalled();
 for(const headers of [{origin:'https://evil.example'},{cookie:cookie+'; '+cookie},{authorization:'Bearer refused'}] as Record<string,string>[])expect(await owner.readiness(ready(headers),signal())).toEqual({status:'unavailable'});
 expect((await owner.submit(request(cookie),input,signal())).status).toBe('resetComplete');expect(await owner.readiness(ready(),signal())).toEqual({status:'unavailable'});
});
it('readiness removes expired grants without admitting reset or exposing credentials',async()=>{
 const owner=createRecoveryBrowser(origin),g=grant(),d=owner.install(g);vi.useFakeTimers();vi.setSystemTime(Date.now()+60001);
 const r=new Request(origin+'/api/account/reset-ready',{method:'POST',headers:{origin,cookie:d.setCookie.split(';')[0]!}});
 expect(await owner.readiness(r,signal())).toEqual({status:'unavailable'});expect(g.discard).toHaveBeenCalledOnce();expect(g.reset).not.toHaveBeenCalled();await owner.close();
});
