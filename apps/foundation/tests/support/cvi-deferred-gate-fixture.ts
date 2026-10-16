/** Actual SQLite/authority process sequence. SQLite row markers are not PG xids. */
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mandatoryFixture,mandatoryCall} from './cvi-mandatory-fixture.ts';
import {residentWitnessTransport} from './cvi-resident-witness.ts';
import {call} from './cvi-replay-process.ts';
import {fixtureKey} from './cvi-witness-service-fixture.ts';
import {createLocalSignedDatabaseBridge} from '../../src/server/local-cvi-database-authority-bridge.ts';
import {fullStateProjection,assertCommittedFullState} from '../../src/server/local-cvi-full-state-reconciliation.ts';
import {createLocalStartupCheckpointInspector} from '../../src/server/local-cvi-startup-checkpoint.ts';
import {historyCanonical} from '../../src/server/local-cvi-history-authority.ts';
import {witnessServiceDigest} from '../../src/server/local-cvi-witness-service.ts';
import {inspectLocalTransitionGate,bindLocalTransitionAdmission,localTransitionFinishBinding} from '../../src/server/local-cvi-transition-port.ts';
import type {LocalTransitionGate,LocalTransitionSetup} from '../../src/server/local-cvi-transition-port.ts';
import type {DatabaseBinding} from '../../src/server/local-cvi-database-authority-bridge.ts';
function transactionCall(input:Record<string,unknown>,handler?:(m:any)=>Promise<unknown>):Promise<any>{return new Promise((resolve,reject)=>{
 const child=spawn('python3',[fileURLToPath(new URL('./cvi-deferred-transaction-store.py',import.meta.url))],{stdio:['pipe','pipe','pipe']});let raw='',answer:any,held=false;
 const hold=()=>{held=true;child.kill('SIGKILL');},timer=setTimeout(hold,8000);child.stderr.resume();child.stdin.on('error',hold);child.on('error',hold);
 child.stdout.on('data',d=>{raw+=d.toString();if(Buffer.byteLength(raw)>1048576)return hold();let at:number;while((at=raw.indexOf('\n'))>=0){const line=raw.slice(0,at);raw=raw.slice(at+1);try{const m=JSON.parse(line);if(m.stage==='result'){if(answer)throw Error();answer=m.result;}else if(['admit','confirm'].includes(m.stage)&&handler)Promise.resolve().then(()=>handler(m)).then(v=>{if(!held)child.stdin.write(JSON.stringify(v)+'\n');},hold);else throw Error();}catch{hold();}}});
 child.on('close',code=>{clearTimeout(timer);if(held||code!==0||!answer)reject(Error('Deferred transaction held'));else resolve(answer);});child.stdin.write(JSON.stringify(input)+'\n');
});}
export async function deferredGateFixture(mode:'activate'|'renew'='activate'){
 let time=1000;const resident=residentWitnessTransport(),x=await mandatoryFixture(undefined,()=>time,resident.call),root=await mkdtemp(join(tmpdir(),'stylist-deferred-gate-'));
 try{
  let previousLease:any;
  if(mode==='renew'){const initial=await x.plan('activate',{previous:0,owner:'a'.repeat(64),boot:'b'.repeat(64),ttl:3000,token:randomBytes(32).toString('hex')});previousLease=await x.adapter('rotator').execute(initial,new AbortController().signal);}
  const initialRevision=mode==='renew'?2:0,plan=mode==='renew'?await x.plan('renew',{lease:previousLease,ttl:8000,token:randomBytes(32).toString('hex')}):await x.plan('activate',{previous:0,owner:'a'.repeat(64),boot:'b'.repeat(64),ttl:8000,token:randomBytes(32).toString('hex')}),states=await mandatoryCall({root:x.root,config:x.config,mode:'plan-full',actor:plan.actor,kind:plan.kind,args:plan.args}),physicalDigest='c'.repeat(64),journal:any=await call(root,'prepare',{bindingDigest:physicalDigest}),key=fixtureKey(),database={keyId:'fixture-key-deferred-database',publicKeyPem:key.pem},reader=x.actors.find(a=>a.role==='observer')!,principal='fixture_rotator';
  const owner={storeId:x.pin.storeId,generation:1,ownerDigest:mode==='renew'?previousLease.ownerDigest:plan.args.owner as string,bootDigest:mode==='renew'?previousLease.bootDigest:plan.args.boot as string,expiresAt:9000,minimumRevision:initialRevision+2},command={operationId:plan.id.slice(0,32),kind:plan.kind,previous:fullStateProjection(states.previous),target:fullStateProjection(states.target),recordHash:null,expiresAt:mode==='renew'?previousLease.expiresAt:8000};
  const setup:LocalTransitionSetup={root,scope:{storeId:journal.storeId,bindingDigest:physicalDigest,nativeStoreId:x.pin.storeId,applicationExpiresAt:10000,expiresAt:mode==='renew'?previousLease.expiresAt:8000},plan,pin:{authority:x.pin,database,readerPrincipal:reader.principalDigest},writerPrincipal:plan.actor.principalDigest,owner,databasePrincipal:principal};
  const authority=x.authorityPort('rotator'),signal=()=>new AbortController().signal,observe=()=>transactionCall({root:x.root,plan,command,config:x.config,principal,mode:'observe'});
  let admission:any,bridge:ReturnType<typeof createLocalSignedDatabaseBridge>|undefined,active:DatabaseBinding|undefined,transaction:any,attempted=false;
  const execute=async(gate:LocalTransitionGate,options:Readonly<{crash?:string;copyAdmission?:boolean;beforeBind?:()=>void}>={})=>{
   if(attempted)throw Error('Fixture transaction already attempted');attempted=true;
   const entered:any=await inspectLocalTransitionGate(gate,{storeId:setup.scope.storeId,bindingDigest:setup.scope.bindingDigest,challenge:randomBytes(32).toString('hex'),now:time},signal());if(entered.operationId!==plan.id)throw Error('Original matching gate required before advance');
   const before=await x.inspect();if(before.pending!==null||before.revision!==initialRevision)throw Error('Fixture did not enter before advance');
   const approval=await authority.advance(plan);
   bridge=createLocalSignedDatabaseBridge(x.pin,database,principal,plan,approval,command,authority,async request=>{if(!active)throw Error();const body={version:1,keyId:database.keyId,...request,bindingDigest:witnessServiceDigest(active),issuedAt:time,expiresAt:time+3000};return {body,signature:key.sign(historyCanonical(body))};},()=>time,8000);
   transaction=await transactionCall({root:x.root,plan,command,config:x.config,principal,crash:options.crash},async m=>{
    active=structuredClone(m.binding);
    if(m.stage==='admit'){admission=await bridge!.admit(m.binding,signal());return admission;}
    const confirmed=await bridge!.confirm(m.binding,m.claimHash,signal());options.beforeBind?.();await bindLocalTransitionAdmission(gate,options.copyAdmission?structuredClone(admission):admission,signal());return confirmed;
   });
   const observed=await observe(),binding=localTransitionFinishBinding(gate);assertCommittedFullState(observed,plan,states.target,command,binding.commit.claimHash,binding.commit.transactionId);
   await authority.reconcile(plan);return observed;
  };
  const registry={version:1 as const,entries:[{operationId:plan.id,target:plan.to,projection:fullStateProjection(states.target)}]};
  const inspector=(gate:LocalTransitionGate,prepared=true)=>{const b=localTransitionFinishBinding(gate);return createLocalStartupCheckpointInspector({authority:x.pin,database,readerPrincipal:reader.principalDigest,registryDigest:witnessServiceDigest(registry),minimumRevision:owner.minimumRevision},registry,{authority:n=>authority.read(n),database:async nonce=>{const body={version:1,keyId:database.keyId,storeId:x.pin.storeId,policyDigest:x.pin.policyDigest,nonce,issuedAt:time,expiresAt:time+3000,checkpoint:await observe()};return {body,signature:key.sign(historyCanonical(body))};}},()=>time,5000,prepared?b:undefined);};
  return {setup,root,x,owner,plan,previousLease,clock:()=>time,at:(at:number)=>time=at,execute,observe,inspector,admission:()=>admission,close:async()=>{await resident.close();await x.close();await rm(root,{recursive:true,force:true});}};
 }catch(e){await resident.close();await x.close();await rm(root,{recursive:true,force:true});throw e;}
}
