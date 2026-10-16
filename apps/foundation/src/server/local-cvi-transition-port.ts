/** Disabled original, supervised local gate. A finish is not owner permission. */
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import {historyCanonical} from './local-cvi-history-authority.ts';
import {captureGateFinishContext,captureGateFinishBinding,gateFinishJson,gateFinishScope,verifyLocalGateFinishProof} from './local-cvi-gate-finish-proof.ts';
import {claimLocalGateFinishInspection} from './local-cvi-startup-checkpoint.ts';
import {witnessServiceDigest} from './local-cvi-witness-service.ts';
import {claimOriginalDatabaseAdmission} from './local-cvi-database-authority-bridge.ts';
import type {GateFinishContext,GateFinishBinding} from './local-cvi-gate-finish-proof.ts';
import type {ReplayInspectionRequest} from './local-cvi-replay-inspection.ts';
type Scope=ReturnType<typeof gateFinishScope>;
export type LocalTransitionSetup=Readonly<{root:string;scope:Scope;plan:GateFinishBinding['plan'];pin:GateFinishBinding['pin'];writerPrincipal:string;owner:GateFinishBinding['owner'];databasePrincipal:string}>;
export type LocalTransitionGate=Readonly<{status:'local-transition-gate'}>;
type Control={binding():GateFinishBinding;bind(raw:unknown,s:AbortSignal):Promise<void>;inspect(r:ReplayInspectionRequest,s:AbortSignal):Promise<unknown>;finish(r:unknown,s:AbortSignal):Promise<void>;close():Promise<void>;held():boolean};
const controls=new WeakMap<object,Control>();
const exact=(v:any,keys:string[])=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const int=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const same=(a:any,b:any)=>historyCanonical(a)===historyCanonical(b);
function freeze<T>(v:T):T{if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;}
/** All setup fields come from captured server configuration, never HTTP. */
export async function beginLocalTransitionGate(raw:LocalTransitionSetup,external:AbortSignal,clock=Date.now,deadlineMs=8000):Promise<LocalTransitionGate>{
 if(!gateFinishJson(raw)||!exact(raw,['root','scope','plan','pin','writerPrincipal','owner','databasePrincipal'])||typeof raw.databasePrincipal!=='string'||!/^[a-z][a-z0-9_]{0,62}$/.test(raw.databasePrincipal)||typeof raw.root!=='string'||!raw.root.startsWith('/')||Buffer.byteLength(historyCanonical(raw as any))>1048576||typeof clock!=='function'||!int(deadlineMs)||deadlineMs<1||deadlineMs>8000||external.aborted)throw Error('Local transition unavailable');
 const x=structuredClone(raw),started=clock(),scope=x.scope;
 // Validate the complete trusted context before spawning or creating a marker.
 const preliminary={version:1 as const,operationId:x.plan.id,intentDigest:witnessServiceDigest(x.plan),...scope,issuedAt:x.plan.now,expectedNativeDigest:witnessServiceDigest(x.plan.from),targetNativeDigest:witnessServiceDigest(x.plan.to),replayStateDigest:'0'.repeat(64),initialJournalDigest:'0'.repeat(64)};
 captureGateFinishContext({plan:x.plan,pin:x.pin,writerPrincipal:x.writerPrincipal,owner:x.owner,marker:preliminary,prepared:{status:'transition-finish-prepared',operationId:x.plan.id,scopeDigest:witnessServiceDigest(scope),targetDigest:preliminary.targetNativeDigest,challenge:randomBytes(32).toString('hex'),issuedAt:started,expiresAt:scope.expiresAt}});
 return open(x,external,clock,deadlineMs,started);
}
async function open(x:LocalTransitionSetup,external:AbortSignal,clock:()=>number,deadlineMs:number,started:number){
 const {root,scope,plan,pin,writerPrincipal,owner,databasePrincipal}=x;
 if(!int(started)||started<plan.now||started>=scope.expiresAt)throw Error('Local transition unavailable');
 const child=spawn('python3',[fileURLToPath(new URL('../../../../tools/operations/local_cvi_transition_port.py',import.meta.url))],{stdio:['pipe','pipe','pipe']});
 let buffer='',context:GateFinishContext|undefined,binding:GateFinishBinding|undefined,held=false,finished=false,busy=false,requestedFinish=false,last=started;
 let readyResolve!:()=>void,readyReject!:(e:Error)=>void,pending:undefined|{stage:string;resolve(v:any):void;reject(e:Error):void},reply:any,exitResolve!:()=>void;
 const ready=new Promise<void>((r,j)=>{readyResolve=r;readyReject=j;}),exit=new Promise<void>(r=>exitResolve=r);void ready.catch(()=>{});
 const hold=()=>{if(held||finished)return;held=true;readyReject(Error('Local transition held'));pending?.reject(Error('Local transition held'));child.kill('SIGKILL');};
 const now=()=>{const at=clock();if(held||finished||external.aborted||!int(at)||at<last||at>=scope.expiresAt){hold();throw Error('Local transition held');}last=at;return at;};
 const timer=setTimeout(hold,Math.min(deadlineMs,scope.expiresAt-started)),onAbort=()=>hold();external.addEventListener('abort',onAbort,{once:true});if(external.aborted)hold();
 child.stdout.on('data',data=>{buffer+=data.toString();if(Buffer.byteLength(buffer)>1048576)return hold();let i:number;
  while((i=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,i);buffer=buffer.slice(i+1);try{
   const m=JSON.parse(line);now();
   if(exact(m,['stage','marker','prepared'])&&m.stage==='ready'&&!context&&!pending){
    const candidate=captureGateFinishContext({marker:m.marker,prepared:m.prepared,plan,pin,writerPrincipal,owner});
    if(!same(gateFinishScope(candidate.marker),scope))throw Error();context=freeze(candidate);readyResolve();
   }else if(exact(m,['stage','result'])&&pending&&m.stage===pending.stage){
    if(m.stage==='finished'){if(reply)throw Error();reply=m.result;}
    else{const p=pending;pending=undefined;p.resolve(structuredClone(m.result));}
   }else throw Error();
  }catch{hold();}}
 });
 child.stderr.resume();child.stdin.on('error',hold);child.on('error',hold);child.on('close',code=>{
  clearTimeout(timer);external.removeEventListener('abort',onAbort);
  if(!held&&code===0&&binding&&requestedFinish&&pending?.stage==='finished'&&exact(reply,['status','operationId','scopeDigest','targetDigest'])&&reply.status==='transition-finished'&&reply.operationId===plan.id&&reply.scopeDigest===witnessServiceDigest(scope)&&reply.targetDigest===binding.marker.targetNativeDigest){
   try{now();if(buffer.length)throw Error();finished=true;pending.resolve(undefined);pending=undefined;}catch{hold();}
  }else hold();exitResolve();
 });
 const write=(v:unknown)=>{const encoded=JSON.stringify(v);if(Buffer.byteLength(encoded)>1048576)throw Error();child.stdin.write(encoded+'\n');};
 try{
  write({root,scope,intent:plan,context:{pin,writerPrincipal,owner},now:started,node:process.execPath,verifier:fileURLToPath(new URL('../../../../tools/operations/local-cvi-gate-finish-verifier.ts',import.meta.url))});await ready;now();
  const port=Object.freeze({status:'local-transition-gate' as const});
  const request=async(stage:string,command:string,value:unknown,s:AbortSignal)=>{
   if(busy||requestedFinish||s.aborted)throw Error('Local transition held');busy=true;
   const stop=()=>hold();s.addEventListener('abort',stop,{once:true});
   try{const at=now();if(s.aborted)throw Error();if(command==='finish')requestedFinish=true;
    const result=new Promise<any>((resolve,reject)=>{pending={stage,resolve,reject};});void result.catch(()=>{});write({command,now:at,value});return await result;
   }catch{hold();throw Error('Local transition held');}finally{busy=false;s.removeEventListener('abort',stop);}
  };
  controls.set(port,{binding:()=>{now();if(!binding)throw Error('Original deferred admission required');return binding;},bind:async(raw,s)=>{try{if(binding||busy||requestedFinish||!context)throw Error();const commit=claimOriginalDatabaseAdmission(raw,{authority:pin.authority,database:pin.database,principal:databasePrincipal,plan},now()),candidate=freeze(captureGateFinishBinding({...context,commit}));const result=await request('bound','bind',commit,s);now();if(!exact(result,['operationId','commitDigest'])||result.operationId!==plan.id||result.commitDigest!==witnessServiceDigest(commit))throw Error();binding=candidate;}catch{hold();throw Error('Original deferred admission unavailable');}},held:()=>held,close:async()=>{hold();await exit;},inspect:async(r,s)=>{
   try{if(!gateFinishJson(r)||!exact(r,['storeId','bindingDigest','challenge','now'])||r.storeId!==scope.storeId||r.bindingDigest!==scope.bindingDigest)throw Error();const value=await request('inspected','inspect',structuredClone(r),s);now();
    if(!exact(value,['operationId','scopeDigest','snapshot'])||value.operationId!==plan.id||value.scopeDigest!==witnessServiceDigest(scope)||value.snapshot.challenge!==r.challenge||value.snapshot.now!==r.now)throw Error();return value;
   }catch{hold();throw Error('Local transition inspection unavailable');}
  },finish:async(r,s)=>{try{if(!binding)throw Error();const at=now(),pack=claimLocalGateFinishInspection(r,binding!,at);verifyLocalGateFinishProof(binding!,pack,at);await request('finished','finish',pack,s);}catch{hold();throw Error('Local transition finish unavailable');}}});return port;
 }catch{hold();await exit;throw Error('Local transition unavailable');}
}
const original=(p:object)=>{const c=controls.get(p);if(!c)throw Error('Original transition gate required');return c;};
export const localTransitionFinishBinding=(p:LocalTransitionGate)=>original(p).binding();
export const bindLocalTransitionAdmission=(p:LocalTransitionGate,r:unknown,s:AbortSignal)=>original(p).bind(r,s);
export const inspectLocalTransitionGate=(p:LocalTransitionGate,r:ReplayInspectionRequest,s:AbortSignal)=>original(p).inspect(r,s);
export const finishLocalTransitionGate=(p:LocalTransitionGate,r:unknown,s:AbortSignal)=>original(p).finish(r,s);
export const closeLocalTransitionGate=(p:LocalTransitionGate)=>original(p).close();
export const localTransitionIsHeld=(p:LocalTransitionGate)=>original(p).held();
