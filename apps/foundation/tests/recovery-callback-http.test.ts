import {it,expect,vi} from 'vitest';
import {createRecoveryCallbackHttp} from '../src/server/recovery-callback-http.ts';
import {createRecoveryBrowser} from '../src/server/recovery-browser.ts';
const origin='https://stylist.example',signal=()=>new AbortController().signal;
const callbacks={clear:()=> '__Host-stylist_flow=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0' as const};
const request=()=>new Request(origin+'/auth/callback/recovery?code=synthetic');
function grant(){return {status:'resetRequired' as const,expiresAt:Date.now()+300000,reset:vi.fn(async()=>({status:'resetComplete' as const})),discard:vi.fn(async()=>true)};}
it('delivers only a reset cookie and clears flow without account access',async()=>{
 const value=grant(),browser=createRecoveryBrowser(origin),http=createRecoveryCallbackHttp(origin,{complete:async()=>value},browser,callbacks);
 const response=await http.handle(request(),signal());expect(response.status).toBe(303);expect(response.headers.get('location')).toBe('/account/reset');expect(await response.text()).toBe('');expect(response.headers.get('cache-control')).toBe('no-store');
 const cookies=response.headers.getSetCookie();expect(cookies).toHaveLength(2);expect(cookies[0]).toMatch(/^__Host-stylist_reset=/);expect(cookies.join('')).not.toContain('__Host-stylist_access');expect(cookies[1]).toContain('Max-Age=0');
 expect(await http.discardResponse(response)).toBe(true);expect(value.discard).toHaveBeenCalledOnce();expect(await browser.close()).toBe(true);
});
it('cleans canceled delivery and refused installation without exposing a reset cookie',async()=>{
 for(const canceled of [false,true]){
  const value=grant(),stop=new AbortController(),browser=createRecoveryBrowser(origin);if(!canceled)await browser.close();
  const http=createRecoveryCallbackHttp(origin,{complete:async()=>{if(canceled)stop.abort();return value;}},browser,callbacks);
  const response=await http.handle(request(),stop.signal);expect(response.headers.get('location')).toBe('/account?status=unavailable');expect(response.headers.get('set-cookie')).not.toContain('__Host-stylist_reset');expect(value.discard).toHaveBeenCalledOnce();
 }
});
it('sanitizes canceled callback and rejects wrong origins or methods before recovery',async()=>{
 const complete=vi.fn(async()=>({status:'canceled' as const})),browser=createRecoveryBrowser(origin),http=createRecoveryCallbackHttp(origin,{complete},browser,callbacks);
 const response=await http.handle(request(),signal());expect(response.headers.get('location')).toBe('/account?status=canceled');expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
 for(const bad of [new Request('https://evil.test/auth/callback/recovery'),new Request(origin+'/auth/callback/recovery',{method:'POST'})])expect((await http.handle(bad,signal())).status).toBe(404);
 expect(complete).toHaveBeenCalledOnce();expect(await browser.close()).toBe(true);
});
