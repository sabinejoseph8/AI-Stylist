import {mandatoryCall} from './support/cvi-mandatory-fixture.ts';
import {fullStateProjection} from '../src/server/local-cvi-full-state-reconciliation.ts';
import {it,expect,vi} from 'vitest';
import {access,readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {deferredGateFixture} from './support/cvi-deferred-gate-fixture.ts';
import {createLocalGatedSqliteExecution,claimLocalGatedExecution,localGatedExecutionBinding,inspectLocalGatedExecution,finishLocalGatedExecution,closeLocalGatedExecution} from '../src/server/local-cvi-gated-execution.ts';
const signal=()=>new AbortController().signal;
it.each(['activate','renew'] as const)('retains the original %s execution through actual commit, reconciliation and signed finish',async mode=>{
 const f=await deferredGateFixture(mode),producer=f.producer();try{
  const result=await producer.execute(f.plan,signal()),context=claimLocalGatedExecution(result,f.plan,f.clock()),binding=localGatedExecutionBinding(context);
  expect(Object.isFrozen(result)).toBe(true);expect(binding.commit.transactionId).toBe((await f.observe()).transactionId);
  expect((await f.x.inspect()).pending).toBeNull();expect((await f.x.inspect()).revision).toBe(mode==='renew'?4:2);
  const value:any=await inspectLocalGatedExecution(context,{storeId:f.setup.scope.storeId,bindingDigest:f.setup.scope.bindingDigest,challenge:randomBytes(32).toString('hex'),now:f.clock()},signal());expect(value.snapshot.status).toBe('replay-idle');
  const before=(await f.x.inspect()).requests.length,inspection=await f.inspectorForBinding(binding).inspectOwner(f.owner,signal());
  await finishLocalGatedExecution(context,inspection,signal());expect((await f.x.inspect()).requests.length-before).toBe(2);
  await expect(access(f.root+'/owner-transition.json')).rejects.toThrow();expect(()=>localGatedExecutionBinding(context)).toThrow();
  await expect(producer.execute(f.plan,signal())).rejects.toThrow();
 }finally{await producer.close();await f.close();}
},30000);
it('copied leases and contexts cannot reconstruct or consume the original execution',async()=>{
 const f=await deferredGateFixture(),producer=f.producer();try{
  const result=await producer.execute(f.plan,signal());expect(()=>claimLocalGatedExecution(structuredClone(result),f.plan,f.clock())).toThrow();
  const c=claimLocalGatedExecution(result,f.plan,f.clock());expect(()=>claimLocalGatedExecution(result,f.plan,f.clock())).toThrow();expect(()=>localGatedExecutionBinding({...c})).toThrow();
  await expect(closeLocalGatedExecution({...c})).rejects.toThrow();expect(localGatedExecutionBinding(c).plan.id).toBe(f.plan.id);
 }finally{await producer.close();await f.close();}
},30000);
it('a substituted plan refuses before gate entry or authority advancement',async()=>{
 const f=await deferredGateFixture(),producer=f.producer();try{
  await expect(producer.execute({...f.plan,id:'0'.repeat(64)},signal())).rejects.toThrow();expect((await f.x.inspect()).revision).toBe(0);await expect(access(f.root+'/owner-transition.json')).rejects.toThrow();
 }finally{await producer.close();await f.close();}
},30000);
it('an identity failure prevents commit and preserves the pending operation and gate marker',async()=>{
 const f=await deferredGateFixture(),producer=f.producer({identity:async()=>{throw Error('Unavailable identity');}});try{
  await expect(producer.execute(f.plan,signal())).rejects.toThrow();expect(producer.isHeld()).toBe(true);expect((await f.x.inspect()).pending).toBe(f.plan.id);await expect(f.observe()).rejects.toThrow();
  expect((await readFile(f.root+'/owner-transition.json','utf8')).length).toBeGreaterThan(0);
 }finally{await producer.close();await f.close();}
},30000);
it('a lost post-commit observation holds without reconciliation or automatic reapplication',async()=>{
 const f=await deferredGateFixture(),producer=f.producer({observe:async()=>{throw Error('Lost observation');}});try{
  await expect(producer.execute(f.plan,signal())).rejects.toThrow();expect((await f.observe()).consumed).toBe(true);expect((await f.x.inspect()).pending).toBe(f.plan.id);
  await expect(producer.execute(f.plan,signal())).rejects.toThrow();expect((await readFile(f.root+'/owner-transition.json','utf8')).length).toBeGreaterThan(0);
 }finally{await producer.close();await f.close();}
},30000);
it('cancellation after commit preserves durable evidence and releases no execution handoff',async()=>{
 const f=await deferredGateFixture(),c=new AbortController(),producer=f.producer({observe:async()=>{const seen=await f.observe();c.abort();return seen;}});try{
  await expect(producer.execute(f.plan,c.signal)).rejects.toThrow();expect((await f.observe()).consumed).toBe(true);expect((await f.x.inspect()).pending).toBe(f.plan.id);expect(producer.isHeld()).toBe(true);
 }finally{await producer.close();await f.close();}
},30000);
it('an already-canceled request performs no gate or database work',async()=>{
 const f=await deferredGateFixture(),producer=f.producer(),c=new AbortController();c.abort();try{
  await expect(producer.execute(f.plan,c.signal)).rejects.toThrow();expect((await f.x.inspect()).revision).toBe(0);await expect(access(f.root+'/owner-transition.json')).rejects.toThrow();
 }finally{await producer.close();await f.close();}
},30000);
it('expired original results cannot become handoffs even though reconciliation completed',async()=>{
 const f=await deferredGateFixture(),producer=f.producer();try{
  const result=await producer.execute(f.plan,signal());f.at(8000);expect(()=>claimLocalGatedExecution(result,f.plan,8000)).toThrow();expect((await f.x.inspect()).pending).toBeNull();
 }finally{await producer.close();await f.close();}
},30000);
it('only the original prepared signed inspection can finish the retained context',async()=>{
 const f=await deferredGateFixture(),producer=f.producer();try{
  const result=await producer.execute(f.plan,signal()),c=claimLocalGatedExecution(result,f.plan,f.clock()),inspection=await f.inspectorForBinding(localGatedExecutionBinding(c)).inspectOwner(f.owner,signal());
  await expect(finishLocalGatedExecution(c,structuredClone(inspection),signal())).rejects.toThrow();expect(()=>localGatedExecutionBinding(c)).toThrow();expect((await readFile(f.root+'/owner-transition.json','utf8')).length).toBeGreaterThan(0);
 }finally{await producer.close();await f.close();}
},30000);
it('captured setup cannot be redirected after the producer is configured',async()=>{
 const f=await deferredGateFixture(),producer=f.producer(),expected=f.setup.root;try{
  (f.setup as any).root='/private/tmp/not-the-original-replay';(f.setup as any).databasePrincipal='invalid principal';
  const result=await producer.execute(f.plan,signal()),c=claimLocalGatedExecution(result,f.plan,f.clock());
  expect(localGatedExecutionBinding(c).plan.id).toBe(f.plan.id);expect((await readFile(expected+'/owner-transition.json','utf8')).length).toBeGreaterThan(0);
 }finally{await producer.close();await f.close();}
},30000);
it('reentrant claiming cannot consume a second copy of the original execution',async()=>{
 const f=await deferredGateFixture(),producer=f.producer();try{
  const result=await producer.execute(f.plan,signal()),input={...f.plan};let nested=false;
  Object.defineProperty(input,'id',{enumerable:true,get(){expect(()=>claimLocalGatedExecution(result,f.plan,f.clock())).toThrow();nested=true;return f.plan.id;}});
  const c=claimLocalGatedExecution(result,input,f.clock());expect(nested).toBe(true);expect(localGatedExecutionBinding(c).plan.id).toBe(f.plan.id);
 }finally{await producer.close();await f.close();}
},30000);
it('aborting a stalled post-commit callback terminates the producer instead of hanging',async()=>{
 const f=await deferredGateFixture(),c=new AbortController(),producer=f.producer({observe:async()=>{setTimeout(()=>c.abort(),20);return new Promise(()=>{});}});try{
  await expect(producer.execute(f.plan,c.signal)).rejects.toThrow();expect(producer.isHeld()).toBe(true);expect((await f.observe()).consumed).toBe(true);expect((await f.x.inspect()).pending).toBe(f.plan.id);
 }finally{await producer.close();await f.close();}
},30000);
it('closing during observation aborts pending work without reconciling afterward',async()=>{
 const f=await deferredGateFixture();let observed!:()=>void;const observing=new Promise<void>(r=>observed=r);
 let release!:(v:unknown)=>void;const stalled=new Promise(r=>release=r),producer=f.producer({observe:async()=>{observed();return stalled;}});try{
  const work=producer.execute(f.plan,signal());void work.catch(()=>{});await observing;await producer.close();await expect(work).rejects.toThrow();
  release(await f.observe());await new Promise(r=>setTimeout(r,10));expect((await f.x.inspect()).pending).toBe(f.plan.id);
 }finally{await producer.close();await f.close();}
},30000);

it.each(['shape','previous-projection','previous-state','expired','late'])('invalid %s configuration refuses before gate entry or authority work',async mode=>{
 const f=await deferredGateFixture();try{
  const states=await mandatoryCall({root:f.x.root,config:f.x.config,mode:'plan-full',actor:f.plan.actor,kind:f.plan.kind,args:f.plan.args});
  const command:any={operationId:f.plan.id.slice(0,32),kind:f.plan.kind,previous:fullStateProjection(states.previous),target:fullStateProjection(states.target),recordHash:null,expiresAt:f.setup.scope.expiresAt};
  let previous=states.previous;if(mode==='shape')command.extra=true;if(mode==='previous-projection')command.previous.head='0'.repeat(64);if(mode==='previous-state')previous=states.target;if(mode==='expired')command.expiresAt=f.plan.now;if(mode==='late')command.expiresAt=f.setup.scope.expiresAt+1;
  const work=vi.fn(async()=>{throw Error('Must not run');});
  expect(()=>createLocalGatedSqliteExecution({gate:f.setup,nativeRoot:f.x.root,previous,target:states.target,command},{authority:{advance:work,claim:work,read:work,reconcile:work},identity:work,observe:work},f.clock)).toThrow();
  expect(work).not.toHaveBeenCalled();expect((await f.x.inspect()).revision).toBe(0);await expect(access(f.root+'/owner-transition.json')).rejects.toThrow();
 }finally{await f.close();}
},30000);
