import {it,expect,vi} from 'vitest';
import {createAuthSessionAuthority} from '../src/server/auth-session.ts';
const owner='00000000-0000-0000-0000-000000000001',session='00000000-0000-0000-0000-000000000002';
it('passes only the owner/session pair and accepts exact true',async()=>{
 const call=vi.fn(async()=>true);const authority=createAuthSessionAuthority({call});
 expect(await authority.active(owner,session,new AbortController().signal)).toBe(true);
 expect(call).toHaveBeenCalledWith('stylist_auth_session_active',{p_owner:owner,p_session:session});
 for(const value of [false,null,undefined,'true',1,{active:true}])expect(await createAuthSessionAuthority({call:async()=>value}).active(owner,session,new AbortController().signal)).toBe(false);
});
it('refuses invalid identities and cancellation without a query',async()=>{
 const call=vi.fn();const authority=createAuthSessionAuthority({call});const stop=new AbortController();stop.abort();
 expect(await authority.active(owner,session,stop.signal)).toBe(false);
 expect(await authority.active('bad',session,new AbortController().signal)).toBe(false);expect(call).not.toHaveBeenCalled();
});
it('drops acknowledgment after cancellation and hides authority errors',async()=>{
 const stop=new AbortController();const authority=createAuthSessionAuthority({call:async()=>{stop.abort();return true;}});
 expect(await authority.active(owner,session,stop.signal)).toBe(false);
 expect(await createAuthSessionAuthority({call:async()=>{throw Error('secret');}}).active(owner,session,new AbortController().signal)).toBe(false);
});
