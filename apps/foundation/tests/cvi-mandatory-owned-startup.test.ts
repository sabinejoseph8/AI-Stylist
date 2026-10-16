/** Actual signed/native startup; no plain replay or copied-permit fallback. */
import {it,expect,vi} from 'vitest';
import {startupAdmissionFixture} from './support/cvi-startup-admission-fixture.ts';
import {createLocalCviStartupOwner,isLocalCviStartedOwner} from '../src/server/local-cvi-startup-owner.ts';
import {createLocalOwnedReplayPort,localOwnedReplayState} from '../src/server/local-cvi-owned-replay.ts';
const signal=()=>new AbortController().signal;
it.each(['plain','copy'])('refuses a %s port before native admission',async mode=>{const f=await startupAdmissionFixture();try{
 const admit=vi.fn(async()=>null),resources={...f.resources,replay:mode==='plain'?f.rawReplay:{...f.resources.replay}};
 expect(()=>createLocalCviStartupOwner(f.expected,f.checkpoint,{admit},resources,()=>1000)).toThrow();expect(admit).not.toHaveBeenCalled();expect((await f.x.inspect()).revision).toBe(2);
 }finally{await f.close();}},30000);
it.each(['native','cap','secret'])('refuses an owned port with a substituted %s scope before work',async mode=>{const f=await startupAdmissionFixture();try{
 const binding={...f.resources.binding};if(mode==='cap')binding.expiresAt=20000;if(mode==='secret')binding.secret='f'.repeat(64);
 const replay=createLocalOwnedReplayPort({storeId:f.journal.storeId,nativeStoreId:mode==='native'?f.resources.boot.storeId:f.x.pin.storeId,binding},{inspect:async()=>null,mutate:async()=>null},()=>1000),admit=vi.fn(async()=>null);
 expect(()=>createLocalCviStartupOwner(f.expected,f.checkpoint,{admit},{...f.resources,replay},()=>1000)).toThrow();expect(admit).not.toHaveBeenCalled();expect((await f.x.inspect()).revision).toBe(2);
 }finally{await f.close();}},30000);
it('copying the committed public permit cannot bind or register an owner',async()=>{const f=await startupAdmissionFixture();try{
 const original=f.admission(),admission={admit:async(i:any,s:AbortSignal)=>structuredClone(await original.admit(i,s))};
 const c=createLocalCviStartupOwner(f.expected,f.checkpoint,admission,f.resources,()=>1000,8000);
 expect(await c.start(signal())).toBeNull();expect(c.isHeld()).toBe(true);expect(localOwnedReplayState(f.resources.replay)).toEqual({bound:false,held:true});expect((await f.x.inspect()).revision).toBe(4);
 }finally{await f.close();}},30000);
it('End retires the private port and removes protected HTTP startup identity',async()=>{const f=await startupAdmissionFixture();try{
 const owner=await f.make().start(signal());expect(owner).not.toBeNull();expect(isLocalCviStartedOwner(owner!)).toBe(true);expect(localOwnedReplayState(f.resources.replay).bound).toBe(true);
 owner!.end();expect(isLocalCviStartedOwner(owner!)).toBe(false);expect(localOwnedReplayState(f.resources.replay)).toEqual({bound:false,held:true});
 expect(()=>createLocalCviStartupOwner(f.expected,f.checkpoint,f.admission(),f.resources,()=>1000)).toThrow();expect(f.replayHooks.reserve).not.toHaveBeenCalled();expect((await f.x.inspect()).revision).toBe(4);
 }finally{await f.close();}},30000);
it('credential failure retires a bound private handoff without undoing native COMMIT',async()=>{const f=await startupAdmissionFixture();try{
 f.resources.authority.activate=async()=>{throw Error('Simulated activation loss');};expect(await f.make().start(signal())).toBeNull();
 expect(localOwnedReplayState(f.resources.replay)).toEqual({bound:false,held:true});expect((await f.x.inspect()).revision).toBe(4);expect(f.replayHooks.reserve).not.toHaveBeenCalled();
 }finally{await f.close();}},30000);
it('two controllers cannot claim one private port or retire the successful owner',async()=>{const f=await startupAdmissionFixture();try{
 const execute=vi.spyOn(f.ports,'execute'),one=createLocalCviStartupOwner(f.expected,f.checkpoint,f.admission(),f.resources,()=>1000,8000),two=createLocalCviStartupOwner(f.expected,f.checkpoint,f.admission(),f.resources,()=>1000,8000);
 const first=one.start(signal());expect(await two.start(signal())).toBeNull();const owner=await first;expect(owner).not.toBeNull();expect(execute).toHaveBeenCalledTimes(1);expect(isLocalCviStartedOwner(owner!)).toBe(true);expect(localOwnedReplayState(f.resources.replay)).toEqual({bound:true,held:false});owner!.end();
 }finally{await f.close();}},30000);
