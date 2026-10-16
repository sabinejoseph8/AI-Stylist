import {it,expect,vi} from 'vitest';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createLocalCviStartupOwner} from '../src/server/local-cvi-startup-owner.ts';
import {createLocalCviStyling} from '../src/server/local-cvi-styling.ts';
import {cviCredentialDigests} from '../src/server/local-cvi-credentials.ts';
import {credentialBinding,credentialCall,scopeReplay,fixtureRequest,makeEndpoint} from './support/cvi-credential-process.ts';
import {call} from './support/cvi-replay-process.ts';
import {startupFixture} from './support/cvi-startup-fixture.ts';
const signal=()=>new AbortController().signal;
function setup(){
 let time=1000,drafts=0;
 const binding=credentialBinding(2),boot={storeId:'11111111-1111-4111-8111-111111111111',previous:1,bootDigest:'2'.repeat(64)},expected={storeId:'00000000-0000-4000-8000-000000000001',operationId:'a'.repeat(64),revision:2};
 const observation=()=>({status:'checkpoint-consistent',revision:2,operationId:expected.operationId,permissions:{write:false,reconcile:false,sign:false,resume:false},reason:'fresh-owner-required'});
 const checkpoint={inspectFresh:vi.fn(async()=>observation())};
 const admission={admit:vi.fn(async(input:any)=>({status:'authorized',authorizationId:'b'.repeat(64),input:structuredClone(input),after:{...expected}}))};
 const replay={storeId:'22222222-2222-4222-8222-222222222222',reserve:vi.fn(async()=>null),consume:vi.fn(async()=>null)};
 const authority={activate:vi.fn(async(i:any)=>({storeId:i.storeId,scopeDigest:i.scopeDigest,bindingDigest:i.bindingDigest,bootDigest:i.bootDigest,generation:i.previous+1})),check:vi.fn(async(i:any)=>({...i,active:true}))};
 let flow:ReturnType<typeof createLocalCviStyling>|undefined;
 const makeFlow=vi.fn(()=>flow=createLocalCviStyling({draft:async()=>{drafts++;return 'Synthetic checked output.';},check:async(text,s)=>({approved:true,text,revision:s.revision})}));
 const resources={binding,boot,replay,authority,makeFlow};
 return {expected,checkpoint,admission,resources,authority,replay,makeFlow,observation,flow:()=>flow,drafts:()=>drafts,at:(t:number)=>{time=t;},make:()=>createLocalCviStartupOwner(expected,checkpoint,admission,resources,()=>time,2000)};
}
it('checkpoint-only readiness cannot activate without a separate admission',async()=>{const f=setup();f.admission.admit=vi.fn(async()=>null as any);expect(await f.make().start(signal())).toBeNull();expect(f.authority.activate).not.toHaveBeenCalled();expect(f.makeFlow).not.toHaveBeenCalled();});
it('calls inspection, admission, fresh activation and final checks before returning an owner',async()=>{const f=setup(),e=await f.make().start(signal());expect(e).not.toBeNull();expect(f.checkpoint.inspectFresh).toHaveBeenCalledTimes(2);expect(f.admission.admit).toHaveBeenCalledTimes(1);expect(f.authority.activate).toHaveBeenCalledTimes(1);expect(f.authority.check).toHaveBeenCalledTimes(1);expect(f.drafts()).toBe(0);e!.end();});
it.each(['revision','operation','permissions','reason','extra'])('refuses a %s checkpoint before admission',async mode=>{const f=setup();f.checkpoint.inspectFresh=vi.fn(async()=>{const r:any=f.observation();if(mode==='revision')r.revision=1;if(mode==='operation')r.operationId='0'.repeat(64);if(mode==='permissions')r.permissions.resume=true;if(mode==='reason')r.reason='resume';if(mode==='extra')r.raw=true;return r;});expect(await f.make().start(signal())).toBeNull();expect(f.admission.admit).not.toHaveBeenCalled();});
it.each(['status','namespace','boot','binding','expiry','after','extra'])('refuses substituted %s admission',async mode=>{const f=setup();f.admission.admit=vi.fn(async input=>{const r:any={status:'authorized',authorizationId:'b'.repeat(64),input:structuredClone(input),after:{...f.expected}};if(mode==='status')r.status=true;if(mode==='namespace')r.input.replayStoreId=f.resources.boot.storeId;if(mode==='boot')r.input.bootDigest='3'.repeat(64);if(mode==='binding')r.input.bindingDigest='0'.repeat(64);if(mode==='expiry')r.input.expiresAt++;if(mode==='after')r.after.revision=1;if(mode==='extra')r.input.raw=undefined;return r;});expect(await f.make().start(signal())).toBeNull();expect(f.authority.activate).not.toHaveBeenCalled();});
it('missing privileged admission cannot select a fallback',()=>{const f=setup();expect(()=>createLocalCviStartupOwner(f.expected,f.checkpoint,undefined as any,f.resources)).toThrow();});
it('unknown activation remains held without retry or old credential reuse',async()=>{const f=setup();f.authority.activate=vi.fn(async()=>{throw Error('Unknown committed outcome');});const c=f.make();expect(await c.start(signal())).toBeNull();expect(await c.start(signal())).toBeNull();expect(f.authority.activate).toHaveBeenCalledTimes(1);expect(c.isHeld()).toBe(true);expect(f.flow()!.snapshot().notes.coverage.text).toBe('');});
it('a late activation response after cancellation never returns an endpoint',async()=>{const f=setup();let resolve!:(v:any)=>void;f.authority.activate=vi.fn(()=>new Promise(r=>resolve=r));const c=new AbortController(),owner=f.make(),pending=owner.start(c.signal);await vi.waitFor(()=>expect(typeof resolve).toBe('function'));c.abort();expect(await pending).toBeNull();const i=f.authority.activate.mock.calls[0][0];resolve({storeId:i.storeId,scopeDigest:i.scopeDigest,bindingDigest:i.bindingDigest,bootDigest:i.bootDigest,generation:2});await new Promise(r=>setTimeout(r,10));expect(f.authority.check).not.toHaveBeenCalled();expect(f.drafts()).toBe(0);});
it('a changed final checkpoint holds a committed new generation',async()=>{const f=setup();let n=0;f.checkpoint.inspectFresh=vi.fn(async()=>({...f.observation(),revision:n++?4:2}));expect(await f.make().start(signal())).toBeNull();expect(f.authority.activate).toHaveBeenCalledTimes(1);expect(f.drafts()).toBe(0);});
it('unknown current-credential proof never returns readiness',async()=>{const f=setup();f.authority.check=vi.fn(async()=>({active:false}) as any);expect(await f.make().start(signal())).toBeNull();expect(f.authority.activate).toHaveBeenCalledTimes(1);});
it('reused notebook state is refused and cleared instead of restored',async()=>{const f=setup(),old=f.resources.makeFlow();old.note({id:'fixture-old',seq:1,field:'coverage',text:'Old sleeves',confirmed:true});f.resources.makeFlow=vi.fn(()=>old);expect(await f.make().start(signal())).toBeNull();expect(f.authority.activate).not.toHaveBeenCalled();expect(old.snapshot().notes.coverage.text).toBe('');});
it('ports are captured before inspection and cannot be replaced with a raw fallback',async()=>{const f=setup(),c=f.make();f.admission.admit=vi.fn(async()=>{throw Error('Replaced');});f.authority.activate=vi.fn(async()=>{throw Error('Replaced');});const e=await c.start(signal());expect(e).not.toBeNull();e!.end();});
it('clock reversal after admission prevents activation',async()=>{const f=setup(),admit=f.admission.admit;f.admission.admit=vi.fn(async i=>{const p=await admit(i);f.at(999);return p;});expect(await f.make().start(signal())).toBeNull();expect(f.authority.activate).not.toHaveBeenCalled();});
it('startup deadlines do not become endpoint lifetime deadlines',async()=>{const f=setup(),e=await f.make().start(signal());expect(e).not.toBeNull();f.at(4000);const r=await e!.handle(fixtureRequest(f.resources.binding.secret));expect(r.status).toBe(409);expect(f.authority.check.mock.calls.length).toBeGreaterThan(1);e!.end();});

