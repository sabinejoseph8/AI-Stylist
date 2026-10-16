/** Disabled concrete SQLite producer. No hosted driver, raw-write fallback or
 * owner-publication permission. SQLite row markers are not PostgreSQL xids. */
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash,randomBytes} from 'node:crypto';
import {historyCanonical} from './local-cvi-history-authority.ts';
import {createLocalSignedDatabaseBridge} from './local-cvi-database-authority-bridge.ts';
import type {DatabaseBinding,DatabaseProofRequest} from './local-cvi-database-authority-bridge.ts';
import type {MandatoryLeaseIntent,MonotonicLeaseAuthorityPort} from './local-cvi-mandatory-persistence.ts';
import {assertCommittedFullState,fullStateMetadata,fullStateProjection,createLocalFullStateReconciler} from './local-cvi-full-state-reconciliation.ts';
import {beginLocalTransitionGate,bindLocalTransitionAdmission,localTransitionFinishBinding,inspectLocalTransitionGate,finishLocalTransitionGate,closeLocalTransitionGate,localTransitionIsHeld} from './local-cvi-transition-port.ts';
import type {LocalTransitionSetup,LocalTransitionGate} from './local-cvi-transition-port.ts';
import type {ReplayInspectionRequest} from './local-cvi-replay-inspection.ts';
export type LocalGatedExecutionContext=Readonly<{status:'original-gated-execution'}>;
type RecordState={gate:LocalTransitionGate;plan:MandatoryLeaseIntent;lease:object;fingerprint:string;signal:AbortSignal;clock():number;expiresAt:number;observedAt:number;claimed:boolean;claiming:boolean;finished:boolean;busy:boolean;held:boolean};
const results=new WeakMap<object,RecordState>(),contexts=new WeakMap<object,RecordState>();
const same=(a:any,b:any)=>historyCanonical(a)===historyCanonical(b);
const exact=(v:any,keys:string[])=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
function freeze<T>(v:T):T{if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;}
const live=(r:RecordState,at:number)=>{
 if(r.held||r.finished||r.signal.aborted||localTransitionIsHeld(r.gate)||!Number.isSafeInteger(at)||at<r.observedAt||at>=r.expiresAt)throw Error('Original gated execution unavailable');
 const actual=r.clock();if(!Number.isSafeInteger(actual)||actual<at||actual>=r.expiresAt)throw Error('Original gated execution unavailable');r.observedAt=actual;
};
/** Claim the original execution once before cloning its public native lease. */
export function claimLocalGatedExecution(raw:unknown,plan:MandatoryLeaseIntent,at:number):LocalGatedExecutionContext{
 const r=raw&&typeof raw==='object'?results.get(raw):undefined;
 if(!r||r.claimed||r.claiming)throw Error('Original gated execution unavailable');r.claiming=true;
 try{
  // Capture JSON before the final liveness check; getters cannot cancel mid-claim.
  const wanted=structuredClone(plan);if(!same(wanted,r.plan)||historyCanonical(raw as any)!==r.fingerprint)throw Error('Original gated execution unavailable');
  live(r,at);if(r.claimed)throw Error('Original gated execution unavailable');r.claimed=true;const context=Object.freeze({status:'original-gated-execution' as const});contexts.set(context,r);return context;
 }finally{r.claiming=false;}
}
export const isOriginalLocalGatedExecution=(raw:unknown)=>!!raw&&typeof raw==='object'&&results.has(raw);
export const localGatedExecutionFinished=(c:LocalGatedExecutionContext)=>{const r=contexts.get(c);if(!r)throw Error('Original gated execution required');return r.finished&&!r.held;};
const original=(c:LocalGatedExecutionContext)=>{const r=contexts.get(c);if(!r)throw Error('Original gated execution required');live(r,r.clock());return r;};
export const localGatedExecutionBinding=(c:LocalGatedExecutionContext)=>localTransitionFinishBinding(original(c).gate);
export async function inspectLocalGatedExecution(c:LocalGatedExecutionContext,request:ReplayInspectionRequest,signal:AbortSignal){
 const r=original(c);if(r.busy)throw Error('Original gated execution busy');r.busy=true;
 try{const value=await inspectLocalTransitionGate(r.gate,request,AbortSignal.any([signal,r.signal]));live(r,r.clock());return value;}
 catch{r.held=true;await closeLocalTransitionGate(r.gate);throw Error('Original gated execution held');}finally{r.busy=false;}
}
export async function finishLocalGatedExecution(c:LocalGatedExecutionContext,inspection:unknown,signal:AbortSignal){
 const r=original(c);if(r.busy)throw Error('Original gated execution busy');r.busy=true;
 try{await finishLocalTransitionGate(r.gate,inspection,AbortSignal.any([signal,r.signal]));
  const at=r.clock();if(r.signal.aborted||signal.aborted||!Number.isSafeInteger(at)||at<r.observedAt||at>=r.expiresAt)throw Error();r.finished=true;
 }catch{r.held=true;await closeLocalTransitionGate(r.gate);throw Error('Original gated execution held');}finally{r.busy=false;}
}
export async function closeLocalGatedExecution(c:LocalGatedExecutionContext){const r=contexts.get(c);if(!r)throw Error('Original gated execution required');r.held=true;await closeLocalTransitionGate(r.gate);}

