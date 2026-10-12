import {it,expect,vi,afterEach} from 'vitest';
import {randomBytes} from 'node:crypto';
import {createRefreshEnvelopes} from '../src/server/refresh-envelope.ts';
import {createRefreshStore} from '../src/server/refresh-store.ts';
const owner='11111111-1111-4111-8111-111111111111',session='22222222-2222-4222-8222-222222222222',lease='33333333-3333-4333-8333-333333333333';
const scope=()=>({ownerId:owner,sessionId:session,generation:1,expiresAt:Date.now()+60000});
const signal=()=>new AbortController().signal,codec=()=>createRefreshEnvelopes(new Map([['fixture',randomBytes(32)]]),'fixture');
afterEach(()=>vi.useRealTimers());
it('encrypts adoption and next-generation rotation without sending plaintext to RPC',async()=>{
 const c=codec(),call=vi.fn(async()=>true),store=createRefreshStore({call},c),context=scope();
 expect(await store.adopt('first-fixture',context,signal())).toBe('confirmed');expect(await store.finish('second-fixture',context,lease,context.expiresAt,signal())).toBe('confirmed');
 expect(JSON.stringify(call.mock.calls)).not.toContain('first-fixture');expect(JSON.stringify(call.mock.calls)).not.toContain('second-fixture');
 const calls=call.mock.calls as unknown as Array<[string,Record<string,unknown>]>;
 expect(calls[0]![0]).toBe('stylist_adopt_refresh');expect(calls[1]![0]).toBe('stylist_finish_refresh');expect(c.open(calls[1]![1].p_envelope,{...context,generation:2})).toBe('second-fixture');
});
it('checks claimed owner/session/generation and hides plaintext behind a server capability',async()=>{
 const c=codec(),context=scope(),record={owner_id:owner,session_id:session,generation:1,expires_at_ms:context.expiresAt,envelope:c.seal('fixture-secret',context),state:'rotating',lease_id:lease};
 const call=vi.fn(async()=>record),store=createRefreshStore({call},c);const result=await store.claim(owner,session,1,signal());
 expect(result.status).toBe('claimed');if(result.status!=='claimed')throw Error();expect(result.readSecret()).toBe('fixture-secret');expect(result.readSecret()).toBeNull();expect(JSON.stringify(result)).not.toContain('fixture-secret');
 expect((await store.claim(owner,session,2,signal())).status).toBe('unconfirmed');record.owner_id='44444444-4444-4444-8444-444444444444';expect((await store.claim(owner,session,1,signal())).status).toBe('unconfirmed');
});
it('distinguishes absent/refused state from uncertain malformed or failed storage replies',async()=>{
 const c=codec(),call=vi.fn(async()=>null as unknown),store=createRefreshStore({call},c),context=scope();
 expect((await store.inspect(owner,session,signal())).status).toBe('absent');expect((await store.claim(owner,session,1,signal())).status).toBe('refused');
 call.mockResolvedValue({status:'private'});expect((await store.inspect(owner,session,signal())).status).toBe('unconfirmed');expect(await store.hold(context,lease,signal())).toBe('unconfirmed');
 call.mockRejectedValue(Error('private'));expect(await store.adopt('fixture',context,signal())).toBe('unconfirmed');
});
it('retains admission for canceled storage work and does not retry ambiguous writes',async()=>{
 vi.useFakeTimers();const releases:Array<(v:unknown)=>void>=[],call=vi.fn(()=>new Promise(resolve=>releases.push(resolve))),store=createRefreshStore({call},codec(),20),context=scope();
 const pending=Array.from({length:4},()=>store.adopt('fixture',context,signal()));await vi.advanceTimersByTimeAsync(21);expect(await Promise.all(pending)).toEqual(Array(4).fill('unconfirmed'));
 expect(await store.adopt('fixture',context,signal())).toBe('unconfirmed');expect(call).toHaveBeenCalledTimes(4);releases.forEach(resolve=>resolve(true));await vi.advanceTimersByTimeAsync(0);
});
it('refuses invalid scope before any storage call',async()=>{
 const call=vi.fn(),store=createRefreshStore({call},codec());expect(await store.adopt('fixture',{...scope(),generation:2},signal())).toBe('refused');expect((await store.claim('bad',session,1,signal())).status).toBe('refused');expect(call).not.toHaveBeenCalled();
});

it('requires exact trusted revocation confirmation before requesting fenced removal',async()=>{
 const call=vi.fn(async()=>true),store=createRefreshStore({call},codec()),context=scope();
 expect(await store.remove(context,lease,false,signal())).toBe('refused');expect(call).not.toHaveBeenCalled();
 expect(await store.remove(context,lease,true,signal())).toBe('confirmed');
 expect(call).toHaveBeenCalledWith('stylist_remove_refresh',{p_owner:owner,p_session:session,p_generation:1,p_lease:lease,p_revoked:true},expect.any(AbortSignal));
});
it('discovers bounded scoped metadata without exporting envelopes or plaintext',async()=>{
 const context=scope(),call=vi.fn(async()=>[{owner_id:owner,session_id:session,generation:1,expires_at_ms:context.expiresAt,state:'held',lease_id:lease}]),store=createRefreshStore({call},codec());
 const page=await store.discover(null,10,signal());expect(page.status).toBe('found');if(page.status!=='found')throw Error();expect(page.candidates[0]?.scope.sessionId).toBe(session);expect(JSON.stringify(page)).not.toContain('envelope');expect(page.nextAfter).toBe(session);
 expect((await store.discover(null,101,signal())).status).toBe('unconfirmed');expect(call).toHaveBeenCalledTimes(1);
});
it('refuses out-of-order discovery and credential-bearing metadata',async()=>{
 const context=scope(),record={owner_id:owner,session_id:session,generation:1,expires_at_ms:context.expiresAt,state:'ready',lease_id:null},call=vi.fn(async():Promise<unknown>=>[record]),store=createRefreshStore({call},codec());
 expect((await store.discover(session,10,signal())).status).toBe('unconfirmed');call.mockResolvedValue([{...record,envelope:{private:'fixture'}}]);expect((await store.discover(null,10,signal())).status).toBe('unconfirmed');
});
