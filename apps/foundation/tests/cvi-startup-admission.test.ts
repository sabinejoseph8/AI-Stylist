import {it,expect,vi} from 'vitest';
import {startupAdmissionFixture} from './support/cvi-startup-admission-fixture.ts';
import {fixtureRequest,makeEndpoint} from './support/cvi-credential-process.ts';
import {witnessServiceDigest} from '../src/server/local-cvi-witness-service.ts';
import {createLocalDurableStartupAdmission} from '../src/server/local-cvi-startup-admission.ts';
import {fullStateMetadata} from '../src/server/local-cvi-full-state-reconciliation.ts';
const signal=()=>new AbortController().signal;
it('commits authenticated admission and inspects the actual new full state before returning a fresh endpoint',async()=>{const f=await startupAdmissionFixture();try{
 const e=await f.make().start(signal());expect(e).not.toBeNull();const a=await f.x.inspect();expect(a.revision).toBe(4);expect(a.pending).toBeNull();expect(fullStateMetadata(await f.snapshot())).toEqual(f.lastPlan().to);expect(a.current).toEqual(f.lastPlan().to);
 const checked:any=await f.checkpoint.inspectFresh(signal());expect(checked.operationId).toBe(f.lastPlan().id);expect(checked.revision).toBe(4);expect(checked.permissions.resume).toBe(false);
 const r=await e!.handle(fixtureRequest(f.resources.binding.secret,'fixture-admitted'));expect(r.status).toBe(200);expect(await r.text()).toContain('Synthetic checked output.');e!.end();
 const old=makeEndpoint(f.credential,f.replayRoot,f.journal.storeId,f.oldLease);expect((await old.endpoint.handle(fixtureRequest())).status).toBe(409);old.endpoint.end();
}finally{await f.close();}},20000);
it('lost admission acknowledgment remains committed and refuses fresh-object replay',async()=>{const f=await startupAdmissionFixture();try{
 const execute=f.ports.execute;f.ports.execute=async(p,s)=>{await execute(p,s);throw Error('Lost acknowledgment');};expect(await f.make().start(signal())).toBeNull();expect((await f.x.inspect()).revision).toBe(4);expect((await f.x.inspect()).pending).toBeNull();
 f.ports.execute=execute;await expect(f.admission().admit(f.input(),signal())).rejects.toThrow();expect(await f.make().start(signal())).toBeNull();expect(f.drafts()).toBe(0);
}finally{await f.close();}},20000);
it('a crash after database COMMIT preserves the execution claim and holds admission pending',async()=>{const f=await startupAdmissionFixture();try{
 f.x.setCrash('after-commit');expect(await f.make().start(signal())).toBeNull();const a=await f.x.inspect();expect(a.pending).toBe(f.lastPlan().id);expect(a.revision).toBe(3);expect(fullStateMetadata(await f.snapshot())).toEqual(f.lastPlan().to);
 f.x.setCrash(undefined);await expect(f.admission().admit(f.input(),signal())).rejects.toThrow();expect(await f.make().start(signal())).toBeNull();expect(f.drafts()).toBe(0);
}finally{await f.close();}},20000);
it('credential activation failure after admission does not roll back the committed full-state transition',async()=>{const f=await startupAdmissionFixture();try{
 f.resources.authority.activate=async()=>{throw Error('Unavailable credential store');};expect(await f.make().start(signal())).toBeNull();expect((await f.x.inspect()).revision).toBe(4);expect(fullStateMetadata(await f.snapshot())).toEqual(f.lastPlan().to);expect(f.drafts()).toBe(0);
 await expect(f.admission().admit(f.input(),signal())).rejects.toThrow();
 // Negative boundary: the disconnected legacy credential-only path does not
 // consult the full-state owner. Separate-store atomicity is NOT proven.
 const old=makeEndpoint(f.credential,f.replayRoot,f.journal.storeId,f.oldLease),r=await old.endpoint.handle(fixtureRequest(undefined,'fixture-gap'));expect(r.status).toBe(200);await r.text();old.endpoint.end();
}finally{await f.close();}},20000);
it('refuses a changed incoming scope before planning or spending admission',async()=>{const f=await startupAdmissionFixture();try{const plan=vi.spyOn(f.ports,'plan');await expect(f.admission().admit({...f.input(),replayStoreId:f.scope.credentialStoreId},signal())).rejects.toThrow();expect(plan).not.toHaveBeenCalled();expect((await f.x.inspect()).revision).toBe(2);}finally{await f.close();}},20000);

