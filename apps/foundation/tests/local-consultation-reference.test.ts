import {expect,it,vi} from 'vitest';
import {LocalConsultationReference} from '../src/media/local-consultation-reference.ts';
import {LocalConsultationView} from '../src/session/local-consultation-view.ts';
import {StylingSession} from '../src/session/styling-session.ts';
import {APPROVED_NOTES_RETENTION} from '../src/session/notes-retention-policy.ts';
function fixture(normalize:((file:Blob)=>Promise<Blob>)=async()=>new Blob(['generated pixels'],{type:'image/webp'})){
 const session=new StylingSession({simulation:true,owner:'sample',clock:()=>0,policy:APPROVED_NOTES_RETENTION});let reset=()=>{},serial=0;
 const edit=vi.fn(async(c:any)=>session.update('sample',{...c,status:'confirmed',origin:'touch'}));
 const view=new LocalConsultationView({snapshot:async()=>session.snapshot('sample'),edit,clear:async()=>{const ok=session.clear('sample');reset();return ok;},end:async()=>{const ok=session.end('sample');reset();return ok;},onReset:listener=>{reset=listener;return()=>{};}});
 const revoke=vi.fn(),reference=new LocalConsultationReference(view,{normalize,createURL:()=>`blob:generated_${++serial}`,revokeURL:revoke});
 return{session,edit,view,reference,revoke,close:()=>{reference.dispose();view.dispose();}};
}
const photo=()=>new Blob(['generated image fixture'],{type:'image/png'});
it('confirms the same photo and accepted wardrobe description without transmitting pixels or URLs',async()=>{
 const x=fixture();try{await x.view.refresh();await x.reference.choose([photo()]);expect(x.reference.snapshot().reference).toBeNull();expect(await x.reference.confirm('Navy blazer','owned')).toBe(true);expect(x.view.snapshot().session!.notes.wardrobe.value).toBe('Owned: Navy blazer');expect(x.reference.snapshot().reference?.ownership).toBe('owned');expect(JSON.stringify(x.edit.mock.calls)).not.toMatch(/blob:|pixels|image\//);}finally{x.close();}
});
it('does not confirm a photo optimistically while shared acknowledgment is pending',async()=>{
 const x=fixture();let done!:(v:any)=>void;try{await x.view.refresh();await x.reference.choose([photo()]);x.edit.mockImplementationOnce(()=>new Promise(r=>done=r));const pending=x.reference.confirm('Blazer','owned');await vi.waitFor(()=>expect(done).toBeTypeOf('function'));expect(x.reference.snapshot().reference).toBeNull();expect(await x.reference.choose([photo()])).toBe(false);done('unavailable');expect(await pending).toBe(false);expect(x.reference.snapshot().reference).toBeNull();}finally{x.close();}
});
it('choosing replacement photos preserves the old accepted reference until shared confirmation',async()=>{
 const x=fixture();try{await x.view.refresh();await x.reference.choose([photo()]);await x.reference.confirm('Navy blazer','owned');const first=x.reference.snapshot().reference;await x.reference.choose([photo()]);expect(x.reference.snapshot().reference).toEqual(first);expect(await x.reference.confirm('Red jacket','inspiration')).toBe(true);expect(x.reference.snapshot().reference?.photo.id).not.toBe(first!.photo.id);expect(x.view.snapshot().session!.notes.wardrobe.value).toBe('Inspiration: Red jacket');expect(x.revoke).toHaveBeenCalledWith(first!.photo.url);}finally{x.close();}
});
it('a second photo with the same description advances the shared reference field revision',async()=>{
 const x=fixture();try{await x.view.refresh();await x.reference.choose([photo()]);await x.reference.confirm('Blazer','owned');const revision=x.view.snapshot().session!.notes.wardrobe.revision;await x.reference.choose([photo()]);await x.reference.confirm('Blazer','owned');expect(x.view.snapshot().session!.notes.wardrobe.revision).toBe(revision+1);expect(x.reference.snapshot().reference!.photo.id).toBe(2);}finally{x.close();}
});
it('unrelated budget changes retain the reference while direct wardrobe correction invalidates it',async()=>{
 const x=fixture();try{await x.view.refresh();await x.reference.choose([photo()]);await x.reference.confirm('Blazer','owned');const ref=x.reference.snapshot().reference;await x.view.save(x.view.beginEdit('budget')!,'USD 350 maximum (items only)');expect(x.reference.snapshot().reference).toEqual(ref);await x.view.save(x.view.beginEdit('wardrobe')!,'Different owned piece');expect(x.reference.snapshot().reference).toBeNull();expect(x.reference.snapshot().photos).toEqual([]);expect(x.revoke).toHaveBeenCalledWith(ref!.photo.url);}finally{x.close();}
});
it.each(['clear','end','transportLost'] as const)('%s clears photo URLs and refuses late confirmation',async action=>{
 const x=fixture();let done!:(v:any)=>void;try{await x.view.refresh();await x.reference.choose([photo()]);x.edit.mockImplementationOnce(()=>new Promise(r=>done=r));const pending=x.reference.confirm('Blazer','owned');await vi.waitFor(()=>expect(done).toBeTypeOf('function'));await x.view[action]();done('applied');expect(await pending).toBe(false);expect(x.reference.snapshot().reference).toBeNull();expect(x.reference.snapshot().photos).toEqual([]);expect(x.revoke).toHaveBeenCalled();}finally{x.close();}
});
it('explicit removal advances shared context and removes only the accepted session reference',async()=>{
 const x=fixture();try{await x.view.refresh();await x.reference.choose([photo()]);await x.reference.confirm('Blazer','owned');expect(await x.reference.removeReference()).toBe(true);expect(x.reference.snapshot().reference).toBeNull();expect(x.view.snapshot().session!.notes.wardrobe.value).toBe('No confirmed session reference');}finally{x.close();}
});
it('refuses missing ownership, oversized descriptions and confirmation before shared readiness',async()=>{
 const x=fixture();try{expect(await x.reference.choose([photo()])).toBe(false);await x.view.refresh();await x.reference.choose([photo()]);expect(await x.reference.confirm('Blazer',null as any)).toBe(false);expect(await x.reference.confirm('x'.repeat(121),'owned')).toBe(false);expect(x.edit).not.toHaveBeenCalled();}finally{x.close();}
});

it('late image decoding after shared Clear cannot return a photo or accepted reference',async()=>{
 let done!:(v:Blob)=>void;const x=fixture(()=>new Promise(r=>done=r));try{await x.view.refresh();const pending=x.reference.choose([photo()]);await x.view.clear();done(new Blob(['late pixels'],{type:'image/webp'}));expect(await pending).toBe(false);expect(x.reference.snapshot().photos).toEqual([]);expect(x.reference.snapshot().reference).toBeNull();}finally{x.close();}
});
it('failed photo preparation reports a finished error without replacing the old accepted reference',async()=>{
 let fail=false;const x=fixture(async()=>{if(fail)throw Error('Synthetic decode failure');return new Blob(['generated pixels'],{type:'image/webp'});});try{await x.view.refresh();await x.reference.choose([photo()]);await x.reference.confirm('Blazer','owned');const old=x.reference.snapshot().reference;fail=true;expect(await x.reference.choose([photo()])).toBe(false);expect(x.reference.snapshot().reference).toEqual(old);expect(x.reference.snapshot().message).toContain('could not be prepared');expect(x.reference.snapshot().loading).toBe(false);}finally{x.close();}
});

it('a duplicate-looking applied reply cannot bind a new photo to an unchanged wardrobe revision',async()=>{
 const x=fixture();try{await x.view.refresh();await x.reference.choose([photo()]);await x.reference.confirm('Blazer','owned');const first=x.reference.snapshot().reference;await x.reference.choose([photo()]);x.edit.mockResolvedValueOnce('applied');expect(await x.reference.confirm('Blazer','owned')).toBe(false);expect(x.reference.snapshot().reference).toEqual(first);}finally{x.close();}
});
it('a refused replacement keeps the old accepted reference and shared wardrobe value',async()=>{
 const x=fixture();try{await x.view.refresh();await x.reference.choose([photo()]);await x.reference.confirm('Blazer','owned');const first=x.reference.snapshot().reference;await x.reference.choose([photo()]);x.edit.mockResolvedValueOnce('unavailable');expect(await x.reference.confirm('Red jacket','inspiration')).toBe(false);expect(x.reference.snapshot().reference).toEqual(first);expect(x.view.snapshot().session!.notes.wardrobe.value).toBe('Owned: Blazer');}finally{x.close();}
});

it('pending and provisional transcript notices preserve the confirmed photo and its accepted metadata',async()=>{const x=fixture();try{await x.view.refresh();await x.reference.choose([photo()]);await x.reference.confirm('Navy blazer','owned');const ref=x.reference.snapshot().reference;x.view.observeInput({serial:0,phase:'settled'});x.view.observeInput({serial:1,phase:'pending'});expect(x.reference.snapshot().reference).toEqual(ref);x.session.update('sample',{id:'partial_style',epoch:1,field:'style',baseRevision:0,sequence:0,value:'Long sleeves',status:'tentative',origin:'speech'});x.view.observeInput({serial:2,phase:'partial'});await vi.waitFor(()=>expect(x.view.snapshot().session?.notes.style.value).toBe('Long sleeves'));expect(x.reference.snapshot().reference).toEqual(ref);expect(x.view.snapshot().inputPending).toBe(true);x.session.update('sample',{id:'final_style',epoch:1,field:'style',baseRevision:1,sequence:1,value:'Long sleeves',status:'confirmed',origin:'speech'});x.view.observeInput({serial:3,phase:'settled'});await vi.waitFor(()=>expect(x.view.snapshot().session?.notes.style.status).toBe('confirmed'));expect(x.reference.snapshot().reference).toEqual(ref);expect(x.revoke).not.toHaveBeenCalled();}finally{x.close();}});
