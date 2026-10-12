import {expect,it,vi} from 'vitest';
import {createAccountResourceIdentity} from '../src/server/account-resource-identity.ts';
import type {createRefreshStore} from '../src/server/refresh-store.ts';
const origin='https://stylist.test',signal=()=>new AbortController().signal;
function fixture(){
 let record:unknown={status:'found',state:'ready',scope:{ownerId:'owner',sessionId:'session',generation:1,expiresAt:Date.now()+60000}};
 const identity={ownerId:'owner',sessionId:'session',isCurrent:vi.fn(async()=>true)};
 const inspect=vi.fn(async()=>record),authorize=vi.fn(async()=>identity);
 const gate=createAccountResourceIdentity(authorize,{inspect} as unknown as Pick<ReturnType<typeof createRefreshStore>,'inspect'>);
 return {gate,identity,inspect,set:(value:unknown)=>{record=value;},request:new Request(origin+'/api/wardrobe')};
}
it('requires ready scoped durable ownership and rechecks it before resource reuse',async()=>{
 const f=fixture(),proof=await f.gate(f.request,signal());expect(proof?.ownerId).toBe('owner');expect(await proof?.isCurrent(signal())).toBe(true);
 f.set({status:'absent'});expect(await proof?.isCurrent(signal())).toBe(false);
});
it('refuses missing, held, rotating, expired, mismatched and uncertain ownership',async()=>{
 for(const record of [{status:'absent'},{status:'unconfirmed'},...['held','rotating'].map(state=>({status:'found',state,scope:{ownerId:'owner',sessionId:'session',expiresAt:Date.now()+60000}})),{status:'found',state:'ready',scope:{ownerId:'other',sessionId:'session',expiresAt:Date.now()+60000}},{status:'found',state:'ready',scope:{ownerId:'owner',sessionId:'session',expiresAt:Date.now()-1}}]){const f=fixture();f.set(record);expect(await f.gate(f.request,signal())).toBeNull();}
});
it('refuses absolute expiry and changed deadlines even when provider identity remains current',async()=>{
 vi.useFakeTimers();try{
 const now=Date.UTC(2026,9,12);vi.setSystemTime(now);const f=fixture(),proof=await f.gate(f.request,signal());
 f.set({status:'found',state:'ready',scope:{ownerId:'owner',sessionId:'session',expiresAt:now+120000}});expect(await proof?.isCurrent(signal())).toBe(false);
 vi.setSystemTime(now+60000);expect(await proof?.isCurrent(signal())).toBe(false);
 }finally{vi.useRealTimers();}
});
it('retains cancellation and revocation refusal',async()=>{
 const f=fixture(),proof=await f.gate(f.request,signal());f.identity.isCurrent.mockResolvedValue(false);expect(await proof?.isCurrent(signal())).toBe(false);
 const controller=new AbortController();controller.abort();expect(await f.gate(f.request,controller.signal)).toBeNull();
});
