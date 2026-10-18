/** Synthetic view contracts; original-pair/browser evidence is separate. */
import {expect,it,vi} from 'vitest';
import {LocalPrivacy} from '../src/privacy/local-privacy.ts';
import {bindLocalConsultationPrivacy} from '../src/privacy/local-consultation-privacy.ts';
import {LocalConsultationView} from '../src/session/local-consultation-view.ts';
import {LocalConsultationReference} from '../src/media/local-consultation-reference.ts';
import {StylingSession} from '../src/session/styling-session.ts';
import {APPROVED_NOTES_RETENTION} from '../src/session/notes-retention-policy.ts';
function fixture(privacy=new LocalPrivacy()){
 const session=new StylingSession({simulation:true,owner:'sample',clock:()=>0,policy:APPROVED_NOTES_RETENTION});let reset=()=>{};
 const port={snapshot:vi.fn(async()=>session.snapshot('sample')),edit:vi.fn(async(c:any)=>session.update('sample',{...c,status:'confirmed',origin:'touch'})),clear:vi.fn(async()=>{const result=session.clear('sample');reset();return result;}),end:vi.fn(async()=>session.end('sample')),onReset:(fn:()=>void)=>{reset=fn;return()=>{};}};
 const view=new LocalConsultationView(port),pixels=new Blob(['generated PNG pixels'],{type:'image/png'}),revoke=vi.fn();let serial=0;
 const reference=new LocalConsultationReference(view,{normalize:async()=>pixels,createURL:()=>`blob:private_fixture_${++serial}`,revokeURL:revoke});
 const stop=bindLocalConsultationPrivacy(privacy,view,reference);
 return{session,port,view,reference,privacy,pixels,revoke,close:()=>{stop();reference.dispose();view.dispose();}};
}
it('exports the same seven notes and normalized photo without internal versions, blob URLs or credentials',async()=>{
 const x=fixture();try{await x.view.refresh();await x.view.save(x.view.beginEdit('budget')!,'USD 350 maximum (items only)');x.view.savePreferences(['budget']);
 await x.reference.choose([new Blob(['generated source'])]);expect(await x.reference.confirm('Navy blazer','owned')).toBe(true);
 expect(await x.privacy.prepare(['session','preferences'])).toBe(true);const json=x.privacy.snapshot().ready!.json,out=JSON.parse(json);
 expect(Object.keys(out.categories)).toEqual(['session','preferences']);expect(out.categories.session.data.notes).toHaveLength(7);
 expect(out.categories.session.data.notes.find((n:any)=>n.field==='wardrobe')).toMatchObject({value:'Owned: Navy blazer',status:'confirmed'});
 expect(out.categories.session.data.reference).toEqual({description:'Navy blazer',ownership:'owned',photoId:'session_photo_1'});
 expect(out.categories.session.photos[0]).toEqual({id:'session_photo_1',type:'image/png',base64:Buffer.from(await x.pixels.arrayBuffer()).toString('base64')});
 expect(out.categories.preferences.data).toEqual({budget:'USD 350 maximum (items only)'});expect(json).not.toMatch(/blob:|token|fence|nativeRevision|Authorization/);
 }finally{x.close();}
});
it('pending input invalidates an already prepared export and prevents an old session export',async()=>{
 const x=fixture();try{await x.view.refresh();x.view.requireInputTransport();expect(await x.privacy.prepare(['session'])).toBe(false);
 x.view.observeInput({serial:0,phase:'settled'});expect(await x.privacy.prepare(['session'])).toBe(true);const ready=x.privacy.snapshot().ready!;
 x.view.observeInput({serial:1,phase:'pending'});expect(x.privacy.snapshot().ready).toBeNull();expect(x.privacy.consume(ready)).toBeNull();expect(await x.privacy.prepare(['session'])).toBe(false);
 x.view.observeInput({serial:2,phase:'settled'});await vi.waitFor(()=>expect(x.view.snapshot().busy).toBe(false));expect(await x.privacy.prepare(['session'])).toBe(true);
 }finally{x.close();}
});
it('a touch edit and reference replacement invalidate earlier prepared copies',async()=>{
 const x=fixture();try{await x.view.refresh();await x.reference.choose([new Blob(['first'])]);await x.reference.confirm('Blazer','owned');await x.privacy.prepare(['session']);const ready=x.privacy.snapshot().ready!;
 await x.view.save(x.view.beginEdit('color')!,'Emerald');expect(x.privacy.current(ready)).toBe(false);
 await x.privacy.prepare(['session']);const before=x.privacy.snapshot().ready!;await x.reference.choose([new Blob(['second'])]);expect(x.privacy.consume(before)).toBeNull();expect(await x.reference.confirm('Coat','inspiration')).toBe(true);
 await x.privacy.prepare(['session']);expect(JSON.parse(x.privacy.snapshot().ready!.json).categories.session.data.reference.description).toBe('Coat');
 }finally{x.close();}
});
it('a delayed photo encoder cannot publish after the same shared session is cleared',async()=>{
 let finish!:(value:string)=>void;const x=fixture(new LocalPrivacy(()=>new Promise(r=>{finish=r;})));
 try{await x.view.refresh();await x.reference.choose([new Blob(['generated'])]);await x.reference.confirm('Blazer','owned');const pending=x.privacy.prepare(['session']);await vi.waitFor(()=>expect(finish).toBeTypeOf('function'));
 expect(await x.privacy.clearAsync(['session'])).toBe(true);finish(Buffer.from(await x.pixels.arrayBuffer()).toString('base64'));expect(await pending).toBe(false);expect(x.privacy.snapshot().ready).toBeNull();expect(x.reference.exportPhotos()).toEqual([]);expect(x.view.snapshot().session!.notes.wardrobe.value).toBe('');
 }finally{x.close();}
});
it('session clearing awaits acknowledgment and preserves separately saved categories',async()=>{
 const x=fixture();try{await x.view.refresh();await x.view.save(x.view.beginEdit('budget')!,'USD 350 maximum (items only)');x.view.savePreferences(['budget']);await x.reference.choose([new Blob(['generated'])]);await x.reference.confirm('Blazer','owned');
 const other=vi.fn();for(const category of ['wardrobe','looks','shopping'] as const)x.privacy.bind(category,{read:()=>({data:{saved:true},photos:[]}),clear:other});
 let finish!:(ok:boolean)=>void;x.port.clear.mockImplementationOnce(()=>new Promise(r=>{finish=r;}));const pending=x.privacy.clearAsync(['session']);await vi.waitFor(()=>expect(finish).toBeTypeOf('function'));
 expect(x.privacy.snapshot().clearing).toBe(true);expect(x.privacy.snapshot().message).not.toContain('were cleared');expect(x.view.snapshot().session).toBeNull();expect(x.reference.snapshot().photos).toEqual([]);
 x.session.clear('sample');finish(true);expect(await pending).toBe(true);expect(x.view.snapshot().session!.notes.budget.value).toBe('');expect(x.view.snapshot().saved.budget).toContain('350');expect(other).not.toHaveBeenCalled();
 expect(await x.privacy.prepare(['preferences'])).toBe(true);expect(JSON.parse(x.privacy.snapshot().ready!.json).categories.preferences.data.budget).toContain('350');
 }finally{x.close();}
});
it('failed shared cleanup reports failure and cannot clear selected preferences afterward',async()=>{
 const x=fixture();try{await x.view.refresh();await x.view.save(x.view.beginEdit('budget')!,'USD 350 maximum (items only)');x.view.savePreferences(['budget']);x.port.clear.mockResolvedValueOnce(false);
 expect(await x.privacy.clearAsync(['session','preferences'])).toBe(false);expect(x.privacy.snapshot().message).toContain('could not be confirmed');expect(x.view.snapshot().session).toBeNull();expect(x.view.snapshot().saved.budget).toContain('350');expect(await x.privacy.prepare(['session'])).toBe(false);
 }finally{x.close();}
});
it('clearing saved preferences leaves the current shared notes unchanged',async()=>{
 const x=fixture();try{await x.view.refresh();await x.view.save(x.view.beginEdit('budget')!,'USD 350 maximum (items only)');x.view.savePreferences(['budget']);expect(await x.privacy.clearAsync(['preferences'])).toBe(true);expect(x.view.snapshot().saved).toEqual({});expect(x.view.snapshot().session!.notes.budget.value).toContain('350');expect(x.port.clear).not.toHaveBeenCalled();}finally{x.close();}
});
it('foreign reference bindings are refused before any source becomes available',()=>{
 const a=fixture(),b=fixture(),privacy=new LocalPrivacy();try{expect(()=>bindLocalConsultationPrivacy(privacy,a.view,b.reference)).toThrow();expect(privacy.clear(['preferences'])).toBe(false);}finally{a.close();b.close();}
});
it('held, ended and disposed views never export stale session notes',async()=>{
 for(const action of ['transportLost','end','dispose'] as const){const x=fixture();try{await x.view.refresh();await x.view.save(x.view.beginEdit('style')!,'Long sleeves');await x.privacy.prepare(['session']);const ready=x.privacy.snapshot().ready!;await x.view[action]();expect(x.privacy.consume(ready)).toBeNull();expect(await x.privacy.prepare(['session'])).toBe(false);}finally{x.close();}}
});
