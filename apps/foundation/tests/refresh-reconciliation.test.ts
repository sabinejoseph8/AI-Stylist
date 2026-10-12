import {it,expect,vi} from 'vitest';
import {createRefreshReconciliation} from '../src/server/refresh-reconciliation.ts';
import type {createRefreshStore} from '../src/server/refresh-store.ts';
const scope={ownerId:'11111111-1111-4111-8111-111111111111',sessionId:'22222222-2222-4222-8222-222222222222',generation:2,leaseId:'33333333-3333-4333-8333-333333333333'},signal=()=>new AbortController().signal;
function fixture(){const inspect=vi.fn(async():Promise<unknown>=>({status:'found',scope:{...scope,expiresAt:Date.now()+60000},state:'held',leaseId:scope.leaseId})),remove=vi.fn(async()=> 'confirmed'),confirm=vi.fn(async():Promise<unknown>=>({status:'revoked',ownerId:scope.ownerId,sessionId:scope.sessionId}));return {inspect,remove,confirm,run:createRefreshReconciliation({inspect,remove} as unknown as ReturnType<typeof createRefreshStore>,{confirm})};}
it('removes only scoped ownership after independent exact revocation confirmation',async()=>{const f=fixture();expect(await f.run.reconcile(scope,signal())).toBe('confirmed');expect(f.confirm).toHaveBeenCalledTimes(1);expect(f.remove).toHaveBeenCalledTimes(1);});
it('refuses stale generations and wrong-session or ambiguous proof',async()=>{
 const stale=fixture();expect(await stale.run.reconcile({...scope,generation:1},signal())).toBe('stale');expect(stale.confirm).not.toHaveBeenCalled();expect(stale.remove).not.toHaveBeenCalled();
 for(const proof of [false,{status:'revoked',ownerId:scope.ownerId,sessionId:'other'},{status:'unconfirmed'}]){const f=fixture();f.confirm.mockResolvedValue(proof);expect(await f.run.reconcile(scope,signal())).toBe('unconfirmed');expect(f.remove).not.toHaveBeenCalled();}
});
it('requires remote proof even when local ownership is already absent',async()=>{const f=fixture();f.inspect.mockResolvedValue({status:'absent'});f.confirm.mockResolvedValue(false);expect(await f.run.reconcile(scope,signal())).toBe('unconfirmed');f.confirm.mockResolvedValue({status:'revoked',ownerId:scope.ownerId,sessionId:scope.sessionId});expect(await f.run.reconcile(scope,signal())).toBe('confirmed');expect(f.remove).not.toHaveBeenCalled();});
it('retains uncertainty after removal failure or cancellation',async()=>{const f=fixture();f.remove.mockResolvedValue('unconfirmed');expect(await f.run.reconcile(scope,signal())).toBe('unconfirmed');const control=new AbortController();control.abort();expect(await f.run.reconcile(scope,control.signal)).toBe('unconfirmed');expect(f.inspect).toHaveBeenCalledTimes(1);});
it('retains capacity for authority work ignoring cancellation',async()=>{
 vi.useFakeTimers();try{const f=fixture(),release:Array<(x:unknown)=>void>=[];f.confirm.mockImplementation(()=>new Promise(r=>release.push(r)));const run=createRefreshReconciliation({inspect:f.inspect,remove:f.remove} as unknown as ReturnType<typeof createRefreshStore>,{confirm:f.confirm},20);
 const calls=Array.from({length:4},()=>run.reconcile(scope,signal()));await vi.advanceTimersByTimeAsync(21);expect(await Promise.all(calls)).toEqual(Array(4).fill('unconfirmed'));expect(await run.reconcile(scope,signal())).toBe('unconfirmed');expect(f.confirm).toHaveBeenCalledTimes(4);release.forEach(r=>r(false));await vi.advanceTimersByTimeAsync(0);expect(f.remove).not.toHaveBeenCalled();
 }finally{vi.useRealTimers();}
});
