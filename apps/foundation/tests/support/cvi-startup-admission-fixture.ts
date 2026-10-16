import {createLocalDurableOwnerContinuation} from '../../src/server/local-cvi-owner-continuation.ts';
import {createLocalGatedSqliteExecution} from '../../src/server/local-cvi-gated-execution.ts';
import {transactionCall} from './cvi-deferred-gate-fixture.ts';
import {residentWitnessTransport} from './cvi-resident-witness.ts';
import {vi} from 'vitest';
import {createLocalOwnedReplayPort,localOwnedReplayState} from '../../src/server/local-cvi-owned-replay.ts';
import {ownerReplayCall} from './cvi-owner-replay-process.ts';
/** Disposable composition. SQLite authority/lease transitions are actual.
 * Observer transaction labels are fixture markers, not native SQL commit IDs. */
import {randomBytes} from 'node:crypto';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {mandatoryFixture,mandatoryCall} from './cvi-mandatory-fixture.ts';
import {fixtureKey} from './cvi-witness-service-fixture.ts';
import {credentialBinding,credentialCall,scopeReplay} from './cvi-credential-process.ts';
import {call} from './cvi-replay-process.ts';
import {createLocalMandatoryLeaseAdapter} from '../../src/server/local-cvi-mandatory-persistence.ts';
import {createLocalDurableStartupAdmission,localStartupOwnerBoot} from '../../src/server/local-cvi-startup-admission.ts';
import {createLocalCviStartupOwner} from '../../src/server/local-cvi-startup-owner.ts';
import {createLocalStartupCheckpointInspector} from '../../src/server/local-cvi-startup-checkpoint.ts';
import {fullStateProjection} from '../../src/server/local-cvi-full-state-reconciliation.ts';
import {createLocalCviStyling} from '../../src/server/local-cvi-styling.ts';
import {cviCredentialDigests} from '../../src/server/local-cvi-credentials.ts';
import {historyCanonical} from '../../src/server/local-cvi-history-authority.ts';
import {witnessServiceDigest} from '../../src/server/local-cvi-witness-service.ts';
import type {DurableStartupPorts} from '../../src/server/local-cvi-startup-admission.ts';
import type {FreshOwnerAdmissionInput} from '../../src/server/local-cvi-startup-owner.ts';
import type {GateFinishBinding} from '../../src/server/local-cvi-gate-finish-proof.ts';
export async function startupAdmissionFixture(testClock:()=>number=()=>1000,bindingExpiresAt=10000,useResidentAuthority=false,useGatedExecution=false){
 const resident=useResidentAuthority?residentWitnessTransport():undefined;
 const x=await mandatoryFixture(undefined,testClock,resident?.call),signal=()=>new AbortController().signal,first=await x.activation();
 const firstLease:any=await x.adapter('rotator').execute(first,signal());
 const baseline=await x.observe(),snapshot=()=>mandatoryCall({root:x.root,config:x.config,mode:'full-observe'}),initialSnapshot=await snapshot();
 const root=await mkdtemp(join(tmpdir(),'stylist-startup-admission-')),credential=join(root,'credentials'),replayRoot=join(root,'replay');await mkdir(credential,{mode:0o700});await mkdir(replayRoot,{mode:0o700});
 const binding={...credentialBinding(2),expiresAt:bindingExpiresAt},oldBinding={...credentialBinding(),expiresAt:bindingExpiresAt},oldDigests=cviCredentialDigests(oldBinding),prepared:any=await credentialCall(credential,'prepare',oldDigests),oldLease:any=await credentialCall(credential,'activate',{storeId:prepared.storeId,...oldDigests,bootDigest:'1'.repeat(64),previous:0,now:1000}),journal:any=await call(replayRoot,'prepare',{bindingDigest:oldDigests.scopeDigest});
 const expected={storeId:x.pin.storeId,operationId:first.id,revision:2},boot={storeId:prepared.storeId,previous:1,bootDigest:'2'.repeat(64)},scope={checkpoint:expected,credentialStoreId:prepared.storeId,replayStoreId:journal.storeId,previous:1,bootDigest:boot.bootDigest,...cviCredentialDigests(binding)};
 const rotator=x.actors.find(a=>a.role==='rotator')!,reader=x.actors.find(a=>a.role==='observer')!,authority=x.authorityPort('rotator'),key=fixtureKey();
 const registry={version:1 as const,entries:[{operationId:first.id,target:first.to,projection:fullStateProjection(initialSnapshot)}]};
 const ownerDigest=witnessServiceDigest(x.config.actor);
 let nativeLease:any;const gatedProducers=new Set<ReturnType<typeof createLocalGatedSqliteExecution>>();
 let marker={operationId:first.id.slice(0,32),transactionId:'1',claimHash:'c'.repeat(64),consumed:true,protected:true},claimHash='',lastPlan:any,drafts=0;
 const claim=authority.claim;authority.claim=async(p,n)=>{const e=await claim(p,n);claimHash=witnessServiceDigest(e.request);return e;};
 const adapter=()=>createLocalMandatoryLeaseAdapter(x.pin,{role:'rotator',principalDigest:rotator.principalDigest},authority,x.persistence,testClock,8000);
 const executeGated=async(p:any,s:AbortSignal)=>{
    const states=await mandatoryCall({root:x.root,config:{...x.config,now:testClock()},mode:'plan-full',actor:p.actor,kind:p.kind,args:p.args});
    const command={operationId:p.id.slice(0,32),kind:p.kind,previous:fullStateProjection(states.previous),target:fullStateProjection(states.target),recordHash:null,expiresAt:p.kind==='renew'?Number((p.args.lease as any).expiresAt):p.now+Number(p.args.ttl)};
    const observe=async()=>{const seen=await transactionCall({root:x.root,plan:p,command,config:x.config,principal:'fixture_rotator',mode:'observe'});marker={operationId:seen.operationId,transactionId:seen.transactionId,claimHash:seen.claimHash,consumed:true,protected:true};return seen;};
    const active=states.target.grants.find((g:any)=>g[6]==='active'),owner={storeId:x.pin.storeId,generation:active[0],ownerDigest:active[1],bootDigest:active[2],expiresAt:active[5],minimumRevision:(await x.inspect()).revision+2};
    const producer=createLocalGatedSqliteExecution({gate:{root:replayRoot,scope:{storeId:journal.storeId,bindingDigest:oldDigests.scopeDigest,nativeStoreId:x.pin.storeId,applicationExpiresAt:binding.expiresAt,expiresAt:Number(command.expiresAt)},plan:p,pin:{authority:x.pin,database:{keyId:'fixture-key-startup-observer',publicKeyPem:key.pem},readerPrincipal:reader.principalDigest},writerPrincipal:rotator.principalDigest,owner,databasePrincipal:'fixture_rotator'},nativeRoot:x.root,previous:states.previous,target:states.target,command},{authority,observe,identity:async(request,b)=>{const body={version:1,keyId:'fixture-key-startup-observer',...request,bindingDigest:witnessServiceDigest(b),issuedAt:testClock(),expiresAt:testClock()+3000};return {body,signature:key.sign(historyCanonical(body))};}},testClock);
    gatedProducers.add(producer);nativeLease=await producer.execute(p,s);return nativeLease;
 };
 const ports:DurableStartupPorts={
  plan:async(input)=>{const p=await x.plan('activate',{previous:input.previous,owner:ownerDigest,boot:localStartupOwnerBoot(input),ttl:input.expiresAt-input.issuedAt,token:randomBytes(32).toString('hex')});lastPlan=p;registry.entries.push({operationId:p.id,target:p.to,projection:{...fullStateProjection(initialSnapshot),generation:2,owner:p.args.owner as string,boot:p.args.boot as string}});return p;},
  execute:async(p,s)=>{
   if(useGatedExecution){
    return executeGated(p,s);
   }
   const lease=await adapter().execute(p,s);nativeLease=lease;marker={operationId:p.id.slice(0,32),transactionId:'2',claimHash,consumed:true,protected:true};return lease;
  },
  read:(n,s)=>authority.read(n),
 };
 const readPorts={authority:(n:string)=>authority.read(n),database:async(nonce:string)=>{const snapshotValue=await snapshot(),issuedAt=testClock(),body={version:1,keyId:'fixture-key-startup-observer',storeId:x.pin.storeId,policyDigest:x.pin.policyDigest,nonce,issuedAt,expiresAt:issuedAt+7000,checkpoint:{snapshot:snapshotValue,projection:fullStateProjection(snapshotValue),...marker}};return {body,signature:key.sign(historyCanonical(body))};}};
 const startupPin=()=>({authority:x.pin,database:{keyId:'fixture-key-startup-observer',publicKeyPem:key.pem},readerPrincipal:reader.principalDigest,registryDigest:witnessServiceDigest(registry),minimumRevision:2});
 const inspector=(clock=testClock,finish?:GateFinishBinding)=>createLocalStartupCheckpointInspector(startupPin(),registry,readPorts,clock,5000,finish);
 const checkpoint={inspectFresh:(s:AbortSignal)=>inspector().inspect(s),inspectOwnerFresh:(owner:any,s:AbortSignal)=>inspector().inspectOwner(owner,s),...(useGatedExecution?{inspectOwnerGatedFresh:(owner:any,finish:GateFinishBinding,s:AbortSignal)=>inspector(testClock,finish).inspectOwner(owner,s)}:{})};
 const admission=(clock=testClock)=>createLocalDurableStartupAdmission(x.pin,scope,baseline,{principalDigest:rotator.principalDigest,readerPrincipal:reader.principalDigest,ownerDigest},ports,clock);
 const rawReplay=scopeReplay(replayRoot,journal.storeId,oldDigests.scopeDigest),digests=cviCredentialDigests(binding);
 const replayContext={x,ownerDigest,journal,replayRoot,resources:{binding:Object.freeze({...binding})}};
 const backendWork=new Set<Promise<unknown>>(),privatePorts=new Set<ReturnType<typeof createLocalOwnedReplayPort>>();
 const mutation=async(mode:'reserve'|'consume',lease:any,floor:number,r:any,signal:AbortSignal)=>{const task=ownerReplayCall(replayContext,lease,mode,{...r,bindingDigest:oldDigests.scopeDigest},{signal,config:{minimumRevision:floor}});backendWork.add(task);try{const value=await task;return {...value,bindingDigest:r.bindingDigest};}finally{backendWork.delete(task);}};
 const replayHooks={inspect:vi.fn(rawReplay.inspect),reserve:vi.fn((lease:any,floor:number,r:any,s:AbortSignal)=>mutation('reserve',lease,floor,r,s)),consume:vi.fn((lease:any,floor:number,r:any,s:AbortSignal)=>mutation('consume',lease,floor,r,s))};
 const newReplay=()=>{const port=createLocalOwnedReplayPort({storeId:journal.storeId,nativeStoreId:x.pin.storeId,binding},{inspect:(r,s)=>replayHooks.inspect(r,s),mutate:(mode,lease,floor,r,s)=>replayHooks[mode](lease,floor,r,s)},testClock);privatePorts.add(port);return port;};
 const resources={binding,boot,replay:newReplay(),authority:{activate:(i:any)=>credentialCall(credential,'activate',i),check:(request:any)=>credentialCall(credential,'check',{request})},makeFlow:()=>createLocalCviStyling({draft:async()=>{drafts++;return 'Synthetic checked output.';},check:async(text,s)=>({approved:true,text,revision:s.revision})})};
 const tracked=async(p:any)=>{
  const a=x.authorityPort(p.actor.role),claim=a.claim;let hash='';a.claim=async(intent,n)=>{const e=await claim(intent,n);hash=witnessServiceDigest(e.request);return e;};
  const actor=x.actors.find(r=>r.role===p.actor.role)!;const result=await createLocalMandatoryLeaseAdapter(x.pin,{role:p.actor.role,principalDigest:actor.principalDigest},a,x.persistence,testClock,8000).execute(p,signal());
  registry.entries.push({operationId:p.id,target:p.to,projection:fullStateProjection(await snapshot())});marker={operationId:p.id.slice(0,32),transactionId:String(Number(marker.transactionId)+1),claimHash:hash,consumed:true,protected:true};return result;
 };
 const write=async()=>tracked(await x.commitPlan(nativeLease)),fence=async()=>tracked(await x.fencing(nativeLease.generation)),replace=async()=>tracked(await x.plan('activate',{previous:nativeLease.generation,owner:ownerDigest,boot:randomBytes(32).toString('hex'),ttl:1000,token:randomBytes(32).toString('hex')}));
 const oldOwner={storeId:x.pin.storeId,generation:firstLease.generation,ownerDigest:firstLease.ownerDigest,bootDigest:firstLease.bootDigest,expiresAt:firstLease.expiresAt,minimumRevision:2};
 const gatedRenewal=()=>{
  if(!useGatedExecution||!nativeLease)throw Error('Gated fixture owner required');
  return createLocalDurableOwnerContinuation(x.pin,nativeLease,scope.bindingDigest,binding.expiresAt,{principalDigest:rotator.principalDigest,readerPrincipal:reader.principalDigest},{
   plan:async args=>{const p=await x.plan('renew',{lease:args.lease,ttl:args.ttl,token:args.token});const full=await mandatoryCall({root:x.root,config:{...x.config,now:testClock()},mode:'plan-full',actor:p.actor,kind:p.kind,args:p.args});registry.entries.push({operationId:p.id,target:p.to,projection:fullStateProjection(full.target)});lastPlan=p;return p;},execute:executeGated,read:n=>authority.read(n),
  },testClock);
 };
 const input=():FreshOwnerAdmissionInput=>({...structuredClone(scope),nonce:'4'.repeat(64),issuedAt:1000,expiresAt:8000});
 return {gatedRenewal,gateMaterial:()=>({pin:startupPin(),registry:structuredClone(registry),readPorts,databaseKey:key,writerPrincipal:rotator.principalDigest,physicalBindingDigest:oldDigests.scopeDigest}),residentStats:()=>resident?.stats(),newReplay,rawReplay,replayHooks,executeTracked:tracked,inspector,markerCopy:()=>structuredClone(marker),restoreMarker:(m:typeof marker)=>{marker=structuredClone(m);},oldOwner,write,fence,replace,ownerDigest,nativeLease:()=>nativeLease,oldOwnerExpiresAt:initialSnapshot.grants[0][5] as number,x,root,credential,replayRoot,journal,oldLease,scope,expected,baseline,ports,checkpoint,resources,admission,input,snapshot,lastPlan:()=>lastPlan,drafts:()=>drafts,make:()=>{if(localOwnedReplayState(resources.replay).bound||localOwnedReplayState(resources.replay).held)resources.replay=newReplay();return createLocalCviStartupOwner(expected,checkpoint,admission(),resources,testClock,7000);},close:async()=>{await Promise.allSettled([...gatedProducers].map(p=>p.close()));for(const p of privatePorts)p.close?.();await Promise.allSettled([...backendWork]);await resident?.close();await x.close();await rm(root,{recursive:true,force:true});}};
}
