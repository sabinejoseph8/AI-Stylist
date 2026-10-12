import {it,expect,vi} from 'vitest';
import {createInitialSessionStager} from '../src/server/initial-session.ts';
import type {createRefreshStore} from '../src/server/refresh-store.ts';
import type {createIdentityVerifier} from '../src/server/verified-identity.ts';
const owner='11111111-1111-4111-8111-111111111111',session='22222222-2222-4222-8222-222222222222',lease='33333333-3333-4333-8333-333333333333';
const signal=()=>new AbortController().signal;
const identity={ownerId:owner,sessionId:session,isCurrent:async()=>true};
const verifier={verify:async()=>identity} as ReturnType<typeof createIdentityVerifier>;
const input={accessToken:'fixture-access',refreshSecret:'fixture-refresh'};
it('adopts verified identity once and clears confirmed scoped ownership',async()=>{
 const scope={ownerId:owner,sessionId:session,generation:1,expiresAt:Date.now()+60000};let state='absent';
 const adopt=vi.fn(async()=>{state='ready';return 'confirmed';});const remove=vi.fn(async()=> 'confirmed');
 const store={inspect:async()=>state==='absent'?{status:'absent'}:{status:'found',scope,state,leaseId:state==='held'?lease:null},adopt,claim:async()=>({status:'claimed',scope,leaseId:lease,clearSecret:()=>{state='held';}}),hold:async()=> 'confirmed',remove} as unknown as ReturnType<typeof createRefreshStore>;
 const revoke=vi.fn(async()=>true);const staged=await createInitialSessionStager(store,verifier,()=>scope.expiresAt,revoke).stage(input,signal());
 expect(await staged.adopt?.(signal())).toBe(true);expect(await staged.adopt?.(signal())).toBe(true);expect(adopt).toHaveBeenCalledTimes(1);
 expect(await staged.discard(signal())).toBe(true);expect(await staged.discard(signal())).toBe(true);expect(remove).toHaveBeenCalledTimes(1);expect(revoke).toHaveBeenCalledTimes(1);
});
it('never deletes ambiguous adoption or pre-existing ownership',async()=>{
 for(const before of ['absent','found']){
  let inspected=0;const remove=vi.fn();const store={inspect:async()=>++inspected===1?{status:before}:{status:'found',scope:{generation:1},state:'ready',leaseId:null},adopt:async()=> 'unconfirmed',remove} as unknown as ReturnType<typeof createRefreshStore>;
  const staged=await createInitialSessionStager(store,verifier,()=>Date.now()+60000,async()=>true).stage(input,signal());expect(await staged.adopt?.(signal())).toBe(false);expect(await staged.discard(signal())).toBe(false);expect(remove).not.toHaveBeenCalled();
 }
});
it('refuses invalid identity before storage and preserves refused revocation',async()=>{
 const store={adopt:vi.fn(),inspect:async()=>({status:'absent'})} as unknown as ReturnType<typeof createRefreshStore>;
 await expect(createInitialSessionStager(store,{verify:async()=>null} as ReturnType<typeof createIdentityVerifier>,()=>Date.now()+60000,async()=>true).stage(input,signal())).rejects.toThrow('Session staging unavailable');
 const staged=await createInitialSessionStager(store,verifier,()=>Date.now()+60000,async()=>false).stage(input,signal());expect(await staged.discard(signal())).toBe(false);expect(store.adopt).not.toHaveBeenCalled();
});
it('quarantines an unacknowledged adoption without granting deletion authority',async()=>{
 const scope={ownerId:owner,sessionId:session,generation:1,expiresAt:Date.now()+60000};let state='absent';const hold=vi.fn(async()=> 'confirmed'),remove=vi.fn();
 const store={inspect:async()=>state==='absent'?{status:'absent'}:{status:'found',scope,state:'ready',leaseId:null},adopt:async()=>{state='ready';return 'unconfirmed';},claim:async()=>({status:'claimed',scope,leaseId:lease,clearSecret:()=>{}}),hold,remove} as unknown as ReturnType<typeof createRefreshStore>;
 const staged=await createInitialSessionStager(store,verifier,()=>scope.expiresAt,async()=>false).stage(input,signal());
 expect(await staged.adopt?.(signal())).toBe(false);expect(await staged.discard(signal())).toBe(false);expect(hold).toHaveBeenCalledTimes(1);expect(remove).not.toHaveBeenCalled();
});
