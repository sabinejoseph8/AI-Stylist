import {it,expect,vi} from 'vitest';
import {startupAdmissionFixture} from './support/cvi-startup-admission-fixture.ts';
import {createLocalCviStartupOwner,continueLocalCviOwner} from '../src/server/local-cvi-startup-owner.ts';
import {createLocalDurableOwnerContinuation} from '../src/server/local-cvi-owner-continuation.ts';
import {cviCredentialDigests} from '../src/server/local-cvi-credentials.ts';
import {call} from './support/cvi-replay-process.ts';
const signal=()=>new AbortController().signal;
async function fixture(cap=10000){
 let time=1000;const f=await startupAdmissionFixture(()=>time,cap);
 const makeFlow=f.resources.makeFlow;let flow!:ReturnType<typeof makeFlow>;f.resources.makeFlow=()=>flow=makeFlow();
 const owner=await createLocalCviStartupOwner(f.expected,f.checkpoint,f.admission(),f.resources,()=>time,5000,8000).start(signal());
 if(!owner){await f.close();throw Error('Continuation fixture held');}
 const old=structuredClone(f.nativeLease()),rotator=f.x.actors.find(a=>a.role==='rotator')!,reader=f.x.actors.find(a=>a.role==='observer')!;
 const authority=f.x.authorityPort('rotator'),ports={plan:vi.fn(async(a:any)=>f.x.plan('renew',{lease:a.lease,ttl:a.ttl,token:a.token})),execute:vi.fn((p:any,s:AbortSignal)=>f.executeTracked(p)),read:vi.fn((n:string,s:AbortSignal)=>authority.read(n))};
 const make=(bindingDigest=cviCredentialDigests(f.resources.binding).bindingDigest,appCap=cap)=>createLocalDurableOwnerContinuation(f.x.pin,old,bindingDigest,appCap,{principalDigest:rotator.principalDigest,readerPrincipal:reader.principalDigest},ports,()=>time);
 const request=(id='fixture-after-renewal')=>new Request(f.resources.binding.origin+'/v1/chat/completions',{method:'POST',headers:{authorization:'Bearer '+f.resources.binding.secret,'x-cvi-conversation':f.resources.binding.conversation,'x-cvi-request-id':id,'content-type':'application/json'},body:JSON.stringify({model:'local-simulation',stream:true,messages:[{role:'user',content:'Synthetic sleeves'}]})});
 const records=async()=>((await call(f.replayRoot,'inspect',{storeId:f.journal.storeId})) as any).records;
 return {f,owner,flow,old,ports,make,request,records,at:(n:number)=>{time=n;},close:async()=>{owner.end();await f.close();}};
}
it('adopts an exact signed renewal at idle, invalidates prepared text and preserves replay history',async()=>{const x=await fixture();try{
 const first=await x.owner.handle(x.request('fixture-before-renewal'));expect(first.status).toBe(200);await first.text();const before=await x.records();
 x.flow.note({id:'fixture-retained-notes',seq:1,field:'coverage',text:'Long sleeves',confirmed:false});const notes=structuredClone(x.flow.snapshot().notes);
 const pending=await x.flow.prepare(signal());
 expect(pending.status).toBe('prepared');
 x.at(1500);expect(await continueLocalCviOwner(x.owner,x.make(),signal())).toBe(true);expect((await x.f.x.inspect()).revision).toBe(6);expect(pending.takeSse()).toBeNull();expect(x.flow.snapshot().notes).toEqual(notes);
 expect(await x.records()).toEqual(before);x.at(2000);const next=await x.owner.handle(x.request());expect(next.status).toBe(200);expect(await next.text()).toContain('Synthetic checked output.');
 expect((await x.owner.handle(x.request('fixture-before-renewal'))).status).toBe(409);expect(await x.records()).toHaveLength(2);
 x.at(10000);expect((await x.owner.handle(x.request('fixture-at-cap'))).status).toBe(410);
 }finally{await x.close();}},60000);
