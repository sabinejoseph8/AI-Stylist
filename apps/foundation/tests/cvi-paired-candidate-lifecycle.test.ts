/** Synthetic identity/clock; real disposable original pair and native admissions. */
import {expect,it,vi} from 'vitest';
import {pairedOwnerFixture} from './support/cvi-paired-owner-fixture.ts';
import {candidateIllustrationPorts,candidateNoteFixture} from './support/cvi-candidate-illustrations.ts';
import {createLocalCviCandidateRehearsal} from '../src/server/local-cvi-candidate-rehearsal.ts';
import {createLocalCviViewPort} from '../src/server/local-cvi-view-port.ts';
import {LocalConsultationView} from '../src/session/local-consultation-view.ts';
import {LocalConsultationCandidate} from '../src/session/local-consultation-candidate.ts';
import {FIELDS} from '../../../packages/style-contracts/src/index.ts';
const request=(token='fixture-customer')=>new Request('https://app.example.test/notebook',{headers:{authorization:'Bearer '+token}}),signal=()=>new AbortController().signal;
async function fixture(){
 const x=await pairedOwnerFixture();await x.start();for(const [field] of FIELDS)expect(await x.context.edit(request(),{action:'edit',id:'lifecycle_setup_'+field,epoch:1,field,baseRevision:0,sequence:0,value:candidateNoteFixture[field]},signal())).toBe('applied');
 const ports=candidateIllustrationPorts(x.clock),service=createLocalCviCandidateRehearsal({simulation:true,context:x.context,request:request(),clock:x.clock,...ports}),view=new LocalConsultationView(createLocalCviViewPort(x.context,request()));expect(await view.refresh()).toBe(true);
 const client=new LocalConsultationCandidate(view,service);return{x,ports,service,view,client,close:async()=>{client.dispose();view.dispose();service.close();await x.close();}};
}
it('an admitted correction aborts the unfinished sample; delayed facts cannot recreate it',async()=>{
 const f=await fixture();try{
  let finish!:()=>void;const original=f.ports.facts.getMockImplementation()!;f.ports.facts.mockImplementationOnce(async look=>{await new Promise<void>(r=>{finish=r;});return original(look);});
  const pending=f.client.run();await vi.waitFor(()=>expect(finish).toBeTypeOf('function'));
  expect(await f.view.save(f.view.beginEdit('budget')!,'$500')).toBe('applied');expect(await pending).toBe(false);finish();
  expect(f.client.savedProjection()).toBeNull();expect(await f.client.run()).toBe(false);expect(f.view.snapshot().session!.notes.budget.status).toBe('tentative');
  expect(await f.view.save(f.view.beginEdit('budget')!,'USD 350 maximum (items only)')).toBe('applied');expect(await f.client.run()).toBe(true);expect(f.client.savedProjection()).not.toBeNull();expect((await f.x.f.x.inspect()).requests.length).toBeLessThanOrEqual(128);expect((await f.x.records()).length).toBe(0);
 }finally{await f.close();}
},120000);
it('native lease expiry hides current samples instead of admitting cached output',async()=>{
 const f=await fixture();try{expect(await f.client.run()).toBe(true);f.x.at(10000);expect(await f.view.refresh()).toBe(false);expect(f.client.snapshot().value).toBeNull();expect(f.client.savedProjection()).toBeNull();expect(await f.client.run()).toBe(false);expect((await f.x.records()).length).toBe(0);}finally{await f.close();}
},120000);
it('a foreign synthetic customer cannot read or edit the shared session or alter its current sample',async()=>{
 const f=await fixture();try{expect(await f.client.run()).toBe(true);const before=f.client.savedProjection(),other=createLocalCviViewPort(f.x.context,request('other-fixture-customer'));expect(await other.snapshot(signal())).toBeNull();expect(await other.contextSnapshot(signal())).toBeNull();expect(await other.edit({action:'edit',id:'foreign',epoch:1,field:'style',baseRevision:1,sequence:1,value:'Wrong customer'},signal())).toBe('unavailable');expect(f.client.savedProjection()).toEqual(before);expect(f.view.snapshot().session!.notes.style.value).toBe('Long sleeves');expect((await f.x.records()).length).toBe(0);}finally{await f.close();}
},120000);
it('reusing already-bound original startup resources is refused without replacing the first consultation',async()=>{
 const f=await fixture();try{expect(await f.client.run()).toBe(true);const before=f.client.savedProjection();expect(()=>f.x.make()).toThrow('Original private replay port required');expect(await f.view.refresh()).toBe(true);expect(f.view.snapshot().session!.notes.style.value).toBe('Long sleeves');expect(await f.client.run()).toBe(true);expect(f.client.savedProjection()!.items).toEqual(before!.items);expect((await f.x.f.x.inspect()).requests.length).toBeLessThanOrEqual(128);expect((await f.x.records()).length).toBe(0);}finally{await f.close();}
},120000);
