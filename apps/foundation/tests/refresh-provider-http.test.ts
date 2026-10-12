import {it,expect,vi} from 'vitest';
import {createRefreshProviderHttp} from '../src/server/refresh-provider-http.ts';
const project='https://example.supabase.co',key='fixture-service-key-not-real',signal=()=>new AbortController().signal;
it('pins refresh and session-local logout endpoints with explicit credentials and no redirects',async()=>{
 const fetcher=vi.fn(async(_url:string,_init:RequestInit)=>new Response('{}',{headers:{'content-type':'application/json'}}));const p=createRefreshProviderHttp(project,key,fetcher);
 await p.refresh({refresh_token:'fixture-refresh'},signal());expect(fetcher.mock.calls[0]?.[0]).toBe(project+'/auth/v1/token?grant_type=refresh_token');
 const init=(fetcher.mock.calls as unknown as Array<[string,RequestInit]>)[0]![1];expect(init.redirect).toBe('error');expect(init.credentials).toBe('omit');expect(JSON.parse(init.body as string)).toEqual({refresh_token:'fixture-refresh'});
 fetcher.mockResolvedValue(new Response(null,{status:204}));expect(await p.revoke('fixture-access','local',signal())).toEqual({status:'accepted'});
 const logout=(fetcher.mock.calls as unknown as Array<[string,RequestInit]>)[1]!;expect(logout[0]).toBe(project+'/auth/v1/logout?scope=local');expect(logout[1].body).toBeUndefined();expect((logout[1].headers as Record<string,string>).authorization).toBe('Bearer fixture-access');
});
it('does not convert remote errors or unexpected success responses into revocation proof',async()=>{
 for(const status of [200,301,400,401,404,429,500]){const fetcher=vi.fn(async()=>new Response('private',{status}));expect(await createRefreshProviderHttp(project,key,fetcher).revoke('fixture','local',signal())).toEqual({status:'unconfirmed'});expect(fetcher).toHaveBeenCalledTimes(1);}
});
it('bounds response bytes and rejects malformed JSON and invalid destinations',async()=>{
 for(const body of ['not-json',' '.repeat(65537)]){const p=createRefreshProviderHttp(project,key,async()=>new Response(body,{headers:{'content-type':'application/json'}}));await expect(p.refresh({refresh_token:'fixture'},signal())).rejects.toThrow('Supabase operation unavailable');}
 expect(()=>createRefreshProviderHttp('https://foreign.example',key,fetch)).toThrow();
});
it('keeps ignored canceled HTTP requests within four-operation admission without retry',async()=>{
 vi.useFakeTimers();try{const releases:Array<(r:Response)=>void>=[],fetcher=vi.fn(()=>new Promise<Response>(r=>releases.push(r))),p=createRefreshProviderHttp(project,key,fetcher,20);
 const pending=Array.from({length:4},()=>p.refresh({refresh_token:'fixture'},signal()).catch(()=>null));await vi.advanceTimersByTimeAsync(21);await Promise.all(pending);await expect(p.refresh({refresh_token:'fixture'},signal())).rejects.toThrow();expect(fetcher).toHaveBeenCalledTimes(4);releases.forEach(r=>r(new Response('{}')));await vi.advanceTimersByTimeAsync(0);
 }finally{vi.useRealTimers();}
});
