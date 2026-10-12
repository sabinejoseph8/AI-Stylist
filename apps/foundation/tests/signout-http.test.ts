import {it,expect,vi} from 'vitest';
import {createSignOutHttp} from '../src/server/signout-http.ts';
const origin='https://stylist.example',signal=()=>new AbortController().signal;
const request=(body:unknown={})=>new Request(origin+'/api/account/sign-out',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
it('clears cookies through headers even when remote sign-out is unconfirmed',async()=>{
 const submit=vi.fn(async()=>({status:'remoteUnconfirmed' as const,setCookies:['__Host-stylist_access=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0','__Host-stylist_flow=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0']})),handler=createSignOutHttp(origin,{submit}),response=await handler(request(),signal());
 expect(response.status).toBe(409);expect(await response.json()).toEqual({status:'remoteUnconfirmed'});expect(response.headers.getSetCookie()).toHaveLength(2);expect(response.headers.get('cache-control')).toBe('no-store');
});
it('rejects caller-selected identity or scope before revocation',async()=>{
 const submit=vi.fn(),handler=createSignOutHttp(origin,{submit});expect((await handler(request({userId:'caller-selected'}),signal())).status).toBe(400);expect(submit).not.toHaveBeenCalled();
});
