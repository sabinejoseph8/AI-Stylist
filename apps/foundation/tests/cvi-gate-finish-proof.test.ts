import {it,expect} from 'vitest';
import {gateFinishFixture} from './support/cvi-gate-finish-fixture.ts';
import {claimLocalGateFinishInspection} from '../src/server/local-cvi-startup-checkpoint.ts';
import {verifyLocalGateFinishProof,gateFinishChallenges} from '../src/server/local-cvi-gate-finish-proof.ts';
import {isLocalCviStartedOwner} from '../src/server/local-cvi-startup-owner.ts';
import {historyCanonical} from '../src/server/local-cvi-history-authority.ts';
const signal=()=>new AbortController().signal;
it('retains the exact signed final inspection once without adding authority reads',async()=>{const x=await gateFinishFixture();try{
 const before=(await x.f.x.inspect()).requests.length,r=await x.make().inspectOwner(x.binding.owner,signal()),after=(await x.f.x.inspect()).requests.length;
 expect(after-before).toBe(2);expect(r.permissions.resume).toBe(false);expect(isLocalCviStartedOwner(r)).toBe(false);
 const pack=claimLocalGateFinishInspection(r,x.binding,1000),ch=gateFinishChallenges(x.binding.prepared);
 expect(new Set(Object.values(ch)).size).toBe(3);expect(pack.before.request.challenge).toBe(ch.before);expect((pack.database as any).body.nonce).toBe(ch.database);expect(pack.after.request.challenge).toBe(ch.after);
 const result=verifyLocalGateFinishProof(x.binding,pack,1000);expect(result).toEqual({status:'transition-finish-verified',operationId:x.binding.plan.id,targetDigest:x.binding.marker.targetNativeDigest,challenge:x.binding.prepared.challenge});
 expect(isLocalCviStartedOwner(result)).toBe(false);expect((await x.f.x.inspect()).requests.length).toBe(after);expect(()=>claimLocalGateFinishInspection(r,x.binding,1000)).toThrow();
 }finally{await x.close();}},30000);
it('copies of a result or binding cannot claim the original proof',async()=>{const x=await gateFinishFixture();try{
 const r=await x.make().inspectOwner(x.binding.owner,signal());expect(()=>claimLocalGateFinishInspection(structuredClone(r),x.binding,1000)).toThrow();expect(()=>claimLocalGateFinishInspection(r,structuredClone(x.binding),1000)).toThrow();expect(claimLocalGateFinishInspection(r,x.binding,1000)).toBeDefined();
 }finally{await x.close();}},30000);
it('cancellation after inspection invalidates the unclaimed proof',async()=>{const x=await gateFinishFixture();try{
 const c=new AbortController(),r=await x.make().inspectOwner(x.binding.owner,c.signal);c.abort();expect(()=>claimLocalGateFinishInspection(r,x.binding,1000)).toThrow();
 }finally{await x.close();}},30000);
it('claim respects earliest signed-proof expiry rather than the longer gate cap',async()=>{const x=await gateFinishFixture();try{
 const r=await x.make().inspectOwner(x.binding.owner,signal());expect(x.binding.prepared.expiresAt).toBe(5000);expect(()=>claimLocalGateFinishInspection(r,x.binding,4000)).toThrow();expect(()=>claimLocalGateFinishInspection(r,x.binding,999)).toThrow();
 }finally{await x.close();}},30000);
it('signed but altered transaction, claim, state and flags are refused',async()=>{const x=await gateFinishFixture();try{
 const r=await x.make().inspectOwner(x.binding.owner,signal()),original=claimLocalGateFinishInspection(r,x.binding,1000);
 for(const mode of ['transaction','claim','operation','state','consumed','protected','nonce','expiry']){
  const pack=structuredClone(original),db=pack.database as any,c=db.body.checkpoint;
  if(mode==='transaction')c.transactionId='3';if(mode==='claim')c.claimHash='0'.repeat(64);if(mode==='operation')c.operationId='0'.repeat(32);if(mode==='state')c.snapshot.grants[0][3]='0'.repeat(64);if(mode==='consumed')c.consumed=false;if(mode==='protected')c.protected=false;if(mode==='nonce')db.body.nonce='0'.repeat(64);if(mode==='expiry')db.body.expiresAt=1000;
  db.signature=x.material.databaseKey.sign(historyCanonical(db.body));expect(()=>verifyLocalGateFinishProof(x.binding,pack,1000),mode).toThrow();
 }
 }finally{await x.close();}},30000);
it('forged authority signatures, mixed scopes and reordered challenges are refused',async()=>{const x=await gateFinishFixture();try{
 const r=await x.make().inspectOwner(x.binding.owner,signal()),original=claimLocalGateFinishInspection(r,x.binding,1000);
 for(const mode of ['signature','swap','challenge','reader','extra','undefined']){
  const pack:any=structuredClone(original);if(mode==='signature')pack.after.reply.signature='0'.repeat(128);if(mode==='swap')[pack.before,pack.after]=[pack.after,pack.before];if(mode==='challenge')pack.before.request.challenge='0'.repeat(64);if(mode==='reader')pack.before.request.principalDigest='0'.repeat(64);if(mode==='extra')pack.resume=true;if(mode==='undefined')pack.extra=undefined;
  expect(()=>verifyLocalGateFinishProof(x.binding,pack,1000),mode).toThrow();
 }
 }finally{await x.close();}},30000);
