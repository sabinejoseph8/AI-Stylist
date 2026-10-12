import {it,expect,vi} from 'vitest';
import {createAuthSessionPresence} from '../src/server/auth-session-presence.ts';
const owner='11111111-1111-4111-8111-111111111111',session='22222222-2222-4222-8222-222222222222';
const signal=()=>new AbortController().signal;
it('confirms only explicit absence with exact scoped evidence',async()=>{
 const call=vi.fn(async()=>'absent');
 expect(await createAuthSessionPresence({call}).confirm(owner,session,signal())).toEqual({status:'revoked',ownerId:owner,sessionId:session});
 expect(call).toHaveBeenCalledWith('stylist_auth_session_presence',{p_owner:owner,p_session:session});
 for(const value of ['present','mismatch',false,null,undefined,{},'revoked'])expect(await createAuthSessionPresence({call:async()=>value}).confirm(owner,session,signal())).toEqual({status:'unconfirmed'});
});
it('keeps errors and invalid input uncertain',async()=>{
 expect(await createAuthSessionPresence({call:async()=>{throw Error('private');}}).confirm(owner,session,signal())).toEqual({status:'unconfirmed'});
 const call=vi.fn();const authority=createAuthSessionPresence({call});const stop=new AbortController();stop.abort();
 await authority.confirm('bad',session,signal());await authority.confirm(owner,session,stop.signal);expect(call).not.toHaveBeenCalled();
});
it('retains capacity until ignored cancellation settles',async()=>{
 const resolvers:Array<(v:unknown)=>void>=[];const call=vi.fn(()=>new Promise(resolve=>resolvers.push(resolve)));const authority=createAuthSessionPresence({call},5);
 expect(await Promise.all(Array.from({length:4},()=>authority.confirm(owner,session,signal())))).toEqual(Array(4).fill({status:'unconfirmed'}));
 expect(await authority.confirm(owner,session,signal())).toEqual({status:'unconfirmed'});expect(call).toHaveBeenCalledTimes(4);
 resolvers.forEach(resolve=>resolve('absent'));await new Promise(resolve=>setTimeout(resolve,0));
 const next=authority.confirm(owner,session,signal());resolvers[4]('present');expect(await next).toEqual({status:'unconfirmed'});
});
it('drops absence after external cancellation',async()=>{
 const stop=new AbortController();const authority=createAuthSessionPresence({call:async()=>{stop.abort();return 'absent';}});
 expect(await authority.confirm(owner,session,stop.signal)).toEqual({status:'unconfirmed'});
});