it('a busy prepared HTTP response refuses continuation before calling the renewal port',async()=>{const x=await fixture();try{
 const response=await x.owner.handle(x.request());expect(response.status).toBe(200);const port=x.make();x.at(1500);
 expect(await continueLocalCviOwner(x.owner,port,signal())).toBe(false);expect(x.ports.execute).not.toHaveBeenCalled();
 await response.body!.cancel();expect(await x.records()).toHaveLength(1);expect((await x.records())[0].status).toBe('reserved');expect(await continueLocalCviOwner(x.owner,port,signal())).toBe(false);expect(x.ports.execute).not.toHaveBeenCalled();
 }finally{await x.close();}},30000);
it.each(['binding','cap'])('a mismatched %s scope cannot authorize continuation',async mode=>{const x=await fixture();try{
 x.at(1500);const port=mode==='binding'?x.make('f'.repeat(64)):x.make(undefined,11000);
 expect(await continueLocalCviOwner(x.owner,port,signal())).toBe(false);expect(port.isHeld()).toBe(true);expect(x.ports.execute).not.toHaveBeenCalled();expect((await x.owner.handle(x.request())).status).toBe(410);
 }finally{await x.close();}},30000);
it.each(['json','clone'])('a %s handoff cannot substitute for the original transient authorization',async mode=>{const x=await fixture();try{
 x.at(1500);const real=x.make();expect(await continueLocalCviOwner(x.owner,{renew:async(i,s)=>mode==='json'?{status:'owner-continuation'}:structuredClone(await real.renew(i,s))},signal())).toBe(false);
 expect(x.ports.execute).toHaveBeenCalledTimes(mode==='clone'?1:0);expect((await x.owner.handle(x.request())).status).toBe(410);
 }finally{await x.close();}},30000);
it('an expired original owner cannot start renewal',async()=>{const x=await fixture();try{
 x.at(9000);expect(await continueLocalCviOwner(x.owner,x.make(),signal())).toBe(false);expect(x.ports.execute).not.toHaveBeenCalled();expect((await x.owner.handle(x.request())).status).toBe(410);
 }finally{await x.close();}},30000);
it('a lost committed result holds the owner without retrying or restoring old replay permission',async()=>{const x=await fixture();try{
 x.at(1500);const execute=x.ports.execute.getMockImplementation()!;x.ports.execute.mockImplementationOnce(async(p,s)=>{await execute(p,s);throw Error('Lost acknowledgment');});const port=x.make();
 expect(await continueLocalCviOwner(x.owner,port,signal())).toBe(false);expect(port.isHeld()).toBe(true);expect((await x.f.x.inspect()).revision).toBe(6);
 expect(await continueLocalCviOwner(x.owner,port,signal())).toBe(false);expect(x.ports.execute).toHaveBeenCalledTimes(1);expect(await x.records()).toHaveLength(0);
 }finally{await x.close();}},30000);
it('old-owner expiry after commit refuses adoption of the longer new grant',async()=>{const x=await fixture();try{
 x.at(1500);const execute=x.ports.execute.getMockImplementation()!;x.ports.execute.mockImplementationOnce(async(p,s)=>{const result=await execute(p,s);x.at(9000);return result;});
 expect(await continueLocalCviOwner(x.owner,x.make(),signal())).toBe(false);expect((await x.f.x.inspect()).revision).toBe(6);expect((await x.owner.handle(x.request())).status).toBe(410);
 }finally{await x.close();}},30000);
it('an object copy of a started owner has no continuation control',async()=>{const x=await fixture();try{expect(await continueLocalCviOwner({...x.owner},x.make(),signal())).toBe(false);expect(x.ports.execute).not.toHaveBeenCalled();}finally{await x.close();}},30000);
it('application cap earlier than native domain expiry clamps renewal and remains absolute',async()=>{const x=await fixture(9400);try{
 x.at(1500);expect(await continueLocalCviOwner(x.owner,x.make(),signal())).toBe(true);expect(x.ports.plan.mock.calls[0][0].ttl).toBe(7900);
 x.at(2000);const r=await x.owner.handle(x.request());expect(r.status).toBe(200);await r.text();
 x.at(9400);expect((await x.owner.handle(x.request('fixture-cap-blocked'))).status).toBe(410);
 }finally{await x.close();}},60000);
