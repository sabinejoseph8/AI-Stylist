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
export async function startupAdmissionFixture(){
 const x=await mandatoryFixture(),signal=()=>new AbortController().signal,first=await x.activation();
 await x.adapter('rotator').execute(first,signal());
 const baseline=await x.observe(),snapshot=()=>mandatoryCall({root:x.root,config:x.config,mode:'full-observe'}),initialSnapshot=await snapshot();
 const root=await mkdtemp(join(tmpdir(),'stylist-startup-admission-')),credential=join(root,'credentials'),replayRoot=join(root,'replay');await mkdir(credential,{mode:0o700});await mkdir(replayRoot,{mode:0o700});
 const binding=credentialBinding(2),oldBinding=credentialBinding(),oldDigests=cviCredentialDigests(oldBinding),prepared:any=await credentialCall(credential,'prepare',oldDigests),oldLease:any=await credentialCall(credential,'activate',{storeId:prepared.storeId,...oldDigests,bootDigest:'1'.repeat(64),previous:0,now:1000}),journal:any=await call(replayRoot,'prepare',{bindingDigest:oldDigests.scopeDigest});
 const expected={storeId:x.pin.storeId,operationId:first.id,revision:2},boot={storeId:prepared.storeId,previous:1,bootDigest:'2'.repeat(64)},scope={checkpoint:expected,credentialStoreId:prepared.storeId,replayStoreId:journal.storeId,previous:1,bootDigest:boot.bootDigest,...cviCredentialDigests(binding)};
 const rotator=x.actors.find(a=>a.role==='rotator')!,reader=x.actors.find(a=>a.role==='observer')!,authority=x.authorityPort('rotator'),key=fixtureKey();
 const registry={version:1 as const,entries:[{operationId:first.id,target:first.to,projection:fullStateProjection(initialSnapshot)}]};
 const ownerDigest=witnessServiceDigest(x.config.actor);
 let nativeLease:any;
 let marker={operationId:first.id.slice(0,32),transactionId:'1',claimHash:'c'.repeat(64),consumed:true,protected:true},claimHash='',lastPlan:any,drafts=0;
 const claim=authority.claim;authority.claim=async(p,n)=>{const e=await claim(p,n);claimHash=witnessServiceDigest(e.request);return e;};
 const adapter=()=>createLocalMandatoryLeaseAdapter(x.pin,{role:'rotator',principalDigest:rotator.principalDigest},authority,x.persistence,()=>1000,8000);
 const ports:DurableStartupPorts={
  plan:async(input)=>{const p=await x.plan('activate',{previous:input.previous,owner:ownerDigest,boot:localStartupOwnerBoot(input),ttl:input.expiresAt-input.issuedAt,token:randomBytes(32).toString('hex')});lastPlan=p;registry.entries.push({operationId:p.id,target:p.to,projection:{...fullStateProjection(initialSnapshot),generation:2,owner:p.args.owner as string,boot:p.args.boot as string}});return p;},
  execute:async(p,s)=>{const lease=await adapter().execute(p,s);nativeLease=lease;marker={operationId:p.id.slice(0,32),transactionId:'2',claimHash,consumed:true,protected:true};return lease;},
  read:(n,s)=>authority.read(n),
 };
 const readPorts={authority:(n:string)=>authority.read(n),database:async(nonce:string)=>{const snapshotValue=await snapshot(),body={version:1,keyId:'fixture-key-startup-observer',storeId:x.pin.storeId,policyDigest:x.pin.policyDigest,nonce,issuedAt:1000,expiresAt:8000,checkpoint:{snapshot:snapshotValue,projection:fullStateProjection(snapshotValue),...marker}};return {body,signature:key.sign(historyCanonical(body))};}};
 const checkpoint={inspectFresh:(s:AbortSignal)=>createLocalStartupCheckpointInspector({authority:x.pin,database:{keyId:'fixture-key-startup-observer',publicKeyPem:key.pem},readerPrincipal:reader.principalDigest,registryDigest:witnessServiceDigest(registry),minimumRevision:2},registry,readPorts,()=>1000).inspect(s)};
 const admission=(clock=()=>1000)=>createLocalDurableStartupAdmission(x.pin,scope,baseline,{principalDigest:rotator.principalDigest,readerPrincipal:reader.principalDigest,ownerDigest},ports,clock);
 const resources={binding,boot,replay:scopeReplay(replayRoot,journal.storeId,oldDigests.scopeDigest),authority:{activate:(i:any)=>credentialCall(credential,'activate',i),check:(request:any)=>credentialCall(credential,'check',{request})},makeFlow:()=>createLocalCviStyling({draft:async()=>{drafts++;return 'Synthetic checked output.';},check:async(text,s)=>({approved:true,text,revision:s.revision})})};
 const input=():FreshOwnerAdmissionInput=>({...structuredClone(scope),nonce:'4'.repeat(64),issuedAt:1000,expiresAt:8000});
 return {ownerDigest,nativeLease:()=>nativeLease,oldOwnerExpiresAt:initialSnapshot.grants[0][5] as number,x,root,credential,replayRoot,journal,oldLease,scope,expected,baseline,ports,checkpoint,resources,admission,input,snapshot,lastPlan:()=>lastPlan,drafts:()=>drafts,make:()=>createLocalCviStartupOwner(expected,checkpoint,admission(),resources,()=>1000,7000),close:async()=>{await x.close();await rm(root,{recursive:true,force:true});}};
}
