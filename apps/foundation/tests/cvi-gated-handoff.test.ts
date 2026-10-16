import {it,expect} from 'vitest';
import {readFile} from 'node:fs/promises';
import {startupAdmissionFixture} from './support/cvi-startup-admission-fixture.ts';
import {deferredGateFixture,transactionCall} from './support/cvi-deferred-gate-fixture.ts';
import {mandatoryCall} from './support/cvi-mandatory-fixture.ts';
import {fixtureKey} from './support/cvi-witness-service-fixture.ts';
import {bindLocalOwnedReplay,localOwnedReplayExecutionContext,localOwnedReplayState} from '../src/server/local-cvi-owned-replay.ts';
import {createLocalGatedSqliteExecution,localGatedExecutionBinding,localGatedExecutionFinished,finishLocalGatedExecution} from '../src/server/local-cvi-gated-execution.ts';
import {createLocalDurableOwnerContinuation,consumeOwnerContinuation,claimLocalContinuationReplayLease,inspectOwnerContinuation} from '../src/server/local-cvi-owner-continuation.ts';
import {createLocalStartupCheckpointInspector} from '../src/server/local-cvi-startup-checkpoint.ts';
import {fullStateProjection} from '../src/server/local-cvi-full-state-reconciliation.ts';
import {historyCanonical} from '../src/server/local-cvi-history-authority.ts';
import {witnessServiceDigest} from '../src/server/local-cvi-witness-service.ts';
const signal=()=>new AbortController().signal;
it('startup carries the original committed context through the private permit and replay binding',async()=>{
 const f=await startupAdmissionFixture(()=>1000,10000,true,true);try{
  const input=f.input(),permit:any=await f.admission().admit(input,signal());bindLocalOwnedReplay(f.resources.replay,permit,input);
  const c=localOwnedReplayExecutionContext(f.resources.replay)!;expect(c).toBeDefined();const b=localGatedExecutionBinding(c);expect(b.plan.id).toBe(permit.after.operationId);
  const r:any=await f.resources.replay.inspect!({storeId:f.resources.replay.storeId,bindingDigest:f.scope.bindingDigest,challenge:'e'.repeat(64),now:1000},signal());expect(r.status).toBe('replay-idle');expect(r.bindingDigest).toBe(f.scope.bindingDigest);expect(f.replayHooks.inspect).not.toHaveBeenCalled();
  expect(await f.resources.replay.reserve({storeId:f.resources.replay.storeId,bindingDigest:f.scope.bindingDigest,requestDigest:'f'.repeat(64),now:1000},signal())).toBeNull();expect(f.replayHooks.reserve).not.toHaveBeenCalled();
  const inspection=await f.inspector(()=>1000,b).inspectOwner(permit.owner,signal());await finishLocalGatedExecution(c,inspection,signal());expect(localGatedExecutionFinished(c)).toBe(true);
 }finally{await f.close();}
},30000);
it('copied startup permits cannot transfer the context and the original remains one-use',async()=>{
 const f=await startupAdmissionFixture(()=>1000,10000,true,true);try{
  const input=f.input(),permit=await f.admission().admit(input,signal()),copyPort=f.newReplay();
  expect(()=>bindLocalOwnedReplay(copyPort,structuredClone(permit),input)).toThrow();expect(localOwnedReplayExecutionContext(copyPort)).toBeUndefined();
  bindLocalOwnedReplay(f.resources.replay,permit,input);const c=localOwnedReplayExecutionContext(f.resources.replay)!;expect(()=>localGatedExecutionBinding({...c})).toThrow();
  expect(()=>bindLocalOwnedReplay(f.resources.replay,permit,input)).toThrow();expect(localOwnedReplayState(f.resources.replay).held).toBe(true);expect(()=>localGatedExecutionBinding(c)).toThrow();
 }finally{await f.close();}
},30000);
it('retiring bound replay closes the original gate without removing uncertain evidence',async()=>{
 const f=await startupAdmissionFixture(()=>1000,10000,true,true);try{
  const input=f.input(),permit=await f.admission().admit(input,signal());bindLocalOwnedReplay(f.resources.replay,permit,input);const c=localOwnedReplayExecutionContext(f.resources.replay)!;
  f.resources.replay.close?.();expect(localOwnedReplayExecutionContext(f.resources.replay)).toBeUndefined();expect(()=>localGatedExecutionBinding(c)).toThrow();expect((await readFile(f.replayRoot+'/owner-transition.json','utf8')).length).toBeGreaterThan(0);
 }finally{await f.close();}
},30000);
it('cancellation after startup execution prevents a late permit binding',async()=>{
 const f=await startupAdmissionFixture(()=>1000,10000,true,true),controller=new AbortController();try{
  const input=f.input(),permit=await f.admission().admit(input,controller.signal);controller.abort();expect(()=>bindLocalOwnedReplay(f.resources.replay,permit,input)).toThrow();expect(localOwnedReplayExecutionContext(f.resources.replay)).toBeUndefined();expect((await f.x.inspect()).pending).toBeNull();
 }finally{await f.close();}
},30000);