it('one port adopts two distinct one-use renewals without sliding the application cap',async()=>{const x=await fixture();try{
 const port=x.make();x.at(1500);expect(await continueLocalCviOwner(x.owner,port,signal())).toBe(true);
 x.at(2000);expect(await continueLocalCviOwner(x.owner,port,signal())).toBe(true);expect(x.ports.execute).toHaveBeenCalledTimes(2);expect((await x.f.x.inspect()).revision).toBe(8);
 expect(await continueLocalCviOwner(x.owner,port,signal())).toBe(false);expect(port.isHeld()).toBe(false);expect(x.ports.execute).toHaveBeenCalledTimes(2);
 x.at(2500);const r=await x.owner.handle(x.request());expect(r.status).toBe(200);await r.text();expect(await x.records()).toHaveLength(1);
 }finally{await x.close();}},60000);
it('reusing the original consumed handoff cannot authorize another ownership update',async()=>{const x=await fixture();try{
 const real=x.make();let saved:unknown;const port={renew:async(i:any,s:AbortSignal)=>saved??(saved=await real.renew(i,s))};
 x.at(1500);expect(await continueLocalCviOwner(x.owner,port,signal())).toBe(true);x.at(2000);
 expect(await continueLocalCviOwner(x.owner,port,signal())).toBe(false);expect(x.ports.execute).toHaveBeenCalledTimes(1);expect((await x.owner.handle(x.request())).status).toBe(410);
 }finally{await x.close();}},60000);
it('forged completed authority evidence cannot produce an adoptable handoff',async()=>{const x=await fixture();try{
 const read=x.ports.read.getMockImplementation()!;let calls=0;x.ports.read.mockImplementation(async(n,s)=>{const e=await read(n,s);return ++calls===2?{...e,reply:{...(e.reply as any),signature:'0'.repeat(128)}}:e;});
 x.at(1500);const port=x.make();expect(await continueLocalCviOwner(x.owner,port,signal())).toBe(false);expect(port.isHeld()).toBe(true);
 expect((await x.f.x.inspect()).revision).toBe(6);expect((await x.owner.handle(x.request())).status).toBe(410);
 }finally{await x.close();}},60000);
it('durable credential replacement after renewal prevents final adoption',async()=>{const x=await fixture();try{
 const execute=x.ports.execute.getMockImplementation()!,d=cviCredentialDigests(x.f.resources.binding);
 x.ports.execute.mockImplementationOnce(async(p,s)=>{const result=await execute(p,s);await x.f.resources.authority.activate({storeId:x.f.scope.credentialStoreId,...d,bootDigest:'e'.repeat(64),previous:2,now:1500});return result;});
 x.at(1500);expect(await continueLocalCviOwner(x.owner,x.make(),signal())).toBe(false);expect((await x.f.x.inspect()).revision).toBe(6);
 expect((await x.owner.handle(x.request())).status).toBe(410);expect(await x.records()).toHaveLength(0);
 }finally{await x.close();}},60000);
it('cancellation after handoff creation invalidates it and prevents late adoption',async()=>{const x=await fixture();try{
 const real=x.make(),controller=new AbortController();let raw:unknown,input:any,release!:()=>void;
 const port={renew:async(i:any,s:AbortSignal)=>{input=i;raw=await real.renew(i,s);await new Promise<void>(r=>release=r);return raw;}};
 x.at(1500);const pending=continueLocalCviOwner(x.owner,port,controller.signal);await vi.waitFor(()=>expect(release).toBeTypeOf('function'),{timeout:6000});controller.abort();expect(await pending).toBe(false);
 const {inspectOwnerContinuation}=await import('../src/server/local-cvi-owner-continuation.ts');expect(()=>inspectOwnerContinuation(raw,input,1500)).toThrow();release();
 expect((await x.owner.handle(x.request())).status).toBe(410);expect((await x.f.x.inspect()).revision).toBe(6);
 }finally{await x.close();}},60000);
