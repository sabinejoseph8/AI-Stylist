/** Actual pair, SQLite, signatures and read admissions. Renderer callbacks,
 * identity and logical clock remain synthetic; no protected output is sent. */
import {expect,it} from 'vitest';
import {pairedOwnerFixture} from './support/cvi-paired-owner-fixture.ts';
import {candidateIllustrationPorts,candidateNoteFixture} from './support/cvi-candidate-illustrations.ts';
import {createLocalCviCandidateRehearsal} from '../src/server/local-cvi-candidate-rehearsal.ts';
import type {SampleReference} from '../src/server/local-cvi-candidate-rehearsal.ts';
import {FIELDS} from '../../../packages/style-contracts/src/index.ts';
const request=()=>new Request('https://app.example.test/notebook',{headers:{authorization:'Bearer fixture-customer'}}),signal=()=>new AbortController().signal;
it('three illustrative rounds use one genuine paired context without changing notes, owned/kept pieces or the 128-record cap',async()=>{
 const x=await pairedOwnerFixture();let model:ReturnType<typeof createLocalCviCandidateRehearsal>|undefined;
 try{
  await x.start();for(const [field] of FIELDS)expect(await x.context.edit(request(),{action:'edit',id:'candidate_setup_'+field,epoch:1,field,baseRevision:0,sequence:0,value:candidateNoteFixture[field]},signal())).toBe('applied');
  const notes=await x.context.snapshot(request(),signal());expect(notes).not.toBeNull();const reference:SampleReference={epoch:notes!.epoch,fieldRevision:notes!.notes.wardrobe.revision,photoId:1,description:'Navy blazer',ownership:'owned'},ports=candidateIllustrationPorts(x.clock);
  model=createLocalCviCandidateRehearsal({simulation:true,context:x.context,request:request(),clock:x.clock,...ports});let s=(await model.snapshot(signal()))!;expect(s).not.toBeNull();s=(await model.prepare({expected:s.version,reference},signal()))!;expect(s.state).toBe('sample');const dress=s.look!.items[0],owned=s.look!.items.find(p=>p.owned);
  s=(await model.feedback({expected:s.version,kind:'keep',target:{kind:'item',itemId:dress.id},text:'Keep the dress'},signal()))!;expect(s).not.toBeNull();s=(await model.prepare({expected:s.version,reference},signal()))!;
  for(let i=1;i<=3;i++){const shoe=s.look!.items.find(p=>p.slot==='shoes')!;s=(await model.feedback({expected:s.version,kind:'change',target:{kind:'item',itemId:shoe.id},text:'Change these shoes'},signal()))!;expect(s).not.toBeNull();s=(await model.prepare({expected:s.version,reference},signal()))!;expect(s.state).toBe('sample');expect(s.feedback.round).toBe(i);expect(s.look!.items[0]).toEqual(dress);expect(s.look!.items.find(p=>p.owned)).toEqual(owned);expect(s).toMatchObject({releaseEnabled:false,audioEnabled:false,shoppingEnabled:false});}
  expect(await x.context.snapshot(request(),signal())).toEqual(notes);const authority=await x.f.x.inspect();expect(authority.requests.length).toBeLessThanOrEqual(128);expect(ports.build).toHaveBeenCalledTimes(5);expect(ports.build.mock.calls.map(([input])=>input.version.inputRevision)).toEqual([0,1,2,3,4]);expect((await x.records()).length).toBe(0);process.stdout.write(JSON.stringify({scope:'illustrative-paired-candidate',authorityRecords:authority.requests.length,authorityRecordCap:128,illustratedBuilds:5,protectedOutputs:0})+'\n');
 }finally{model?.close();await x.close();}
},120000);
