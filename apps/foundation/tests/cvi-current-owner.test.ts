import {it,expect,vi} from 'vitest';
import {startupAdmissionFixture} from './support/cvi-startup-admission-fixture.ts';
import {fixtureRequest,credentialCall,credentialBinding} from './support/cvi-credential-process.ts';
import {createLocalCurrentOwnerCredentialAuthority,createLocalCviCurrentOwnerEndpoint} from '../src/server/local-cvi-checkpoint-credentials.ts';
const signal=()=>new AbortController().signal;
function simple(){
 const native={storeId:'00000000-0000-4000-8000-000000000001',generation:2,ownerDigest:'5'.repeat(64),bootDigest:'6'.repeat(64),expiresAt:9000,minimumRevision:4},lease={storeId:'11111111-1111-4111-8111-111111111111',generation:2,scopeDigest:'a'.repeat(64),bindingDigest:'b'.repeat(64),bootDigest:'c'.repeat(64)};
 let revision=4,operation='d'.repeat(64),time=1000;const observation=()=>{const {minimumRevision,...owner}=native;return {status:'owner-current',revision,operationId:operation,owner,permissions:{write:false,reconcile:false,sign:false,resume:false}};};
 const checkpoint={inspectOwnerFresh:vi.fn(async(_owner:any)=>observation())},authority={check:vi.fn(async(i:any)=>({...i,active:true}))};
 return {native,lease,checkpoint,authority,observation,revision:(r:number)=>{revision=r;operation=(r===4?'d':'e').repeat(64);},operation:(o:string)=>{operation=o;},time:(t:number)=>{time=t;},input:()=>({...lease,now:1000}),make:()=>createLocalCurrentOwnerCredentialAuthority(native,lease,checkpoint,authority,()=>time)};
}
it('allows verified same-owner progress and raises the inspection floor',async()=>{const f=simple(),g=f.make();expect(await g.check(f.input(),signal())).not.toBeNull();f.revision(6);expect(await g.check(f.input(),signal())).not.toBeNull();expect(f.checkpoint.inspectOwnerFresh.mock.calls[3][0].minimumRevision).toBe(6);expect(g.isHeld()).toBe(false);});
it('the observed floor cannot go backwards in the existing owner instance',async()=>{const f=simple(),g=f.make();f.revision(6);expect(await g.check(f.input(),signal())).not.toBeNull();f.revision(4);expect(await g.check(f.input(),signal())).toBeNull();f.revision(6);expect(await g.check(f.input(),signal())).toBeNull();expect(g.isHeld()).toBe(true);});
it.each(['generation','owner','boot','expiry','store','permissions','extra','status'])('refuses substituted %s ownership evidence',async mode=>{const f=simple();f.checkpoint.inspectOwnerFresh=vi.fn(async()=>{const r:any=f.observation();if(mode==='generation')r.owner.generation=3;if(mode==='owner')r.owner.ownerDigest='0'.repeat(64);if(mode==='boot')r.owner.bootDigest='0'.repeat(64);if(mode==='expiry')r.owner.expiresAt++;if(mode==='store')r.owner.storeId=f.lease.storeId;if(mode==='permissions')r.permissions.sign=true;if(mode==='extra')r.raw=true;if(mode==='status')r.status='checkpoint-consistent';return r;});const g=f.make();expect(await g.check(f.input(),signal())).toBeNull();expect(f.authority.check).not.toHaveBeenCalled();expect(g.isHeld()).toBe(true);});
it('cannot replace the operation marker at the same revision',async()=>{const f=simple(),g=f.make();expect(await g.check(f.input(),signal())).not.toBeNull();f.operation('f'.repeat(64));expect(await g.check(f.input(),signal())).toBeNull();});
it('cannot advance the revision while keeping the previous operation marker',async()=>{const f=simple(),g=f.make();expect(await g.check(f.input(),signal())).not.toBeNull();f.revision(6);f.operation('d'.repeat(64));expect(await g.check(f.input(),signal())).toBeNull();});
it('a replacement owner during credential work suppresses the earlier proof',async()=>{const f=simple();let changed=false;f.checkpoint.inspectOwnerFresh=vi.fn(async()=>{const r=f.observation();if(changed)r.owner.bootDigest='0'.repeat(64);return r;});f.authority.check=vi.fn(async i=>{changed=true;return {...i,active:true};});expect(await f.make().check(f.input(),signal())).toBeNull();});
it('expiry during final owner observation cannot return the proof',async()=>{const f=simple();let reads=0;f.checkpoint.inspectOwnerFresh=vi.fn(async()=>{if(reads++)f.time(9000);return f.observation();});expect(await f.make().check(f.input(),signal())).toBeNull();});
it('missing owner observation cannot select checkpoint-only fallback',()=>{const f=simple();expect(()=>createLocalCurrentOwnerCredentialAuthority(f.native,f.lease,{inspectOwnerFresh:undefined} as any,f.authority)).toThrow();});

