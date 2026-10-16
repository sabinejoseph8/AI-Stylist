import {it,expect,vi} from 'vitest';
import {startupAdmissionFixture} from './support/cvi-startup-admission-fixture.ts';
import {fixtureRequest,credentialCall,credentialBinding} from './support/cvi-credential-process.ts';
import {createLocalCheckpointCredentialAuthority,createLocalCviCheckpointEndpoint} from '../src/server/local-cvi-checkpoint-credentials.ts';
const signal=()=>new AbortController().signal;
function simple(){
 const expected={storeId:'00000000-0000-4000-8000-000000000001',operationId:'a'.repeat(64),revision:2},lease={storeId:'11111111-1111-4111-8111-111111111111',scopeDigest:'b'.repeat(64),bindingDigest:'c'.repeat(64),bootDigest:'d'.repeat(64),generation:1};
 const observation=()=>({status:'checkpoint-consistent',operationId:expected.operationId,revision:2,permissions:{write:false,reconcile:false,sign:false,resume:false},reason:'fresh-owner-required'});
 const checkpoint={inspectFresh:vi.fn(async()=>observation())},authority={check:vi.fn(async(input:any)=>({...input,active:true}))};
 return {expected,lease,checkpoint,authority,observation,make:()=>createLocalCheckpointCredentialAuthority(expected,lease,checkpoint,authority,9000,()=>1000),input:()=>({...lease,now:1000})};
}
it('checks full-state identity on both sides of the credential proof',async()=>{const f=simple(),g=f.make();expect(await g.check(f.input(),signal())).toEqual({...f.input(),active:true});expect(f.checkpoint.inspectFresh).toHaveBeenCalledTimes(2);expect(f.authority.check).toHaveBeenCalledTimes(1);expect(g.isHeld()).toBe(false);});
it.each(['revision','operation','permission','reason','extra'])('refuses an altered %s checkpoint before credential work',async mode=>{const f=simple();f.checkpoint.inspectFresh=vi.fn(async()=>{const r:any=f.observation();if(mode==='revision')r.revision++;if(mode==='operation')r.operationId='0'.repeat(64);if(mode==='permission')r.permissions.resume=true;if(mode==='reason')r.reason='resume';if(mode==='extra')r.raw=true;return r;});const g=f.make();expect(await g.check(f.input(),signal())).toBeNull();expect(f.authority.check).not.toHaveBeenCalled();expect(g.isHeld()).toBe(true);});
it('a transition during credential work permanently holds the old owner',async()=>{const f=simple();let changed=false;f.checkpoint.inspectFresh=vi.fn(async()=>({...f.observation(),revision:changed?4:2}));f.authority.check=vi.fn(async input=>{changed=true;return {...input,active:true};});const g=f.make();expect(await g.check(f.input(),signal())).toBeNull();changed=false;expect(await g.check(f.input(),signal())).toBeNull();expect(f.authority.check).toHaveBeenCalledTimes(1);});
it('missing inspection has no credential-only fallback',()=>{const f=simple();expect(()=>createLocalCheckpointCredentialAuthority(f.expected,f.lease,undefined as any,f.authority,9000,()=>1000)).toThrow();});
it('a substituted credential lease cannot make any port call',async()=>{const f=simple();expect(await f.make().check({...f.input(),generation:2},signal())).toBeNull();expect(f.checkpoint.inspectFresh).not.toHaveBeenCalled();expect(f.authority.check).not.toHaveBeenCalled();});
it('unknown credential outcome holds without retry',async()=>{const f=simple();f.authority.check=vi.fn(async()=>{throw Error('Unknown');});const g=f.make();expect(await g.check(f.input(),signal())).toBeNull();expect(await g.check(f.input(),signal())).toBeNull();expect(f.authority.check).toHaveBeenCalledTimes(1);});
it('captures ports and primitive scope before asynchronous requests',async()=>{const f=simple(),g=f.make();f.checkpoint.inspectFresh=vi.fn(async()=>{throw Error('Replaced');});f.authority.check=vi.fn(async()=>{throw Error('Replaced');});f.expected.revision=4;f.lease.generation=2;expect(await g.check({...f.input(),generation:1},signal())).not.toBeNull();});
it('cancellation during inspection cannot return a credential proof',async()=>{const f=simple(),c=new AbortController();f.checkpoint.inspectFresh=vi.fn(async()=>{c.abort();return f.observation();});expect(await f.make().check(f.input(),c.signal)).toBeNull();expect(f.authority.check).not.toHaveBeenCalled();});

