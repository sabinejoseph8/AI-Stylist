import {it,expect,vi} from 'vitest';
import {createPasswordProviderHttp} from '../src/server/password-provider-http.ts';
const key='synthetic-key-for-tests-only',project='https://example.supabase.co';
const input={method:'signIn' as const,email:'sample@example.test',password:'made-up'};
const signal=()=>new AbortController().signal;
it('uses fixed endpoints and whitelisted bodies without redirects or cookies',async()=>{
 const fetcher=vi.fn(async(_url:string,_init:RequestInit)=>Response.json({access_token:'fixture',refresh_token:'fixture',token_type:'bearer'}));const port=createPasswordProviderHttp(project,key,fetcher);
 await port.password(input,signal());expect(fetcher.mock.calls[0][0]).toBe(project+'/auth/v1/token?grant_type=password');
 const init=fetcher.mock.calls[0][1] as RequestInit;expect(JSON.parse(init.body as string)).toEqual({email:input.email,password:input.password});expect(init.redirect).toBe('error');expect(init.credentials).toBe('omit');
});
it('normalizes only a token-free signup user response',async()=>{
 const id='11111111-1111-4111-8111-111111111111';const port=createPasswordProviderHttp(project,key,async()=>Response.json({id}));
 expect(await port.password({...input,method:'signUp'},signal())).toEqual({status:'confirmationRequired'});
 const malformed=createPasswordProviderHttp(project,key,async()=>Response.json({id,access_token:null}));expect(await malformed.password({...input,method:'signUp'},signal())).toEqual({id,access_token:null});
});
it('accepts only explicit empty 204 logout and hides provider failures',async()=>{
 const fetcher=vi.fn(async(_url:string,_init:RequestInit)=>new Response(null,{status:204}));const port=createPasswordProviderHttp(project,key,fetcher);expect(await port.revoke('fixture','local',signal())).toBe(true);expect(fetcher.mock.calls[0][0]).toBe(project+'/auth/v1/logout?scope=local');
 const failed=createPasswordProviderHttp(project,key,async()=>Response.json({private:'error'},{status:400}));await expect(failed.password(input,signal())).rejects.toThrow('Supabase operation unavailable');expect(await failed.revoke('fixture','local',signal())).toBe(false);
});
it('refuses canceled and invalid requests before fetch',async()=>{
 const fetcher=vi.fn();const port=createPasswordProviderHttp(project,key,fetcher);const stop=new AbortController();stop.abort();await expect(port.password(input,stop.signal)).rejects.toThrow();await expect(port.password({...input,email:'bad'},signal())).rejects.toThrow();expect(fetcher).not.toHaveBeenCalled();
});
it('holds admission while timed-out fetches ignore cancellation',async()=>{
 const resolvers:Array<(r:Response)=>void>=[];const fetcher=vi.fn((_url:string,_init:RequestInit)=>new Promise<Response>(resolve=>resolvers.push(resolve)));const port=createPasswordProviderHttp(project,key,fetcher,5);
 await Promise.all(Array.from({length:4},()=>expect(port.password(input,signal())).rejects.toThrow()));await expect(port.password(input,signal())).rejects.toThrow();expect(fetcher).toHaveBeenCalledTimes(4);
 resolvers.forEach(resolve=>resolve(Response.json({id:'late'})));await new Promise(resolve=>setTimeout(resolve,0));
 const next=port.password(input,signal());const checked=expect(next).rejects.toThrow();await new Promise(resolve=>setTimeout(resolve,0));resolvers[4](new Response(null,{status:400}));await checked;
});
it('rejects oversized and non-JSON replies without accepting confirmation',async()=>{
 for(const response of [Response.json({id:'x'.repeat(70000)}),new Response('private',{headers:{'content-type':'text/plain'}})]){
  const port=createPasswordProviderHttp(project,key,async()=>response);await expect(port.password({...input,method:'signUp'},signal())).rejects.toThrow('Supabase operation unavailable');
 }
});
