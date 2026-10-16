/** Unbranded native/guard protocol contracts; genuine pair acceptance is tested separately. */
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
/** Actual native locks, durable file writes and public-key authority checks. */
import {it,expect} from 'vitest';
import {startupAdmissionFixture} from './support/cvi-startup-admission-fixture.ts';
import {createLocalCviStartupOwner} from './support/cvi-private-contract-owner.ts';
import {ownerReplayCall,ownerReplayRequest} from './support/cvi-owner-replay-process.ts';
import {cviCredentialDigests} from '../src/server/local-cvi-credentials.ts';
import {mandatoryCall} from './support/cvi-mandatory-fixture.ts';
import {call} from './support/cvi-replay-process.ts';
const signal=()=>new AbortController().signal;
async function fixture(){
 let time=1000;const f=await startupAdmissionFixture(()=>time),owner=await createLocalCviStartupOwner(f.expected,f.checkpoint,f.admission(),f.resources,()=>time,7000,8000).start(signal());
 if(!owner){await f.close();throw Error('Startup held');}
 const lease=structuredClone(f.nativeLease());
 const rows=async()=>((await call(f.replayRoot,'inspect',{storeId:f.journal.storeId})) as any).records;
 const renew=async()=>{time=1500;const p=await f.x.plan('renew',{lease,ttl:8000,token:'f'.repeat(64)});return f.executeTracked(p);};
 return {f,owner,lease,rows,renew,at:(n:number)=>time=n,close:async()=>{owner.end();await f.close();}};
}
it('reserves and consumes under native locks with three fresh signed checks each',async()=>{const x=await fixture();try{
 const receipt=await ownerReplayCall(x.f,x.lease,'reserve',ownerReplayRequest(x.f));expect(receipt.status).toBe('reserved');
 expect((await ownerReplayCall(x.f,x.lease,'consume',receipt)).status).toBe('spent');expect((await x.rows())[0].status).toBe('spent');expect((await x.f.x.inspect()).revision).toBe(4);
 }finally{await x.close();}},30000);
it.each(['reserve','consume'])('an old worker cannot %s after same-generation renewal',async mode=>{const x=await fixture();try{
 let request=ownerReplayRequest(x.f);if(mode==='consume')request=await ownerReplayCall(x.f,x.lease,'reserve',request);
 const before=await x.rows();const beforePin={storeId:x.lease.storeId,generation:x.lease.generation,ownerDigest:x.lease.ownerDigest,bootDigest:x.lease.bootDigest,expiresAt:x.lease.expiresAt,minimumRevision:4};expect((await x.f.checkpoint.inspectOwnerFresh(beforePin,signal())).status).toBe('owner-current');await x.renew();request={...request,now:1500};
 await expect(ownerReplayCall(x.f,x.lease,mode,request)).rejects.toThrow();expect(await x.rows()).toEqual(before);expect((await x.f.x.inspect()).revision).toBe(6);
 }finally{await x.close();}},30000);
it('pending authority intent prevents a replay write before the native transition commits',async()=>{const x=await fixture();try{
 x.at(1500);const p=await x.f.x.plan('renew',{lease:x.lease,ttl:8000,token:'e'.repeat(64)});await x.f.x.authorityPort('rotator').advance(p);
 await expect(ownerReplayCall(x.f,x.lease,'reserve',ownerReplayRequest(x.f,1500))).rejects.toThrow();expect(await x.rows()).toHaveLength(0);expect((await x.f.x.inspect()).pending).toBe(p.id);
 }finally{await x.close();}},30000);
it.each(['signature','cached','reader','revision'])('a %s proof cannot select an unsigned or stale fallback',async mode=>{const x=await fixture();try{
 const port=x.f.x.authorityPort('rotator');let cached:any;
 const read=async(n:string)=>{if(mode==='cached')return cached??(cached=await port.read(n));const e=await port.read(n);return mode==='signature'?{...e,reply:{...e.reply,signature:'0'.repeat(128)}}:e;};
 const config=mode==='reader'?{readerPrincipal:x.f.x.actors.find(a=>a.role==='rotator')!.principalDigest}:mode==='revision'?{minimumRevision:5}:{};
 await expect(ownerReplayCall(x.f,x.lease,'reserve',ownerReplayRequest(x.f),{read,config})).rejects.toThrow();expect(await x.rows()).toHaveLength(0);
 }finally{await x.close();}},30000);
