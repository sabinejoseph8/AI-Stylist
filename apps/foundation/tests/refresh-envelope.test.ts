import {it,expect,vi,afterEach} from 'vitest';
import {randomBytes} from 'node:crypto';
import {createRefreshEnvelopes} from '../src/server/refresh-envelope.ts';
const scope=()=>({ownerId:'11111111-1111-4111-8111-111111111111',sessionId:'22222222-2222-4222-8222-222222222222',generation:1,expiresAt:Date.now()+60000});
const fixture=()=>createRefreshEnvelopes(new Map([['current',randomBytes(32)]]),'current');
afterEach(()=>vi.useRealTimers());
it('encrypts fixture state with fresh nonces and exact scope binding',()=>{
 const codec=fixture(),context=scope(),first=codec.seal('simulated-refresh-fixture',context),second=codec.seal('simulated-refresh-fixture',context);
 expect(first.nonce).not.toBe(second.nonce);expect(JSON.stringify(first)).not.toContain('simulated-refresh-fixture');expect(codec.open(first,context)).toBe('simulated-refresh-fixture');expect(Object.isFrozen(first)).toBe(true);
 for(const altered of [{ownerId:'33333333-3333-4333-8333-333333333333'},{sessionId:'44444444-4444-4444-8444-444444444444'},{generation:2},{expiresAt:context.expiresAt+1}])expect(codec.open(first,{...context,...altered})).toBeNull();
});
it('rejects tampering, unexpected fields, malformed sizes and another key',()=>{
 const codec=fixture(),context=scope(),value=codec.seal('fixture',context);
 for(const modified of [{...value,tag:'A'.repeat(22)},{...value,ciphertext:'A'.repeat(100)},{...value,nonce:'A'.repeat(16)},{...value,version:2},{...value,extra:true},{...value,ciphertext:'A'.repeat(12000)},{...value,keyId:'unknown'}])expect(codec.open(modified,context)).toBeNull();
 expect(fixture().open(value,context)).toBeNull();
});
it('supports an explicitly supplied old key during key rotation without retaining the caller buffer',()=>{
 const old=randomBytes(32),current=randomBytes(32),context=scope(),before=createRefreshEnvelopes(new Map([['old',old]]),'old'),envelope=before.seal('fixture',context);
 const after=createRefreshEnvelopes(new Map([['old',old],['current',current]]),'current');old.fill(0);current.fill(0);
 expect(after.open(envelope,context)).toBe('fixture');const rotated=after.seal('new-fixture',context);expect(rotated.keyId).toBe('current');expect(after.open(rotated,context)).toBe('new-fixture');
});
it('refuses expired state and invalid scope or secret sizes',()=>{
 const codec=fixture(),context=scope(),envelope=codec.seal('fixture',context);vi.useFakeTimers();vi.setSystemTime(context.expiresAt);
 expect(codec.open(envelope,context)).toBeNull();expect(()=>codec.seal('fixture',context)).toThrow('Refresh storage unavailable');vi.useRealTimers();
 for(const input of ['', 'a'.repeat(8193), '\ud800'])expect(()=>codec.seal(input,scope())).toThrow('Refresh storage unavailable');
 expect(()=>codec.seal('fixture',{...scope(),generation:0})).toThrow('Refresh storage unavailable');
});
it('refuses invalid configuration without exposing key details',()=>{
 expect(()=>createRefreshEnvelopes(new Map(),'none')).toThrow('Refresh storage unavailable');
 expect(()=>createRefreshEnvelopes(new Map([['current',randomBytes(16)]]),'current')).toThrow('Refresh storage unavailable');
});
