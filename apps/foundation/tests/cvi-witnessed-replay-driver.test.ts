/** Concrete fixed driver with actual local lease/witness; no live provider or account. */
import {it,expect,vi} from 'vitest';
import {readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import {pairedOwnerFixture} from './support/cvi-paired-owner-fixture.ts';
import {createLocalWitnessedReplayBackend} from '../src/server/local-cvi-witnessed-replay.ts';
const signal=()=>new AbortController().signal;
function setup(x:Awaited<ReturnType<typeof pairedOwnerFixture>>){const c=x.config;return {nativeRoot:c.nativeRoot,replayRoot:c.replayRoot,replayStoreId:c.scope.replayStoreId,physicalBindingDigest:c.physicalBindingDigest,applicationBindingDigest:c.scope.bindingDigest,applicationExpiresAt:c.binding.expiresAt,witness:c.witness,authority:c.authority,readerPrincipal:c.actor.readerPrincipal,ownerDigest:c.actor.ownerDigest};}
const request=(x:Awaited<ReturnType<typeof pairedOwnerFixture>>)=>({storeId:x.f.journal.storeId,bindingDigest:x.f.scope.bindingDigest,requestDigest:'d'.repeat(64),now:1000});
const bytes=(x:Awaited<ReturnType<typeof pairedOwnerFixture>>)=>Promise.all([x.f.replayRoot+'/ledger.json',x.config.witness.root+'/ledger.json'].map(n=>readFile(n)));
async function coherent(x:Awaited<ReturnType<typeof pairedOwnerFixture>>){const [ledger,witness]=await bytes(x);expect(JSON.parse(witness.toString()).head).toBe(createHash('sha256').update(ledger).digest('hex'));}
it('already canceled work cannot call the authority or change either journal',async()=>{
 const x=await pairedOwnerFixture();let backend:ReturnType<typeof createLocalWitnessedReplayBackend>|undefined;try{await x.start();const read=vi.fn(async()=>{throw Error('Must not read');});backend=createLocalWitnessedReplayBackend(setup(x),read,x.clock);const before=await bytes(x),c=new AbortController();c.abort();await expect(backend.mutate('reserve',x.nativeLease(),4,request(x),c.signal)).rejects.toThrow();expect(read).not.toHaveBeenCalled();expect(await bytes(x)).toEqual(before);}finally{await backend?.close();await x.close();}
},60000);
it.each(['lost-proof','canceled-proof'])('a %s after save preserves the witnessed reservation without acknowledgment or retry',async mode=>{
 const x=await pairedOwnerFixture(),c=new AbortController();let backend:ReturnType<typeof createLocalWitnessedReplayBackend>|undefined;try{
  await x.start();const authority=x.f.x.authorityPort('rotator');let reads=0;backend=createLocalWitnessedReplayBackend(setup(x),async(n,s)=>{if(++reads===3&&mode==='lost-proof')throw Error('Lost final proof');const result=await authority.read(n);if(reads===3)c.abort();return result;},x.clock);
  await expect(backend.mutate('reserve',x.nativeLease(),4,request(x),c.signal)).rejects.toThrow();expect(reads).toBe(3);expect(backend.isHeld()).toBe(true);expect((await x.records())[0].status).toBe('reserved');await coherent(x);const saved=await bytes(x);await expect(backend.mutate('reserve',x.nativeLease(),4,request(x),signal())).rejects.toThrow();expect(reads).toBe(3);expect(await bytes(x)).toEqual(saved);
 }finally{await backend?.close();await x.close();}
},60000);
it('cancellation stops a stalled proof callback without waiting for its late reply',async()=>{
 const x=await pairedOwnerFixture(),c=new AbortController();let backend:ReturnType<typeof createLocalWitnessedReplayBackend>|undefined,resolve:((v:any)=>void)|undefined;try{
  await x.start();const authority=x.f.x.authorityPort('rotator');let reads=0;backend=createLocalWitnessedReplayBackend(setup(x),(n,s)=>++reads===2?new Promise(r=>resolve=r):authority.read(n),x.clock);const before=await bytes(x),pending=backend.mutate('reserve',x.nativeLease(),4,request(x),c.signal);void pending.catch(()=>{});await vi.waitFor(()=>expect(resolve).toBeTypeOf('function'),{timeout:8000});c.abort();await expect(pending).rejects.toThrow();expect(backend.isHeld()).toBe(true);expect(await bytes(x)).toEqual(before);resolve!({});await new Promise(r=>setTimeout(r,10));expect(reads).toBe(2);expect(await bytes(x)).toEqual(before);
 }finally{resolve?.({});await backend?.close();await x.close();}
},60000);
it('clock rollback during signed verification holds before any replay write',async()=>{
 const x=await pairedOwnerFixture();let backend:ReturnType<typeof createLocalWitnessedReplayBackend>|undefined;try{await x.start();const authority=x.f.x.authorityPort('rotator');backend=createLocalWitnessedReplayBackend(setup(x),async(n,s)=>{const result=await authority.read(n);x.at(999);return result;},x.clock);const before=await bytes(x);await expect(backend.mutate('reserve',x.nativeLease(),4,request(x),signal())).rejects.toThrow();expect(backend.isHeld()).toBe(true);expect(await bytes(x)).toEqual(before);}finally{await backend?.close();await x.close();}
},60000);
it('the absolute wall deadline refuses a late callback even when timer dispatch is delayed',async()=>{
 const x=await pairedOwnerFixture();let backend:ReturnType<typeof createLocalWitnessedReplayBackend>|undefined;try{await x.start();let calls=0;backend=createLocalWitnessedReplayBackend({...setup(x),applicationExpiresAt:1300},async()=>{calls++;const at=performance.now();while(performance.now()-at<350){}return {} as any;},x.clock);const before=await bytes(x);await expect(backend.mutate('reserve',x.nativeLease(),4,request(x),signal())).rejects.toThrow();expect(calls).toBe(1);expect(backend.isHeld()).toBe(true);expect(await bytes(x)).toEqual(before);}finally{await backend?.close();await x.close();}
},60000);
it('an oversized proof frame holds without writing or falling back to an unsigned result',async()=>{
 const x=await pairedOwnerFixture();let backend:ReturnType<typeof createLocalWitnessedReplayBackend>|undefined;try{await x.start();backend=createLocalWitnessedReplayBackend(setup(x),async()=>({padding:'x'.repeat(1048577)}) as any,x.clock);const before=await bytes(x);await expect(backend.mutate('reserve',x.nativeLease(),4,request(x),signal())).rejects.toThrow();expect(backend.isHeld()).toBe(true);expect(await bytes(x)).toEqual(before);}finally{await backend?.close();await x.close();}
},60000);
it('a competing native plan cannot enter while the concrete driver checks its signed proofs',async()=>{
 const x=await pairedOwnerFixture();let backend:ReturnType<typeof createLocalWitnessedReplayBackend>|undefined;try{
  await x.start();const authority=x.f.x.authorityPort('rotator');let blocked=0;backend=createLocalWitnessedReplayBackend(setup(x),async n=>{await expect(x.f.x.commitPlan(x.nativeLease())).rejects.toThrow();blocked++;return authority.read(n);},x.clock);const r:any=await backend.mutate('reserve',x.nativeLease(),4,request(x),signal());expect(r.status).toBe('reserved');expect(blocked).toBe(3);expect((await backend.mutate('consume',x.nativeLease(),4,r,signal()) as any).status).toBe('spent');expect(blocked).toBe(6);expect((await x.f.x.inspect()).revision).toBe(4);await coherent(x);
 }finally{await backend?.close();await x.close();}
},60000);
it('a competing driver request refuses before work without retiring the original operation',async()=>{
 const x=await pairedOwnerFixture();let backend:ReturnType<typeof createLocalWitnessedReplayBackend>|undefined,release:(()=>void)|undefined;try{
  await x.start();const authority=x.f.x.authorityPort('rotator');let reads=0;backend=createLocalWitnessedReplayBackend(setup(x),async n=>{if(++reads===1)await new Promise<void>(r=>release=r);return authority.read(n);},x.clock);const before=await bytes(x),pending=backend.mutate('reserve',x.nativeLease(),4,request(x),signal());void pending.catch(()=>{});await vi.waitFor(()=>expect(release).toBeTypeOf('function'),{timeout:8000});await expect(backend.mutate('reserve',x.nativeLease(),4,{...request(x),requestDigest:'e'.repeat(64)},signal())).rejects.toThrow();expect(backend.isHeld()).toBe(false);expect(reads).toBe(1);await expect(x.records()).rejects.toThrow();expect(await bytes(x)).toEqual(before);release!();expect((await pending as any).status).toBe('reserved');expect(reads).toBe(3);expect(backend.isHeld()).toBe(false);expect(await x.records()).toHaveLength(1);await coherent(x);
 }finally{release?.();await backend?.close();await x.close();}
},60000);
