import {it,expect,vi} from 'vitest';
import {createOAuthCallbackHttp} from '../src/server/oauth-callback-http.ts';
const origin='https://stylist.example',signal=()=>new AbortController().signal;
const callbacks={clear:()=> '__Host-stylist_flow=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0' as const};
it('delivers only a fixed local redirect with cookies and retains undelivered cleanup',async()=>{
 const discard=vi.fn(async()=>true),http=createOAuthCallbackHttp(origin,{complete:async()=>({status:'ready',userId:'fixture',returnPath:'/wardrobe',setCookies:['__Host-stylist_access=fixture; Path=/; Secure; HttpOnly',callbacks.clear()],discard})},callbacks);
 const reply=await http.handle(new Request(origin+'/auth/callback/google?flow=fixture&code=fixture'),'google',signal());
 expect(reply.status).toBe(303);expect(reply.headers.get('location')).toBe('/wardrobe');expect(await reply.text()).toBe('');expect(reply.headers.get('cache-control')).toBe('no-store');expect(reply.headers.get('referrer-policy')).toBe('no-referrer');expect(reply.headers.getSetCookie()).toHaveLength(2);
 expect(await http.discardResponse(reply)).toBe(true);expect(discard).toHaveBeenCalledOnce();
});
it('sanitizes callback failure and clears the transaction cookie',async()=>{
 const http=createOAuthCallbackHttp(origin,{complete:async()=>({status:'canceled'})},callbacks);
 const reply=await http.handle(new Request(origin+'/auth/callback/apple?error_description=private'),'apple',signal());expect(reply.headers.get('location')).toBe('/account?status=canceled');expect(reply.headers.get('set-cookie')).toContain('Max-Age=0');expect(await reply.text()).not.toContain('private');
});
it('cleans a ready result when canceled or when its return path is external',async()=>{
 for(const canceled of [false,true]){
  const discard=vi.fn(async()=>true),stop=new AbortController();
  const http=createOAuthCallbackHttp(origin,{complete:async()=>{if(canceled)stop.abort();return {status:'ready',userId:'fixture',returnPath:canceled?'/profile':'https://evil.test',setCookies:['private'],discard};}},callbacks);
  const reply=await http.handle(new Request(origin+'/auth/callback/google'),'google',stop.signal);expect(reply.headers.get('location')).toBe('/account?status=unavailable');expect(reply.headers.get('set-cookie')).not.toContain('private');expect(discard).toHaveBeenCalledOnce();
 }
});
it('refuses mismatched origins, methods and paths before exchange',async()=>{
 const complete=vi.fn(),http=createOAuthCallbackHttp(origin,{complete},callbacks);
 for(const request of [new Request('https://evil.test/auth/callback/google'),new Request(origin+'/auth/callback/google',{method:'POST'}),new Request(origin+'/auth/callback/apple')])expect((await http.handle(request,'google',signal())).status).toBe(404);
 expect(complete).not.toHaveBeenCalled();
});
