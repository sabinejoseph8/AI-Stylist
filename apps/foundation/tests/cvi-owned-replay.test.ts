/** Unbranded native/guard protocol contracts; genuine pair acceptance is tested separately. */
import {startupAdmissionFixture} from './support/cvi-startup-admission-fixture.ts';
import {ownerReplayCall} from './support/cvi-owner-replay-process.ts';
import {cviCredentialDigests} from '../src/server/local-cvi-credentials.ts';
import {createLocalCviStartupOwner,continueLocalCviOwner} from './support/cvi-private-contract-owner.ts';
import {createLocalDurableOwnerContinuation,inspectOwnerContinuation} from '../src/server/local-cvi-owner-continuation.ts';
import {it,expect,vi} from 'vitest';
import {ownedReplayFixture} from './support/cvi-owned-replay-fixture.ts';
import {bindLocalOwnedReplay,adoptLocalOwnedReplay,holdLocalOwnedReplay,localOwnedReplayState,isLocalOwnedReplayPort,createLocalOwnedReplayPort} from '../src/server/local-cvi-owned-replay.ts';
import {consumeOwnerContinuation} from '../src/server/local-cvi-owner-continuation.ts';
import type {CviReplayReceipt} from '../src/server/local-cvi-endpoint.ts';
const signal=()=>new AbortController().signal;
it('a genuine startup handoff binds once and never publishes its private lease',async()=>{const x=await ownedReplayFixture();try{
 expect(x.permit).not.toHaveProperty('token');expect(x.permit).not.toHaveProperty('lease');expect(await x.port.reserve(x.request(),signal())).toBeNull();expect(x.mutate).not.toHaveBeenCalled();
 bindLocalOwnedReplay(x.port,x.permit,x.input);expect(localOwnedReplayState(x.port)).toEqual({bound:true,held:false});
 const receipt=await x.port.reserve(x.request(),signal()) as CviReplayReceipt;expect(receipt.status).toBe('reserved');expect((await x.port.consume!(receipt,signal()) as CviReplayReceipt).status).toBe('spent');
 const other=x.make();expect(()=>bindLocalOwnedReplay(other,x.permit,x.input)).toThrow();expect(localOwnedReplayState(other).held).toBe(true);expect(localOwnedReplayState(x.port).bound).toBe(true);
 }finally{await x.close();}},30000);
it('JSON, cloned and altered public permits cannot reconstruct startup permission',async()=>{const x=await ownedReplayFixture();try{
 for(const copy of [JSON.parse(JSON.stringify(x.permit)),structuredClone(x.permit),{...(x.permit as any),authorizationId:'f'.repeat(64)}]){const p=x.make();expect(()=>bindLocalOwnedReplay(p,copy,x.input)).toThrow();expect(localOwnedReplayState(p).held).toBe(true);}
 expect(x.mutate).not.toHaveBeenCalled();bindLocalOwnedReplay(x.port,x.permit,x.input);expect(localOwnedReplayState(x.port).bound).toBe(true);
 }finally{await x.close();}},30000);
it('plain or copied ports have no private binding identity',async()=>{const x=await ownedReplayFixture();try{
 expect(isLocalOwnedReplayPort(x.port)).toBe(true);for(const p of [{...x.port},x.f.rawReplay]){expect(isLocalOwnedReplayPort(p)).toBe(false);expect(()=>bindLocalOwnedReplay(p,x.permit,x.input)).toThrow();}
 bindLocalOwnedReplay(x.port,x.permit,x.input);expect(x.mutate).not.toHaveBeenCalled();
 }finally{await x.close();}},30000);
