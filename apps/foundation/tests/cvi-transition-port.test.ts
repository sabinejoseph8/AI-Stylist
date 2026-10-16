import {it,expect,vi} from 'vitest';
import {randomBytes} from 'node:crypto';
import {readFile,access} from 'node:fs/promises';
import {deferredGateFixture} from './support/cvi-deferred-gate-fixture.ts';
import {beginLocalTransitionGate,localTransitionFinishBinding,bindLocalTransitionAdmission,inspectLocalTransitionGate,finishLocalTransitionGate,closeLocalTransitionGate,localTransitionIsHeld} from '../src/server/local-cvi-transition-port.ts';
import type {LocalTransitionGate} from '../src/server/local-cvi-transition-port.ts';
const signal=()=>new AbortController().signal;
it('the original gate spans authority advance, confirmed admission, actual SQLite COMMIT and signed finish',async()=>{const x=await deferredGateFixture();let p:LocalTransitionGate|undefined;try{
 p=await beginLocalTransitionGate(x.setup,signal(),x.clock);expect((await x.x.inspect()).revision).toBe(0);expect(()=>localTransitionFinishBinding(p!)).toThrow();await x.execute(p);const b=localTransitionFinishBinding(p);
 expect(b.commit).toEqual({operationId:x.plan.id.slice(0,32),transactionId:(await x.observe()).transactionId,claimHash:(await x.observe()).claimHash});
 const value:any=await inspectLocalTransitionGate(p,{storeId:b.marker.storeId,bindingDigest:b.marker.bindingDigest,challenge:randomBytes(32).toString('hex'),now:1000},signal());expect(value.snapshot.status).toBe('replay-idle');
 const before=(await x.x.inspect()).requests.length,r=await x.inspector(p).inspectOwner(x.owner,signal());await finishLocalTransitionGate(p,r,signal());expect(localTransitionIsHeld(p)).toBe(false);expect((await x.x.inspect()).requests.length-before).toBe(2);await expect(access(x.root+'/owner-transition.json')).rejects.toThrow();await expect(finishLocalTransitionGate(p,r,signal())).rejects.toThrow();
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}},30000);
it('copied handles cannot bind, inspect, finish, obtain context or close the original gate',async()=>{const x=await deferredGateFixture();let p:LocalTransitionGate|undefined;try{
 p=await beginLocalTransitionGate(x.setup,signal(),x.clock);const copy={...p};expect(()=>localTransitionFinishBinding(copy)).toThrow();expect(()=>closeLocalTransitionGate(copy)).toThrow();expect(()=>bindLocalTransitionAdmission(copy,{},signal())).toThrow();expect(()=>inspectLocalTransitionGate(copy,{} as any,signal())).toThrow();expect(()=>finishLocalTransitionGate(copy,{},signal())).toThrow();expect(localTransitionIsHeld(p)).toBe(false);
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}},30000);
it('an ordinary checkpoint summary holds the original gate and retains its marker',async()=>{const x=await deferredGateFixture();let p:LocalTransitionGate|undefined;try{
 p=await beginLocalTransitionGate(x.setup,signal(),x.clock);await x.execute(p);const r=await x.inspector(p,false).inspectOwner(x.owner,signal());await expect(finishLocalTransitionGate(p,r,signal())).rejects.toThrow();expect(localTransitionIsHeld(p)).toBe(true);expect((await readFile(x.root+'/owner-transition.json','utf8')).length).toBeGreaterThan(0);
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}},30000);
it('cancellation kills the gate before advance, retaining uncertainty without retry',async()=>{const x=await deferredGateFixture();let p:LocalTransitionGate|undefined;try{
 const c=new AbortController();p=await beginLocalTransitionGate(x.setup,c.signal,x.clock);c.abort();await vi.waitFor(()=>expect(localTransitionIsHeld(p!)).toBe(true));await closeLocalTransitionGate(p);expect((await x.x.inspect()).revision).toBe(0);expect((await readFile(x.root+'/owner-transition.json','utf8')).length).toBeGreaterThan(0);await expect(beginLocalTransitionGate(x.setup,signal(),x.clock,500)).rejects.toThrow();
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}},30000);
it('hard supervision kills an idle original gate despite a frozen fixture clock',async()=>{const x=await deferredGateFixture();let p:LocalTransitionGate|undefined;try{
 p=await beginLocalTransitionGate(x.setup,signal(),x.clock,500);await vi.waitFor(()=>expect(localTransitionIsHeld(p!)).toBe(true),{timeout:2000});await closeLocalTransitionGate(p);expect((await readFile(x.root+'/owner-transition.json','utf8')).length).toBeGreaterThan(0);
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}},30000);
it('raw pre-entry commits and invalid trusted contexts refuse before marker creation',async()=>{const x=await deferredGateFixture();try{
 const s=x.setup;for(const bad of [{...s,commit:{operationId:x.plan.id.slice(0,32),transactionId:'40',claimHash:'c'.repeat(64)}},{...s,scope:{...s.scope,expiresAt:90000}},{...s,pin:{...s.pin,database:s.pin.authority}},{...s,databasePrincipal:'bad principal'}])await expect(beginLocalTransitionGate(bad,signal(),x.clock)).rejects.toThrow();await expect(access(x.root+'/owner-transition.json')).rejects.toThrow();
 }finally{await x.close();}},30000);
