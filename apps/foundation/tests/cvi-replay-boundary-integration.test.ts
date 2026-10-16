/** Actual disposable file journals and signed native transitions. No provider. */
import {it,expect,vi} from 'vitest';
import {startupAdmissionFixture} from './support/cvi-startup-admission-fixture.ts';
import {createLocalCviStartupOwner,continueLocalCviOwner} from '../src/server/local-cvi-startup-owner.ts';
import {createLocalDurableOwnerContinuation} from '../src/server/local-cvi-owner-continuation.ts';
import {cviCredentialDigests} from '../src/server/local-cvi-credentials.ts';
import {call} from './support/cvi-replay-process.ts';
const signal=()=>new AbortController().signal;
const rows=async(f:any)=>((await call(f.replayRoot,'inspect',{storeId:f.journal.storeId})) as any).records;
const reserve=(f:any,now=1000)=>f.rawReplay.reserve({storeId:f.journal.storeId,bindingDigest:cviCredentialDigests(f.resources.binding).bindingDigest,requestDigest:'e'.repeat(64),now},signal());
it('fresh coordinators retain a pending reservation and refuse before native admission',async()=>{
 const f=await startupAdmissionFixture();try{
  await reserve(f);const before=await rows(f),execute=vi.spyOn(f.ports,'execute');
  for(let n=0;n<2;n++){const c=f.make();expect(await c.start(signal())).toBeNull();expect(c.isHeld()).toBe(true);}
  expect(execute).not.toHaveBeenCalled();expect((await f.x.inspect()).revision).toBe(2);expect(await rows(f)).toEqual(before);expect(f.drafts()).toBe(0);
 }finally{await f.close();}
},30000);
it('pending evidence after committed admission holds without undoing the native commit',async()=>{
 const f=await startupAdmissionFixture();try{
  const execute=f.ports.execute;f.ports.execute=async(p,s)=>{const result=await execute(p,s);await reserve(f);return result;};
  const c=f.make();expect(await c.start(signal())).toBeNull();expect(c.isHeld()).toBe(true);
  expect((await f.x.inspect()).revision).toBe(4);expect((await rows(f))[0].status).toBe('reserved');expect(f.drafts()).toBe(0);
 }finally{await f.close();}
},30000);
it('pending evidence after credential proof prevents returning an owner',async()=>{
 const f=await startupAdmissionFixture();try{
  const check=f.resources.authority.check;f.resources.authority.check=async r=>{const result=await check(r);await reserve(f);return result;};
  const c=f.make();expect(await c.start(signal())).toBeNull();expect(c.isHeld()).toBe(true);
  expect((await f.x.inspect()).revision).toBe(4);expect((await rows(f))[0].status).toBe('reserved');expect(f.drafts()).toBe(0);
 }finally{await f.close();}
},30000);
it('strong startup requires the inspection port rather than a lower fallback',async()=>{
 const f=await startupAdmissionFixture();try{
  const resources={...f.resources,replay:{storeId:f.journal.storeId,reserve:f.resources.replay.reserve,consume:f.resources.replay.consume}};
  expect(()=>createLocalCviStartupOwner(f.expected,f.checkpoint,f.admission(),resources,()=>1000)).toThrow();expect((await f.x.inspect()).revision).toBe(2);
 }finally{await f.close();}
},30000);
it('a durable pending row blocks renewal even when this process has no unsettled flag',async()=>{
 const f=await startupAdmissionFixture();let owner:any;try{
  owner=await f.make().start(signal());expect(owner).not.toBeNull();await reserve(f);const before=await rows(f),renew=vi.fn(async()=>null);
  expect(await continueLocalCviOwner(owner,{renew},signal())).toBe(false);expect(renew).not.toHaveBeenCalled();expect(await rows(f)).toEqual(before);
  expect((await f.x.inspect()).revision).toBe(4);expect(f.drafts()).toBe(0);
 }finally{owner?.end();await f.close();}
},30000);
it('pending evidence after native renewal holds the adopted owner and preserves the commit',async()=>{
 let time=1000;const f=await startupAdmissionFixture(()=>time);let owner:any;try{
  owner=await createLocalCviStartupOwner(f.expected,f.checkpoint,f.admission(),f.resources,()=>time,5000,8000).start(signal());expect(owner).not.toBeNull();
  const old=structuredClone(f.nativeLease()),rotator=f.x.actors.find(a=>a.role==='rotator')!,reader=f.x.actors.find(a=>a.role==='observer')!,authority=f.x.authorityPort('rotator');
  const execute=vi.fn(async(p:any)=>{const result=await f.executeTracked(p);await reserve(f,time);return result;});
  const port=createLocalDurableOwnerContinuation(f.x.pin,old,cviCredentialDigests(f.resources.binding).bindingDigest,10000,{principalDigest:rotator.principalDigest,readerPrincipal:reader.principalDigest},{plan:a=>f.x.plan('renew',{lease:a.lease,ttl:a.ttl,token:a.token}),execute,read:n=>authority.read(n)},()=>time);
  time=1500;expect(await continueLocalCviOwner(owner,port,signal())).toBe(false);expect(execute).toHaveBeenCalledTimes(1);
  expect((await f.x.inspect()).revision).toBe(6);expect((await rows(f))[0].status).toBe('reserved');expect(f.drafts()).toBe(0);
  expect(await continueLocalCviOwner(owner,port,signal())).toBe(false);expect(execute).toHaveBeenCalledTimes(1);
 }finally{owner?.end();await f.close();}
},60000);
it('spent-only history survives fresh process inspection and startup',async()=>{
 const f=await startupAdmissionFixture();let owner:any;try{
  const receipt:any=await reserve(f);await f.rawReplay.consume(receipt,signal());const before=await rows(f);
  owner=await f.make().start(signal());expect(owner).not.toBeNull();expect(await rows(f)).toEqual(before);
  await expect(reserve(f)).rejects.toThrow();expect(await rows(f)).toEqual(before);
 }finally{owner?.end();await f.close();}
},30000);