it('an expired original handoff cannot bind a newly constructed port',async()=>{const x=await ownedReplayFixture();try{x.at(10000);expect(()=>bindLocalOwnedReplay(x.port,x.permit,x.input)).toThrow();expect(localOwnedReplayState(x.port).held).toBe(true);expect(x.mutate).not.toHaveBeenCalled();}finally{await x.close();}},30000);
it('renewal adoption requires the original already-consumed handoff',async()=>{const x=await ownedReplayFixture();try{
 bindLocalOwnedReplay(x.port,x.permit,x.input);x.at(1500);const raw=await x.renewal.renew(x.continuationInput,signal());
 consumeOwnerContinuation(raw,x.continuationInput,1500);adoptLocalOwnedReplay(x.port,raw,x.continuationInput);
 const receipt=await x.port.reserve(x.request(),signal()) as CviReplayReceipt;expect(receipt.status).toBe('reserved');await x.port.consume!(receipt,signal());
 const sent=x.mutate.mock.calls[0];expect(sent[1].expiresAt).toBe(9500);expect(sent[2]).toBe(6);expect(x.port).not.toHaveProperty('lease');
 expect(()=>adoptLocalOwnedReplay(x.port,raw,x.continuationInput)).toThrow();expect(localOwnedReplayState(x.port).held).toBe(true);
 }finally{await x.close();}},30000);
it('an unconsumed renewal cannot adopt a private lease',async()=>{const x=await ownedReplayFixture();try{
 bindLocalOwnedReplay(x.port,x.permit,x.input);x.at(1500);const raw=await x.renewal.renew(x.continuationInput,signal());expect(()=>adoptLocalOwnedReplay(x.port,raw,x.continuationInput)).toThrow();expect(x.mutate).not.toHaveBeenCalled();
 }finally{await x.close();}},30000);
it('a copied consumed renewal cannot reconstruct replay permission',async()=>{const x=await ownedReplayFixture();try{
 bindLocalOwnedReplay(x.port,x.permit,x.input);x.at(1500);const raw=await x.renewal.renew(x.continuationInput,signal());consumeOwnerContinuation(raw,x.continuationInput,1500);
 expect(()=>adoptLocalOwnedReplay(x.port,structuredClone(raw),x.continuationInput)).toThrow();expect(localOwnedReplayState(x.port).held).toBe(true);expect(x.mutate).not.toHaveBeenCalled();
 }finally{await x.close();}},30000);
it('pending original work prevents native replay adoption',async()=>{const x=await ownedReplayFixture();try{
 bindLocalOwnedReplay(x.port,x.permit,x.input);await x.port.reserve(x.request(),signal());x.at(1500);const raw=await x.renewal.renew(x.continuationInput,signal());consumeOwnerContinuation(raw,x.continuationInput,1500);
 expect(()=>adoptLocalOwnedReplay(x.port,raw,x.continuationInput)).toThrow();expect(localOwnedReplayState(x.port).held).toBe(true);
 }finally{await x.close();}},30000);
it('held original work cannot be rearmed by another public snapshot',async()=>{const x=await ownedReplayFixture();try{
 bindLocalOwnedReplay(x.port,x.permit,x.input);holdLocalOwnedReplay(x.port);expect(await x.port.reserve(x.request(),signal())).toBeNull();expect(()=>bindLocalOwnedReplay(x.port,x.permit,x.input)).toThrow();expect(x.mutate).not.toHaveBeenCalled();
 }finally{await x.close();}},30000);
it('consume requires this instance’s original reservation acknowledgment',async()=>{const x=await ownedReplayFixture();try{
 bindLocalOwnedReplay(x.port,x.permit,x.input);expect(await x.port.consume!({...x.request(),receipt:'fixture-receipt-'+'a'.repeat(32),status:'reserved'},signal())).toBeNull();expect(x.mutate).not.toHaveBeenCalled();
 }finally{await x.close();}},30000);
it('abort before backend invocation holds the original attempt without writing',async()=>{const x=await ownedReplayFixture();try{
 bindLocalOwnedReplay(x.port,x.permit,x.input);const c=new AbortController(),pending=x.port.reserve(x.request(),c.signal);c.abort();expect(await pending).toBeNull();expect(localOwnedReplayState(x.port).held).toBe(true);expect(x.mutate).not.toHaveBeenCalled();
 }finally{await x.close();}},30000);
it('scope substitution refuses before any private backend call',async()=>{const x=await ownedReplayFixture();try{
 bindLocalOwnedReplay(x.port,x.permit,x.input);expect(await x.port.reserve({...x.request(),bindingDigest:'f'.repeat(64)},signal())).toBeNull();expect(x.mutate).not.toHaveBeenCalled();
 }finally{await x.close();}},30000);