it('one composed endpoint continues before and after an actual authenticated same-owner write',async()=>{const f=await startupAdmissionFixture();try{
 const e=await f.make().start(signal());expect(e).not.toBeNull();const first=await e!.handle(fixtureRequest(f.resources.binding.secret,'fixture-before-write'));expect(first.status).toBe(200);expect(await first.text()).toContain('Synthetic checked output.');
 await f.write();expect((await f.x.inspect()).revision).toBe(6);const second=await e!.handle(fixtureRequest(f.resources.binding.secret,'fixture-after-write'));expect(second.status).toBe(200);expect(await second.text()).toContain('Synthetic checked output.');expect(f.drafts()).toBe(2);e!.end();
}finally{await f.close();}},30000);
it.each(['fence','replace'])('a %s transition refuses the former owner even while its credential is active',async mode=>{const f=await startupAdmissionFixture();try{
 const e=await f.make().start(signal());expect(e).not.toBeNull();await f[mode as 'fence'|'replace']();expect((await f.x.inspect()).revision).toBe(6);expect((await e!.handle(fixtureRequest(f.resources.binding.secret,'fixture-retired'))).status).toBe(409);expect(f.drafts()).toBe(0);e!.end();
}finally{await f.close();}},30000);
it('an existing current-owner endpoint refuses after another admission commits but credential rotation fails',async()=>{const f=await startupAdmissionFixture();try{
 const old=createLocalCviCurrentOwnerEndpoint(credentialBinding(),f.resources.makeFlow(),f.resources.replay,f.oldLease,f.oldOwner,f.checkpoint,{check:request=>credentialCall(f.credential,'check',{request})},()=>1000,8000);
 f.resources.authority.activate=async()=>{throw Error('Unavailable rotation');};expect(await f.make().start(signal())).toBeNull();expect((await old.handle(fixtureRequest())).status).toBe(409);expect(f.drafts()).toBe(0);old.end();
}finally{await f.close();}},30000);
it('a retained owner floor refuses a coordinated older state restore',async()=>{const f=await startupAdmissionFixture();try{
 const e=await f.make().start(signal());expect(e).not.toBeNull();const db=await f.x.dbSnapshot(),authority=await f.x.authoritySnapshot(),marker=f.markerCopy();
 await f.write();const r=await e!.handle(fixtureRequest(f.resources.binding.secret,'fixture-newer'));expect(r.status).toBe(200);await r.text();expect(f.drafts()).toBe(1);
 await f.x.dbRestore(db);await f.x.authorityRestore(authority);f.restoreMarker(marker);expect((await f.x.inspect()).revision).toBe(4);
 expect((await e!.handle(fixtureRequest(f.resources.binding.secret,'fixture-restored'))).status).toBe(409);expect(f.drafts()).toBe(1);e!.end();
}finally{await f.close();}},30000);
it('signed ownership inspection confirms the existing grant without granting writes or resume',async()=>{const f=await startupAdmissionFixture();try{const r:any=await f.checkpoint.inspectOwnerFresh(f.oldOwner,signal()),{minimumRevision,...native}=f.oldOwner;expect(r.status).toBe('owner-current');expect(r.revision).toBe(2);expect(r.owner).toEqual(native);expect(r.permissions).toEqual({write:false,reconcile:false,sign:false,resume:false});}finally{await f.close();}},20000);
it.each(['generation','ownerDigest','bootDigest','expiresAt','minimumRevision','storeId','extra'])('signed inspection rejects a mismatched %s owner pin',async mode=>{const f=await startupAdmissionFixture();try{const pin:any={...f.oldOwner};if(mode==='generation')pin.generation++;if(mode==='ownerDigest'||mode==='bootDigest')pin[mode]='0'.repeat(64);if(mode==='expiresAt'||mode==='minimumRevision')pin[mode]++;if(mode==='storeId')pin.storeId=f.resources.boot.storeId;if(mode==='extra')pin.token='hidden';await expect(Promise.resolve().then(()=>f.checkpoint.inspectOwnerFresh(pin,signal()))).rejects.toThrow();expect((await f.x.inspect()).revision).toBe(2);}finally{await f.close();}},20000);
it('a consistent historical checkpoint cannot confirm an expired active owner',async()=>{const f=await startupAdmissionFixture();try{expect((await f.inspector(()=>f.oldOwner.expiresAt).inspect(signal())).status).toBe('checkpoint-consistent');await expect(f.inspector(()=>f.oldOwner.expiresAt).inspectOwner(f.oldOwner,signal())).rejects.toThrow();}finally{await f.close();}},20000);
it('same-owner progress invalidates only the pending request and permits a fresh turn',async()=>{const f=simple(),g=f.make(),request=signal();expect(await g.check(f.input(),request)).not.toBeNull();f.revision(6);expect(await g.check(f.input(),request)).toBeNull();expect(g.isHeld()).toBe(false);expect(await g.check(f.input(),signal())).not.toBeNull();});
it('a prepared reply cannot cross a native state write, but the same endpoint can prepare the next turn',async()=>{const f=await startupAdmissionFixture();try{
 const e=await f.make().start(signal());expect(e).not.toBeNull();const pending=await e!.handle(fixtureRequest(f.resources.binding.secret,'fixture-stale-draft'));expect(pending.status).toBe(200);
 await f.write();await expect(pending.text()).rejects.toThrow();expect(f.drafts()).toBe(1);
 const next=await e!.handle(fixtureRequest(f.resources.binding.secret,'fixture-fresh-draft'));expect(next.status).toBe(200);expect(await next.text()).toContain('Synthetic checked output.');expect(f.drafts()).toBe(2);e!.end();
}finally{await f.close();}},30000);
it('a native update after durable consume suppresses old output without refunding or ending the owner',async()=>{const f=await startupAdmissionFixture();try{
 const consume=f.replayHooks.consume.getMockImplementation()!;let once=false;f.replayHooks.consume.mockImplementation(async(lease,floor,r,s)=>{const ack=await consume(lease,floor,r,s);if(!once){once=true;await f.write();}return ack;});
 const e=await f.make().start(signal());expect(e).not.toBeNull();const pending=await e!.handle(fixtureRequest(f.resources.binding.secret,'fixture-spent-stale'));expect(pending.status).toBe(200);await expect(pending.text()).rejects.toThrow();expect(once).toBe(true);
 expect((await e!.handle(fixtureRequest(f.resources.binding.secret,'fixture-spent-stale'))).status).toBe(409);
 const next=await e!.handle(fixtureRequest(f.resources.binding.secret,'fixture-spent-fresh'));expect(next.status).toBe(200);expect(await next.text()).toContain('Synthetic checked output.');expect(f.drafts()).toBe(2);e!.end();
}finally{await f.close();}},30000);
it('negative boundary: losing the newer public floor with a coordinated restore can admit an old consistent owner view',async()=>{const f=await startupAdmissionFixture();try{
 const e=await f.make().start(signal());expect(e).not.toBeNull();const db=await f.x.dbSnapshot(),authority=await f.x.authoritySnapshot(),marker=f.markerCopy(),lease=f.nativeLease();
 await f.write();const r=await e!.handle(fixtureRequest(f.resources.binding.secret,'fixture-retained-floor'));expect(r.status).toBe(200);await r.text();
 await f.x.dbRestore(db);await f.x.authorityRestore(authority);f.restoreMarker(marker);
 const oldPin={storeId:f.x.pin.storeId,generation:lease.generation,ownerDigest:lease.ownerDigest,bootDigest:lease.bootDigest,expiresAt:lease.expiresAt,minimumRevision:4};
 // Recreated read-only inspection lacks the independently retained revision 6.
 const view:any=await f.checkpoint.inspectOwnerFresh(oldPin,signal());expect(view.revision).toBe(4);expect(view.permissions).toEqual({write:false,reconcile:false,sign:false,resume:false});
 expect((await e!.handle(fixtureRequest(f.resources.binding.secret,'fixture-guard-still-retains-six'))).status).toBe(409);e!.end();
}finally{await f.close();}},30000);
it.each(['replace','unavailable'])('a prepared reply losing %s ownership evidence cannot settle its reservation as stale',async mode=>{const f=await startupAdmissionFixture();try{
 const consume=f.replayHooks.consume,e=await f.make().start(signal());expect(e).not.toBeNull();const pending=await e!.handle(fixtureRequest(f.resources.binding.secret,'fixture-invalid-owner'));expect(pending.status).toBe(200);
 if(mode==='replace')await f.replace();else f.x.setUnavailable(true);await expect(pending.text()).rejects.toThrow();expect(consume).not.toHaveBeenCalled();expect(f.drafts()).toBe(1);e!.end();
}finally{await f.close();}},30000);
it('an unknown stale-settlement result keeps the reservation held and never retries it',async()=>{const f=await startupAdmissionFixture();try{
 const consume=vi.fn(async()=>{throw Error('Unknown settlement');});f.replayHooks.consume.mockImplementation(consume);
 const e=await f.make().start(signal());expect(e).not.toBeNull();const pending=await e!.handle(fixtureRequest(f.resources.binding.secret,'fixture-unknown-settlement'));expect(pending.status).toBe(200);await f.write();await expect(pending.text()).rejects.toThrow();expect(consume).toHaveBeenCalledTimes(1);
 expect((await e!.handle(fixtureRequest(f.resources.binding.secret,'fixture-new-but-held'))).status).toBe(409);expect(consume).toHaveBeenCalledTimes(1);expect(f.drafts()).toBe(1);e!.end();
}finally{await f.close();}},30000);
