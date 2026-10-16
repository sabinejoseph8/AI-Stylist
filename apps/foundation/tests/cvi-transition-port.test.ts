import {it,expect,vi} from 'vitest';
import {randomBytes} from 'node:crypto';
import {readFile,access} from 'node:fs/promises';
import {gateFinishFixture} from './support/cvi-gate-finish-fixture.ts';
import {beginLocalTransitionGate,localTransitionFinishBinding,inspectLocalTransitionGate,finishLocalTransitionGate,closeLocalTransitionGate,localTransitionIsHeld} from '../src/server/local-cvi-transition-port.ts';
import type {LocalTransitionSetup,LocalTransitionGate} from '../src/server/local-cvi-transition-port.ts';
import {gateFinishScope} from '../src/server/local-cvi-gate-finish-proof.ts';
const signal=()=>new AbortController().signal;
const setup=(x:Awaited<ReturnType<typeof gateFinishFixture>>):LocalTransitionSetup=>({root:x.f.replayRoot,scope:gateFinishScope(x.binding.marker),plan:x.binding.plan,pin:x.binding.pin,writerPrincipal:x.binding.writerPrincipal,owner:x.binding.owner,commit:x.binding.commit});
it('original Node gate inspects and finishes with the original signed checkpoint and clean process exit',async()=>{const x=await gateFinishFixture();let p:LocalTransitionGate|undefined;try{
 p=await beginLocalTransitionGate(setup(x),signal(),x.clock);const b=localTransitionFinishBinding(p);
 const value:any=await inspectLocalTransitionGate(p,{storeId:b.marker.storeId,bindingDigest:b.marker.bindingDigest,challenge:randomBytes(32).toString('hex'),now:1000},signal());expect(value.snapshot.status).toBe('replay-idle');
 const before=(await x.f.x.inspect()).requests.length,r=await x.f.inspector(x.clock,b).inspectOwner(b.owner,signal());
 await finishLocalTransitionGate(p,r,signal());expect(localTransitionIsHeld(p)).toBe(false);expect((await x.f.x.inspect()).requests.length-before).toBe(2);await expect(access(x.f.replayRoot+'/owner-transition.json')).rejects.toThrow();
 await expect(finishLocalTransitionGate(p,r,signal())).rejects.toThrow();
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}},30000);
it('copied handles cannot inspect, finish, read a binding or retire the original gate',async()=>{const x=await gateFinishFixture();let p:LocalTransitionGate|undefined;try{
 p=await beginLocalTransitionGate(setup(x),signal(),x.clock);const copy={...p};expect(()=>localTransitionFinishBinding(copy)).toThrow();expect(()=>closeLocalTransitionGate(copy)).toThrow();expect(()=>inspectLocalTransitionGate(copy,{} as any,signal())).toThrow();expect(()=>finishLocalTransitionGate(copy,{},signal())).toThrow();expect(localTransitionIsHeld(p)).toBe(false);
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}},30000);
it('an ordinary checkpoint summary holds the original gate and retains its marker',async()=>{const x=await gateFinishFixture();let p:LocalTransitionGate|undefined;try{
 const r=await x.f.inspector().inspectOwner(x.binding.owner,signal());p=await beginLocalTransitionGate(setup(x),signal(),x.clock);await expect(finishLocalTransitionGate(p,r,signal())).rejects.toThrow();expect(localTransitionIsHeld(p)).toBe(true);expect((await readFile(x.f.replayRoot+'/owner-transition.json','utf8')).length).toBeGreaterThan(0);
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}},30000);
it('cancellation kills the lock process and retains uncertainty without retry',async()=>{const x=await gateFinishFixture();let p:LocalTransitionGate|undefined;try{
 const c=new AbortController();p=await beginLocalTransitionGate(setup(x),c.signal,x.clock);c.abort();await vi.waitFor(()=>expect(localTransitionIsHeld(p!)).toBe(true));await closeLocalTransitionGate(p);expect((await readFile(x.f.replayRoot+'/owner-transition.json','utf8')).length).toBeGreaterThan(0);await expect(beginLocalTransitionGate(setup(x),signal(),x.clock,500)).rejects.toThrow();
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}},30000);
it('hard supervision kills an idle original gate even with a frozen logical clock',async()=>{const x=await gateFinishFixture();let p:LocalTransitionGate|undefined;try{
 p=await beginLocalTransitionGate(setup(x),signal(),x.clock,500);await vi.waitFor(()=>expect(localTransitionIsHeld(p!)).toBe(true),{timeout:2000});await closeLocalTransitionGate(p);expect((await readFile(x.f.replayRoot+'/owner-transition.json','utf8')).length).toBeGreaterThan(0);
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}},30000);
it('invalid trusted context refuses before spawning or creating a marker',async()=>{const x=await gateFinishFixture();try{
 const s=setup(x);for(const bad of [{...s,commit:{...s.commit,claimHash:'bad'}},{...s,scope:{...s.scope,expiresAt:90000}},{...s,pin:{...s.pin,database:s.pin.authority}}])await expect(beginLocalTransitionGate(bad,signal(),x.clock)).rejects.toThrow();await expect(access(x.f.replayRoot+'/owner-transition.json')).rejects.toThrow();
 }finally{await x.close();}},30000);