it('a different credential-bound session cap cannot adopt an original permit',async()=>{const x=await ownedReplayFixture();try{
 const p=createLocalOwnedReplayPort({storeId:x.scope.storeId,nativeStoreId:x.scope.nativeStoreId,binding:{...x.f.resources.binding,expiresAt:20000}},x.backend,()=>1000);
 expect(()=>bindLocalOwnedReplay(p,x.permit,x.input)).toThrow();expect(x.mutate).not.toHaveBeenCalled();bindLocalOwnedReplay(x.port,x.permit,x.input);
 }finally{await x.close();}},30000);

it('an actual endpoint retains private replay permission through original startup and renewal handoffs',async()=>{
 let time=1000;const f=await startupAdmissionFixture(()=>time),digests=cviCredentialDigests(f.resources.binding),original=f.resources.replay;let owner:any;
 const port=createLocalOwnedReplayPort({storeId:f.journal.storeId,nativeStoreId:f.x.pin.storeId,binding:f.resources.binding},{inspect:original.inspect!,mutate:async(mode,lease,floor,input,s)=>{
  const value=await ownerReplayCall(f,lease,mode,{...input,bindingDigest:digests.scopeDigest},{signal:s,config:{minimumRevision:floor}});return {...value,bindingDigest:input.bindingDigest};
 }},()=>time);
 try{
  const admission=f.admission();
  const checkpoint={...f.checkpoint,beginOwnerContinuation:()=>({inspect:async(raw:unknown,input:any,s:AbortSignal)=>f.checkpoint.inspectOwnerFresh(inspectOwnerContinuation(raw,input,time).owner,s),finish:()=>{},cancel:()=>holdLocalOwnedReplay(port)})};
  f.resources.replay=port as any;owner=await createLocalCviStartupOwner(f.expected,checkpoint,admission,f.resources,()=>time,8000,8000).start(signal());expect(owner).not.toBeNull();
  const request=(id:string)=>new Request(f.resources.binding.origin+'/v1/chat/completions',{method:'POST',headers:{authorization:'Bearer '+f.resources.binding.secret,'x-cvi-conversation':f.resources.binding.conversation,'x-cvi-request-id':id,'content-type':'application/json'},body:JSON.stringify({model:'local-simulation',stream:true,messages:[{role:'user',content:'Synthetic sleeves'}]})});
  const first=await owner.handle(request('fixture-private-before'));expect(first.status).toBe(200);await first.text();
  const rotator=f.x.actors.find(a=>a.role==='rotator')!,reader=f.x.actors.find(a=>a.role==='observer')!,authority=f.x.authorityPort('rotator');
  const renewal=createLocalDurableOwnerContinuation(f.x.pin,f.nativeLease(),digests.bindingDigest,10000,{principalDigest:rotator.principalDigest,readerPrincipal:reader.principalDigest},{plan:a=>f.x.plan('renew',{lease:a.lease,ttl:a.ttl,token:a.token}),execute:p=>f.executeTracked(p),read:n=>authority.read(n)},()=>time);
  time=1500;expect(await continueLocalCviOwner(owner,renewal,signal())).toBe(true);
  time=2000;const next=await owner.handle(request('fixture-private-after'));expect(next.status).toBe(200);expect(await next.text()).toContain('Synthetic checked output.');expect(localOwnedReplayState(port)).toEqual({bound:true,held:false});
  time=10000;expect((await owner.handle(request('fixture-private-expired'))).status).toBe(410);
 }finally{holdLocalOwnedReplay(port);owner?.end();await f.close();}
},60000);

it('native expiry refuses work while the credential-bound application cap is still valid',async()=>{const x=await ownedReplayFixture();try{
 bindLocalOwnedReplay(x.port,x.permit,x.input);x.at(8000);expect(await x.port.reserve(x.request(),signal())).toBeNull();expect(localOwnedReplayState(x.port).held).toBe(true);expect(x.mutate).not.toHaveBeenCalled();
 }finally{await x.close();}},30000);
