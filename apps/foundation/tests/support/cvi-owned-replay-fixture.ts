/** Actual signed handoffs and owner-guarded Python writes. Synthetic inputs only. */
import {vi} from 'vitest';
import {startupAdmissionFixture} from './cvi-startup-admission-fixture.ts';
import {ownerReplayCall} from './cvi-owner-replay-process.ts';
import {cviCredentialDigests} from '../../src/server/local-cvi-credentials.ts';
import {createLocalOwnedReplayPort} from '../../src/server/local-cvi-owned-replay.ts';
import {createLocalDurableOwnerContinuation} from '../../src/server/local-cvi-owner-continuation.ts';
export async function ownedReplayFixture(){
 let time=1000;const f=await startupAdmissionFixture(()=>time),digests=cviCredentialDigests(f.resources.binding);
 const scope={storeId:f.journal.storeId,nativeStoreId:f.x.pin.storeId,bindingDigest:digests.bindingDigest,applicationExpiresAt:f.resources.binding.expiresAt};
 const mutate=vi.fn(async(mode:any,lease:any,floor:number,input:any,s:AbortSignal)=>{
  const value=await ownerReplayCall(f,lease,mode,{...input,bindingDigest:digests.scopeDigest},{signal:s,config:{minimumRevision:floor}});return {...value,bindingDigest:input.bindingDigest};
 });
 const backend={inspect:f.resources.replay.inspect,mutate},make=()=>createLocalOwnedReplayPort({storeId:scope.storeId,nativeStoreId:scope.nativeStoreId,binding:f.resources.binding},backend,()=>time),port=make(),input=f.input(),permit=await f.admission().admit(input,new AbortController().signal);
 const continuationInput={owner:(permit as any).owner,operationId:(permit as any).after.operationId,revision:(permit as any).after.revision,bindingDigest:digests.bindingDigest,applicationExpiresAt:scope.applicationExpiresAt};
 const rotator=f.x.actors.find(a=>a.role==='rotator')!,reader=f.x.actors.find(a=>a.role==='observer')!,authority=f.x.authorityPort('rotator');
 const renewal=createLocalDurableOwnerContinuation(f.x.pin,f.nativeLease(),digests.bindingDigest,scope.applicationExpiresAt,{principalDigest:rotator.principalDigest,readerPrincipal:reader.principalDigest},{plan:a=>f.x.plan('renew',{lease:a.lease,ttl:a.ttl,token:a.token}),execute:p=>f.executeTracked(p),read:n=>authority.read(n)},()=>time);
 return {f,scope,port,make,permit,input,mutate,backend,renewal,continuationInput,request:(digest='c'.repeat(64))=>({storeId:scope.storeId,bindingDigest:scope.bindingDigest,requestDigest:digest,now:time}),at:(n:number)=>time=n,close:()=>f.close()};
}
