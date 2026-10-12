import {it,expect,vi} from 'vitest';
import {createStoredSignOut} from '../src/server/stored-signout.ts';
import type {createAccountSecurity} from '../src/server/account-security.ts';
import type {createRefreshStore} from '../src/server/refresh-store.ts';
const owner='11111111-1111-4111-8111-111111111111',session='22222222-2222-4222-8222-222222222222',origin='https://stylist.example';
const signal=()=>new AbortController().signal;
const request=()=>new Request(origin+'/api/account/sign-out',{method:'POST',headers:{origin,cookie:'__Host-stylist_access=fixture.jwt.token'}});
const security={authorize:async()=>({ownerId:owner,sessionId:session,isCurrent:async()=>true})} as Pick<ReturnType<typeof createAccountSecurity>,'authorize'>;
it('requires independent primary absence even after accepted logout',async()=>{
 const store={inspect:async()=>({status:'absent'}),remove:vi.fn()} as unknown as ReturnType<typeof createRefreshStore>;
 const revoke=vi.fn(async()=>true);const authority={confirm:async()=>({status:'unconfirmed'})};const port=createStoredSignOut(security,store,authority,origin,revoke);
 expect(await port.revoke(request(),owner,signal())).toBe(false);expect(revoke).toHaveBeenCalledWith('fixture.jwt.token',expect.any(AbortSignal));
});
it('accepts independently proved absence despite a lost remote acknowledgment',async()=>{
 const store={inspect:async()=>({status:'absent'}),remove:vi.fn()} as unknown as ReturnType<typeof createRefreshStore>;
 const port=createStoredSignOut(security,store,{confirm:async()=>({status:'revoked',ownerId:owner,sessionId:session})},origin,async()=>false);
 expect(await port.revoke(request(),owner,signal())).toBe(true);
});
it('refuses wrong owner and cross-origin requests before remote work',async()=>{
 const revoke=vi.fn(),port=createStoredSignOut(security,{inspect:vi.fn(),remove:vi.fn()} as unknown as ReturnType<typeof createRefreshStore>,{confirm:vi.fn()},origin,revoke);
 expect(await port.revoke(request(),'other',signal())).toBe(false);
 expect(await port.revoke(new Request(origin+'/api/account/sign-out',{method:'POST',headers:{origin:'https://other.example'}}),owner,signal())).toBe(false);expect(revoke).not.toHaveBeenCalled();
});
it('holds owned credentials before cleanup and uses fenced removal only after proof',async()=>{
 const scope={ownerId:owner,sessionId:session,generation:2,expiresAt:Date.now()+60000},lease='33333333-3333-4333-8333-333333333333';const events:string[]=[];let held=false;
 const store={inspect:async()=>({status:'found',scope,state:held?'held':'ready',leaseId:held?lease:null}),claim:async()=>({status:'claimed',scope,leaseId:lease,clearSecret:()=>{}}),hold:async()=>{held=true;events.push('hold');return 'confirmed';},remove:async()=>{events.push('remove');return 'confirmed';}} as unknown as ReturnType<typeof createRefreshStore>;
 const port=createStoredSignOut(security,store,{confirm:async()=>({status:'revoked',ownerId:owner,sessionId:session})},origin,async()=>{events.push('revoke');return true;});expect(await port.revoke(request(),owner,signal())).toBe(true);expect(events).toEqual(['hold','revoke','remove']);
});
