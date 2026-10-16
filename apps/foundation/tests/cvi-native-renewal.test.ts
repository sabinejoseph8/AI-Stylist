/** Unbranded native/guard protocol contracts; genuine pair acceptance is tested separately. */
import {it,expect} from 'vitest';
import {randomBytes} from 'node:crypto';
import {mandatoryFixture} from './support/cvi-mandatory-fixture.ts';
import {fullStateMetadata} from '../src/server/local-cvi-full-state-reconciliation.ts';
import {mandatoryCall} from './support/cvi-mandatory-fixture.ts';
const signal=()=>new AbortController().signal;
async function fixture(){
 let time=1000;const x=await mandatoryFixture(undefined,()=>time);
 const first=await x.activation(),lease:any=await x.adapter('rotator').execute(first,signal());
 const renewal=()=>x.plan('renew',{lease,ttl:8000,token:randomBytes(32).toString('hex')});
 return {x,lease,renewal,at:(n:number)=>{time=n;},execute:(p:any)=>x.adapter('rotator').execute(p,signal()) as Promise<any>};
}
it('renewal uses signed advance, claimed execution and reconciled full native state',async()=>{const f=await fixture();try{
 f.at(1500);const p=await f.renewal();expect(p.from.epochFloor).toBe(p.to.epochFloor);expect(p.from.historyDigest).not.toBe(p.to.historyDigest);
 const r=await f.execute(p);expect(r.token).toBe(p.args.token);expect(r.token).not.toBe(f.lease.token);expect(r.expiresAt).toBe(9500);expect(r.generation).toBe(f.lease.generation);
 expect(await f.x.observe()).toEqual(p.to);expect((await f.x.inspect()).pending).toBeNull();expect((await f.x.inspect()).operations).toHaveLength(2);
 const full=await mandatoryCall({root:f.x.root,mode:'full-observe',config:f.x.config});expect(fullStateMetadata(full)).toEqual(p.to);
 await expect(f.renewal()).rejects.toThrow();await expect(f.execute(p)).rejects.toThrow();
 }finally{await f.x.close();}},30000);
it.each(['writer','fencer','signer'] as const)('signed %s cannot authorize a renewal',async role=>{const f=await fixture();try{
 f.at(1500);const p=await f.renewal(),before=await f.x.inspect();await expect(f.x.service().handle(f.x.request(role,'advance',p.id,before.revision),signal())).rejects.toThrow();
 expect(await f.x.observe()).toEqual(p.from);expect((await f.x.inspect()).requests).toHaveLength(before.requests.length);
 }finally{await f.x.close();}},30000);
it.each(['before-commit','after-commit'])('renewal %s crash never rearms its original plan',async stage=>{const f=await fixture();try{
 f.at(1500);const p=await f.renewal();f.x.setCrash(stage);await expect(f.execute(p)).rejects.toThrow();f.x.setCrash(undefined);
 expect(await f.x.observe()).toEqual(stage==='before-commit'?p.from:p.to);expect((await f.x.inspect()).pending).toBe(p.id);
 if(stage==='after-commit'){await f.x.recover(p);expect((await f.x.inspect()).pending).toBeNull();}
 await expect(f.execute(p)).rejects.toThrow();
 }finally{await f.x.close();}},30000);
it('one-sided database rollback after renewal is refused by current authority',async()=>{const f=await fixture();try{
 f.at(1500);const old=await f.x.dbSnapshot(),p=await f.renewal();await f.execute(p);await f.x.dbRestore(old);
 const replacement=await f.renewal();await expect(f.execute(replacement)).rejects.toThrow();expect((await f.x.inspect()).current).toEqual(p.to);
 }finally{await f.x.close();}},30000);
it('an expired original grant cannot even produce a renewal plan',async()=>{const f=await fixture();try{f.at(2000);await expect(f.renewal()).rejects.toThrow();expect((await f.x.inspect()).operations).toHaveLength(1);}finally{await f.x.close();}},30000);
it('lost reconciliation holds a committed renewal without restoring old token or retry permission',async()=>{const f=await fixture();try{
 f.at(1500);const p=await f.renewal();f.x.setDenyReconcile(true);await expect(f.execute(p)).rejects.toThrow();
 expect(await f.x.observe()).toEqual(p.to);expect((await f.x.inspect()).pending).toBe(p.id);await expect(f.renewal()).rejects.toThrow();
 f.x.setDenyReconcile(false);await f.x.recover(p);await expect(f.execute(p)).rejects.toThrow();
 }finally{await f.x.close();}},30000);
it('competing renewal plans cannot commit from the same original grant',async()=>{const f=await fixture();try{
 f.at(1500);const first=await f.renewal(),second=await f.renewal();expect(first.from).toEqual(second.from);expect(first.id).not.toBe(second.id);
 await f.execute(first);await expect(f.execute(second)).rejects.toThrow();expect(await f.x.observe()).toEqual(first.to);expect((await f.x.inspect()).operations).toHaveLength(2);
 }finally{await f.x.close();}},30000);
it('a stale signed read leaves the original native grant unchanged and authority pending',async()=>{const f=await fixture();try{
 f.at(1500);const p=await f.renewal();f.x.setReplayRead(true);await expect(f.execute(p)).rejects.toThrow();
 expect(await f.x.observe()).toEqual(p.from);expect((await f.x.inspect()).pending).toBe(p.id);await expect(f.execute(p)).rejects.toThrow();
 }finally{await f.x.close();}},30000);
it('altering a planned renewal token refuses before authority admission',async()=>{const f=await fixture();try{
 f.at(1500);const p=await f.renewal(),before=await f.x.inspect();await expect(f.execute({...p,args:{...p.args,token:'f'.repeat(64)}})).rejects.toThrow();
 expect(await f.x.observe()).toEqual(p.from);expect((await f.x.inspect()).requests).toHaveLength(before.requests.length);
 }finally{await f.x.close();}},30000);
it('an existing composed owner cannot silently adopt a renewed native grant',async()=>{
 let time=1000;const {startupAdmissionFixture}=await import('./support/cvi-startup-admission-fixture.ts'),{createLocalCviStartupOwner}=await import('./support/cvi-private-contract-owner.ts');
 // Fresh signed operations over one resident test transport, without proof
 // caching or changes to the original five-second startup/eight-second lease.
 const f=await startupAdmissionFixture(()=>time,10000,true);try{
  const owner=await createLocalCviStartupOwner(f.expected,f.checkpoint,f.admission(),f.resources,()=>time,5000,8000).start(signal());expect(owner).not.toBeNull();
  const old=f.nativeLease();time=8500;const p=await f.x.plan('renew',{lease:old,ttl:8000,token:randomBytes(32).toString('hex')}),updated:any=await f.x.adapter('rotator').execute(p,signal());
  expect(updated.expiresAt).toBe(10000);expect(updated.generation).toBe(old.generation);
  const request=new Request(f.resources.binding.origin+'/v1/chat/completions',{method:'POST',headers:{authorization:'Bearer '+f.resources.binding.secret,'x-cvi-conversation':f.resources.binding.conversation,'x-cvi-request-id':'fixture-no-implicit-renewal','content-type':'application/json'},body:JSON.stringify({model:'local-simulation',stream:true,messages:[{role:'user',content:'Synthetic'}]})});
  expect((await owner!.handle(request)).status).toBe(409);expect(f.drafts()).toBe(0);owner!.end();
 }finally{await f.close();}
},60000);
