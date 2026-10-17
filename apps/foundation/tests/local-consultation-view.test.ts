import {expect,it,vi} from 'vitest';
import {LocalConsultationView,consultationSnapshot} from '../src/session/local-consultation-view.ts';
import {StylingSession} from '../src/session/styling-session.ts';
import {APPROVED_NOTES_RETENTION} from '../src/session/notes-retention-policy.ts';
function fixture(){
 const session=new StylingSession({simulation:true,owner:'sample',clock:()=>0,policy:APPROVED_NOTES_RETENTION});let reset=()=>{};
 const port={snapshot:vi.fn(async()=>session.snapshot('sample')),edit:vi.fn(async(c:any)=>session.update('sample',{...c,status:c.field==='budget'&&c.value==='$500'?'tentative':'confirmed',origin:'touch'})),clear:vi.fn(async()=>{const ok=session.clear('sample');reset();return ok;}),end:vi.fn(async()=>{const ok=session.end('sample');reset();return ok;}),onReset:(listener:()=>void)=>{reset=listener;return()=>{reset=()=>{};};}};
 return{session,port,view:new LocalConsultationView(port),reset:()=>reset()};
}
it('shows only accepted shared notes and keeps ambiguous budget tentative',async()=>{
 const x=fixture();expect(await x.view.refresh()).toBe(true);const edit=x.view.beginEdit('budget')!;let done!:(v:any)=>void;
 x.port.edit.mockImplementationOnce(()=>new Promise(r=>done=r));const pending=x.view.save(edit,'$500');expect(x.view.snapshot().session!.notes.budget.value).toBe('');expect(x.view.snapshot().busy).toBe(true);
 await vi.waitFor(()=>expect(done).toBeTypeOf('function'));x.session.update('sample',{id:'host',epoch:1,field:'budget',baseRevision:0,sequence:0,value:'$500',status:'tentative',origin:'touch'});done('applied');expect(await pending).toBe('applied');expect(x.view.snapshot().session!.notes.budget.status).toBe('tentative');expect(x.view.savePreferences(['budget'])).toBe(false);expect(x.view.snapshot().releaseEnabled).toBe(false);x.view.dispose();
});
it('edits carry captured field revision and refuse an old edit after refresh',async()=>{
 const x=fixture();await x.view.refresh();const old=x.view.beginEdit('style')!;expect(await x.view.save(old,'Long sleeves')).toBe('applied');expect(x.port.edit).toHaveBeenCalledWith({action:'edit',id:'view_1',epoch:1,field:'style',baseRevision:0,sequence:0,value:'Long sleeves'},expect.any(AbortSignal));expect(await x.view.save(old,'Short sleeves')).toBe('stale');expect(x.port.edit).toHaveBeenCalledTimes(1);x.view.dispose();
});
it('confirm commands never supply a client-selected replacement value',async()=>{
 const x=fixture();await x.view.refresh();await x.view.save(x.view.beginEdit('occasion')!,'Wedding');await x.view.confirm('occasion');expect(x.port.edit.mock.calls.at(-1)![0]).toEqual({action:'confirm',id:'view_2',epoch:1,field:'occasion',baseRevision:1,sequence:1});x.view.dispose();
});
it.each(['clear','end','transportLost','dispose'] as const)('%s hides notes immediately and drops a late edit reply',async action=>{
 const x=fixture();await x.view.refresh();await x.view.save(x.view.beginEdit('style')!,'Long sleeves');let done!:(v:any)=>void;x.port.edit.mockImplementationOnce(()=>new Promise(r=>done=r));const pending=x.view.save(x.view.beginEdit('style')!,'Late old value');await vi.waitFor(()=>expect(done).toBeTypeOf('function'));const cleanup=x.view[action]();expect(x.view.snapshot().session).toBeNull();done('applied');expect(await pending).toBe('unavailable');await cleanup;expect(x.view.snapshot().session?.notes.style.value??'').not.toBe('Late old value');x.view.dispose();
});
it('selected saved sample preferences survive Clear and End but dispose removes them',async()=>{
 const x=fixture();await x.view.refresh();await x.view.save(x.view.beginEdit('budget')!,'USD 350 maximum (items only)');expect(x.view.savePreferences(['budget'])).toBe(true);expect(x.view.savePreferences(['occasion'])).toBe(false);await x.view.clear();expect(x.view.snapshot().session!.notes.budget.value).toBe('');expect(x.view.snapshot().saved).toEqual({budget:'USD 350 maximum (items only)'});await x.view.end();expect(x.view.snapshot().state).toBe('ended');expect(x.view.snapshot().saved.budget).toContain('350');x.view.transportLost();expect(x.view.snapshot().state).toBe('ended');x.view.dispose();expect(x.view.snapshot().saved).toEqual({});
});
it('a failed edit acknowledgment never becomes an optimistic confirmation',async()=>{
 const x=fixture();await x.view.refresh();x.port.edit.mockRejectedValueOnce(Error('Unknown outcome'));expect(await x.view.save(x.view.beginEdit('style')!,'Long sleeves')).toBe('unavailable');expect(x.view.snapshot().session).toBeNull();expect(x.view.snapshot().state).toBe('held');x.view.dispose();
});
it('late snapshot after reset cannot display a discarded epoch',async()=>{
 const x=fixture(),raw=x.session.snapshot('sample');let done!:(v:any)=>void;x.port.snapshot.mockImplementationOnce(()=>new Promise(r=>done=r));const pending=x.view.refresh();await vi.waitFor(()=>expect(done).toBeTypeOf('function'));x.reset();done(raw);expect(await pending).toBe(false);expect(x.view.snapshot().session).toBeNull();x.view.dispose();
});
it('transport failure does not discard the monotonic snapshot floor',async()=>{
 const x=fixture();await x.view.refresh();const old=x.session.snapshot('sample');await x.view.save(x.view.beginEdit('style')!,'Long sleeves');x.view.transportLost();x.port.snapshot.mockResolvedValueOnce(old);expect(await x.view.refresh()).toBe(false);expect(x.view.snapshot().session).toBeNull();x.view.dispose();
});
it('same-version changed content and malformed replies are refused',async()=>{
 const x=fixture();await x.view.refresh();const forged=structuredClone(x.session.snapshot('sample'))!;(forged.notes as any).style={value:'Forged',status:'confirmed',origin:'touch',scope:'session',revision:0,sequence:-1};x.port.snapshot.mockResolvedValueOnce(forged);expect(await x.view.refresh()).toBe(false);expect(x.view.snapshot().session).toBeNull();
 for(const raw of [null,{}, {...forged,extra:true},{...forged,epoch:-1},{...forged,notes:{style:forged.notes.style}}])expect(consultationSnapshot(raw)).toBeNull();x.view.dispose();
});
it('returned snapshots and captured port functions cannot be mutated',async()=>{
 const x=fixture();x.port.snapshot=vi.fn(async()=>null);expect(await x.view.refresh()).toBe(true);const s=x.view.snapshot().session!;expect(Object.isFrozen(s.notes.style)).toBe(true);expect(()=>{(s.notes.style as any).value='Changed';}).toThrow();expect(s.notes.style.value).toBe('');x.view.dispose();
});

