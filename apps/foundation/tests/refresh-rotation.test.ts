import {it,expect,vi} from 'vitest';
import {createRefreshRotation} from '../src/server/refresh-rotation.ts';
import type {createRefreshStore} from '../src/server/refresh-store.ts';
const scope={ownerId:'11111111-1111-4111-8111-111111111111',sessionId:'22222222-2222-4222-8222-222222222222',generation:1,expiresAt:Date.now()+60000};
const signal=()=>new AbortController().signal;
function fixture(){
 const claim={status:'claimed',scope,leaseId:'33333333-3333-4333-8333-333333333333',readSecret:vi.fn(()=> 'old-fixture'),clearSecret:vi.fn()};
 const store={claim:vi.fn(async(_owner:string,_session:string,generation:number)=>({...claim,scope:{...scope,generation}})),finish:vi.fn(async()=> 'confirmed'),inspect:vi.fn(async()=>({status:'found',scope:{...scope,generation:2},state:'ready',leaseId:null})),remove:vi.fn(async()=> 'confirmed'),hold:vi.fn(async()=> 'confirmed')};
 const revoke=vi.fn(async()=>true),rotate=vi.fn(async(_secret:string,_signal:AbortSignal)=>({accessToken:'access-fixture',refreshSecret:'new-fixture',expiresAt:scope.expiresAt,revoke}));
 return {store,claim,rotate,revoke,rotation:createRefreshRotation(store as unknown as ReturnType<typeof createRefreshStore>,{rotate})};
}
it('claims once, stages encrypted ownership adoption, then revokes before fenced removal',async()=>{
 const f=fixture(),session=await f.rotation.stage(scope,signal());expect(f.rotate.mock.calls[0]?.[0]).toBe('old-fixture');expect(f.store.finish).not.toHaveBeenCalled();
 expect(await session.adopt!(signal())).toBe(true);expect(await session.adopt!(signal())).toBe(true);expect(f.store.finish).toHaveBeenCalledTimes(1);
 expect(await session.discard(signal())).toBe(true);expect(await session.discard(signal())).toBe(true);expect(f.revoke).toHaveBeenCalledTimes(1);expect(f.store.remove).toHaveBeenCalledTimes(1);
 expect(await session.adopt!(signal())).toBe(false);
});
it('keeps ambiguous provider rotation durably claimed and does not retry',async()=>{
 const f=fixture();f.rotate.mockRejectedValue(Error('private'));await expect(f.rotation.stage(scope,signal())).rejects.toThrow('Account refresh unavailable');expect(f.claim.clearSecret).toHaveBeenCalled();expect(f.store.remove).not.toHaveBeenCalled();expect(f.rotate).toHaveBeenCalledTimes(1);
});
it('refuses removal if provider revocation is unconfirmed or a different generation is present',async()=>{
 const f=fixture(),session=await f.rotation.stage(scope,signal());f.revoke.mockResolvedValue(false);expect(await session.discard(signal())).toBe(false);expect(f.store.remove).not.toHaveBeenCalled();expect(f.store.hold).toHaveBeenCalledTimes(1);
 const g=fixture(),other=await g.rotation.stage(scope,signal());g.store.inspect.mockResolvedValue({status:'found',scope:{...scope,generation:3},state:'ready',leaseId:null});expect(await other.discard(signal())).toBe(false);expect(g.store.remove).not.toHaveBeenCalled();
});

it('waits for started adoption before revoking and removing ownership',async()=>{
 const f=fixture();let finish!:(value:string)=>void;
 f.store.finish.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
 const session=await f.rotation.stage(scope,signal()),adoption=session.adopt!(signal()),discard=session.discard(signal());
 expect(f.revoke).not.toHaveBeenCalled();finish('confirmed');expect(await adoption).toBe(true);expect(await discard).toBe(true);
 expect(f.revoke).toHaveBeenCalledTimes(1);expect(f.store.remove).toHaveBeenCalledTimes(1);
});

it('never removes ownership when cleanup inspection is unavailable',async()=>{
 const f=fixture(),session=await f.rotation.stage(scope,signal());
 f.store.inspect.mockRejectedValue(Error('fixture database unavailable'));
 expect(await session.discard(signal())).toBe(false);expect(f.store.remove).not.toHaveBeenCalled();expect(f.revoke).toHaveBeenCalledTimes(1);
});
it('does not quarantine or delete a competing newer generation',async()=>{
 const f=fixture(),session=await f.rotation.stage(scope,signal());f.store.inspect.mockResolvedValue({status:'found',scope:{...scope,generation:3},state:'ready',leaseId:null});
 expect(await session.discard(signal())).toBe(false);expect(f.store.claim).toHaveBeenCalledTimes(1);expect(f.store.hold).not.toHaveBeenCalled();expect(f.store.remove).not.toHaveBeenCalled();
});

it('does not start cleanup work with an already canceled scope',async()=>{
 const f=fixture(),session=await f.rotation.stage(scope,signal()),control=new AbortController();control.abort();
 expect(await session.discard(control.signal)).toBe(false);expect(f.revoke).not.toHaveBeenCalled();expect(f.store.inspect).not.toHaveBeenCalled();expect(f.store.remove).not.toHaveBeenCalled();
});
it('does not remove ownership when cancellation arrives during revocation',async()=>{
 const f=fixture(),session=await f.rotation.stage(scope,signal()),control=new AbortController();
 f.revoke.mockImplementation(async()=>{control.abort();return true;});
 expect(await session.discard(control.signal)).toBe(false);expect(f.store.remove).not.toHaveBeenCalled();expect(f.revoke).toHaveBeenCalledTimes(1);
});
