import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {createNotebookRehearsal} from '../src/note-browser-rehearsal.ts';
const owners:ReturnType<typeof createNotebookRehearsal>[]=[];
function setup(){const page=new EventTarget(),visibility=Object.assign(new EventTarget(),{hidden:false}),changed=vi.fn(),status=vi.fn();const owner=createNotebookRehearsal({simulation:true,page,visibility,changed,status});owners.push(owner);return{owner,page,visibility,changed,status};}
beforeEach(()=>vi.useFakeTimers());afterEach(()=>{owners.splice(0).forEach(o=>o.dispose());vi.useRealTimers();});
describe('local notebook connection rehearsal',()=>{
 it('rejects activation without simulation',()=>{expect(()=>createNotebookRehearsal({page:new EventTarget(),visibility:Object.assign(new EventTarget(),{hidden:false}),changed:vi.fn(),status:vi.fn()})).toThrow('disabled');});
 it('runs two turns through the prepared owners and confirms the correction',async()=>{
   const s=setup();expect(s.owner.session.status().state).toBe('ready');expect(await s.owner.play()).toBe(true);await vi.advanceTimersByTimeAsync(1500);
   expect(s.changed.mock.lastCall![0].notes.color).toMatchObject({value:'Emerald green',status:'tentative'});expect(s.owner.session.status().state).toBe('ready');
   expect(await s.owner.play()).toBe(true);await vi.advanceTimersByTimeAsync(1500);expect(s.changed.mock.lastCall![0].notes.color).toMatchObject({value:'Blue',status:'tentative'});
   expect(s.owner.session.confirm('color')).toBe(true);await vi.advanceTimersByTimeAsync(50);expect(s.changed.mock.lastCall![0].notes.color.status).toBe('confirmed');
   expect(await s.owner.play()).toBe(false);expect(s.owner.snapshot().server?.transcription?.audioBytes).toBe(9600);s.owner.dispose();expect(s.changed).toHaveBeenLastCalledWith(null);expect(s.owner.snapshot().notes.notes.color.status).toBe('missing');expect(vi.getTimerCount()).toBe(0);
 });
 it('holds duplicate play while the first turn is pending',async()=>{const s=setup();expect(await s.owner.play()).toBe(true);expect(await s.owner.play()).toBe(false);expect(s.owner.turns()).toBe(1);});
 it.each(['pagehide','hidden','dispose'])('clears both owners on %s without late updates',async kind=>{const s=setup();await s.owner.play();if(kind==='pagehide')s.page.dispatchEvent(new Event('pagehide'));if(kind==='hidden'){s.visibility.hidden=true;s.visibility.dispatchEvent(new Event('visibilitychange'));}if(kind==='dispose')s.owner.dispose();await vi.advanceTimersByTimeAsync(2000);expect(s.owner.snapshot().closed).toBe(true);expect(s.owner.snapshot().server?.ended).toBe(true);expect(s.owner.session.snapshot().connection.notes).toBeNull();expect(s.changed).toHaveBeenLastCalledWith(null);expect(vi.getTimerCount()).toBe(0);});
 it('starts no capture and schedules no work on an already hidden page',()=>{const changed=vi.fn();const owner=createNotebookRehearsal({simulation:true,page:new EventTarget(),visibility:Object.assign(new EventTarget(),{hidden:true}),changed,status:vi.fn()});owners.push(owner);expect(owner.snapshot().closed).toBe(true);expect(owner.snapshot().server).toBeNull();expect(vi.getTimerCount()).toBe(0);});
 it('does not acquire browser media or fetch any provider',async()=>{const fetch=vi.spyOn(globalThis,'fetch');const s=setup();await s.owner.play();await vi.advanceTimersByTimeAsync(1500);expect(fetch).not.toHaveBeenCalled();fetch.mockRestore();});
});
