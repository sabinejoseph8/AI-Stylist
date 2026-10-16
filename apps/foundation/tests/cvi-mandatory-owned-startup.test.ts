/** Genuine configured pairs only; no test harness can acquire the protected brand. */
import {it,expect,vi} from 'vitest';
import {pairedOwnerFixture} from './support/cvi-paired-owner-fixture.ts';
import {createLocalCviStartupOwner,isLocalCviStartedOwner} from '../src/server/local-cvi-startup-owner.ts';
import {claimLocalOwnerPair,bindLocalOwnerPair} from '../src/server/local-cvi-owner-pair.ts';
import {localOwnedReplayState} from '../src/server/local-cvi-owned-replay.ts';
const signal=()=>new AbortController().signal;
it.each(['plain','copy'])('refuses a %s port before native admission',async mode=>{const x=await pairedOwnerFixture();try{
 const replay=mode==='plain'?x.f.rawReplay:{...x.pair.replay};expect(()=>createLocalCviStartupOwner(x.f.expected,x.context.checkpoint,x.pair.admission,{...x.resources,replay},x.clock)).toThrow();expect(x.ports.planFull).not.toHaveBeenCalled();expect((await x.f.x.inspect()).revision).toBe(2);
 }finally{await x.close();}},30000);
it.each(['native','cap','secret'])('refuses a substituted %s scope before work',async mode=>{const x=await pairedOwnerFixture();try{
 const binding={...x.resources.binding},expected={...x.f.expected};if(mode==='cap')binding.expiresAt=20000;if(mode==='secret')binding.secret='f'.repeat(64);if(mode==='native')expected.storeId=x.resources.boot.storeId;
 expect(()=>createLocalCviStartupOwner(expected,x.context.checkpoint,x.pair.admission,{...x.resources,binding},x.clock)).toThrow();expect(x.ports.planFull).not.toHaveBeenCalled();expect((await x.f.x.inspect()).revision).toBe(2);
 }finally{await x.close();}},30000);
it('copying a committed public permit cannot bind or register an owner; retirement preserves COMMIT',async()=>{const x=await pairedOwnerFixture();try{
 expect(claimLocalOwnerPair(x.pair.admission)).toBe(true);const input=x.f.input(),raw=await x.pair.admission.admit(input,signal());
 expect(()=>bindLocalOwnerPair(x.pair.admission,structuredClone(raw),input)).toThrow();expect(isLocalCviStartedOwner(raw as object)).toBe(false);expect(localOwnedReplayState(x.pair.replay).bound).toBe(false);expect((await x.f.x.inspect()).revision).toBe(4);
 await x.pair.close();expect(localOwnedReplayState(x.pair.replay)).toEqual({bound:false,held:true});expect((await x.f.x.inspect()).revision).toBe(4);
 }finally{await x.close();}},30000);
it('End retires the private port and removes protected HTTP startup identity',async()=>{const x=await pairedOwnerFixture();try{
 const owner=await x.make().start(signal());expect(owner).not.toBeNull();expect(isLocalCviStartedOwner(owner!)).toBe(true);expect(localOwnedReplayState(x.pair.replay).bound).toBe(true);
 owner!.end();expect(isLocalCviStartedOwner(owner!)).toBe(false);expect(localOwnedReplayState(x.pair.replay)).toEqual({bound:false,held:true});expect(()=>x.make()).toThrow();expect(x.f.replayHooks.reserve).not.toHaveBeenCalled();expect((await x.f.x.inspect()).revision).toBe(4);
 }finally{await x.close();}},30000);
it('credential failure retires a bound private handoff without undoing native COMMIT',async()=>{const x=await pairedOwnerFixture(ports=>{ports.credentials={...ports.credentials,activate:vi.fn(async()=>{throw Error('Simulated activation loss');})};});try{
 expect(await x.make().start(signal())).toBeNull();expect(localOwnedReplayState(x.pair.replay)).toEqual({bound:false,held:true});expect((await x.f.x.inspect()).revision).toBe(4);expect(x.f.replayHooks.reserve).not.toHaveBeenCalled();expect(x.draft).not.toHaveBeenCalled();
 }finally{await x.close();}},30000);
it('two controllers cannot claim one pair or retire the successful owner',async()=>{const x=await pairedOwnerFixture();try{
 const one=x.make(),two=x.make(),first=one.start(signal());expect(await two.start(signal())).toBeNull();const owner=await first;expect(owner).not.toBeNull();expect(x.ports.planFull).toHaveBeenCalledTimes(1);expect((await x.f.x.inspect()).revision).toBe(4);expect(isLocalCviStartedOwner(owner!)).toBe(true);expect(localOwnedReplayState(x.pair.replay)).toEqual({bound:true,held:false});owner!.end();
 }finally{await x.close();}},30000);