function oldEndpoint(f:Awaited<ReturnType<typeof startupAdmissionFixture>>){const flow=f.resources.makeFlow(),endpoint=createLocalCviCheckpointEndpoint(credentialBinding(),flow,f.resources.replay,f.oldLease,f.expected,f.checkpoint,{check:(request)=>credentialCall(f.credential,'check',{request})},f.oldOwnerExpiresAt,()=>1000,8000);return {...endpoint,flow};}
it('a previously constructed composed owner stops after admission even when credential rotation fails',async()=>{const f=await startupAdmissionFixture();try{
 const old=oldEndpoint(f);old.flow.note({id:'fixture-old-note',seq:1,field:'coverage',text:'Old sleeves',confirmed:true});const first=await old.handle(fixtureRequest(undefined,'fixture-before'));expect(first.status).toBe(200);expect(await first.text()).toContain('Synthetic checked output.');expect(f.drafts()).toBe(1);
 f.resources.authority.activate=async()=>{throw Error('Credential rotation unavailable');};expect(await f.make().start(signal())).toBeNull();expect((await f.x.inspect()).revision).toBe(4);
 expect((await old.handle(fixtureRequest(undefined,'fixture-after'))).status).toBe(409);expect(f.drafts()).toBe(1);expect(old.flow.snapshot().notes.coverage.text).toBe('');old.end();
}finally{await f.close();}},25000);
it('committing admission while an old credential proof is awaited prevents body processing',async()=>{const f=await startupAdmissionFixture();try{
 let changed=false;const check=async(request:any)=>{const result=await credentialCall(f.credential,'check',{request});if(!changed){changed=true;await f.admission().admit(f.input(),signal());}return result;};
 const reserve=vi.spyOn(f.resources.replay,'reserve'),old=createLocalCviCheckpointEndpoint(credentialBinding(),f.resources.makeFlow(),f.resources.replay,f.oldLease,f.expected,f.checkpoint,{check},f.oldOwnerExpiresAt,()=>1000,8000);
 expect((await old.handle(fixtureRequest())).status).toBe(409);expect(reserve).not.toHaveBeenCalled();expect(f.drafts()).toBe(0);expect((await f.x.inspect()).revision).toBe(4);old.end();
}finally{await f.close();}},25000);
it('a transition after durable consume suppresses checked output without refunding the request',async()=>{const f=await startupAdmissionFixture();try{
 const consume=f.resources.replay.consume;let spent=false;f.resources.replay.consume=async(r,s)=>{const ack=await consume(r,s);spent=true;await f.admission().admit(f.input(),signal());return ack;};
 const old=oldEndpoint(f),r=await old.handle(fixtureRequest());expect(r.status).toBe(200);await expect(r.text()).rejects.toThrow();expect(spent).toBe(true);expect(f.drafts()).toBe(1);expect((await f.x.inspect()).revision).toBe(4);
 expect((await old.handle(fixtureRequest(undefined,'fixture-later'))).status).toBe(409);expect(f.drafts()).toBe(1);old.end();
}finally{await f.close();}},25000);
it('a missing full-state observer holds the composed owner with no draft',async()=>{const f=await startupAdmissionFixture();try{const old=oldEndpoint(f);f.x.setUnavailable(true);expect((await old.handle(fixtureRequest())).status).toBe(409);expect(f.drafts()).toBe(0);old.end();}finally{await f.close();}},25000);