async function renewedHandoff(){
 const f=await deferredGateFixture('renew'),authority=f.x.authorityPort('rotator'),key=fixtureKey(),database={keyId:'fixture-key-gated-handoff',publicKeyPem:key.pem};
 let p:any,states:any,command:any,producer:ReturnType<typeof createLocalGatedSqliteExecution>|undefined;
 const observe=()=>transactionCall({root:f.x.root,plan:p,command,config:f.x.config,principal:f.setup.databasePrincipal,mode:'observe'});
 const ports={plan:async(args:any)=>{p=await f.x.plan('renew',{lease:args.lease,ttl:args.ttl,token:args.token});states=await mandatoryCall({root:f.x.root,config:f.x.config,mode:'plan-full',actor:p.actor,kind:p.kind,args:p.args});return p;},execute:async(plan:any,s:AbortSignal)=>{
  command={operationId:plan.id.slice(0,32),kind:'renew',previous:fullStateProjection(states.previous),target:fullStateProjection(states.target),recordHash:null,expiresAt:f.previousLease.expiresAt};
  producer=createLocalGatedSqliteExecution({gate:{...f.setup,plan,pin:{...f.setup.pin,database}},nativeRoot:f.x.root,previous:states.previous,target:states.target,command},{authority,observe,identity:async(request,b)=>{const body={version:1,keyId:database.keyId,...request,bindingDigest:witnessServiceDigest(b),issuedAt:f.clock(),expiresAt:f.clock()+3000};return {body,signature:key.sign(historyCanonical(body))};}},f.clock);return producer.execute(plan,s);
 },read:(n:string)=>authority.read(n)};
 const port=createLocalDurableOwnerContinuation(f.x.pin,f.previousLease,f.setup.scope.bindingDigest,10000,{principalDigest:f.plan.actor.principalDigest,readerPrincipal:f.setup.pin.readerPrincipal},ports,f.clock);
 const before={owner:{...f.setup.owner,expiresAt:f.previousLease.expiresAt,minimumRevision:2},operationId:f.previousOperationId!,revision:2,bindingDigest:f.setup.scope.bindingDigest,applicationExpiresAt:10000};
 const inspection=(c:any,owner:any)=>{const registry={version:1 as const,entries:[{operationId:p.id,target:p.to,projection:command.target}]};return createLocalStartupCheckpointInspector({authority:f.x.pin,database,readerPrincipal:f.setup.pin.readerPrincipal,registryDigest:witnessServiceDigest(registry),minimumRevision:4},registry,{authority:n=>authority.read(n),database:async nonce=>{const body={version:1,keyId:database.keyId,storeId:f.x.pin.storeId,policyDigest:f.x.pin.policyDigest,nonce,issuedAt:f.clock(),expiresAt:f.clock()+3000,checkpoint:await observe()};return {body,signature:key.sign(historyCanonical(body))};}},f.clock,5000,localGatedExecutionBinding(c)).inspectOwner(owner,signal());};
 return {f,port,before,inspection,close:async()=>{await producer?.close();await f.close();}};
}
it('renewal retains the original execution until the original handoff is consumed and claimed',async()=>{
 const x=await renewedHandoff();try{
  const raw=await x.port.renew(x.before,signal()),next=inspectOwnerContinuation(raw,x.before,x.f.clock());expect(()=>claimLocalContinuationReplayLease(raw,x.before,x.f.clock())).toThrow();
  consumeOwnerContinuation(raw,x.before,x.f.clock());const claimed=claimLocalContinuationReplayLease(raw,x.before,x.f.clock()),c=claimed.execution!;expect(c).toBeDefined();expect(claimed.lease.expiresAt).toBe(next.owner.expiresAt);
  expect(()=>claimLocalContinuationReplayLease(raw,x.before,x.f.clock())).toThrow();const r=await x.inspection(c,next.owner);await finishLocalGatedExecution(c,r,signal());expect(localGatedExecutionFinished(c)).toBe(true);
 }finally{await x.close();}
},30000);
it('a copied renewal handoff cannot expose the original context before or after consumption',async()=>{
 const x=await renewedHandoff();try{
  const raw=await x.port.renew(x.before,signal());expect(()=>consumeOwnerContinuation(structuredClone(raw),x.before,x.f.clock())).toThrow();consumeOwnerContinuation(raw,x.before,x.f.clock());expect(()=>claimLocalContinuationReplayLease(structuredClone(raw),x.before,x.f.clock())).toThrow();expect(claimLocalContinuationReplayLease(raw,x.before,x.f.clock()).execution).toBeDefined();
 }finally{await x.close();}
},30000);
it('canceled renewal results cannot be consumed to recreate an execution context',async()=>{
 const x=await renewedHandoff(),controller=new AbortController();try{
  const raw=await x.port.renew(x.before,controller.signal);controller.abort();expect(()=>consumeOwnerContinuation(raw,x.before,x.f.clock())).toThrow();expect(()=>claimLocalContinuationReplayLease(raw,x.before,x.f.clock())).toThrow();expect((await x.f.x.inspect()).pending).toBeNull();
 }finally{await x.close();}
},30000);

it('a genuine gated startup cannot register an owner before its gate has finished',async()=>{
 const f=await startupAdmissionFixture(()=>1000,10000,true,true);try{
  const owner=await f.make().start(signal());expect(owner).toBeNull();expect(f.drafts()).toBe(0);expect(localOwnedReplayState(f.resources.replay).held).toBe(true);expect((await readFile(f.replayRoot+'/owner-transition.json','utf8')).length).toBeGreaterThan(0);
 }finally{await f.close();}
},30000);
