import {it,expect,vi} from 'vitest';
import {randomBytes} from 'node:crypto';
import {createRefreshStore} from '../src/server/refresh-store.ts';
import {createRefreshEnvelopes} from '../src/server/refresh-envelope.ts';
const codec=()=>createRefreshEnvelopes(new Map([['fixture',randomBytes(32)]]),'fixture');
const usage={key_id:'fixture',total:3,ready:1,rotating:1,held:1,expired:2};
const signal=()=>new AbortController().signal;
it('returns only validated counts including held and expired ownership',async()=>{
 const call=vi.fn(async()=>usage);const store=createRefreshStore({call},codec());
 expect(await store.keyUsage('fixture',signal())).toEqual({status:'found',keyId:'fixture',total:3,ready:1,rotating:1,held:1,expired:2});
 expect(call).toHaveBeenCalledWith('stylist_refresh_key_usage',{p_key_id:'fixture'},expect.any(AbortSignal));
});
it('rejects malformed counts, unexpected data and inconsistent totals',async()=>{
 for(const value of [null,[],{...usage,total:4},{...usage,expired:4},{...usage,held:-1},{...usage,ready:1.5},{...usage,key_id:'other'},{...usage,envelope:'private'}])expect(await createRefreshStore({call:async()=>value},codec()).keyUsage('fixture',signal())).toEqual({status:'unconfirmed'});
});
it('does not turn invalid requests or database failure into zero usage',async()=>{
 const call=vi.fn();const store=createRefreshStore({call},codec());await store.keyUsage('bad key',signal());const stop=new AbortController();stop.abort();await store.keyUsage('fixture',stop.signal);expect(call).not.toHaveBeenCalled();
 expect(await createRefreshStore({call:async()=>{throw Error('private');}},codec()).keyUsage('fixture',signal())).toEqual({status:'unconfirmed'});
});
