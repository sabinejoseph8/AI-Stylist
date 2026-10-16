import {captureReplayWitness} from './local-cvi-replay-witness.ts';
import type {ReplayWitnessPin} from './local-cvi-replay-witness.ts';
import {createLocalWitnessedReplayBackend} from './local-cvi-witnessed-replay.ts';
/** Disabled concrete SQLite pair. No hosted driver or generic execution port. */
import {randomBytes} from 'node:crypto';
import {historyCanonical} from './local-cvi-history-authority.ts';
import {witnessServiceDigest} from './local-cvi-witness-service.ts';
import type {WitnessServicePin} from './local-cvi-witness-service.ts';
import type {DatabaseIdentityPin,DatabaseProofRequest,DatabaseBinding} from './local-cvi-database-authority-bridge.ts';
import {createLocalDurableStartupAdmission,localStartupOwnerBoot} from './local-cvi-startup-admission.ts';
import {createLocalDurableOwnerContinuation} from './local-cvi-owner-continuation.ts';
import type {OwnerContinuationPort,OwnerContinuationInput} from './local-cvi-owner-continuation.ts';
import type {FreshOwnerAdmissionInput,FreshOwnerAdmissionPort,CurrentOwnerCheckpointPort,CviCheckpointIdentity} from './local-cvi-startup-owner.ts';
import {createLocalOwnedReplayPort,localOwnedReplayState,localOwnedReplayExecutionContext,claimLocalOwnedReplayStartup,bindLocalOwnedReplay,adoptLocalOwnedReplay,holdLocalOwnedReplay} from './local-cvi-owned-replay.ts';
import type {CviCredentialBootAuthority} from './local-cvi-credentials.ts';
import type {CviReplayPort} from './local-cvi-endpoint.ts';
import {createLocalGatedSqliteExecution,localGatedExecutionFinished} from './local-cvi-gated-execution.ts';
import {createLocalStartupCheckpointInspector} from './local-cvi-startup-checkpoint.ts';
import type {StartupReadPorts,StartupRegistry} from './local-cvi-startup-checkpoint.ts';
import {fullStateMetadata,fullStateProjection} from './local-cvi-full-state-reconciliation.ts';
import type {MandatoryLeaseIntent,MonotonicLeaseAuthorityPort} from './local-cvi-mandatory-persistence.ts';
import {localNotebookCheckpointParent,localNotebookCheckpointClock} from './local-cvi-notebook-context.ts';
import {cviCredentialDigests} from './local-cvi-credentials.ts';
type Binding=Readonly<{origin:string;conversation:string;secret:string;expiresAt:number}>;
type Boot=Readonly<{storeId:string;previous:number;bootDigest:string}>;
type Scope=Omit<FreshOwnerAdmissionInput,'nonce'|'issuedAt'|'expiresAt'>;
type PairConfig=Readonly<{witness:ReplayWitnessPin;authority:WitnessServicePin;database:DatabaseIdentityPin;principal:string;actor:Readonly<{principalDigest:string;readerPrincipal:string;ownerDigest:string}>;scope:Scope;baseline:Record<string,unknown>;registry:StartupRegistry;nativeRoot:string;replayRoot:string;physicalBindingDigest:string;binding:Binding}>;
type FullPlan=Readonly<{intent:MandatoryLeaseIntent;previous:unknown;target:unknown}>;
type Ports=Readonly<{
 authority:MonotonicLeaseAuthorityPort;
 planFull(kind:'activate'|'renew',args:Record<string,unknown>,issuedAt:number,signal:AbortSignal):Promise<FullPlan>;
 identity(request:DatabaseProofRequest,binding:DatabaseBinding,signal:AbortSignal):Promise<unknown>;
 observe(command:Record<string,unknown>,signal:AbortSignal):Promise<unknown>;
 checkpoint:StartupReadPorts;
 references?():StartupRegistry;credentials:CviCredentialBootAuthority;
}>;
type Pair={clock:()=>number;credentials:CviCredentialBootAuthority;admission:FreshOwnerAdmissionPort;checkpoint:CurrentOwnerCheckpointPort;replay:CviReplayPort;config:PairConfig;permits:WeakSet<object>;renewalPermits:WeakSet<object>;claimed:boolean;pending:boolean;held:boolean;accept():void};
const pairs=new WeakMap<object,Pair>(),renewals=new WeakMap<object,Pair>();
const exact=(v:any,k:string[])=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...k].sort().join(',');
const same=(a:any,b:any)=>historyCanonical(a)===historyCanonical(b);
function freeze<T>(v:T):T{if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;}
function checkpointRoot(port:object,clock:()=>number){let current=port;for(let n=0;n<4;n++){const parent=localNotebookCheckpointParent(current);if(!parent)return current;if(localNotebookCheckpointClock(current)!==clock)throw Error('Original notebook clock required');current=parent;}throw Error('Checkpoint wrapper depth unavailable');}
export function localOwnerPairMatches(admission:object,checkpoint:object,replay:object,expected:CviCheckpointIdentity,binding:Binding,boot:Boot,credentials:object,clock:()=>number){
 try{const p=pairs.get(admission);return !!p&&!p.held&&!localOwnedReplayState(p.replay).held&&p.replay===replay&&p.credentials===credentials&&p.clock===clock&&checkpointRoot(checkpoint,p.clock)===p.checkpoint&&same(expected,p.config.scope.checkpoint)&&same(binding,p.config.binding)&&same(boot,{storeId:p.config.scope.credentialStoreId,previous:p.config.scope.previous,bootDigest:p.config.scope.bootDigest});}catch{return false;}
}
export function claimLocalOwnerPair(admission:object){const p=pairs.get(admission);if(!p||p.held||p.claimed||!claimLocalOwnedReplayStartup(p.replay))return false;p.claimed=true;return true;}
export function bindLocalOwnerPair(admission:object,raw:unknown,input:FreshOwnerAdmissionInput){
 const p=pairs.get(admission);if(!p||p.held||!p.claimed||!raw||typeof raw!=='object'||!p.permits.has(raw))throw Error('Original paired startup permit required');
 p.permits.delete(raw);try{bindLocalOwnedReplay(p.replay,raw,input);}catch{p.held=true;holdLocalOwnedReplay(p.replay);throw Error('Original paired startup held');}
}
export function adoptLocalOwnerPair(admission:object,raw:unknown,input:OwnerContinuationInput){const p=pairs.get(admission);if(!p||p.held||!p.claimed||!raw||typeof raw!=='object'||!p.renewalPermits.has(raw))throw Error('Original paired renewal handoff required');p.renewalPermits.delete(raw);try{adoptLocalOwnedReplay(p.replay,raw,input);}catch{p.held=true;holdLocalOwnedReplay(p.replay);throw Error('Original paired renewal held');}}
export function acceptLocalOwnerPair(admission:object){const p=pairs.get(admission);if(!p||p.held||!p.claimed)throw Error('Original owner pair required');p.accept();}
export const localOwnerPairContinuationMatches=(admission:object,port:object)=>{const p=pairs.get(admission);return !!p&&!p.held&&renewals.get(port)===p;};

