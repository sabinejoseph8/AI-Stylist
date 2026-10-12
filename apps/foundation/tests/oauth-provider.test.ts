import {it,expect,vi} from 'vitest';
import {createPasswordProviderHttp} from '../src/server/password-provider-http.ts';
import {createOAuthProvider} from '../src/server/oauth-provider.ts';
const input={purpose:'google' as const,code:'synthetic-code',verifier:'a'.repeat(43)};
const signal=()=>new AbortController().signal;
const project='https://example.supabase.co',key='synthetic-server-key-only';
it('exchanges only code and verifier at the fixed PKCE endpoint and stages ownership',async()=>{
 const fetcher=vi.fn(async(_url:string,_init:RequestInit)=>Response.json({access_token:'fixture',refresh_token:'secret',token_type:'bearer'}));
 const stage=vi.fn(async()=>({accessToken:'fixture',adopt:async()=>true,discard:async()=>true}));
 const provider=createOAuthProvider(createPasswordProviderHttp(project,key,fetcher),{stage});
 const result=await provider.exchange(input,signal());
 expect(fetcher.mock.calls[0][0]).toBe(project+'/auth/v1/token?grant_type=pkce');
 const init=fetcher.mock.calls[0][1];expect(JSON.parse(init.body as string)).toEqual({auth_code:input.code,code_verifier:input.verifier});
 expect(init.redirect).toBe('error');expect(init.credentials).toBe('omit');
 expect(stage).toHaveBeenCalledWith({accessToken:'fixture',refreshSecret:'secret'},expect.any(AbortSignal));
 expect('adopt' in result&&await result.adopt!(signal())).toBe(true);
});
it('refuses invalid purposes, codes, verifiers and canceled calls before transport',async()=>{
 const fetcher=vi.fn();const http=createPasswordProviderHttp(project,key,fetcher);
 for(const invalid of [{...input,purpose:'recovery'},{...input,code:'bad code'},{...input,verifier:'short'}])await expect(http.exchange(invalid as typeof input,signal())).rejects.toThrow();
 const stop=new AbortController();stop.abort();await expect(http.exchange(input,stop.signal)).rejects.toThrow();expect(fetcher).not.toHaveBeenCalled();
});
it('does not treat confirmation or malformed tokens as an OAuth session',async()=>{
 const stage=vi.fn();const revoke=vi.fn(async()=>true);
 const confirmation=createOAuthProvider({exchange:async()=>({status:'confirmationRequired'}),revoke},{stage});
 await expect(confirmation.exchange(input,signal())).rejects.toThrow();
 const malformed=createOAuthProvider({exchange:async()=>({access_token:'fixture',refresh_token:null}),revoke},{stage});
 const result=await malformed.exchange(input,signal());
 if(!('discard' in result))throw Error('Missing cleanup');
 expect(await result.adopt!(signal())).toBe(false);expect(await result.discard(signal())).toBe(true);expect(await result.discard(signal())).toBe(true);
 expect(revoke).toHaveBeenCalledTimes(1);expect(stage).not.toHaveBeenCalled();
});
it('retains cleanup ownership for a late provider session after cancellation',async()=>{
 const stop=new AbortController(),discard=vi.fn(async()=>true),stage=vi.fn(async()=>({accessToken:'fixture',adopt:async()=>false,discard}));
 const provider=createOAuthProvider({exchange:async()=>{stop.abort();return {access_token:'fixture',refresh_token:'secret',token_type:'bearer'};},revoke:async()=>false},{stage});
 const result=await provider.exchange(input,stop.signal);expect(stage).toHaveBeenCalled();
 if(!('discard' in result))throw Error('Missing cleanup');await result.discard(signal());expect(discard).toHaveBeenCalledOnce();
});
