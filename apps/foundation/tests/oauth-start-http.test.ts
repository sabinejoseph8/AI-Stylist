import {it,expect,vi} from 'vitest';
import {createAccountCallbacks} from '../src/server/account-callback.ts';
import {createOAuthStart} from '../src/server/oauth-start.ts';
import {createOAuthStartHttp} from '../src/server/oauth-start-http.ts';
const origin='https://stylist.example',project='https://example.supabase.co',signal=()=>new AbortController().signal;
const request=(input:unknown,source=origin)=>new Request(origin+'/api/account/oauth',{method:'POST',headers:{origin:source,'content-type':'application/json'},body:JSON.stringify(input)});
it('prepares a public handoff URL while keeping browser binding in a secure cookie',async()=>{
 const callbacks=createAccountCallbacks(origin),http=createOAuthStartHttp(origin,createOAuthStart(project,callbacks));
 const response=await http.handle(request({provider:'google',returnPath:'/profile'}),signal()),body=await response.json();
 expect(response.status).toBe(200);expect(Object.keys(body).sort()).toEqual(['status','url']);expect(body.status).toBe('handoff');expect(new URL(body.url).origin).toBe(project);
 expect(response.headers.get('set-cookie')).toContain('Secure; HttpOnly; SameSite=Lax');expect(response.headers.get('cache-control')).toBe('no-store');expect(JSON.stringify(body)).not.toContain('__Host-stylist_flow');
 const callback=new URL(new URL(body.url).searchParams.get('redirect_to')!);callback.searchParams.set('code','synthetic');
 const bound=new Request(callback,{headers:{cookie:response.headers.get('set-cookie')!.split(';')[0]}});
 expect(callbacks.fromRequest(bound,'google')?.status).toBe('exchangeRequired');
});
it('abandons an undelivered handoff transaction idempotently',async()=>{
 const callbacks=createAccountCallbacks(origin),http=createOAuthStartHttp(origin,createOAuthStart(project,callbacks));
 const response=await http.handle(request({provider:'apple',returnPath:'/'}),signal()),body=await response.json();
 expect(await http.discardResponse(response)).toBe(true);expect(await http.discardResponse(response)).toBe(true);
 const callback=new URL(new URL(body.url).searchParams.get('redirect_to')!);callback.searchParams.set('code','synthetic');
 expect(callbacks.fromRequest(new Request(callback,{headers:{cookie:response.headers.get('set-cookie')!.split(';')[0]}}),'apple')).toBeNull();
});
it('refuses cross-origin initiation, extra fields, providers and external return paths',async()=>{
 const start={begin:vi.fn()},http=createOAuthStartHttp(origin,start);
 for(const input of [{provider:'other',returnPath:'/'},{provider:'google',returnPath:'/',redirectTo:'https://evil.test'},{provider:'apple'}])expect((await http.handle(request(input),signal())).status).toBe(400);
 expect((await http.handle(request({provider:'google',returnPath:'/'},'https://evil.test'),signal())).status).toBe(400);expect(start.begin).not.toHaveBeenCalled();
 const real=createOAuthStartHttp(origin,createOAuthStart(project,createAccountCallbacks(origin)));expect((await real.handle(request({provider:'google',returnPath:'https://evil.test'}),signal())).status).toBe(400);
 expect(()=>createOAuthStart(project+':9000',createAccountCallbacks(origin))).toThrow();
});