it.each(['owner','token','boot','from','actor'])('refuses a substituted %s plan before execution',async mode=>{const f=await startupAdmissionFixture();try{
 const plan=f.ports.plan,execute=vi.spyOn(f.ports,'execute');f.ports.plan=async(i,s)=>{const p=structuredClone(await plan(i,s));if(mode==='owner')p.args.owner='0'.repeat(64);if(mode==='token')p.args.token='0'.repeat(64);if(mode==='boot')p.args.boot='0'.repeat(64);if(mode==='from')p.from.historyDigest='0'.repeat(64);if(mode==='actor')(p.actor as any).role='writer';return p;};
 await expect(f.admission().admit(f.input(),signal())).rejects.toThrow();expect(execute).not.toHaveBeenCalled();expect((await f.x.inspect()).revision).toBe(2);
}finally{await f.close();}},20000);
it('a forged final signed read holds a successfully committed admission',async()=>{const f=await startupAdmissionFixture();try{
 const execute=f.ports.execute;f.ports.execute=async(p,s)=>{const result=await execute(p,s);f.x.setTamperRead(true);return result;};const admission=f.admission();await expect(admission.admit(f.input(),signal())).rejects.toThrow();expect(admission.isHeld()).toBe(true);expect((await f.x.inspect()).revision).toBe(4);f.x.setTamperRead(false);await expect(f.admission().admit(f.input(),signal())).rejects.toThrow();
}finally{await f.close();}},20000);
it('a replayed signed read cannot stand in for a fresh challenge',async()=>{const f=await startupAdmissionFixture();try{
 const old=await f.ports.read('e'.repeat(64),signal());f.ports.read=async()=>old;const plan=vi.spyOn(f.ports,'plan');await expect(f.admission().admit(f.input(),signal())).rejects.toThrow();expect(plan).not.toHaveBeenCalled();expect((await f.x.inspect()).revision).toBe(2);
}finally{await f.close();}},20000);
it('a changed baseline is refused before planning a new owner',async()=>{const f=await startupAdmissionFixture();try{
 const fence=await f.x.fencing(1);await f.x.adapter('fencer').execute(fence,signal());const plan=vi.spyOn(f.ports,'plan');await expect(f.admission().admit(f.input(),signal())).rejects.toThrow();expect(plan).not.toHaveBeenCalled();expect((await f.x.inspect()).revision).toBe(4);
}finally{await f.close();}},20000);
it('a substituted committed lease cannot authorize startup or refund admission',async()=>{const f=await startupAdmissionFixture();try{
 const execute=f.ports.execute;f.ports.execute=async(p,s)=>({...await execute(p,s) as object,token:'0'.repeat(64)});await expect(f.admission().admit(f.input(),signal())).rejects.toThrow();expect((await f.x.inspect()).revision).toBe(4);f.ports.execute=execute;await expect(f.admission().admit(f.input(),signal())).rejects.toThrow();
}finally{await f.close();}},20000);
it('rollback before COMMIT retains the authority execution claim and refuses replay',async()=>{const f=await startupAdmissionFixture();try{
 f.x.setCrash('before-commit');await expect(f.admission().admit(f.input(),signal())).rejects.toThrow();expect((await f.x.inspect()).revision).toBe(3);expect((await f.x.inspect()).pending).toBe(f.lastPlan().id);expect(fullStateMetadata(await f.snapshot())).toEqual(f.baseline);f.x.setCrash(undefined);await expect(f.admission().admit(f.input(),signal())).rejects.toThrow();expect(f.drafts()).toBe(0);
}finally{await f.close();}},20000);
it('cancellation after durable admission cannot return a late acknowledgment',async()=>{const f=await startupAdmissionFixture();try{
 let committed!:()=>void,release!:()=>void;const done=new Promise<void>(r=>committed=r),delayed=new Promise<void>(r=>release=r),execute=f.ports.execute;
 f.ports.execute=async(p,s)=>{const result=await execute(p,s);committed();await delayed;return result;};const c=new AbortController(),admission=f.admission(),pending=admission.admit(f.input(),c.signal);await done;c.abort();await expect(pending).rejects.toThrow();release();await new Promise(r=>setTimeout(r,10));expect(admission.isHeld()).toBe(true);expect((await f.x.inspect()).revision).toBe(4);f.ports.execute=execute;await expect(f.admission().admit(f.input(),signal())).rejects.toThrow();
}finally{await f.close();}},20000);

it('binds the complete admission input into committed owner history and refuses second use',async()=>{const f=await startupAdmissionFixture();try{const input=f.input(),admission=f.admission(),r:any=await admission.admit(input,signal());expect(r.input).toEqual(input);expect(r.after).toEqual({storeId:f.x.pin.storeId,operationId:f.lastPlan().id,revision:4});const snapshot=await f.snapshot();expect(snapshot.grants[1][1]).toBe(witnessServiceDigest(input));expect(snapshot.grants[0][6]).toBe('retired');expect(snapshot.grants[1][6]).toBe('active');await expect(admission.admit(input,signal())).rejects.toThrow();await expect(f.admission().admit({...input,nonce:'5'.repeat(64)},signal())).rejects.toThrow();}finally{await f.close();}},20000);
it('missing durable execution port cannot select a raw fallback',async()=>{const f=await startupAdmissionFixture();try{const actor={principalDigest:f.x.actors.find(a=>a.role==='rotator')!.principalDigest,readerPrincipal:f.x.actors.find(a=>a.role==='observer')!.principalDigest};expect(()=>createLocalDurableStartupAdmission(f.x.pin,f.scope,f.baseline,actor,{...f.ports,execute:undefined} as any,()=>1000)).toThrow();expect((await f.x.inspect()).revision).toBe(2);}finally{await f.close();}},20000);

it('rechecks the signed read deadline immediately before acknowledging admission',async()=>{const f=await startupAdmissionFixture();try{let reads=0;const admission=f.admission(()=>++reads>=6?4000:1000);await expect(admission.admit(f.input(),signal())).rejects.toThrow();expect(reads).toBe(6);expect(admission.isHeld()).toBe(true);expect((await f.x.inspect()).revision).toBe(4);await expect(f.admission().admit(f.input(),signal())).rejects.toThrow();}finally{await f.close();}},20000);
