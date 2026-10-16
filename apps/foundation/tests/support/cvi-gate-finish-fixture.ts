/** Actual signed native inspection. Transaction labels remain fixture markers. */
import {readFile} from 'node:fs/promises';
import {createHash,randomBytes} from 'node:crypto';
import {startupAdmissionFixture} from './cvi-startup-admission-fixture.ts';
import {witnessServiceDigest} from '../../src/server/local-cvi-witness-service.ts';
import {gateFinishScope} from '../../src/server/local-cvi-gate-finish-proof.ts';
import type {GateFinishBinding} from '../../src/server/local-cvi-gate-finish-proof.ts';
export async function gateFinishFixture(){
 let time=1000;const f=await startupAdmissionFixture(()=>time,10000,true);let owner:any;
 try{
  owner=await f.make().start(new AbortController().signal);if(!owner)throw Error('Gate proof fixture startup held');
  const material=f.gateMaterial(),plan=f.lastPlan(),lease=f.nativeLease(),state=await f.x.inspect(),raw=await readFile(f.replayRoot+'/ledger.json'),journal=JSON.parse(raw.toString()),{clock,...stable}=journal;
  const marker={version:1 as const,operationId:plan.id,intentDigest:witnessServiceDigest(plan),storeId:f.journal.storeId,bindingDigest:material.physicalBindingDigest,nativeStoreId:f.x.pin.storeId,applicationExpiresAt:10000,expiresAt:5000,issuedAt:plan.now,expectedNativeDigest:witnessServiceDigest(plan.from),targetNativeDigest:witnessServiceDigest(plan.to),replayStateDigest:witnessServiceDigest(stable),initialJournalDigest:createHash('sha256').update(raw).digest('hex')};
  const prepared={status:'transition-finish-prepared' as const,operationId:plan.id,scopeDigest:witnessServiceDigest(gateFinishScope(marker)),targetDigest:marker.targetNativeDigest,challenge:randomBytes(32).toString('hex'),issuedAt:time,expiresAt:marker.expiresAt};
  const binding:GateFinishBinding={marker,prepared,plan,pin:{authority:material.pin.authority,database:material.pin.database,readerPrincipal:material.pin.readerPrincipal},writerPrincipal:material.writerPrincipal,owner:{storeId:lease.storeId,generation:lease.generation,ownerDigest:lease.ownerDigest,bootDigest:lease.bootDigest,expiresAt:lease.expiresAt,minimumRevision:state.revision},commit:{operationId:f.markerCopy().operationId,transactionId:f.markerCopy().transactionId,claimHash:f.markerCopy().claimHash}};
  return {f,material,binding,clock:()=>time,at:(n:number)=>time=n,make:()=>f.inspector(()=>time,binding),close:async()=>{owner.end();await f.close();}};
 }catch(e){owner?.end();await f.close();throw e;}
}