it('a copied signed inspection cannot finish the original deferred gate',async()=>{const x=await deferredGateFixture();let p:LocalTransitionGate|undefined;try{
 p=await beginLocalTransitionGate(x.setup,signal(),x.clock);await x.execute(p);const r=await x.inspector(p).inspectOwner(x.owner,signal());await expect(finishLocalTransitionGate(p,structuredClone(r),signal())).rejects.toThrow();expect(localTransitionIsHeld(p)).toBe(true);
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}},30000);
it('clock regression and signed-proof expiry retain the permanent marker',async()=>{for(const at of [999,4000]){const x=await deferredGateFixture();let p:LocalTransitionGate|undefined;try{
 p=await beginLocalTransitionGate(x.setup,signal(),x.clock);await x.execute(p);const r=await x.inspector(p).inspectOwner(x.owner,signal());x.at(at);await expect(finishLocalTransitionGate(p,r,signal())).rejects.toThrow();await closeLocalTransitionGate(p);expect((await readFile(x.root+'/owner-transition.json','utf8')).length).toBeGreaterThan(0);
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}}},30000);
it('two finish calls cannot publish twice even with a competing unknown outcome',async()=>{const x=await deferredGateFixture();let p:LocalTransitionGate|undefined;try{
 p=await beginLocalTransitionGate(x.setup,signal(),x.clock);await x.execute(p);const r=await x.inspector(p).inspectOwner(x.owner,signal());const both=await Promise.allSettled([finishLocalTransitionGate(p,r,signal()),finishLocalTransitionGate(p,r,signal())]);expect(both.filter(v=>v.status==='fulfilled').length).toBeLessThanOrEqual(1);expect(both.some(v=>v.status==='rejected')).toBe(true);expect(localTransitionIsHeld(p)).toBe(true);
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}},30000);
it('setup mutation cannot redirect the captured native plan, keys or SQL principal',async()=>{const x=await deferredGateFixture();let p:LocalTransitionGate|undefined;try{
 const s=structuredClone(x.setup),opening=beginLocalTransitionGate(s,signal(),x.clock);(s as any).databasePrincipal='fixture_writer';(s.pin.database as any).publicKeyPem='invalid';p=await opening;await x.execute(p);const b=localTransitionFinishBinding(p);expect(Object.isFrozen(b.plan.args)).toBe(true);expect(b.pin.database.publicKeyPem).not.toBe(s.pin.database.publicKeyPem);const r=await x.inspector(p).inspectOwner(x.owner,signal());await finishLocalTransitionGate(p,r,signal());
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}},30000);
it('oversized setup frames refuse without an unhandled ready rejection',async()=>{const x=await deferredGateFixture();try{
 const s=structuredClone(x.setup),pad=1048570-Buffer.byteLength(JSON.stringify(s));expect(pad).toBeGreaterThan(0);(s.pin.database as any).publicKeyPem+=' '.repeat(pad);await expect(beginLocalTransitionGate(s,signal(),x.clock)).rejects.toThrow();
 }finally{await x.close();}},30000);