it('simultaneous continuation controls cannot execute two renewals',async()=>{const x=await fixture();try{
 x.at(1500);const first=continueLocalCviOwner(x.owner,x.make(),signal());expect(await continueLocalCviOwner(x.owner,x.make(),signal())).toBe(false);
 expect(await first).toBe(true);expect(x.ports.execute).toHaveBeenCalledTimes(1);expect((await x.f.x.inspect()).revision).toBe(6);
 }finally{await x.close();}},60000);
it('pending note extraction remains open and preserves newer notes during adoption',async()=>{
 let time=1000,pending=false,revision=0,nativeRevision=4;const f=await startupAdmissionFixture(()=>time);
 const {createLocalCviStyling,CVI_FIELDS}=await import('../src/server/local-cvi-styling.ts');
 const notes=Object.fromEntries(CVI_FIELDS.map(k=>[k,{text:'',confirmed:false}])) as any,end=vi.fn();let flow!:ReturnType<typeof createLocalCviStyling>;
 f.resources.makeFlow=()=>flow=createLocalCviStyling({draft:async()=>'Synthetic pending-safe output',check:async(text,s)=>({approved:true,text,revision:s.revision})},1000,{snapshot:()=>({revision,notes,context:{epoch:1,inputRevision:revision,nativeRevision}}),subscribe:()=>()=>{},end,ready:()=>!pending});
 let owner:Awaited<ReturnType<ReturnType<typeof createLocalCviStartupOwner>['start']>>;
 try{
  owner=await createLocalCviStartupOwner(f.expected,f.checkpoint,f.admission(),f.resources,()=>time,5000,8000).start(signal());expect(owner).not.toBeNull();
  const rotator=f.x.actors.find(a=>a.role==='rotator')!,reader=f.x.actors.find(a=>a.role==='observer')!,authority=f.x.authorityPort('rotator');
  const port=createLocalDurableOwnerContinuation(f.x.pin,f.nativeLease(),cviCredentialDigests(f.resources.binding).bindingDigest,10000,{principalDigest:rotator.principalDigest,readerPrincipal:reader.principalDigest},{plan:a=>f.x.plan('renew',{lease:a.lease,ttl:a.ttl,token:a.token}),execute:async(p,s)=>{const r=await f.executeTracked(p);nativeRevision=(await f.x.inspect()).revision;return r;},read:n=>authority.read(n)},()=>time);
  notes.coverage={text:'Latest long sleeves',confirmed:false};revision=1;pending=true;expect(flow.available()).toBe(false);expect(flow.isOpen()).toBe(true);
  time=1500;expect(await continueLocalCviOwner(owner!,port,signal())).toBe(true);expect(end).not.toHaveBeenCalled();expect(flow.isOpen()).toBe(true);expect(flow.available()).toBe(false);expect(flow.snapshot().notes.coverage.text).toBe('Latest long sleeves');
  pending=false;time=2000;const request=new Request(f.resources.binding.origin+'/v1/chat/completions',{method:'POST',headers:{authorization:'Bearer '+f.resources.binding.secret,'x-cvi-conversation':f.resources.binding.conversation,'x-cvi-request-id':'fixture-pending-preserved','content-type':'application/json'},body:JSON.stringify({model:'local-simulation',stream:true,messages:[{role:'user',content:'Synthetic'}]})});
  const response=await owner!.handle(request);expect(response.status).toBe(200);expect(await response.text()).toContain('Synthetic pending-safe output');
  owner!.end();expect(flow.isOpen()).toBe(false);
 }finally{await f.close();}
},60000);
