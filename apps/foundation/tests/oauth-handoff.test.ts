import {it,expect,vi} from 'vitest';
import {createOAuthHandoff} from '../src/web/oauth-handoff.ts';
import {createAccountHttp} from '../src/web/account-http.ts';
import {createAccountCallbacks} from '../src/server/account-callback.ts';
import {createOAuthStart} from '../src/server/oauth-start.ts';
const origin='https://stylist.example',project='https://example.supabase.co',signal=()=>new AbortController().signal;
it('connects the browser social account transport only through an explicit validated handoff',async()=>{
 const start=createOAuthStart(project,createAccountCallbacks(origin)),navigate=vi.fn();
 const send=vi.fn(async(_url:unknown,input?:RequestInit)=>{expect(input?.credentials).toBe('same-origin');expect(input?.redirect).toBe('error');const {provider}=JSON.parse(input?.body as string);return Response.json({status:'handoff',url:start.begin(provider).url});}) as unknown as typeof fetch;
 const social=createOAuthHandoff(origin,project,send,navigate),accounts=createAccountHttp(origin,send,15000,social);
 expect(await accounts.submit({method:'social',provider:'google'},signal())).toEqual({status:'redirecting'});expect(navigate).toHaveBeenCalledOnce();expect(new URL(navigate.mock.calls[0]![0]).origin).toBe(project);
});
it('refuses external destinations, duplicate parameters and wrong provider before navigation',async()=>{
 for(const change of ['external','duplicate','provider']){
  const url=new URL(createOAuthStart(project,createAccountCallbacks(origin)).begin('google').url);
  if(change==='external')url.hostname='evil.example';if(change==='duplicate')url.searchParams.append('provider','google');if(change==='provider')url.searchParams.set('provider','apple');
  const navigate=vi.fn(),social=createOAuthHandoff(origin,project,async()=>Response.json({status:'handoff',url:url.href}),navigate);
  await expect(social('google',signal())).rejects.toThrow('Account unavailable');expect(navigate).not.toHaveBeenCalled();
 }
});
it('cancellation refuses a late handoff without navigation',async()=>{
 let release!:(response:Response)=>void;const navigate=vi.fn(),social=createOAuthHandoff(origin,project,()=>new Promise(resolve=>release=resolve),navigate),controller=new AbortController();
 const pending=social('google',controller.signal);const rejected=expect(pending).rejects.toThrow('Account unavailable');controller.abort();await rejected;
 release(Response.json({status:'handoff',url:createOAuthStart(project,createAccountCallbacks(origin)).begin('google').url}));await new Promise(resolve=>setTimeout(resolve,0));expect(navigate).not.toHaveBeenCalled();
});

it('composes browser handoff with the prepared server initiation response',async()=>{
 const {createOAuthStartHttp}=await import('../src/server/oauth-start-http.ts');
 const callbacks=createAccountCallbacks(origin),server=createOAuthStartHttp(origin,createOAuthStart(project,callbacks));
 const navigate=vi.fn();let flowCookie='';
 const send:typeof fetch=async(url,input)=>{
  const headers=new Headers(input?.headers);headers.set('origin',origin);
  const response=await server.handle(new Request(String(url),{...input,headers}),input?.signal??signal());
  flowCookie=response.headers.get('set-cookie')??'';return response;
 };
 const social=createOAuthHandoff(origin,project,send,navigate);
 expect(await social('apple',signal())).toEqual({status:'redirecting'});
 const url=new URL(navigate.mock.calls[0]![0]),callback=url.searchParams.get('redirect_to')!;
 const result=callbacks.fromRequest(new Request(callback+'&code=synthetic',{headers:{cookie:flowCookie.split(';')[0]!}}),'apple');
 expect(result?.status).toBe('exchangeRequired');expect(callbacks.fromRequest(new Request(callback+'&code=synthetic',{headers:{cookie:flowCookie.split(';')[0]!}}),'apple')).toBeNull();
});
