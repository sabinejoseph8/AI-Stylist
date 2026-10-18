import {afterEach,expect,it,vi} from 'vitest';
import {LocalPrivacy} from '../src/privacy/local-privacy.ts';
const read=()=>({data:{sample:'fixture'},photos:[]});
afterEach(()=>vi.useRealTimers());
it('does not report success before shared cleanup confirms, and preserves other scopes',async()=>{
 const model=new LocalPrivacy();let finish!:(ok:boolean)=>void;
 model.bind('session',{read,clearAsync:()=>new Promise(r=>{finish=r;})});
 const saved=vi.fn();model.bind('looks',{read,clear:saved});
 const pending=model.clearAsync(['session']);expect(model.snapshot().busy).toBe(true);expect(model.snapshot().clearing).toBe(true);
 expect(model.snapshot().message).not.toContain('were cleared');expect(saved).not.toHaveBeenCalled();
 finish(true);expect(await pending).toBe(true);expect(model.snapshot().busy).toBe(false);expect(model.snapshot().message).toContain('were cleared');expect(saved).not.toHaveBeenCalled();
});
it('refuses synchronous clearing of an asynchronous selection before any mutation',()=>{
 const model=new LocalPrivacy(),shared=vi.fn(async()=>true),saved=vi.fn();
 model.bind('session',{read,clearAsync:shared});model.bind('looks',{read,clear:saved});
 expect(model.clear(['looks','session'])).toBe(false);expect(shared).not.toHaveBeenCalled();expect(saved).not.toHaveBeenCalled();
});
it('a false acknowledgment stops later categories and retains failure status',async()=>{
 const model=new LocalPrivacy(),saved=vi.fn();model.bind('session',{read,clearAsync:async()=>false});model.bind('looks',{read,clear:saved});
 expect(await model.clearAsync(['session','looks'])).toBe(false);expect(saved).not.toHaveBeenCalled();expect(model.snapshot().message).toContain('could not be confirmed');expect(model.snapshot().busy).toBe(false);
});
it('a thrown cleanup failure cannot become a success or clear another category',async()=>{
 const model=new LocalPrivacy(),saved=vi.fn();model.bind('session',{read,clearAsync:async()=>{throw Error('Synthetic failure');}});model.bind('preferences',{read,clear:saved});
 expect(await model.clearAsync(['session','preferences'])).toBe(false);expect(saved).not.toHaveBeenCalled();expect(model.snapshot().message).not.toContain('were cleared');
});
it('timeout holds success, and late confirmation cannot clear the next captured category',async()=>{
 vi.useFakeTimers();const model=new LocalPrivacy();let finish!:(ok:boolean)=>void;const saved=vi.fn();
 model.bind('session',{read,clearAsync:()=>new Promise(r=>{finish=r;})});model.bind('looks',{read,clear:saved});
 const pending=model.clearAsync(['session','looks']);await vi.advanceTimersByTimeAsync(8000);expect(await pending).toBe(false);const message=model.snapshot().message;
 finish(true);await Promise.resolve();await Promise.resolve();expect(saved).not.toHaveBeenCalled();expect(model.snapshot().message).toBe(message);expect(model.snapshot().ready).toBeNull();
});
it('source invalidation cannot make an active clear appear idle or permit overlapping work',async()=>{
 const model=new LocalPrivacy();let finish!:(ok:boolean)=>void;const shared=vi.fn(()=>new Promise<boolean>(r=>{finish=r;}));model.bind('session',{read,clearAsync:shared});
 const pending=model.clearAsync(['session']);model.invalidate();expect(model.snapshot().busy).toBe(true);expect(model.snapshot().clearing).toBe(true);
 expect(await model.prepare(['session'])).toBe(false);expect(await model.clearAsync(['session'])).toBe(false);expect(model.clear(['session'])).toBe(false);expect(shared).toHaveBeenCalledTimes(1);
 finish(true);expect(await pending).toBe(true);expect(model.snapshot().clearing).toBe(false);
});
it('binding replacement while cleanup waits cannot clear the new scope',async()=>{
 const model=new LocalPrivacy();let finish!:(ok:boolean)=>void;const old=vi.fn(),replacement=vi.fn();
 model.bind('session',{read,clearAsync:()=>new Promise(r=>{finish=r;})});model.bind('looks',{read,clear:old});
 const pending=model.clearAsync(['session','looks']);model.bind('looks',{read,clear:replacement});finish(true);
 expect(await pending).toBe(false);expect(old).not.toHaveBeenCalled();expect(replacement).not.toHaveBeenCalled();
});
it('supports existing synchronous sources through the confirmed async entry',async()=>{
 const model=new LocalPrivacy(),session=vi.fn(),saved=vi.fn();model.bind('session',{read,clear:session});model.bind('looks',{read,clear:saved});
 expect(await model.prepare(['session'])).toBe(true);expect(await model.clearAsync(['session'])).toBe(true);expect(session).toHaveBeenCalledTimes(1);expect(saved).not.toHaveBeenCalled();expect(model.snapshot().ready).toBeNull();
});
it('rejects ambiguous sources before binding either cleanup callback',()=>{
 const model=new LocalPrivacy(),clear=vi.fn(),clearAsync=vi.fn(async()=>true);
 expect(()=>model.bind('session',{read,clear,clearAsync} as any)).toThrow();expect(clear).not.toHaveBeenCalled();expect(clearAsync).not.toHaveBeenCalled();
});