it('a copied confirmed admission cannot bind and leaves authority evidence spent',async()=>{const x=await deferredGateFixture();let p:LocalTransitionGate|undefined;try{
 p=await beginLocalTransitionGate(x.setup,signal(),x.clock);await expect(x.execute(p,{copyAdmission:true})).rejects.toThrow();expect(localTransitionIsHeld(p)).toBe(true);expect((await x.x.inspect()).pending).toBe(x.plan.id);await expect(x.observe()).rejects.toThrow();expect((await readFile(x.root+'/owner-transition.json','utf8')).length).toBeGreaterThan(0);
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}},30000);
it.each(['before-commit','after-commit','after-close'])('unknown %s completion never reconciles or finishes automatically',async crash=>{const x=await deferredGateFixture();let p:LocalTransitionGate|undefined;try{
 p=await beginLocalTransitionGate(x.setup,signal(),x.clock);await expect(x.execute(p,{crash})).rejects.toThrow();expect((await x.x.inspect()).pending).toBe(x.plan.id);await expect(finishLocalTransitionGate(p,{},signal())).rejects.toThrow();expect(localTransitionIsHeld(p)).toBe(true);if(crash==='before-commit')await expect(x.observe()).rejects.toThrow();else expect((await x.observe()).consumed).toBe(true);expect((await readFile(x.root+'/owner-transition.json','utf8')).length).toBeGreaterThan(0);
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}},30000);
it('finish without a deferred admission holds before authority or database work',async()=>{const x=await deferredGateFixture();let p:LocalTransitionGate|undefined;try{
 p=await beginLocalTransitionGate(x.setup,signal(),x.clock);await expect(finishLocalTransitionGate(p,{},signal())).rejects.toThrow();expect(localTransitionIsHeld(p)).toBe(true);expect((await x.x.inspect()).revision).toBe(0);await expect(x.observe()).rejects.toThrow();
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}},30000);
it('plain transaction data cannot replace an original confirmed admission',async()=>{const x=await deferredGateFixture();let p:LocalTransitionGate|undefined;try{
 p=await beginLocalTransitionGate(x.setup,signal(),x.clock);await expect(bindLocalTransitionAdmission(p,{operationId:x.plan.id.slice(0,32),transactionId:'1',claimHash:'c'.repeat(64)},signal())).rejects.toThrow();expect(localTransitionIsHeld(p)).toBe(true);expect((await x.x.inspect()).revision).toBe(0);
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}},30000);
it('a second binding holds rather than replacing a committed transaction',async()=>{const x=await deferredGateFixture();let p:LocalTransitionGate|undefined;try{
 p=await beginLocalTransitionGate(x.setup,signal(),x.clock);const seen=await x.execute(p);await expect(bindLocalTransitionAdmission(p,x.admission(),signal())).rejects.toThrow();expect(localTransitionIsHeld(p)).toBe(true);expect((await x.observe()).transactionId).toBe(seen.transactionId);expect((await x.x.inspect()).revision).toBe(2);
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}},30000);
it('canceling the original gate during confirmation prevents database commit',async()=>{const x=await deferredGateFixture();let p:LocalTransitionGate|undefined;try{
 const c=new AbortController();p=await beginLocalTransitionGate(x.setup,c.signal,x.clock);await expect(x.execute(p,{beforeBind:()=>c.abort()})).rejects.toThrow();expect(localTransitionIsHeld(p)).toBe(true);expect((await x.x.inspect()).pending).toBe(x.plan.id);await expect(x.observe()).rejects.toThrow();
 }finally{if(p)await closeLocalTransitionGate(p);await x.close();}},30000);
