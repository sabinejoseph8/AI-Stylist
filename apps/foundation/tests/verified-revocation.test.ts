import {it,expect,vi} from 'vitest';
import {createVerifiedRevocation} from '../src/server/verified-revocation.ts';
const ownerId='11111111-1111-4111-8111-111111111111',sessionId='22222222-2222-4222-8222-222222222222';
const identity={ownerId,sessionId,isCurrent:async()=>true};const signal=()=>new AbortController().signal;
it('verifies identity before local logout and proves exact absence afterward',async()=>{
 const order:string[]=[];
 const run=createVerifiedRevocation({verify:async()=>{order.push('verify');return identity;}},{confirm:async(owner,session)=>{expect([owner,session]).toEqual([ownerId,sessionId]);order.push('absence');return {status:'revoked',ownerId,sessionId};}},async(jwt,scope)=>{expect([jwt,scope]).toEqual(['token','local']);order.push('logout');return true;});
 expect(await run('token',signal())).toBe(true);expect(order).toEqual(['verify','logout','absence']);
});
it('attempts logout despite failed verification without claiming proof',async()=>{
 for(const verify of [async()=>null,async()=>{throw Error('private');}]){const revoke=vi.fn(async()=>true),confirm=vi.fn();expect(await createVerifiedRevocation({verify},{confirm},revoke)('token',signal())).toBe(false);expect(revoke).toHaveBeenCalledOnce();expect(confirm).not.toHaveBeenCalled();}
});
it('rejects mismatched, additional or missing evidence',async()=>{
 for(const proof of [null,{status:'unconfirmed'},{status:'revoked',ownerId,sessionId:'other'},{status:'revoked',ownerId,sessionId,extra:true}])expect(await createVerifiedRevocation({verify:async()=>identity},{confirm:async()=>proof},async()=>true)('token',signal())).toBe(false);
 const confirm=vi.fn();expect(await createVerifiedRevocation({verify:async()=>identity},{confirm},async()=>false)('token',signal())).toBe(false);expect(confirm).not.toHaveBeenCalled();
});
it('retains capacity after timeout until underlying operations settle',async()=>{
 const resolutions:Array<(value:boolean)=>void>=[];const revoke=vi.fn(()=>new Promise<boolean>(resolve=>resolutions.push(resolve)));
 const run=createVerifiedRevocation({verify:async()=>identity},{confirm:async()=>({status:'revoked',ownerId,sessionId})},revoke,5);
 expect(await Promise.all(Array.from({length:4},()=>run('token',signal())))).toEqual([false,false,false,false]);expect(await run('token',signal())).toBe(false);expect(revoke).toHaveBeenCalledTimes(4);
 resolutions.forEach(resolve=>resolve(true));await new Promise(resolve=>setTimeout(resolve,0));
 const next=run('token',signal());await new Promise(resolve=>setTimeout(resolve,0));resolutions[4](true);expect(await next).toBe(true);
});
it('refuses canceled input and cancellation during logout',async()=>{
 const stop=new AbortController();stop.abort();const revoke=vi.fn(async()=>true);
 expect(await createVerifiedRevocation({verify:async()=>identity},{confirm:vi.fn()},revoke)('token',stop.signal)).toBe(false);expect(revoke).not.toHaveBeenCalled();
 const during=new AbortController();expect(await createVerifiedRevocation({verify:async()=>identity},{confirm:vi.fn()},async()=>{during.abort();return true;})('token',during.signal)).toBe(false);
});
