import {it,expect,vi} from 'vitest';
import {createPrivateNotesPageRehearsal} from '../src/private-notes-trial-page-rehearsal.ts';
it('requires explicit simulation and returns a local availability response',async()=>{expect(()=>createPrivateNotesPageRehearsal({} as never)).toThrow('disabled');const rehearsal=createPrivateNotesPageRehearsal({simulation:true,page:new EventTarget(),visibility:Object.assign(new EventTarget(),{hidden:false})});expect(await (await rehearsal.availability(new AbortController().signal)).json()).toEqual({version:1,enabled:true,noticeVersion:'notes-private-trial-v1'});});
it('supports manual page turns with progressive scripted notes, confirmation and end',async()=>{
 const rehearsal=createPrivateNotesPageRehearsal({simulation:true,page:new EventTarget(),visibility:Object.assign(new EventTarget(),{hidden:false})}),owner=rehearsal.open(()=>{},()=>{});
 try{await vi.waitFor(()=>expect(owner.session.status().state).toBe('ready'));
  for(const [turn,value]of [[1,'USD 500 maximum (items only)'],[2,'USD 350 maximum (items only)']] as const){expect(await owner.session.startTurn('private_turn_'+turn)).toBe(true);await vi.waitFor(()=>expect(owner.session.snapshot().connection.notes?.notes.budget.value).toBe(value));expect(owner.session.status().state).toBe('capturing');expect(owner.session.commit()).toBe(true);await vi.waitFor(()=>expect(owner.session.status().state).toBe('ready'));}
  expect(owner.session.edit('budget','USD 350 maximum (items only)')).toBe(true);await vi.waitFor(()=>expect(owner.session.snapshot().connection.notes?.notes.budget.status).toBe('confirmed'));owner.dispose();expect(owner.snapshot().transportClosed).toBe(true);expect(owner.session.snapshot().connection.notes).toBeNull();
 }finally{owner.dispose();}
});
