import {localGatedExecutionBinding} from './local-cvi-gated-execution.ts';
import type {GateFinishBinding} from './local-cvi-gate-finish-proof.ts';
import {inspectOwnerContinuation,claimOwnerContinuationContext,inspectOwnerContinuationExecution} from './local-cvi-owner-continuation.ts';
import type {OwnerContinuationInput} from './local-cvi-owner-continuation.ts';
/** Local authenticated notebook/context composition. No route, extraction,
 * provider, profile write or note persistence. Authorize is a trusted app gate. */
import {createHash} from 'node:crypto';
import {StylingSession} from '../session/styling-session.ts';
import type {SessionSnapshot,SessionUpdate,UpdateResult} from '../session/styling-session.ts';
import {NotebookProposalStream} from '../session/proposal-stream.ts';
import type {Proposal,ProposalTurn} from '../session/proposal-stream.ts';
import {previewValue} from '../session/notebook-preview.ts';
import type {NotesRetentionPolicy} from '../session/notes-retention-policy.ts';
import {FIELDS} from '../../../../packages/style-contracts/src/index.ts';
import type {Field} from '../../../../packages/style-contracts/src/index.ts';
import {createLocalCviStyling} from './local-cvi-styling.ts';
import type {CviSnapshot,CviField,CviSimulationPorts} from './local-cvi-styling.ts';
import type {CurrentOwnerCheckpointPort} from './local-cvi-startup-owner.ts';
import type {StartupOwnerPin} from './local-cvi-startup-checkpoint.ts';
import type {VerifiedMediaAccess} from './media-read.ts';
const checkpointParents=new WeakMap<object,object>(),checkpointClocks=new WeakMap<object,()=>number>();
/** Only wrappers constructed here can identify their captured parent port. */
export const localNotebookCheckpointParent=(port:object)=>checkpointParents.get(port);
export const localNotebookCheckpointClock=(port:object)=>checkpointClocks.get(port);
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const int=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const hex=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
const map:Readonly<Record<Field,CviField>>=Object.freeze({occasion:'occasion',season:'timing',color:'color',style:'coverage',budget:'budget',lookType:'lookType',wardrobe:'wardrobe'});
export function createLocalCviNotebookContext(options:Readonly<{
 simulation:true;identity:VerifiedMediaAccess;authorize(request:Request,signal:AbortSignal):Promise<VerifiedMediaAccess|null>;
 checkpoint:CurrentOwnerCheckpointPort;ports:CviSimulationPorts;clock:()=>number;policy:NotesRetentionPolicy;deadlineMs?:number;
}>){
 const deadline=options.deadlineMs??8000;
 if(options?.simulation!==true||!uuid(options.identity?.ownerId)||!uuid(options.identity.sessionId)||typeof options.identity.isCurrent!=='function'||typeof options.authorize!=='function'||typeof options.checkpoint?.inspectFresh!=='function'||typeof options.checkpoint.inspectOwnerFresh!=='function'||typeof options.ports?.draft!=='function'||typeof options.ports.check!=='function'||typeof options.clock!=='function'||!int(deadline)||deadline<1||deadline>8000)throw Error('Local notebook context unavailable');
 const capturedCheckpoint=options.checkpoint,capturedClock=options.clock;
 const owner=options.identity.ownerId,authSession=options.identity.sessionId,currentIdentity=options.identity.isCurrent.bind(options.identity),authorize=options.authorize.bind(options),inspect=capturedCheckpoint.inspectFresh.bind(capturedCheckpoint),inspectOwner=capturedCheckpoint.inspectOwnerFresh.bind(capturedCheckpoint),inspectOwnerGated=capturedCheckpoint.inspectOwnerGatedFresh?.bind(capturedCheckpoint),draft=options.ports.draft.bind(options.ports),check=options.ports.check.bind(options.ports);
 const session=new StylingSession({simulation:true,owner,clock:capturedClock,policy:options.policy}),proposals=new NotebookProposalStream(session,owner);
 let flow:ReturnType<typeof createLocalCviStyling>|undefined,closed=false,admitted=0,cleanupAdmitted=0,native:StartupOwnerPin|undefined,nativeRevision=0,operation:string|undefined,inputRevision=0,proposalPending=false,proposalRevision=0,currentProposal:ProposalTurn|null=null,proposalAdmission=0,latestAuthorizedProposal=0;
 let transition:{signal:AbortSignal;done:Promise<boolean>;release(ok:boolean):void;candidate?:{raw:unknown;input:OwnerContinuationInput;owner:StartupOwnerPin;after:{operationId:string;revision:number}}}|undefined;
 const waitTransition=async(signal:AbortSignal)=>{if(!transition||signal===transition.signal)return true;const waiting=transition;let listener:(()=>void)|undefined;try{return await Promise.race([waiting.done,new Promise<boolean>(resolve=>{listener=()=>resolve(false);signal.addEventListener('abort',listener,{once:true});if(signal.aborted)resolve(false);})]);}finally{if(listener)signal.removeEventListener('abort',listener);}};
 const close=()=>{if(closed)return;closed=true;const ending=transition;transition=undefined;ending?.release(false);if(flow)flow.end();else session.end(owner);};
 const active=()=>!closed&&session.snapshot(owner)?.state==='active';
 const liveIdentity=async(signal:AbortSignal)=>{if(signal.aborted)return false;try{if(!active()){close();return false;}const live=await currentIdentity(signal);if(signal.aborted)return false;if(live!==true){close();return false;}return true;}catch{if(!signal.aborted)close();return false;}};
 const caller=async(request:Request,signal:AbortSignal)=>{if(signal.aborted||!await liveIdentity(signal))return false;try{const access=await authorize(request,signal);if(!access||access.ownerId!==owner||access.sessionId!==authSession||typeof access.isCurrent!=='function'||signal.aborted||await access.isCurrent(signal)!==true||signal.aborted)return false;return await liveIdentity(signal);}catch{return false;}};
 const bounded=async<T>(external:AbortSignal,work:(signal:AbortSignal)=>Promise<T>,cleanup=false):Promise<T|null>=>{
  if(external.aborted||closed||(cleanup?cleanupAdmitted>=1:admitted>=4))return null;if(cleanup)cleanupAdmitted++;else admitted++;
  const abort=new AbortController(),signal=AbortSignal.any([external,abort.signal]);let timer:ReturnType<typeof setTimeout>|undefined,onAbort:(()=>void)|undefined;
  const pending=Promise.resolve().then(()=>work(signal)).finally(()=>{if(cleanup)cleanupAdmitted--;else admitted--;});
  try{return await Promise.race([pending,new Promise<never>((_,reject)=>{onAbort=()=>reject(Error());signal.addEventListener('abort',onAbort,{once:true});timer=setTimeout(()=>abort.abort(),deadline);})]);}catch{return null;}finally{if(timer)clearTimeout(timer);if(onAbort)signal.removeEventListener('abort',onAbort);}
 };
 // The local authority journal uses nonblocking exclusive locks even for
 // authenticated read admissions. Serialize this context's inspections rather
 // than retrying unknown outcomes or racing its endpoint and transcript reads.
 let inspections=0,gated=0,inspectionTail:Promise<void>=Promise.resolve();
 const inspectSerial=async<T>(signal:AbortSignal,work:()=>Promise<T>):Promise<T>=>{
  if(transition&&signal!==transition.signal){if(gated+inspections>=7)throw Error('Context unavailable');gated++;try{while(transition&&signal!==transition.signal){if(!await waitTransition(signal))throw Error('Context unavailable');}}finally{gated--;}}
  if(signal.aborted||inspections+gated>=8)throw Error('Context unavailable');inspections++;
  const previous=inspectionTail;let release!:()=>void;inspectionTail=new Promise(r=>{release=r;});
  try{await previous;if(signal.aborted)throw Error('Context unavailable');return await work();}
  finally{inspections--;release();}
 };
 const observeNative=async(wanted:StartupOwnerPin,signal:AbortSignal,finish?:GateFinishBinding)=>{const pin=structuredClone(wanted);if(native&&Object.entries(native).some(([k,v])=>k!=='minimumRevision'&&(pin as any)[k]!==v))throw Error('Stale context pin');try{
    if(!await liveIdentity(signal))throw Error();
    if(finish&&!inspectOwnerGated)throw Error();const originalInspection=await(finish?inspectOwnerGated!(pin,finish,signal):inspectOwner(pin,signal));const r=structuredClone(originalInspection);if(!await liveIdentity(signal))throw Error();
    if(!exact(r,['status','revision','operationId','owner','permissions'])||r.status!=='owner-current'||!int(r.revision)||r.revision<pin.minimumRevision||r.revision<nativeRevision||!hex(r.operationId)||!exact(r.owner,['storeId','generation','ownerDigest','bootDigest','expiresAt'])||Object.entries(pin).some(([k,v])=>k!=='minimumRevision'&&(r.owner as Record<string,unknown>)[k]!==v)||!exact(r.permissions,['write','reconcile','sign','resume'])||Object.values(r.permissions).some(v=>v!==false))throw Error();
    if(native&&Object.entries(native).some(([k,v])=>k!=='minimumRevision'&&(pin as any)[k]!==v))throw Error();
    if(operation!==undefined&&r.revision===nativeRevision&&r.operationId!==operation)throw Error();
    const changed=r.revision!==nativeRevision||r.operationId!==operation;native=Object.freeze({...pin,minimumRevision:r.revision});nativeRevision=r.revision;operation=r.operationId;if(changed)flow?.interrupt();return finish?originalInspection:r;
   }catch{if(!signal.aborted)close();throw Error('Context unavailable');}};
 const checkpoint:CurrentOwnerCheckpointPort={
  inspectFresh:async signal=>{if(!await waitTransition(signal))throw Error('Context unavailable');return inspectSerial(signal,async()=>{if(!await liveIdentity(signal))throw Error('Context unavailable');const r=structuredClone(await inspect(signal));if(!await liveIdentity(signal))throw Error('Context unavailable');return r;});},
  inspectOwnerFresh:(wanted,signal)=>inspectSerial(signal,()=>observeNative(wanted,signal)),
  ...(inspectOwnerGated?{inspectOwnerGatedFresh:(wanted:StartupOwnerPin,finish:GateFinishBinding,signal:AbortSignal)=>inspectSerial(signal,()=>observeNative(wanted,signal,finish))}:{}),
  beginOwnerContinuation(signal){
   if(signal.aborted||!active()||!native)throw Error('Context unavailable');if(transition||inspections||gated)return null;
   let release!:(ok:boolean)=>void;const token={signal,done:new Promise<boolean>(r=>release=r),release:(ok:boolean)=>release(ok),candidate:undefined as {raw:unknown;input:OwnerContinuationInput;owner:StartupOwnerPin;after:{operationId:string;revision:number}}|undefined};transition=token;
   return Object.freeze({async inspect(raw:unknown,input:OwnerContinuationInput,s:AbortSignal,phase?:'fresh'|'gated-final'){
    if(transition!==token||s!==signal||s.aborted)throw Error('Context unavailable');
    const next=inspectOwnerContinuation(raw,input,capturedClock());
    if(!native||input.revision!==nativeRevision||input.operationId!==operation||Object.entries(native).some(([k,v])=>k!=='minimumRevision'&&(input.owner as any)[k]!==v)||token.candidate&&(token.candidate.raw!==raw||JSON.stringify(token.candidate.input)!==JSON.stringify(input)))throw Error('Context unavailable');
    const result=await inspectSerial(s,async()=>{if(!await liveIdentity(s))throw Error('Context unavailable');const active=phase==='gated-final'?inspectOwnerContinuationExecution(raw,input,capturedClock()):undefined;if(phase==='gated-final'&&(!active||!inspectOwnerGated))throw Error('Context unavailable');const originalInspection=await(active?inspectOwnerGated!(next.owner,localGatedExecutionBinding(active),s):inspectOwner(next.owner,s));if(!await liveIdentity(s)||transition!==token)throw Error('Context unavailable');return active?originalInspection:structuredClone(originalInspection);});
    token.candidate={raw,input:structuredClone(input),owner:next.owner,after:next.after};return result;
   },finish(raw:unknown,input:OwnerContinuationInput,s:AbortSignal){
    if(transition!==token||s!==signal||s.aborted||!active()||!token.candidate||token.candidate.raw!==raw||JSON.stringify(token.candidate.input)!==JSON.stringify(input))throw Error('Context unavailable');
    const accepted=claimOwnerContinuationContext(raw,input,capturedClock());if(JSON.stringify(accepted.owner)!==JSON.stringify(token.candidate.owner)||JSON.stringify(accepted.after)!==JSON.stringify(token.candidate.after))throw Error('Context unavailable');
    native=Object.freeze({...accepted.owner});nativeRevision=accepted.after.revision;operation=accepted.after.operationId;flow?.interrupt();transition=undefined;token.release(true);
   },cancel(){if(transition===token){transition=undefined;close();token.release(false);}}});
  },
 };
 Object.freeze(checkpoint);checkpointParents.set(checkpoint,capturedCheckpoint);checkpointClocks.set(checkpoint,capturedClock);
 const project=():CviSnapshot|null=>{
  const s=session.snapshot(owner);if(closed||!s||s.state!=='active')return null;
  return Object.freeze({revision:s.revision,context:Object.freeze({epoch:s.epoch,nativeRevision,inputRevision}),notes:Object.freeze(Object.fromEntries(FIELDS.map(([field])=>[map[field],Object.freeze({text:s.notes[field].value,confirmed:s.notes[field].status==='confirmed'})])) as CviSnapshot['notes'])});
 };
 const same=(a:CviSnapshot,b:CviSnapshot|null)=>!!b&&JSON.stringify(a)===JSON.stringify(b);
 const validContext=async(s:CviSnapshot,signal:AbortSignal)=>!proposalPending&&!!native&&await liveIdentity(signal)&&same(s,project());
 flow=createLocalCviStyling({draft:async(s,signal,conversation)=>{if(!await validContext(s,signal))throw Error('Context unavailable');const text=await(conversation?draft(s,signal,conversation):draft(s,signal));if(!await validContext(s,signal))throw Error('Context changed');return text;},check:async(text,s,signal,conversation)=>{if(!await validContext(s,signal))throw Error('Context unavailable');const result=await(conversation?check(text,s,signal,conversation):check(text,s,signal));if(!await validContext(s,signal))throw Error('Context changed');return result;}},deadline,{snapshot:project,subscribe:change=>session.subscribe(change),ready:()=>!proposalPending&&!!native&&active(),end:()=>{session.end(owner);}});
 const ready=async(signal:AbortSignal)=>{if(!native||!await liveIdentity(signal))return false;await inspectSerial(signal,async()=>{if(!native)throw Error('Context unavailable');await observeNative({...native,minimumRevision:nativeRevision},signal);});return active()&&!signal.aborted;};
 const admittedCaller=async(request:Request,signal:AbortSignal)=>await caller(request,signal)&&await ready(signal);
 return Object.freeze({flow,checkpoint,
  /** Internal cleanup observer. It cannot authorize a note update. */
  onReset(listener:()=>void){
   if(typeof listener!=='function')throw Error('Context observer unavailable');
   let previousEpoch=session.snapshot(owner)?.epoch,wasActive=true;
   return session.subscribe(()=>{const s=session.snapshot(owner),isActive=s?.state==='active';if(s?.epoch!==previousEpoch||wasActive&&!isActive){previousEpoch=s?.epoch;wasActive=isActive;try{listener();}catch{/* Observers cannot veto cleanup. */}}});
  },
  async snapshot(request:Request,signal:AbortSignal):Promise<SessionSnapshot|null>{return bounded(signal,async s=>await admittedCaller(request,s)?session.snapshot(owner):null);},
  async edit(request:Request,command:unknown,signal:AbortSignal):Promise<UpdateResult>{
   let captured:unknown;try{captured=structuredClone(command);}catch{return 'invalid';}
   const ticket=session.ticket(owner);if(!ticket)return 'unavailable';
   const result=await bounded(signal,async s=>{
    if(!await admittedCaller(request,s)||!session.isCurrent(owner,ticket))return 'unavailable' as const;
    if(!captured||typeof captured!=='object'||Array.isArray(captured))return 'invalid' as const;const c=captured as Record<string,unknown>;
    if(!['edit','confirm'].includes(String(c.action))||!exact(c,c.action==='edit'?['action','id','epoch','field','baseRevision','sequence','value']:['action','id','epoch','field','baseRevision','sequence'])||typeof c.id!=='string'||! /^[A-Za-z0-9_-]{1,80}$/.test(c.id)||!FIELDS.some(([f])=>f===c.field))return 'invalid' as const;
    const field=c.field as Field,snap=session.snapshot(owner)!,value=c.action==='confirm'?snap.notes[field].value:c.value;if(typeof value!=='string'||!value.trim())return 'invalid' as const;
    const normalized=previewValue(field,value);return session.update(owner,{id:'edit_'+createHash('sha256').update('local-cvi-notebook-edit-v1:'+c.id).digest('hex'),epoch:c.epoch,field,baseRevision:c.baseRevision,sequence:c.sequence,...normalized,origin:'touch',activity:'customer'} as SessionUpdate);
   });return result??'unavailable';
  },
  async beginProposal(request:Request,id:string,signal:AbortSignal):Promise<ProposalTurn|null>{if(!Number.isSafeInteger(proposalAdmission+1))return null;const ticket=session.ticket(owner),admission=++proposalAdmission;return bounded(signal,async s=>{if(!ticket||!await caller(request,s)||admission<latestAuthorizedProposal)return null;latestAuthorizedProposal=admission;if(!await ready(s)||admission!==latestAuthorizedProposal||!session.isCurrent(owner,ticket)||!Number.isSafeInteger(inputRevision+1))return null;const turn=proposals.begin(id);if(turn){currentProposal=turn;proposalRevision=0;proposalPending=true;inputRevision++;flow?.interrupt();}return turn;});},
  async refreshProposal(request:Request,handle:ProposalTurn,revision:number,signal:AbortSignal){
   return await bounded(signal,async s=>{
    if(!await admittedCaller(request,s)||handle!==currentProposal||handle.signal.aborted||!int(revision)||revision<=proposalRevision||!Number.isSafeInteger(inputRevision+1))return false;
    proposalRevision=revision;proposalPending=true;inputRevision++;flow?.interrupt();return true;
   })===true;
  },
  async acceptProposal(request:Request,handle:ProposalTurn,revision:number,values:readonly Proposal[],final:boolean,signal:AbortSignal){
   let captured:readonly Proposal[];try{captured=structuredClone(values);}catch{return null;}
   const ticket=session.ticket(owner);if(!ticket)return null;
   return bounded(signal,async s=>{if(!await admittedCaller(request,s)||!session.isCurrent(owner,ticket)||handle!==currentProposal||revision!==proposalRevision||!Array.isArray(captured)||captured.some(v=>!exact(v,['field','value'])))return null;const result=proposals.accept(handle,revision,captured,final);if(result.status==='accepted'){proposalPending=false;if(final)currentProposal=null;const snap=project();return Object.freeze({...result,version:snap?.context?Object.freeze({...snap.context,revision:snap.revision}):null});}return Object.freeze({...result,version:null});});
  },
  async clear(request:Request,signal:AbortSignal){return await bounded(signal,async s=>{if(!await caller(request,s)||!session.clear(owner))return false;proposalPending=false;return true;},true)===true;},
  async end(request:Request,signal:AbortSignal){return await bounded(signal,async s=>{if(!await caller(request,s))return false;close();return true;},true)===true;},
 });
}