/** Scope and all privileged callbacks are captured before the first operation.
 * The factory alone chooses the concrete execution driver and checkpoint verifier. */
export function createLocalGatedSqliteOwnerPair(raw:PairConfig,ports:Ports,clock=Date.now){
 if(!ports||typeof ports!=='object'||'replay' in ports||!exact(raw,['authority','database','principal','actor','scope','baseline','registry','nativeRoot','replayRoot','physicalBindingDigest','binding','witness'])||typeof clock!=='function'||typeof raw.principal!=='string'||!/^[a-z][a-z0-9_]{0,62}$/.test(raw.principal)||typeof raw.nativeRoot!=='string'||!raw.nativeRoot.startsWith('/')||typeof raw.replayRoot!=='string'||!raw.replayRoot.startsWith('/')||raw.nativeRoot===raw.replayRoot||!/^[a-f0-9]{64}$/.test(raw.physicalBindingDigest)||typeof ports?.planFull!=='function'||typeof ports.identity!=='function'||typeof ports.observe!=='function'||!['advance','claim','read','reconcile'].every(k=>typeof (ports.authority as any)?.[k]==='function')||typeof ports.checkpoint?.authority!=='function'||typeof ports.checkpoint.database!=='function'||typeof ports.credentials?.activate!=='function'||typeof ports.credentials.check!=='function'||ports.references!==undefined&&typeof ports.references!=='function')throw Error('Original owner pair configuration unavailable');
 const clone=structuredClone(raw),captured={...clone,witness:captureReplayWitness(clone.witness,clone.scope.replayStoreId,clone.replayRoot,clone.nativeRoot)};
 const c=freeze(captured),known={version:1 as const,entries:structuredClone(c.registry.entries).map(e=>({...e}))},planFull=ports.planFull.bind(ports),identity=ports.identity.bind(ports),observe=ports.observe.bind(ports),reads={authority:ports.checkpoint.authority.bind(ports.checkpoint),database:ports.checkpoint.database.bind(ports.checkpoint)},authority=Object.fromEntries(['advance','claim','read','reconcile'].map(k=>[k,(ports.authority as any)[k].bind(ports.authority)])) as unknown as MonotonicLeaseAuthorityPort;
 if(!known.entries.some(e=>e.operationId===c.scope.checkpoint.operationId&&same(e.target,c.baseline))||!same(cviCredentialDigests(c.binding),{scopeDigest:c.scope.scopeDigest,bindingDigest:c.scope.bindingDigest})||c.scope.checkpoint.storeId!==c.authority.storeId)throw Error('Original owner pair scope unavailable');
 const credentials=Object.freeze({activate:ports.credentials.activate.bind(ports.credentials),check:ports.credentials.check.bind(ports.credentials)});
 const backend=createLocalWitnessedReplayBackend({nativeRoot:c.nativeRoot,replayRoot:c.replayRoot,replayStoreId:c.scope.replayStoreId,physicalBindingDigest:c.physicalBindingDigest,applicationBindingDigest:c.scope.bindingDigest,applicationExpiresAt:c.binding.expiresAt,witness:c.witness,authority:c.authority,readerPrincipal:c.actor.readerPrincipal,ownerDigest:c.actor.ownerDigest},(n,s)=>authority.read(n,s),clock);
 const replay=createLocalOwnedReplayPort({storeId:c.scope.replayStoreId,nativeStoreId:c.authority.storeId,binding:c.binding},backend,clock,true),producers=new Set<ReturnType<typeof createLocalGatedSqliteExecution>>();
 let lastLease:any,prepared:FullPlan|undefined,preparedRevision=-1,pair:Pair;
 const referenceSource=ports.references?.bind(ports);
 const makeInspector=(finish?:Parameters<typeof createLocalStartupCheckpointInspector>[5])=>createLocalStartupCheckpointInspector({authority:c.authority,database:c.database,readerPrincipal:c.actor.readerPrincipal,registryDigest:witnessServiceDigest(known),minimumRevision:c.scope.checkpoint.revision},known,reads,clock,5000,finish);
 // Validate keys, registry and baseline before callbacks or durable admissions.
 makeInspector();
 const inspector=(finish?:Parameters<typeof createLocalStartupCheckpointInspector>[5])=>{
  try{if(referenceSource){const incoming=structuredClone(referenceSource());if(!exact(incoming,['version','entries'])||incoming.version!==1||!Array.isArray(incoming.entries)||incoming.entries.length>128)throw Error();for(const e of incoming.entries){const old=known.entries.find(x=>x.operationId===e.operationId);if(old){if(!same(old,e))throw Error();}else{if(known.entries.length>=128)throw Error();known.entries.push(e);}}}return makeInspector(finish);}
  catch{pair.held=true;holdLocalOwnedReplay(replay);throw Error('Original checkpoint references held');}
 };
 const checkpoint=Object.freeze({inspectFresh:(s:AbortSignal)=>inspector().inspect(s),inspectOwnerFresh:(owner:any,s:AbortSignal)=>inspector().inspectOwner(owner,s),inspectOwnerGatedFresh:(owner:any,b:any,s:AbortSignal)=>{
  if(pair.held||!same(b.pin,{authority:c.authority,database:c.database,readerPrincipal:c.actor.readerPrincipal})||b.marker.storeId!==c.scope.replayStoreId||b.marker.nativeStoreId!==c.authority.storeId||b.marker.bindingDigest!==c.physicalBindingDigest||b.marker.applicationExpiresAt!==c.binding.expiresAt||!prepared||b.plan.id!==prepared.intent.id)throw Error('Original paired finish scope unavailable');return inspector(b).inspectOwner(owner,s);
 }});
 const prepare=async(kind:'activate'|'renew',args:Record<string,unknown>,at:number,s:AbortSignal,revision:number)=>{
  if(pair.held||pair.pending||s.aborted||!Number.isSafeInteger(revision)||revision<c.scope.checkpoint.revision||revision>Number.MAX_SAFE_INTEGER-2)throw Error('Original paired plan unavailable');pair.pending=true;
  try{const full=freeze(structuredClone(await planFull(kind,structuredClone(args),at,s))),p=full.intent;
   if(s.aborted||!exact(full,['intent','previous','target'])||p.kind!==kind||p.now!==at||p.actor.role!=='rotator'||p.actor.principalDigest!==c.actor.principalDigest||!same(p.args,args)||!same(fullStateMetadata(full.previous),p.from)||!same(fullStateMetadata(full.target),p.to)||known.entries.some(e=>e.operationId===p.id)||known.entries.length>=128)throw Error();
   prepared=full;preparedRevision=revision;known.entries.push({operationId:p.id,target:p.to,projection:fullStateProjection(full.target)});return p;
  }catch{pair.held=true;holdLocalOwnedReplay(replay);throw Error('Original paired plan held');}
 };
 const execute=async(p:MandatoryLeaseIntent,s:AbortSignal)=>{
  if(pair.held||!pair.pending||!prepared||!same(p,prepared.intent)||s.aborted)throw Error('Original paired execution unavailable');
  try{const full=prepared,target=full.target as any,grant=target.grants.filter((r:any)=>r[6]==='active');if(grant.length!==1)throw Error();
   // The caller's existing verified owner floor supplies this revision; no read is added.
   const revision=preparedRevision+2;if(!Number.isSafeInteger(revision)||revision<2)throw Error();
   const command={operationId:p.id.slice(0,32),kind:p.kind,previous:fullStateProjection(full.previous),target:fullStateProjection(full.target),recordHash:null,expiresAt:p.kind==='renew'?Number((p.args.lease as any).expiresAt):grant[0][5]};
   const owner={storeId:c.authority.storeId,generation:grant[0][0],ownerDigest:grant[0][1],bootDigest:grant[0][2],expiresAt:grant[0][5],minimumRevision:revision};
   const producer=createLocalGatedSqliteExecution({gate:{root:c.replayRoot,witness:c.witness,scope:{storeId:c.scope.replayStoreId,bindingDigest:c.physicalBindingDigest,nativeStoreId:c.authority.storeId,applicationExpiresAt:c.binding.expiresAt,expiresAt:command.expiresAt},plan:p,pin:{authority:c.authority,database:c.database,readerPrincipal:c.actor.readerPrincipal},writerPrincipal:c.actor.principalDigest,owner,databasePrincipal:c.principal},nativeRoot:c.nativeRoot,previous:full.previous,target:full.target,command},{authority,identity,observe:s=>observe(command,s)},clock);
   producers.add(producer);lastLease=await producer.execute(p,s);return lastLease;
  }catch{pair.held=true;holdLocalOwnedReplay(replay);await Promise.allSettled([...producers].map(p=>p.close()));throw Error('Original paired execution held');}
 };
 const nativeAdmission=createLocalDurableStartupAdmission(c.authority,c.scope,c.baseline,c.actor,{plan:(i,s)=>prepare('activate',{previous:i.previous,owner:c.actor.ownerDigest,boot:localStartupOwnerBoot(i),ttl:i.expiresAt-i.issuedAt,token:randomBytes(32).toString('hex')},i.issuedAt,s,c.scope.checkpoint.revision),execute,read:(n,s)=>authority.read(n,s)},clock);
 const permits=new WeakSet<object>();
 const admission=Object.freeze({isHeld:()=>pair.held||nativeAdmission.isHeld(),async admit(i:FreshOwnerAdmissionInput,s:AbortSignal){if(!pair.claimed||pair.held||s.aborted)throw Error('Original pair claim required before admission');try{const raw=await nativeAdmission.admit(i,s);if(!raw||typeof raw!=='object')throw Error();permits.add(raw);return raw;}catch{pair.held=true;holdLocalOwnedReplay(replay);throw Error('Original paired admission held');}}});
 pair={clock,credentials,admission,checkpoint,replay,config:c,permits,renewalPermits:new WeakSet<object>(),claimed:false,pending:false,held:false,accept(){const context=localOwnedReplayExecutionContext(replay);if(pair.held||!pair.claimed||!localOwnedReplayState(replay).bound||!context||!localGatedExecutionFinished(context))throw Error('Original paired acceptance unavailable');pair.pending=false;}};
 pairs.set(admission,pair);
 return Object.freeze({admission,checkpoint,replay,credentials,clock,isHeld:()=>pair.held||backend.isHeld()||localOwnedReplayState(replay).held,continuation(){
  const context=localOwnedReplayExecutionContext(replay);if(pair.held||!pair.claimed||pair.pending||!lastLease||!context||!localGatedExecutionFinished(context))throw Error('Original paired continuation unavailable');
  const nativePort=createLocalDurableOwnerContinuation(c.authority,lastLease,c.scope.bindingDigest,c.binding.expiresAt,{principalDigest:c.actor.principalDigest,readerPrincipal:c.actor.readerPrincipal},{plan:(a,s)=>prepare('renew',{lease:a.lease,ttl:a.ttl,token:a.token},a.issuedAt,s,a.revision),execute,read:(n,s)=>authority.read(n,s)},clock);const port=Object.freeze({isHeld:()=>pair.held||nativePort.isHeld(),async renew(i:OwnerContinuationInput,s:AbortSignal){try{const raw=await nativePort.renew(i,s);if(!raw||typeof raw!=='object')throw Error();pair.renewalPermits.add(raw);return raw;}catch{pair.held=true;holdLocalOwnedReplay(replay);await Promise.allSettled([...producers].map(p=>p.close()));throw Error('Original paired continuation held');}}});renewals.set(port,pair);return port;
 },async close(){pair.held=true;holdLocalOwnedReplay(replay);await Promise.allSettled([...producers].map(p=>p.close()).concat(backend.close()));}});
}
