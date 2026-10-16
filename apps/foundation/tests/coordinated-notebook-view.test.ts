import {LocalConsultationReference} from '../src/media/local-consultation-reference.ts';
import {expect,it,vi} from 'vitest';
import {pairedOwnerFixture} from './support/cvi-paired-owner-fixture.ts';
import {createLocalCviViewPort} from '../src/server/local-cvi-view-port.ts';
import {LocalConsultationView} from '../src/session/local-consultation-view.ts';
const request=()=>new Request('https://app.example.test/notebook',{headers:{authorization:'Bearer fixture-customer'}});
const signal=()=>new AbortController().signal;
it('one genuine paired coordinator owns the view, edits, tentative budget and explicit preference projection',async()=>{
 const x=await pairedOwnerFixture();let view:LocalConsultationView|undefined;
 try{await x.start();view=new LocalConsultationView(createLocalCviViewPort(x.context,request()));expect(await view.refresh()).toBe(true);
 const values={occasion:'Outdoor wedding',season:'November',color:'Emerald',style:'Long sleeves',budget:'$500',lookType:'Full look',wardrobe:'Owned navy blazer'};
 for(const [field,value] of Object.entries(values))expect(await view.save(view.beginEdit(field as any)!,value)).toBe('applied');
 const shared=await x.context.snapshot(request(),signal());expect(view.snapshot().session).toEqual(shared);expect(shared!.notes.budget.status).toBe('tentative');expect(shared!.notes.season.value).toBe('November');expect(view.savePreferences(['budget'])).toBe(false);
 expect(await view.save(view.beginEdit('budget')!,'USD 350 maximum (items only)')).toBe('applied');expect(view.savePreferences(['budget'])).toBe(true);
 const before=await x.records();expect(await view.clear()).toBe(true);expect(Object.values(view.snapshot().session!.notes).every(n=>n.value==='')).toBe(true);expect(view.snapshot().saved.budget).toContain('350');expect(await x.records()).toEqual(before);expect(view.snapshot().releaseEnabled).toBe(false);
 }finally{view?.dispose();await x.close();}
},60000);
it('a genuine pending response is canceled by the same view Clear and cannot restore temporary notes',async()=>{
 const x=await pairedOwnerFixture();let view:LocalConsultationView|undefined,finish!:(v:string)=>void;
 try{const {wire,say}=await x.start();view=new LocalConsultationView(createLocalCviViewPort(x.context,request()));await view.refresh();await say('Long sleeves');await view.refresh();
 x.draft.mockImplementation(()=>new Promise(r=>finish=r));const pending=wire.handle(x.http('Long sleeves'));await vi.waitFor(()=>expect(finish).toBeTypeOf('function'),{timeout:8000});const before=await x.records();
 expect(await view.clear()).toBe(true);expect((await pending).status).not.toBe(200);finish('Discarded response');expect(Object.values(view.snapshot().session!.notes).every(n=>n.value==='')).toBe(true);expect(x.context.flow.snapshot().notes.coverage.text).toBe('');expect((await x.records()).length).toBe(before.length);expect((await wire.handle(x.http('Long sleeves'))).status).not.toBe(200);
 }finally{finish?.('Canceled');view?.dispose();await x.close();}
},60000);
it('a request for another synthetic customer cannot read or edit the captured consultation',async()=>{
 const x=await pairedOwnerFixture();let view:LocalConsultationView|undefined;
 try{await x.start();view=new LocalConsultationView(createLocalCviViewPort(x.context,new Request('https://app.example.test/notebook',{headers:{authorization:'Bearer other-customer'}})));expect(await view.refresh()).toBe(false);expect(view.snapshot().session).toBeNull();expect(view.beginEdit('budget')).toBeNull();expect(x.draft).not.toHaveBeenCalled();
 }finally{view?.dispose();await x.close();}
},60000);

it('the actual paired coordinator and local photo retain the same accepted wardrobe revision',async()=>{
 const x=await pairedOwnerFixture();let view:LocalConsultationView|undefined,reference:LocalConsultationReference|undefined;
 try{await x.start();const appPort=createLocalCviViewPort(x.context,request());view=new LocalConsultationView(appPort);await view.refresh();let serial=0;
 reference=new LocalConsultationReference(view,{normalize:async()=>new Blob(['generated pixels'],{type:'image/webp'}),createURL:()=>`blob:generated_${++serial}`,revokeURL:()=>{}});
 await reference.choose([new Blob(['generated test image'],{type:'image/png'})]);expect(await reference.confirm('Navy blazer','owned')).toBe(true);const first=reference.snapshot().reference;
 expect((await x.context.snapshot(request(),signal()))!.notes.wardrobe.value).toBe('Owned: Navy blazer');await view.save(view.beginEdit('budget')!,'USD 350 maximum (items only)');expect(reference.snapshot().reference).toEqual(first);
 const oldRevision=view.snapshot().session!.notes.wardrobe.revision;await reference.choose([new Blob(['second generated image'],{type:'image/png'})]);expect(await reference.confirm('Navy blazer','owned')).toBe(true);expect(view.snapshot().session!.notes.wardrobe.revision).toBe(oldRevision+1);expect(reference.snapshot().reference!.photo.id).not.toBe(first!.photo.id);
 const initial=await appPort.contextSnapshot(signal());expect(initial).not.toBeNull();const turn=await x.context.beginProposal(request(),'fixture-item-feedback',signal());expect(turn).not.toBeNull();expect((await x.context.acceptProposal(request(),turn!,0,[],true,signal()))?.status).toBe('accepted');const changed=await appPort.contextSnapshot(signal());expect(changed!.revision).toBe(initial!.revision);expect(changed!.inputRevision).toBeGreaterThan(initial!.inputRevision);expect(reference.snapshot().reference).not.toBeNull();
 const before=await x.records();await view.clear();expect(reference.snapshot().photos).toEqual([]);expect(reference.snapshot().reference).toBeNull();expect(await x.records()).toEqual(before);
 }finally{reference?.dispose();view?.dispose();await x.close();}
},60000);
