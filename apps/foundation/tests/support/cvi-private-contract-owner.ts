/** TEST ONLY: private replay/envelope contracts, never the protected owner brand. */
import {createLocalCviStartupEnvelope} from '../../src/server/local-cvi-startup-envelope.ts';
import type {createLocalCviStartupOwner as ProtectedStartup} from '../../src/server/local-cvi-startup-owner.ts';
import {localCviOwnerIsIdle} from '../../src/server/local-cvi-endpoint.ts';
import type {OwnerContinuationPort} from '../../src/server/local-cvi-owner-continuation.ts';
import {isLocalOwnedReplayPort,localOwnedReplayMatches,claimLocalOwnedReplayStartup,bindLocalOwnedReplay,adoptLocalOwnedReplay,holdLocalOwnedReplay,localOwnedReplayState,localOwnedReplayExecutionContext} from '../../src/server/local-cvi-owned-replay.ts';
import {cviCredentialDigests} from '../../src/server/local-cvi-credentials.ts';
import {localGatedExecutionFinished} from '../../src/server/local-cvi-gated-execution.ts';
const owners=new WeakMap<object,{replay:object;renew:(p:OwnerContinuationPort,s:AbortSignal)=>Promise<boolean>}>();
export const isContractOwner=(o:object)=>{const r=owners.get(o);return !!r&&localOwnedReplayState(r.replay).bound;};
export async function continueContractOwner(o:object,p:OwnerContinuationPort,s:AbortSignal){const r=owners.get(o);return r&&isContractOwner(o)&&localCviOwnerIsIdle(o)?r.renew(p,s):false;}
export function createLocalCviStartupOwner(...a:Parameters<typeof ProtectedStartup>){
 const replay=a[3].replay;if(!isLocalOwnedReplayPort(replay)||localOwnedReplayState(replay).bound||localOwnedReplayState(replay).held)throw Error('Original private contract replay required');
 const controller=createLocalCviStartupEnvelope(a[0],a[1],a[2],a[3],a[4],a[5],a[6],{claim:()=>claimLocalOwnedReplayStartup(replay),bind:(raw,input)=>bindLocalOwnedReplay(replay,raw,input),adopt:(raw,input)=>adoptLocalOwnedReplay(replay,raw,input),hold:()=>holdLocalOwnedReplay(replay),execution:()=>localOwnedReplayExecutionContext(replay),ready:()=>{const c=localOwnedReplayExecutionContext(replay);return localOwnedReplayState(replay).bound&&(!c||localGatedExecutionFinished(c));},register:(owner,renew)=>{owners.set(owner,{replay,renew});}});
 if(!localOwnedReplayMatches(replay,{storeId:replay.storeId,nativeStoreId:a[0].storeId,...cviCredentialDigests(a[3].binding),applicationExpiresAt:a[3].binding.expiresAt}))throw Error('Private contract scope unavailable');return controller;
}

export {continueContractOwner as continueLocalCviOwner};