it('the actual lock process verifies the signed original packet and exits before acknowledging',async()=>{const x=await gateFinishFixture();const {finishProcess}=await import('./support/cvi-transition-finish-process.ts');let child:any;try{
 child=await finishProcess(x.f.replayRoot,x.binding,x.clock);const binding={...x.binding,marker:child.marker,prepared:child.prepared};
 const before=(await x.f.x.inspect()).requests.length,r=await x.f.inspector(x.clock,binding).inspectOwner(binding.owner,signal()),pack=claimLocalGateFinishInspection(r,binding,1000);
 expect((await x.f.x.inspect()).requests.length-before).toBe(2);const result=await child.finish(pack);expect(result.status).toBe('transition-finished');expect(isLocalCviStartedOwner(result)).toBe(false);
 const {call}=await import('./support/cvi-replay-process.ts');expect((await call(x.f.replayRoot,'inspect',{storeId:x.f.journal.storeId}) as any).records).toHaveLength(0);await expect(child.finish(pack)).rejects.toThrow();
 }finally{await child?.close();await x.close();}},30000);
it('a valid signed packet from another prepared nonce cannot release the real gate',async()=>{const x=await gateFinishFixture();const {finishProcess}=await import('./support/cvi-transition-finish-process.ts');let child:any;try{
 const old=await x.make().inspectOwner(x.binding.owner,signal()),pack=claimLocalGateFinishInspection(old,x.binding,1000);child=await finishProcess(x.f.replayRoot,x.binding,x.clock);await expect(child.finish(pack)).rejects.toThrow();
 const {readFile}=await import('node:fs/promises');expect((await readFile(x.f.replayRoot+'/owner-transition.json','utf8')).length).toBeGreaterThan(0);
 }finally{await child?.close();await x.close();}},30000);
it('lost finish reply holds the caller without retry even when verified marker removal happened',async()=>{const x=await gateFinishFixture();const {finishProcess}=await import('./support/cvi-transition-finish-process.ts');let child:any;try{
 child=await finishProcess(x.f.replayRoot,x.binding,x.clock,{loseReply:true});const binding={...x.binding,marker:child.marker,prepared:child.prepared},r=await x.f.inspector(x.clock,binding).inspectOwner(binding.owner,signal()),pack=claimLocalGateFinishInspection(r,binding,1000);
 await expect(child.finish(pack)).rejects.toThrow();await expect(child.finish(pack)).rejects.toThrow();expect(()=>claimLocalGateFinishInspection(r,binding,1000)).toThrow();
 const {access}=await import('node:fs/promises');await expect(access(x.f.replayRoot+'/owner-transition.json')).rejects.toThrow();
 }finally{await child?.close();await x.close();}},30000);
it('hard supervision terminates a stalled caller and retains the marker',async()=>{const x=await gateFinishFixture();const {finishProcess}=await import('./support/cvi-transition-finish-process.ts');let child:any;try{
 child=await finishProcess(x.f.replayRoot,x.binding,x.clock,{deadlineMs:500});const {vi}=await import('vitest');await vi.waitFor(()=>expect(child.isHeld()).toBe(true),{timeout:2000});await child.close();
 const {readFile}=await import('node:fs/promises');expect((await readFile(x.f.replayRoot+'/owner-transition.json','utf8')).length).toBeGreaterThan(0);
 }finally{await child?.close();await x.close();}},30000);
it('malformed marker, pin, commit and non-JSON configuration refuse before new reads',async()=>{const x=await gateFinishFixture();try{
 const before=(await x.f.x.inspect()).requests.length;
 for(const mode of ['operation','intent','expiry','scope','owner','commit','key','extra','undefined']){
  const b:any=structuredClone(x.binding);if(mode==='operation')b.marker.operationId='0'.repeat(64);if(mode==='intent')b.marker.intentDigest='0'.repeat(64);if(mode==='expiry')b.prepared.expiresAt++;if(mode==='scope')b.prepared.scopeDigest='0'.repeat(64);if(mode==='owner')b.owner.generation++;if(mode==='commit')delete b.commit;if(mode==='key')b.pin.database={...b.pin.authority};if(mode==='extra')b.permission=true;if(mode==='undefined')b.extra=undefined;
  expect(()=>x.f.inspector(x.clock,b),mode).toThrow();
 }
 expect((await x.f.x.inspect()).requests.length).toBe(before);
 }finally{await x.close();}},30000);
it('mutating the original binding after construction cannot redirect or claim its proof',async()=>{const x=await gateFinishFixture();try{
 const a=x.make();(x.binding.prepared as any).challenge='0'.repeat(64);const r=await a.inspectOwner(x.binding.owner,signal());expect(()=>claimLocalGateFinishInspection(r,x.binding,1000)).toThrow();
 }finally{await x.close();}},30000);
it('ordinary checkpoint summaries are not original prepared finish proofs',async()=>{const x=await gateFinishFixture();try{
 const r=await x.f.inspector().inspectOwner(x.binding.owner,signal());expect(()=>claimLocalGateFinishInspection(r,x.binding,1000)).toThrow();
 }finally{await x.close();}},30000);
it('a later same-owner native change cannot finish an earlier transition',async()=>{const x=await gateFinishFixture();const {finishProcess}=await import('./support/cvi-transition-finish-process.ts');let child:any;try{
 child=await finishProcess(x.f.replayRoot,x.binding,x.clock);const binding={...x.binding,marker:child.marker,prepared:child.prepared};await x.f.write();await expect(x.f.inspector(x.clock,binding).inspectOwner(binding.owner,signal())).rejects.toThrow();
 }finally{await child?.close();await x.close();}},30000);