/** Admission is a synthetic privileged port; credential/replay persistence and
 * signed checkpoint inspection are real local fixture implementations. */
async function integrated(){
 const f=await startupFixture(),root=await mkdtemp(join(tmpdir(),'cvi-owner-')),credential=join(root,'credential'),replayRoot=join(root,'replay');
 await mkdir(credential,{mode:0o700});await mkdir(replayRoot,{mode:0o700});
 const oldBinding=credentialBinding(),digests=cviCredentialDigests(oldBinding),prepared:any=await credentialCall(credential,'prepare',digests);
 const old:any=await credentialCall(credential,'activate',{storeId:prepared.storeId,...digests,bootDigest:'1'.repeat(64),previous:0,now:1000});
 const journal:any=await call(replayRoot,'prepare',{bindingDigest:digests.scopeDigest});
 const expected={storeId:f.x.pin.storeId,operationId:f.plan.id,revision:2},binding=credentialBinding(2);
 const checkpoint={inspectFresh:(s:AbortSignal)=>f.make().inspect(s)};
 const admission={admit:async(input:any)=>({status:'authorized',authorizationId:'d'.repeat(64),input:structuredClone(input),after:expected})};
 const resources={binding,boot:{storeId:prepared.storeId,previous:1,bootDigest:'2'.repeat(64)},replay:scopeReplay(replayRoot,journal.storeId,digests.scopeDigest),authority:{activate:async(input:any)=>credentialCall(credential,'activate',input),check:async(request:any)=>credentialCall(credential,'check',{request})},makeFlow:()=>createLocalCviStyling({draft:async()=> 'Synthetic checked output.',check:async(text,s)=>({approved:true,text,revision:s.revision})})};
 return {f,root,credential,replayRoot,journal,old,expected,checkpoint,admission,resources,make:()=>createLocalCviStartupOwner(expected,checkpoint,admission,resources,()=>1000,8000),close:async()=>{await f.close();await rm(root,{recursive:true,force:true});}};
}
it('composes signed checkpoint inspection with durable rotation and retained replay history',async()=>{
 const f=await integrated();try{
  const retired=makeEndpoint(f.credential,f.replayRoot,f.journal.storeId,f.old);
  const first=await retired.endpoint.handle(fixtureRequest());expect(first.status).toBe(200);await first.text();
  const e=await f.make().start(signal());expect(e).not.toBeNull();
  expect((await retired.endpoint.handle(fixtureRequest(undefined,'fixture-old-again'))).status).toBe(409);
  expect((await e!.handle(fixtureRequest())).status).toBe(401);
  expect((await e!.handle(fixtureRequest(f.resources.binding.secret))).status).toBe(409);
  const next=await e!.handle(fixtureRequest(f.resources.binding.secret,'fixture-fresh'));expect(next.status).toBe(200);expect(await next.text()).toContain('Synthetic checked output.');
  e!.end();retired.endpoint.end();
 }finally{await f.close();}
},15000);
it('lost durable activation acknowledgment remains spent across a new coordinator',async()=>{
 const f=await integrated();try{
  const activate=f.resources.authority.activate;f.resources.authority.activate=async input=>{await activate(input);throw Error('Lost reply');};
  const c=f.make();expect(await c.start(signal())).toBeNull();expect(c.isHeld()).toBe(true);
  f.resources.authority.activate=activate;expect(await f.make().start(signal())).toBeNull();
  const old=makeEndpoint(f.credential,f.replayRoot,f.journal.storeId,f.old);expect((await old.endpoint.handle(fixtureRequest())).status).toBe(409);expect(old.drafts).toBe(0);old.endpoint.end();
 }finally{await f.close();}
},15000);
it('a failed final inspection retains durable retirement without exposing an owner',async()=>{
 const f=await integrated();try{
  let calls=0;const inspect=f.checkpoint.inspectFresh;f.checkpoint.inspectFresh=async s=>{if(calls++)throw Error('Unknown final read');return inspect(s);};
  expect(await f.make().start(signal())).toBeNull();
  const old=makeEndpoint(f.credential,f.replayRoot,f.journal.storeId,f.old);expect((await old.endpoint.handle(fixtureRequest())).status).toBe(409);old.endpoint.end();
  f.checkpoint.inspectFresh=inspect;expect(await f.make().start(signal())).toBeNull();
 }finally{await f.close();}
},15000);
it('cancellation after durable activation cannot undo retirement or return a late owner',async()=>{
 const f=await integrated();try{
  let committed!:()=>void,release!:()=>void;const committedSignal=new Promise<void>(r=>committed=r),delayed=new Promise<void>(r=>release=r),activate=f.resources.authority.activate;
  f.resources.authority.activate=async input=>{const result=await activate(input);committed();await delayed;return result;};
  const c=new AbortController(),owner=f.make(),pending=owner.start(c.signal);await committedSignal;c.abort();expect(await pending).toBeNull();release();await new Promise(r=>setTimeout(r,20));
  const old=makeEndpoint(f.credential,f.replayRoot,f.journal.storeId,f.old);expect((await old.endpoint.handle(fixtureRequest())).status).toBe(409);old.endpoint.end();
  f.resources.authority.activate=activate;expect(await f.make().start(signal())).toBeNull();
 }finally{await f.close();}
},15000);
it('requires the explicitly admitted advanced checkpoint after activation',async()=>{const f=setup(),next={...f.expected,revision:3,operationId:'3'.repeat(64)};let reads=0;f.checkpoint.inspectFresh=vi.fn(async()=>({...f.observation(),...(reads++?{revision:3,operationId:next.operationId}:{})}));f.admission.admit=vi.fn(async input=>({status:'authorized',authorizationId:'b'.repeat(64),input:structuredClone(input),after:next}));const e=await f.make().start(signal());expect(e).not.toBeNull();e!.end();});
it.each(['generation','binding','time','extra'])('holds substituted final credential %s proof',async mode=>{const f=setup();f.authority.check=vi.fn(async input=>{const p:any={...input,active:true};if(mode==='generation')p.generation++;if(mode==='binding')p.bindingDigest='0'.repeat(64);if(mode==='time')p.now--;if(mode==='extra')p.raw=true;return p;});expect(await f.make().start(signal())).toBeNull();expect(f.authority.activate).toHaveBeenCalledTimes(1);});
