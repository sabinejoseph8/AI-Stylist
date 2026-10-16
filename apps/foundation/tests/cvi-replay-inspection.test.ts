import {it,expect,vi,afterEach} from 'vitest';
import {createLocalReplayInspector} from '../src/server/local-cvi-replay-inspection.ts';
import type {ReplayInspectionRequest} from '../src/server/local-cvi-replay-inspection.ts';
import {replayInspectionFixture} from './support/cvi-replay-inspection-fixture.ts';
const storeId='22222222-2222-4222-8222-222222222222',digest='a'.repeat(64),signal=()=>new AbortController().signal;
const setup=(reply:(r:ReplayInspectionRequest)=>unknown=r=>replayInspectionFixture(r))=>{
 let time=1000;const inspect=vi.fn(async(r:ReplayInspectionRequest)=>reply(r)),port={storeId,inspect};
 return {port,inspect,at:(n:number)=>time=n,make:()=>createLocalReplayInspector(port,digest,10000,()=>time)};
};
afterEach(()=>vi.useRealTimers());
it('fresh idle snapshots carry no activation or write permission',async()=>{const f=setup(),x=f.make();expect(await x.idle(signal())).toBe(true);expect(await x.idle(signal())).toBe(true);expect(f.inspect.mock.calls[0][0].challenge).not.toBe(f.inspect.mock.calls[1][0].challenge);expect(x.isHeld()).toBe(false);});
it.each(['storeId','bindingDigest','challenge','now','clock','expiresAt','limit','recordCount','pendingCount','spentCount','journalDigest','status','permissions','extra'])('holds malformed %s evidence without retry',async field=>{
 const f=setup(r=>{const result:any=replayInspectionFixture(r);result[field]=field==='permissions'?{write:true,activate:false,renew:false,sign:false,resume:false}:'invalid';return result;}),x=f.make();
 expect(await x.idle(signal())).toBe(false);expect(x.isHeld()).toBe(true);expect(await x.idle(signal())).toBe(false);expect(f.inspect).toHaveBeenCalledTimes(1);
});
it.each(['pending','exhausted'])('a %s journal stays held and is not repaired',async mode=>{const rows=mode==='pending'?[{status:'reserved'}]:[{status:'spent'}];const f=setup(r=>replayInspectionFixture(r,rows,1)),x=f.make();expect(await x.idle(signal())).toBe(false);expect(x.isHeld()).toBe(true);expect(rows[0].status).toBe(mode==='pending'?'reserved':'spent');});
it('cached replies cannot satisfy a new challenge',async()=>{let cached:unknown;const f=setup(r=>cached??(cached=replayInspectionFixture(r))),x=f.make();expect(await x.idle(signal())).toBe(true);expect(await x.idle(signal())).toBe(false);expect(x.isHeld()).toBe(true);});
it.each(['count','limit'])('a decreasing %s cannot erase observed history',async mode=>{let n=0;const f=setup(r=>{n++;return replayInspectionFixture(r,n===1?[{status:'spent'}]:[],mode==='limit'&&n===2?63:64);}),x=f.make();expect(await x.idle(signal())).toBe(true);expect(await x.idle(signal())).toBe(false);expect(x.isHeld()).toBe(true);});
it('spent records below capacity permit inspection without refunding records',async()=>{const rows=[{status:'spent'}],f=setup(r=>replayInspectionFixture(r,rows)),x=f.make();expect(await x.idle(signal())).toBe(true);f.at(1500);expect(await x.idle(signal())).toBe(true);expect(rows).toEqual([{status:'spent'}]);});
it.each([999,10000,NaN])('backward, expired or invalid time %s refuses before another read',async at=>{const f=setup(),x=f.make();expect(await x.idle(signal())).toBe(true);f.at(at);expect(await x.idle(signal())).toBe(false);expect(f.inspect).toHaveBeenCalledTimes(1);});
it('late backend output cannot establish idle',async()=>{const f=setup(r=>{f.at(9000);return replayInspectionFixture(r);}),x=f.make();expect(await x.idle(signal())).toBe(false);expect(x.isHeld()).toBe(true);});
it('an unresponsive backend is canceled at the deadline',async()=>{vi.useFakeTimers();const port={storeId,inspect:vi.fn(()=>new Promise(()=>{}))},x=createLocalReplayInspector(port,digest,10000,()=>1000),pending=x.idle(signal());await vi.advanceTimersByTimeAsync(8000);expect(await pending).toBe(false);expect(x.isHeld()).toBe(true);});
it('external cancellation holds an in-flight read without retry',async()=>{const port={storeId,inspect:vi.fn(()=>new Promise(()=>{}))},x=createLocalReplayInspector(port,digest,10000,()=>1000),c=new AbortController(),pending=x.idle(c.signal);c.abort();expect(await pending).toBe(false);expect(x.isHeld()).toBe(true);expect(port.inspect).not.toHaveBeenCalled();});
it('missing inspection or malformed store cannot select a fallback',()=>{expect(()=>createLocalReplayInspector({storeId},digest,10000)).toThrow();expect(()=>createLocalReplayInspector({storeId:'-'.repeat(36),inspect:async()=>null},digest,10000)).toThrow();});
it('captures the original inspector before a port is replaced',async()=>{const f=setup(),x=f.make();f.port.inspect=vi.fn(async()=>null as any);expect(await x.idle(signal())).toBe(true);expect(f.inspect).toHaveBeenCalledTimes(1);});
