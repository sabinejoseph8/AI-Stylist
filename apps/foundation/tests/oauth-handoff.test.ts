import {it,expect,vi} from 'vitest';
import {createOAuthHandoff} from '../src/web/oauth-handoff.ts';
import {createAccountHttp} from '../src/web/account-http.ts';
const origin='https://stylist.example',project='https://example.supabase.co';
it.each(['google','apple'] as const)('refuses retired %s handoff before fetch or navigation',async(provider)=>{
 const send=vi.fn(),navigate=vi.fn(),social=createOAuthHandoff(origin,project,send,navigate);
 await expect(social(provider,new AbortController().signal)).rejects.toThrow('Account unavailable');
 expect(send).not.toHaveBeenCalled();expect(navigate).not.toHaveBeenCalled();
});
it('connected transport cannot revive social handoff',async()=>{
 const send=vi.fn(),social=vi.fn(),account=createAccountHttp(origin,send,15000,social);
 await expect(account.submit({method:'social',provider:'google'},new AbortController().signal)).rejects.toThrow();
 expect(send).not.toHaveBeenCalled();expect(social).not.toHaveBeenCalled();
});