function transact(input:object,signal:AbortSignal,handler:(stage:'admit'|'confirm',binding:DatabaseBinding,hash?:string)=>Promise<unknown>):Promise<any>{
 return new Promise((resolve,reject)=>{
  const child=spawn('python3',[fileURLToPath(new URL('../../../../tools/operations/local_cvi_gated_sqlite_execution.py',import.meta.url))],{stdio:['pipe','pipe','pipe']});
  let buffer='',answer:any,held=false,stage=0;
  const hold=()=>{held=true;child.kill('SIGKILL');},timer=setTimeout(hold,8000);signal.addEventListener('abort',hold,{once:true});if(signal.aborted)hold();
  child.stderr.resume();child.stdin.on('error',hold);child.on('error',hold);
  child.stdout.on('data',d=>{buffer+=d.toString();if(Buffer.byteLength(buffer)>1048576)return hold();let at:number;
   while((at=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,at);buffer=buffer.slice(at+1);try{const m=JSON.parse(line);
    if(stage===0&&exact(m,['stage','binding'])&&m.stage==='admit'||stage===1&&exact(m,['stage','binding','claimHash'])&&m.stage==='confirm'){
     const previous=stage;stage=-1;Promise.resolve().then(()=>handler(m.stage,m.binding,m.claimHash)).then(v=>{if(!held&&!signal.aborted){if(stage!==-1)return hold();stage=previous+1;child.stdin.write(JSON.stringify(v)+'\n');}},hold);
    }else if(stage===2&&exact(m,['stage','result'])&&m.stage==='result'){stage++;answer=m.result;}else throw Error();
   }catch{hold();}}
  });
  child.on('close',code=>{clearTimeout(timer);signal.removeEventListener('abort',hold);if(held||signal.aborted||code!==0||stage!==3||buffer.length||!answer)reject(Error('Local gated transaction held'));else resolve(answer);});
  const line=JSON.stringify(input);if(Buffer.byteLength(line)>1048576)hold();else child.stdin.write(line+'\n');
 });
}
export function createLocalGatedSqliteExecution(raw:Readonly<{gate:LocalTransitionSetup;nativeRoot:string;previous:unknown;target:unknown;command:Record<string,unknown>}>,ports:Readonly<{
 authority:MonotonicLeaseAuthorityPort;
 identity(request:DatabaseProofRequest,binding:DatabaseBinding,signal:AbortSignal):Promise<unknown>;
 observe(signal:AbortSignal):Promise<unknown>;
}>,clock=Date.now){
 if(!exact(raw,['gate','nativeRoot','previous','target','command'])||typeof raw.nativeRoot!=='string'||!raw.nativeRoot.startsWith('/')||raw.nativeRoot===raw.gate.root||typeof clock!=='function'||!['activate','renew'].includes(raw.gate.plan.kind)||raw.gate.plan.actor.role!=='rotator'||typeof ports?.identity!=='function'||typeof ports.observe!=='function'||!['advance','claim','read','reconcile'].every(k=>typeof (ports.authority as any)?.[k]==='function'))throw Error('Local gated producer unavailable');
 const setup=freeze(structuredClone(raw)),p=setup.gate.plan,command=setup.command,identity=ports.identity.bind(ports),observe=ports.observe.bind(ports),authority=Object.fromEntries(['advance','claim','read','reconcile'].map(k=>[k,(ports.authority as any)[k].bind(ports.authority)])) as unknown as MonotonicLeaseAuthorityPort;
 if(!exact(command,['operationId','kind','previous','target','recordHash','expiresAt'])||command.recordHash!==null||!same(fullStateMetadata(setup.previous),p.from)||!same(fullStateProjection(setup.previous),command.previous)||!same(fullStateMetadata(setup.target),p.to)||!same(fullStateProjection(setup.target),command.target)||command.operationId!==p.id.slice(0,32)||command.kind!==p.kind||!Number.isSafeInteger(command.expiresAt)||Number(command.expiresAt)<=p.now||Number(command.expiresAt)>setup.gate.scope.expiresAt)throw Error('Local gated producer unavailable');
 let attempted=false,held=false,gate:LocalTransitionGate|undefined,record:RecordState|undefined,activeAbort:AbortController|undefined;
 return Object.freeze({isHeld:()=>held||!!record?.held||!!gate&&localTransitionIsHeld(gate),async close(){held=true;activeAbort?.abort();if(record)record.held=true;if(gate)await closeLocalTransitionGate(gate);},async execute(plan:MandatoryLeaseIntent,external:AbortSignal){
  if(attempted||held||external.aborted||!same(structuredClone(plan),p))throw Error('Local gated producer unavailable');attempted=true;
  const abort=new AbortController();activeAbort=abort;const signal=AbortSignal.any([external,abort.signal]);let timer:ReturnType<typeof setTimeout>|undefined,onAbort:(()=>void)|undefined,last=-1;
  const now=()=>{const at=clock();if(held||signal.aborted||!Number.isSafeInteger(at)||at<last||at<p.now||at>=Number(command.expiresAt))throw Error();last=at;return at;};
  try{
   const started=now();timer=setTimeout(()=>abort.abort(),Math.min(8000,Number(command.expiresAt)-started));
   const canceled=new Promise<never>((_,reject)=>{onAbort=()=>reject(Error('Local gated execution canceled'));signal.addEventListener('abort',onAbort,{once:true});if(signal.aborted)onAbort();});void canceled.catch(()=>{});
   const work=async()=>{
   gate=await beginLocalTransitionGate(setup.gate,signal,clock);
   await inspectLocalTransitionGate(gate,{storeId:setup.gate.scope.storeId,bindingDigest:setup.gate.scope.bindingDigest,challenge:randomBytes(32).toString('hex'),now:now()},signal);
   const approval=await authority.advance(p,signal);now();let active:DatabaseBinding|undefined,admission:unknown;
   const bridge=createLocalSignedDatabaseBridge(setup.gate.pin.authority,setup.gate.pin.database,setup.gate.databasePrincipal,p,approval,command,authority,(r,s)=>{if(!active)throw Error();return identity(r,structuredClone(active),s);},clock);
   const committed=await transact({root:setup.nativeRoot,plan:p,command,principal:setup.gate.databasePrincipal},signal,async(stage,binding,hash)=>{
    now();active=structuredClone(binding);if(stage==='admit'){admission=await bridge.admit(binding,signal);return admission;}
    const confirmed=await bridge.confirm(binding,hash,signal);await bindLocalTransitionAdmission(gate!,admission,signal);return confirmed;
   });now();
   const binding=localTransitionFinishBinding(gate),observed=await observe(signal);now();
   assertCommittedFullState(observed,p,setup.target,command,binding.commit.claimHash,binding.commit.transactionId);
   if(!exact(committed,['transaction','lease'])||!same(committed.transaction,{status:'applied',operationId:command.operationId,transactionId:binding.commit.transactionId,target:command.target}))throw Error();
   const lease=committed.lease,g=(setup.target as any).grants.filter((r:any)=>r[6]==='active');
   if(!exact(lease,['storeId','policyDigest','generation','ownerDigest','bootDigest','token','issuedAt','expiresAt'])||g.length!==1||typeof lease.token!=='string'||!/^[a-f0-9]{64}$/.test(lease.token)||!same([lease.generation,lease.ownerDigest,lease.bootDigest,createHash('sha256').update(lease.token).digest('hex'),lease.issuedAt,lease.expiresAt,'active'],g[0])||lease.storeId!==p.to.storeId||lease.policyDigest!==p.to.policyDigest)throw Error();
   await createLocalFullStateReconciler(setup.gate.pin.authority,p,setup.target,command,binding.commit.claimHash,binding.commit.transactionId,s=>authority.reconcile(p,s),(n,s)=>authority.read(n,s),clock).finalize(signal);
   const at=now(),result=freeze(structuredClone(lease));record={gate,plan:freeze(structuredClone(p)),lease:result,fingerprint:historyCanonical(result),signal,clock,expiresAt:Math.min(Number(command.expiresAt),lease.expiresAt),observedAt:at,claimed:false,claiming:false,finished:false,busy:false,held:false};results.set(result,record);return result;
   };return await Promise.race([work(),canceled]);
  }catch{held=true;abort.abort();if(gate)await closeLocalTransitionGate(gate);throw Error('Local gated producer held');}finally{if(timer)clearTimeout(timer);if(onAbort)signal.removeEventListener('abort',onAbort);}
 }});
}
