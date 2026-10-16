/** Mandatory private replay startup. No unbound activation fallback. */
import {localGatedExecutionFinished} from './local-cvi-gated-execution.ts';
import {localOwnedReplayExecutionContext} from './local-cvi-owned-replay.ts';
import {createLocalCviStartupEnvelope} from './local-cvi-startup-envelope.ts';
import {isLocalOwnedReplayPort,localOwnedReplayState,localOwnedReplayMatches,claimLocalOwnedReplayStartup,bindLocalOwnedReplay,adoptLocalOwnedReplay,holdLocalOwnedReplay} from './local-cvi-owned-replay.ts';
import {cviCredentialDigests} from './local-cvi-credentials.ts';
import {localCviOwnerIsIdle} from './local-cvi-endpoint.ts';
import type {CviReplayPort} from './local-cvi-endpoint.ts';
import type {CviCredentialBootAuthority} from './local-cvi-credentials.ts';
import type {OwnerCheckpointTransition,OwnerContinuationPort} from './local-cvi-owner-continuation.ts';
import type {GateFinishBinding} from './local-cvi-gate-finish-proof.ts';
import type {StartupOwnerPin} from './local-cvi-startup-checkpoint.ts';
import type {createLocalCviStyling} from './local-cvi-styling.ts';
const startedOwners=new WeakSet<object>();
const privateOwners=new WeakMap<object,object>();
const continuations=new WeakMap<object,(port:OwnerContinuationPort,signal:AbortSignal)=>Promise<boolean>>();
export async function continueLocalCviOwner(owner:object,port:OwnerContinuationPort,signal:AbortSignal){const renew=continuations.get(owner);return renew&&localCviOwnerIsIdle(owner)?renew(port,signal):false;}
const publicationReady=(port:object)=>{if(!localOwnedReplayState(port).bound)return false;const execution=localOwnedReplayExecutionContext(port);return !execution||localGatedExecutionFinished(execution);};
export const isLocalCviStartedOwner=(owner:object)=>startedOwners.has(owner)&&publicationReady(privateOwners.get(owner)??{});
export type CviCheckpointIdentity=Readonly<{storeId:string;operationId:string;revision:number}>;
export type FreshOwnerAdmissionInput=Readonly<{checkpoint:CviCheckpointIdentity;credentialStoreId:string;replayStoreId:string;previous:number;bootDigest:string;scopeDigest:string;bindingDigest:string;nonce:string;issuedAt:number;expiresAt:number}>;
/** Trusted server ports, never supplied by an HTTP body. Admission must be
 * durably spent before acknowledgment; this module cannot prove its storage. */
export interface FreshOwnerAdmissionPort {admit(input:FreshOwnerAdmissionInput,signal:AbortSignal):Promise<unknown>}
export interface FreshCheckpointPort {inspectFresh(signal:AbortSignal):Promise<unknown>}
export interface CurrentOwnerCheckpointPort extends FreshCheckpointPort {inspectOwnerFresh(owner:StartupOwnerPin,signal:AbortSignal):Promise<unknown>;inspectOwnerGatedFresh?(owner:StartupOwnerPin,binding:GateFinishBinding,signal:AbortSignal):Promise<unknown>;beginOwnerContinuation?(signal:AbortSignal):OwnerCheckpointTransition|null}
export function createLocalCviStartupOwner(
 expected:CviCheckpointIdentity,checkpoint:CurrentOwnerCheckpointPort,admission:FreshOwnerAdmissionPort,
 resources:Readonly<{binding:Readonly<{origin:string;conversation:string;secret:string;expiresAt:number}>;boot:Readonly<{storeId:string;previous:number;bootDigest:string}>;replay:CviReplayPort;authority:CviCredentialBootAuthority;makeFlow:()=>ReturnType<typeof createLocalCviStyling>}>,
 clock=Date.now,deadlineMs=8000,writerLeaseMs?:number,
){
 const privateReplay=resources?.replay;
 if(!privateReplay||!isLocalOwnedReplayPort(privateReplay)||localOwnedReplayState(privateReplay).bound||localOwnedReplayState(privateReplay).held)throw Error('Original private replay port required');
 const ready=()=>publicationReady(privateReplay);
 const controller=createLocalCviStartupEnvelope(expected,checkpoint,admission,resources,clock,deadlineMs,writerLeaseMs,{
  claim:()=>claimLocalOwnedReplayStartup(privateReplay),
  bind:(raw,input)=>bindLocalOwnedReplay(privateReplay,raw,input),
  adopt:(raw,input)=>adoptLocalOwnedReplay(privateReplay,raw,input),
  hold:()=>holdLocalOwnedReplay(privateReplay),
  execution:()=>localOwnedReplayExecutionContext(privateReplay),
  ready,
  register:(owner,renew)=>{if(!ready())throw Error('Private replay retired or gated execution unfinished');privateOwners.set(owner,privateReplay);continuations.set(owner,renew);startedOwners.add(owner);},
 });
 if(!localOwnedReplayMatches(privateReplay,{storeId:privateReplay.storeId,nativeStoreId:expected.storeId,...cviCredentialDigests(resources.binding),applicationExpiresAt:resources.binding.expiresAt})||localOwnedReplayState(privateReplay).held||localOwnedReplayState(privateReplay).bound)throw Error('Private replay scope unavailable');
 return controller;
}