it('a stalled snapshot resolves on cancellation even if its port ignores abort',async()=>{
 const x=fixture();x.port.snapshot.mockImplementationOnce(()=>new Promise(()=>{}));const pending=x.view.refresh();x.view.transportLost();expect(await pending).toBe(false);expect(x.view.snapshot().busy).toBe(false);x.view.dispose();
});
it('the view refuses a stalled port at the unchanged eight-second bound',async()=>{
 vi.useFakeTimers();const x=fixture();try{x.port.snapshot.mockImplementationOnce(()=>new Promise(()=>{}));const pending=x.view.refresh();await vi.advanceTimersByTimeAsync(8000);expect(await pending).toBe(false);expect(x.view.snapshot().state).toBe('held');}finally{x.view.dispose();vi.useRealTimers();}
});

it('warning-only changes at the same note revision are accepted without inferring note edits',async()=>{
 const x=fixture();await x.view.refresh();const warning={...x.session.snapshot('sample')!,warning:true};x.port.snapshot.mockResolvedValueOnce(warning);expect(await x.view.refresh()).toBe(true);expect(x.view.snapshot().session!.warning).toBe(true);x.view.dispose();
});

it.each(['clear','end'] as const)('a stalled %s acknowledgment is bounded and never claims remote cleanup',async action=>{
 const x=fixture();await x.view.refresh();x.port[action].mockImplementationOnce(()=>new Promise(()=>{}));vi.useFakeTimers();try{const pending=x.view[action]();await vi.advanceTimersByTimeAsync(8000);expect(await pending).toBe(false);expect(x.view.snapshot().session).toBeNull();if(action==='end')expect(x.view.snapshot().state).toBe('ended');}finally{x.view.dispose();vi.useRealTimers();}
});

it('browser cancellation does not require AbortSignal.any',async()=>{
 const any=vi.spyOn(AbortSignal,'any').mockImplementation(()=>{throw Error('Browser feature unavailable');});const x=fixture();try{expect(await x.view.refresh()).toBe(true);expect(await x.view.save(x.view.beginEdit('style')!,'Long sleeves')).toBe('applied');expect(any).not.toHaveBeenCalled();}finally{x.view.dispose();any.mockRestore();}
});

it('explicit sample sign-out clears saved preferences while ordinary End preserves them',async()=>{const x=fixture();await x.view.refresh();await x.view.save(x.view.beginEdit('budget')!,'USD 350 maximum (items only)');expect(x.view.savePreferences(['budget'])).toBe(true);await x.view.end();expect(x.view.snapshot().saved.budget).toContain('350');x.view.clearSavedPreferences();expect(x.view.snapshot().saved).toEqual({});expect(x.view.snapshot().state).toBe('ended');x.view.dispose();});
