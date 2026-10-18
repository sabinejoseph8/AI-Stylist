/** Original local paired coordinator and stores. Identity/extraction stay synthetic. */
import {expect,it,vi} from 'vitest';
import {pairedOwnerFixture} from './support/cvi-paired-owner-fixture.ts';
import {createLocalCviViewPort} from '../src/server/local-cvi-view-port.ts';
import {LocalConsultationView} from '../src/session/local-consultation-view.ts';
import {LocalConsultationReference} from '../src/media/local-consultation-reference.ts';
import {LocalPrivacy} from '../src/privacy/local-privacy.ts';
import {bindLocalConsultationPrivacy} from '../src/privacy/local-consultation-privacy.ts';
it('exports original accepted notes and normalized photo, clears that context and preserves explicit sample preferences',async()=>{
 const x=await pairedOwnerFixture();let view:LocalConsultationView|undefined,reference:LocalConsultationReference|undefined,stop=()=>{};
 const request=()=>new Request('https://app.example.test/notebook',{headers:{authorization:'Bearer fixture-customer'}}),signal=()=>new AbortController().signal;
 try{
  const run=await x.start();view=new LocalConsultationView(createLocalCviViewPort(x.context,request()));await view.refresh();
  reference=new LocalConsultationReference(view,{normalize:async()=>new Blob(['generated normalized PNG'],{type:'image/png'}),createURL:()=> 'blob:generated-paired-photo',revokeURL:vi.fn()});
  const privacy=new LocalPrivacy();stop=bindLocalConsultationPrivacy(privacy,view,reference);const others=vi.fn();
  for(const category of ['wardrobe','looks','shopping'] as const)privacy.bind(category,{read:()=>({data:{saved:true},photos:[]}),clear:others});
  expect(await view.save(view.beginEdit('budget')!,'USD 350 maximum (items only)')).toBe('applied');expect(view.savePreferences(['budget'])).toBe(true);
  await reference.choose([new Blob(['generated source'])]);expect(await reference.confirm('Navy blazer','owned')).toBe(true);expect((await run.say('Long sleeves')).status).toBe('applied');await view.refresh();
  expect(await privacy.prepare(['session','preferences'])).toBe(true);const prepared=privacy.snapshot().ready!,out=JSON.parse(prepared.json),authoritative=await x.context.snapshot(request(),signal());
  if(!authoritative)throw Error('Original snapshot unavailable');
  for(const note of out.categories.session.data.notes)expect(note.value).toBe(authoritative!.notes[note.field as keyof typeof authoritative.notes].value);
  expect(out.categories.session.data.notes.find((n:any)=>n.field==='style').status).toBe('tentative');expect(out.categories.session.photos[0].type).toBe('image/png');expect(prepared.json).not.toMatch(/blob:|fixture-customer|nativeRevision|token|fence/);
  const before=await x.records();expect(await privacy.clearAsync(['session'])).toBe(true);expect(privacy.consume(prepared)).toBeNull();expect(Object.values((await x.context.snapshot(request(),signal()))!.notes).every(n=>n.value==='')).toBe(true);expect(reference.exportPhotos()).toEqual([]);expect(view.snapshot().saved.budget).toContain('350');expect(others).not.toHaveBeenCalled();expect(await x.records()).toEqual(before);
  expect(await privacy.prepare(['preferences'])).toBe(true);expect(JSON.parse(privacy.snapshot().ready!.json).categories.preferences.data.budget).toContain('350');
  const authorityRecords=(await x.f.x.inspect()).requests.length;expect(authorityRecords).toBeLessThanOrEqual(128);expect(await x.records()).toHaveLength(0);expect(x.draft).not.toHaveBeenCalled();process.stdout.write(JSON.stringify({scope:'shared-privacy-original-pair',authorityRecords,authorityRecordCap:128,protectedOutputs:0})+'\n');
 }finally{stop();reference?.dispose();view?.dispose();await x.close();}
},60000);
