import {it,expect,vi} from 'vitest';
import {ProfileRevisionFence} from '../src/server/profile-revision.ts';
it('requires initial observation',()=>expect(()=>new ProfileRevisionFence(()=>{}).capture()).toThrow());
it('another tab save revokes old permits',()=>{const c=vi.fn();const f=new ProfileRevisionFence(c);f.observe(1);const s=f.capture();f.observe(2);expect(f.allows(s)).toBe(false);expect(c).toHaveBeenCalledOnce();expect(f.allows(f.capture())).toBe(true);});
it('duplicates are idempotent',()=>{const c=vi.fn();const f=new ProfileRevisionFence(c);f.observe(1);const s=f.capture();f.observe(1);expect(f.allows(s)).toBe(true);expect(c).not.toHaveBeenCalled();});
for(const value of [null,-1,.5,'2',NaN,Infinity,Number.MAX_SAFE_INTEGER+1,0])it(`rejects stale/invalid ${value}`,()=>{const f=new ProfileRevisionFence(()=>{});f.observe(1);const s=f.capture();expect(()=>f.observe(value)).toThrow();expect(f.allows(s)).toBe(false);expect(()=>f.capture()).toThrow();});
it('cancellation failure closes',()=>{const f=new ProfileRevisionFence(()=>{throw Error();});f.observe(1);const s=f.capture();expect(()=>f.observe(2)).toThrow();expect(f.allows(s)).toBe(false);expect(()=>f.capture()).toThrow();});
it('close is terminal',()=>{const f=new ProfileRevisionFence(()=>{});f.observe(0);const s=f.capture();f.close();f.close();expect(f.allows(s)).toBe(false);expect(()=>f.observe(1)).toThrow();});

it('rejects permits from another customer fence or copied values',()=>{const a=new ProfileRevisionFence(()=>{});const b=new ProfileRevisionFence(()=>{});a.observe(1);b.observe(1);const s=a.capture();expect(b.allows(s)).toBe(false);expect(a.allows({...s})).toBe(false);});
