import {it,expect,vi} from 'vitest';
import {createRefreshScan} from '../src/server/refresh-scan.ts';
import type {createRefreshStore} from '../src/server/refresh-store.ts';
import type {createRefreshReconciliation} from '../src/server/refresh-reconciliation.ts';
const first='11111111-1111-4111-8111-111111111111',second='22222222-2222-4222-8222-222222222222',signal=()=>new AbortController().signal;
const candidate=(sessionId:string)=>({scope:{ownerId:first,sessionId,generation:1,expiresAt:Date.now()+60000},state:'held',leaseId:first});
function fixture(){const discover=vi.fn(async()=>({status:'found',candidates:[candidate(first),candidate(second)],nextAfter:second})),reconcile=vi.fn(async():Promise<string>=>'unconfirmed');const run=createRefreshScan({discover} as unknown as Pick<ReturnType<typeof createRefreshStore>,'discover'>,{reconcile} as unknown as Pick<ReturnType<typeof createRefreshReconciliation>,'reconcile'>);return {discover,reconcile,run};}
it('reports progress while preserving unknown records and separating sweep end from cleanup completion',async()=>{const f=fixture();f.reconcile.mockResolvedValueOnce('confirmed');const page=await f.run.page(null,10,signal());expect(page).toEqual({status:'page',nextAfter:second,visited:2,confirmed:1,stale:0,unconfirmed:1,endOfSweep:true});expect(f.reconcile).toHaveBeenCalledTimes(2);});
it('reports stale scope and returns the last processed cursor',async()=>{const f=fixture();f.reconcile.mockResolvedValue('stale');const page=await f.run.page(null,2,signal());expect(page.stale).toBe(2);expect(page.endOfSweep).toBe(false);expect(page.nextAfter).toBe(second);});
it('does not advance cursor for canceled unresolved work',async()=>{const f=fixture(),control=new AbortController();f.reconcile.mockImplementation(async()=>{control.abort();return 'confirmed';});const page=await f.run.page(null,10,control.signal);expect(page.status).toBe('interrupted');expect(page.nextAfter).toBeNull();expect(page.visited).toBe(0);expect(f.reconcile).toHaveBeenCalledTimes(1);});
it('retains its single-flight slot while underlying discovery ignores cancellation',async()=>{
 vi.useFakeTimers();try{const f=fixture();let release!:(x:Awaited<ReturnType<typeof f.discover>>)=>void;f.discover.mockImplementation(()=>new Promise(r=>release=r));const scan=createRefreshScan({discover:f.discover} as unknown as Pick<ReturnType<typeof createRefreshStore>,'discover'>,{reconcile:f.reconcile} as unknown as Pick<ReturnType<typeof createRefreshReconciliation>,'reconcile'>,20);
 const pending=scan.page(null,10,signal());await vi.advanceTimersByTimeAsync(21);expect((await pending).status).toBe('interrupted');expect((await scan.page(null,10,signal())).status).toBe('unavailable');expect(f.discover).toHaveBeenCalledTimes(1);release({status:'found',candidates:[],nextAfter:second});await vi.advanceTimersByTimeAsync(0);expect(f.reconcile).not.toHaveBeenCalled();
 }finally{vi.useRealTimers();}
});
