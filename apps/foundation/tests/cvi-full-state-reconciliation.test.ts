import {witnessServiceDigest} from '../src/server/local-cvi-witness-service.ts';
import {it,expect} from 'vitest';
import {fullStateFixture} from './support/cvi-full-state-fixture.ts';
import {fullStateMetadata,assertCommittedFullState,createLocalFullStateReconciler} from '../src/server/local-cvi-full-state-reconciliation.ts';
const signal=()=>new AbortController().signal;
const observed=(f:any)=>({snapshot:structuredClone(f.states.target),projection:f.command.target,operationId:f.command.operationId,transactionId:'40',claimHash:'c'.repeat(64),consumed:true,protected:true});
it('complete exported state computes the original signed aggregate, including grant history',async()=>{const f=await fullStateFixture();try{expect(fullStateMetadata(f.states.previous)).toEqual(f.plan.from);expect(f.metadata).toEqual(f.plan.to);}finally{await f.close();}},30000);
it('reconciles only exact committed full state and verifies a fresh completed authority read',async()=>{const f=await fullStateFixture();try{const e=await f.port.claim(f.plan,'a'.repeat(64)),hash=witnessServiceDigest(e.request),o=observed(f);o.claimHash=hash;const r=f.finalizer(hash,'40',async()=>o);expect((await r.finalize(signal())).status).toBe('reconciled');expect((await f.x.inspect()).pending).toBeNull();await expect(r.finalize(signal())).rejects.toThrow();}finally{await f.close();}},30000);
it.each(['snapshot','grant','projection','operation','transaction','claim','consumed','protected'])('refuses %s substitution and preserves pending authority',async mode=>{const f=await fullStateFixture();try{const o:any=observed(f);if(mode==='snapshot')o.snapshot=f.states.previous;if(mode==='grant')o.snapshot.grants[0][3]='0'.repeat(64);if(mode==='projection')o.projection={};if(mode==='operation')o.operationId='0'.repeat(32);if(mode==='transaction')o.transactionId='41';if(mode==='claim')o.claimHash='d'.repeat(64);if(mode==='consumed')o.consumed=false;if(mode==='protected')o.protected=false;await expect(f.finalizer('c'.repeat(64),'40',async()=>o).finalize(signal())).rejects.toThrow();expect((await f.x.inspect()).pending).toBe(f.plan.id);}finally{await f.close();}},30000);
it('reduced five-field projection cannot stand in for full state',async()=>{const f=await fullStateFixture();try{expect(()=>fullStateMetadata(f.command.target)).toThrow();}finally{await f.close();}},30000);
it('uncommitted or absent observation never reconciles',async()=>{const f=await fullStateFixture();try{await expect(f.finalizer('c'.repeat(64),'40',async()=>null).finalize(signal())).rejects.toThrow();expect((await f.x.inspect()).pending).toBe(f.plan.id);}finally{await f.close();}},30000);
it('receipt changes are detected even when domain head and generation match',async()=>{const f=await fullStateFixture();try{const o:any=observed(f);o.snapshot.receipts.push(['a'.repeat(64),'b'.repeat(64),'c'.repeat(64),'{}','claimed',1000]);expect(()=>assertCommittedFullState(o,f.plan,f.states.target,f.command,'c'.repeat(64),'40')).toThrow();}finally{await f.close();}},30000);

it.each(['reconcile','read','expired'])('a %s failure after durable reconciliation cannot release success or retry',async mode=>{const f=await fullStateFixture();try{
 const e=await f.port.claim(f.plan,'a'.repeat(64)),hash=witnessServiceDigest(e.request),o=observed(f);o.claimHash=hash;
 f.finalizer(hash,'40',async()=>o);const port=f.x.authorityPort('rotator');let time=1000;
 const corrupt=(e:any)=>({...e,reply:{...e.reply,signature:'0'.repeat(128)}});
 const r=createLocalFullStateReconciler(f.x.pin,f.plan,f.states.target,f.command,hash,'40',async()=>{const e=await port.reconcile(f.plan);if(mode==='expired')time=3000;return mode==='reconcile'?corrupt(e):e;},async n=>{const e=await port.read(n);return mode==='read'?corrupt(e):e;},()=>time);
 await expect(r.finalize(signal())).rejects.toThrow();expect((await f.x.inspect()).pending).toBeNull();await expect(r.finalize(signal())).rejects.toThrow();
 }finally{await f.close();}},30000);
it.each(['commit','claim','fence','release'])('captures and reconciles the complete %s transition without reducing history',async stage=>{const f=await fullStateFixture(stage);try{
 expect(fullStateMetadata(f.states.previous)).toEqual(f.plan.from);expect(fullStateMetadata(f.states.target)).toEqual(f.plan.to);
 expect(f.states.target).not.toEqual(f.states.previous);
 if(stage==='claim'){expect(f.command.target).toEqual(f.command.previous);expect(f.states.previous.receipts[0][4]).toBe('pending');expect(f.states.target.receipts[0][4]).toBe('claimed');}
 if(stage==='fence')expect(f.states.target.grants[0][6]).toBe('retired');
 if(stage==='release'){expect(f.states.target.releases).toHaveLength(1);expect(f.command.recordHash).toMatch(/^[a-f0-9]{64}$/);}
 const e=await f.port.claim(f.plan,'a'.repeat(64)),hash=witnessServiceDigest(e.request),o={snapshot:f.states.target,projection:f.command.target,operationId:f.command.operationId,transactionId:'40',claimHash:hash,consumed:true,protected:true};
 expect((await f.finalizer(hash,'40',async()=>o).finalize(signal())).status).toBe('reconciled');expect((await f.x.inspect()).pending).toBeNull();
 }finally{await f.close();}},60000);

it('checks every full-state section even when the supplied reduced projection is unchanged',async()=>{
 const f=await fullStateFixture();try{
  const widths={history:4,projections:7,receipts:6,gate:5,grants:7,releases:5};
  for(const [section,width] of Object.entries(widths)){
   const o:any=observed(f);
   // Preserve the reduced projection and execution markers while altering a
   // logical section. No section may bypass exact committed-target comparison.
   if(o.snapshot[section].length)o.snapshot[section][0][width-1]='altered';
   else o.snapshot[section].push(Array(width).fill('altered'));
   expect(o.projection).toEqual(f.command.target);
   expect(()=>assertCommittedFullState(o,f.plan,f.states.target,f.command,'c'.repeat(64),'40'),section).toThrow();
  }
  expect((await f.x.inspect()).pending).toBe(f.plan.id);
 }finally{await f.close();}
},30000);
