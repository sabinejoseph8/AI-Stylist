import {describe,it,expect,vi} from 'vitest';
import {warnBeforeLeaving} from '../src/navigation-warning.ts';
describe('best-effort active test navigation warning',()=>{
 it('requests confirmation while active',()=>{
  const preventDefault=vi.fn(),event={preventDefault,returnValue:undefined} as unknown as BeforeUnloadEvent;
  warnBeforeLeaving(()=>true,event);expect(preventDefault).toHaveBeenCalledOnce();expect(event.returnValue).toBe('');
 });
 it('leaves idle and ended navigation alone',()=>{
  const preventDefault=vi.fn(),event={preventDefault,returnValue:undefined} as unknown as BeforeUnloadEvent;
  warnBeforeLeaving(()=>false,event);expect(preventDefault).not.toHaveBeenCalled();expect(event.returnValue).toBeUndefined();
 });
});
