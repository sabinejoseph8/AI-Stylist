import {it,expect,vi} from 'vitest';
import {createRecoveryProviderHttp} from '../src/server/recovery-provider-http.ts';
const project='https://example.supabase.co',origin='https://stylist.example',key='synthetic-recovery-key-only';
const signal=()=>new AbortController().signal;
const input={email:'sample@example.test',redirectTo:origin+'/auth/callback/recovery?flow='+'a'.repeat(43),challenge:'b'.repeat(43),challengeMethod:'S256' as const};
it('rejects nonstandard Supabase ports and substituted destinations',()=>{
 for(const url of [project+':9000','http://example.supabase.co','https://example.supabase.co.evil.test',project+'/path'])expect(()=>createRecoveryProviderHttp(url,origin,key,vi.fn())).toThrow();
});
it('sends only fixed recovery fields and an exact app callback',async()=>{
 const fetcher=vi.fn(async(_url:string,_init:RequestInit)=>Response.json({}));
 await createRecoveryProviderHttp(project,origin,key,fetcher).request(input,signal());
 const [url,init]=fetcher.mock.calls[0];expect(new URL(url).origin+new URL(url).pathname).toBe(project+'/auth/v1/recover');expect(new URL(url).searchParams.get('redirect_to')).toBe(input.redirectTo);
 expect(JSON.parse(init.body as string)).toEqual({email:input.email,code_challenge:input.challenge,code_challenge_method:'S256'});expect(init.redirect).toBe('error');expect(init.credentials).toBe('omit');
});
it('refuses external, wrong-purpose, duplicate and malformed recovery callbacks before fetch',async()=>{
 const fetcher=vi.fn(),http=createRecoveryProviderHttp(project,origin,key,fetcher);
 for(const redirectTo of ['https://evil.test/auth/callback/recovery?flow='+'a'.repeat(43),input.redirectTo+'&flow='+'a'.repeat(43),input.redirectTo.replace('/recovery','/google'),input.redirectTo+'#access_token=x'])await expect(http.request({...input,redirectTo},signal())).rejects.toThrow();
 expect(fetcher).not.toHaveBeenCalled();
});
it('exchanges recovery PKCE code without sending other caller fields',async()=>{
 const fetcher=vi.fn(async(_url:string,_init:RequestInit)=>Response.json({access_token:'fixture'})),http=createRecoveryProviderHttp(project,origin,key,fetcher);
 await http.exchange({code:'synthetic-code',verifier:'a'.repeat(43)},signal());expect(fetcher.mock.calls[0][0]).toBe(project+'/auth/v1/token?grant_type=pkce');expect(JSON.parse(fetcher.mock.calls[0][1].body as string)).toEqual({auth_code:'synthetic-code',code_verifier:'a'.repeat(43)});
});
it('confirms a password update only for the matching response owner',async()=>{
 const owner='11111111-1111-4111-8111-111111111111';
 const jwt=Buffer.from('{"alg":"ES256"}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:owner})).toString('base64url')+'.fixture';
 for(const id of [owner,'22222222-2222-4222-8222-222222222222']){
  const fetcher=vi.fn(async(_url:string,_init:RequestInit)=>Response.json({id})),http=createRecoveryProviderHttp(project,origin,key,fetcher);
  expect(await http.updatePassword(jwt,'made-up',signal())).toBe(id===owner);
  expect(fetcher.mock.calls[0][0]).toBe(project+'/auth/v1/user');const init=fetcher.mock.calls[0][1];expect(init.method).toBe('PUT');expect(JSON.parse(init.body as string)).toEqual({password:'made-up'});expect((init.headers as Record<string,string>).authorization).toBe('Bearer '+jwt);
 }
});
it('bounds ignored cancellation and retains admission until late fetch cleanup',async()=>{
 const releases:Array<(r:Response)=>void>=[],fetcher=vi.fn(()=>new Promise<Response>(r=>releases.push(r))),http=createRecoveryProviderHttp(project,origin,key,fetcher,5);
 await Promise.all(Array.from({length:4},()=>expect(http.exchange({code:'fixture',verifier:'a'.repeat(43)},signal())).rejects.toThrow()));
 await expect(http.exchange({code:'fixture',verifier:'a'.repeat(43)},signal())).rejects.toThrow();expect(fetcher).toHaveBeenCalledTimes(4);
 releases.forEach(r=>r(Response.json({})));await new Promise(r=>setTimeout(r,0));
});
it('rejects oversized, non-JSON and canceled requests without exposing provider errors',async()=>{
 for(const response of [Response.json({private:'x'.repeat(70000)}),new Response('private',{headers:{'content-type':'text/plain'}}),Response.json({private:'error'},{status:400})]){
  await expect(createRecoveryProviderHttp(project,origin,key,async()=>response).exchange({code:'fixture',verifier:'a'.repeat(43)},signal())).rejects.toThrow('Supabase operation unavailable');
 }
 const fetcher=vi.fn(),stop=new AbortController();stop.abort();await expect(createRecoveryProviderHttp(project,origin,key,fetcher).request(input,stop.signal)).rejects.toThrow();expect(fetcher).not.toHaveBeenCalled();
});