it('unknown final proof retains a saved reservation without retry or refund',async()=>{const x=await fixture();try{
 const port=x.f.x.authorityPort('rotator');
 await expect(ownerReplayCall(x.f,x.lease,'reserve',ownerReplayRequest(x.f),{read:(n,i)=>{if(i===3)throw Error('Simulated loss');return port.read(n);}})).rejects.toThrow();
 const before=await x.rows();expect(before[0].status).toBe('reserved');await expect(ownerReplayCall(x.f,x.lease,'reserve',ownerReplayRequest(x.f))).rejects.toThrow();expect(await x.rows()).toEqual(before);
 }finally{await x.close();}},30000);
it('cancellation after saving leaves a pending reservation across another process',async()=>{const x=await fixture();try{
 const controller=new AbortController(),port=x.f.x.authorityPort('rotator');
 await expect(ownerReplayCall(x.f,x.lease,'reserve',ownerReplayRequest(x.f),{signal:controller.signal,read:async(n,i)=>{if(i===3){controller.abort();throw Error('Canceled before final read');}return port.read(n);}})).rejects.toThrow();
 expect((await x.rows())[0].status).toBe('reserved');
 }finally{await x.close();}},30000);
it('a native write competing during the locked signed read is refused',async()=>{const x=await fixture();try{
 const p=await x.f.x.plan('renew',{lease:x.lease,ttl:8000,token:'e'.repeat(64)}).catch(()=>null);
 // At the same issue time renewal cannot extend expiry, so use a fenced target.
 const plan=p??await x.f.x.fencing(x.lease.generation),port=x.f.x.authorityPort('rotator');let attempts=0;
 const receipt=await ownerReplayCall(x.f,x.lease,'reserve',ownerReplayRequest(x.f),{read:async(n,i)=>{
  if(i===1){attempts++;await expect(mandatoryCall({root:x.f.x.root,mode:'plan',config:x.f.x.config,actor:plan.actor,kind:plan.kind,args:plan.args})).rejects.toThrow();}
  return port.read(n);
 }});expect(receipt.status).toBe('reserved');expect(attempts).toBe(1);expect((await x.f.x.inspect()).revision).toBe(4);
 }finally{await x.close();}},30000);
it.each(['pending','ledger','checkpoint'])('a %s crash preserves unknown write evidence without repair',async crashAt=>{const x=await fixture();try{
 await expect(ownerReplayCall(x.f,x.lease,'reserve',ownerReplayRequest(x.f),{crashAt})).rejects.toThrow();
 await expect(ownerReplayCall(x.f,x.lease,'reserve',ownerReplayRequest(x.f))).rejects.toThrow();expect((await x.f.x.inspect()).revision).toBe(4);
 }finally{await x.close();}},30000);

it('the disabled endpoint uses the original private lease through a guarded replay port',async()=>{
 const f=await startupAdmissionFixture();let owner:any;try{
  owner=await createLocalCviStartupOwner(f.expected,f.checkpoint,f.admission(),f.resources,()=>1000,7000,8000).start(signal());expect(owner).not.toBeNull();
  const request=new Request(f.resources.binding.origin+'/v1/chat/completions',{method:'POST',headers:{authorization:'Bearer '+f.resources.binding.secret,'x-cvi-conversation':f.resources.binding.conversation,'x-cvi-request-id':'fixture-guarded-replay','content-type':'application/json'},body:JSON.stringify({model:'local-simulation',stream:true,messages:[{role:'user',content:'Synthetic long sleeves'}]})});
  const response=await owner.handle(request);expect(response.status).toBe(200);expect(await response.text()).toContain('Synthetic checked output.');
  const records:any=await call(f.replayRoot,'inspect',{storeId:f.journal.storeId});expect(records.records).toHaveLength(1);expect(records.records[0].status).toBe('spent');expect((await f.x.inspect()).revision).toBe(4);
 }finally{owner?.end();await f.close();}
},30000);

it('changed native history cannot hide behind an unchanged generation and head',async()=>{const x=await fixture();try{
 const before=await x.f.snapshot();
 execFileSync('python3',['-c',"import sqlite3,sys; db=sqlite3.connect(sys.argv[1]); db.execute('UPDATE history SET observed=1001 WHERE id=1'); db.commit(); db.close()",join(x.f.x.root,'history.sqlite')]);
 const changed=await x.f.snapshot();expect(changed.gate[0][2]).toBe(before.gate[0][2]);expect(changed.history[0][1]).toBe(before.history[0][1]);
 x.at(1001);await expect(ownerReplayCall(x.f,x.lease,'reserve',ownerReplayRequest(x.f,1001))).rejects.toThrow();expect(await x.rows()).toHaveLength(0);
 }finally{await x.close();}},30000);