it.each([0,8001])('refuses invalid request deadline %s before activating a credential',async requestDeadline=>{
 const {startLocalCviCredentialEndpoint}=await import('../src/server/local-cvi-credentials.ts'),{createLocalCviStyling}=await import('../src/server/local-cvi-styling.ts'),f=simple(),activate=vi.fn(async()=>f.lease),flow=createLocalCviStyling({draft:async()=> 'Synthetic checked output.',check:async(text,s)=>({approved:true,text,revision:s.revision})});
 const replay={storeId:f.lease.storeId,reserve:async()=>null,consume:async()=>null};expect(await startLocalCviCredentialEndpoint(credentialBinding(),flow,replay,{storeId:f.lease.storeId,previous:0,bootDigest:f.lease.bootDigest},{activate,check:f.authority.check},()=>1000,100,requestDeadline)).toBeNull();expect(activate).not.toHaveBeenCalled();flow.end();
});
it('a short startup allowance does not shorten the configured request deadline',async()=>{
 const {startLocalCviCredentialEndpoint}=await import('../src/server/local-cvi-credentials.ts'),{createLocalCviStyling}=await import('../src/server/local-cvi-styling.ts'),f=simple();let finish!:(s:string)=>void;vi.useFakeTimers();
 try{
  const flow=createLocalCviStyling({draft:()=>new Promise(r=>finish=r),check:async(text,s)=>({approved:true,text,revision:s.revision})});
  const replay={storeId:f.lease.storeId,reserve:async(i:any)=>({...i,receipt:'fixture-receipt-'+'1'.repeat(32),status:'reserved'}),consume:async(i:any)=>({...i,status:'spent'})};
  const authority={activate:async(i:any)=>({storeId:i.storeId,scopeDigest:i.scopeDigest,bindingDigest:i.bindingDigest,bootDigest:i.bootDigest,generation:1}),check:async(i:any)=>({...i,active:true})};
  const e=await startLocalCviCredentialEndpoint(credentialBinding(),flow,replay,{storeId:f.lease.storeId,previous:0,bootDigest:f.lease.bootDigest},authority,()=>1000,20,100);expect(e).not.toBeNull();
  const pending=e!.handle(fixtureRequest());await vi.advanceTimersByTimeAsync(50);expect(typeof finish).toBe('function');finish('Synthetic checked output.');const response=await pending;expect(response.status).toBe(200);expect(await response.text()).toContain('Synthetic checked output.');e!.end();
 }finally{vi.useRealTimers();}
});
it('an expired owner lease refuses before either port is called',async()=>{const f=simple(),g=createLocalCheckpointCredentialAuthority(f.expected,f.lease,f.checkpoint,f.authority,9000,()=>9000);expect(await g.check({...f.input(),now:9000},signal())).toBeNull();expect(f.checkpoint.inspectFresh).not.toHaveBeenCalled();expect(f.authority.check).not.toHaveBeenCalled();expect(g.isHeld()).toBe(true);});
it('owner expiry while credential work is awaited permanently holds the owner',async()=>{const f=simple();let now=1000;f.authority.check=vi.fn(async i=>{now=1100;return {...i,active:true};});const g=createLocalCheckpointCredentialAuthority(f.expected,f.lease,f.checkpoint,f.authority,1100,()=>now);expect(await g.check(f.input(),signal())).toBeNull();now=1000;expect(await g.check(f.input(),signal())).toBeNull();expect(f.authority.check).toHaveBeenCalledTimes(1);});
it('owner expiry during final inspection cannot return the earlier credential proof',async()=>{const f=simple();let now=1000,reads=0;f.checkpoint.inspectFresh=vi.fn(async()=>{if(reads++)now=1100;return f.observation();});const g=createLocalCheckpointCredentialAuthority(f.expected,f.lease,f.checkpoint,f.authority,1100,()=>now);expect(await g.check(f.input(),signal())).toBeNull();expect(f.authority.check).toHaveBeenCalledTimes(1);expect(g.isHeld()).toBe(true);});
it('a legitimate same-owner state write is still held until a trusted checkpoint refresh is implemented',async()=>{const f=await startupAdmissionFixture();try{
 const e=await f.make().start(signal());expect(e).not.toBeNull();const plan=await f.x.commitPlan(f.nativeLease());await f.x.adapter('writer').execute(plan,signal());expect((await f.x.inspect()).revision).toBe(6);
 expect((await e!.handle(fixtureRequest(f.resources.binding.secret,'fixture-after-write'))).status).toBe(409);expect(f.drafts()).toBe(0);e!.end();
}finally{await f.close();}},25000);