it('a copied signed inspection cannot finish the original gate',async()=>{const x=await gateFinishFixture();let p:LocalTransitionGate|undefined;try{
 p=await beginLocalTransitionGate(setup(x),signal(),x.clock);const b=localTransitionFinishBinding(p),r=await x.f.inspector(x.clock,b).inspectOwner(b.owner,signal());await expect(finishLocalTransitionGate(p,structuredClone(r),signal())).rejects.toThrow();expect(localTransitionIsHeld(p)).toBe(true);
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}},30000);
it('clock regression and signed-proof expiry retain the permanent marker',async()=>{for(const at of [999,4000]){const x=await gateFinishFixture();let p:LocalTransitionGate|undefined;try{
 p=await beginLocalTransitionGate(setup(x),signal(),x.clock);const b=localTransitionFinishBinding(p),r=await x.f.inspector(x.clock,b).inspectOwner(b.owner,signal());x.at(at);await expect(finishLocalTransitionGate(p,r,signal())).rejects.toThrow();await closeLocalTransitionGate(p);expect((await readFile(x.f.replayRoot+'/owner-transition.json','utf8')).length).toBeGreaterThan(0);
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}}},30000);
it('two finish calls cannot claim or publish twice, including an unknown competing outcome',async()=>{const x=await gateFinishFixture();let p:LocalTransitionGate|undefined;try{
 p=await beginLocalTransitionGate(setup(x),signal(),x.clock);const b=localTransitionFinishBinding(p),r=await x.f.inspector(x.clock,b).inspectOwner(b.owner,signal());const both=await Promise.allSettled([finishLocalTransitionGate(p,r,signal()),finishLocalTransitionGate(p,r,signal())]);expect(both.filter(v=>v.status==='fulfilled').length).toBeLessThanOrEqual(1);expect(both.some(v=>v.status==='rejected')).toBe(true);expect(localTransitionIsHeld(p)).toBe(true);
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}},30000);
it('setup mutations cannot change the captured target, pin or original commit',async()=>{const x=await gateFinishFixture();let p:LocalTransitionGate|undefined;try{
 const s=setup(x),opening=beginLocalTransitionGate(s,signal(),x.clock);(s.commit as any).claimHash='0'.repeat(64);(s.pin.database as any).publicKeyPem='invalid';p=await opening;const b=localTransitionFinishBinding(p);expect(b.commit.claimHash).not.toBe(s.commit.claimHash);expect(Object.isFrozen(b.plan.args)).toBe(true);const r=await x.f.inspector(x.clock,b).inspectOwner(b.owner,signal());await finishLocalTransitionGate(p,r,signal());
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}},30000);
it('an oversized encoded setup frame refuses without an unhandled ready rejection',async()=>{const x=await gateFinishFixture();try{
 const s=structuredClone(setup(x));const pad=1048570-Buffer.byteLength(JSON.stringify(s));expect(pad).toBeGreaterThan(0);(s.pin.database as any).publicKeyPem+=' '.repeat(pad);await expect(beginLocalTransitionGate(s,signal(),x.clock)).rejects.toThrow();
 }finally{await x.close();}},30000);
