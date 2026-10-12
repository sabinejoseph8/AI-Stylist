import {it,expect,vi} from 'vitest';
import {createStoredRefreshPort} from '../src/server/refresh-port.ts';
import type {createAccountSecurity} from '../src/server/account-security.ts';
import type {createRefreshStore} from '../src/server/refresh-store.ts';
import type {createRefreshRotation} from '../src/server/refresh-rotation.ts';
const origin='https://stylist.example',owner='11111111-1111-4111-8111-111111111111',session='22222222-2222-4222-8222-222222222222';
const request=()=>new Request(origin+'/api/account/refresh',{method:'POST',headers:{origin}});
function fixture(){
 const identity={ownerId:owner,sessionId:session,isCurrent:vi.fn(async()=>true)},authorize=vi.fn(async()=>identity);
 const scope={ownerId:owner,sessionId:session,generation:7,expiresAt:Date.now()+60000};
 const inspect=vi.fn(async()=>({status:'found',state:'ready',scope} as Record<string,unknown>));
 const staged={accessToken:'fixture',discard:async()=>true},stage=vi.fn(async()=>staged);
 const port=createStoredRefreshPort({authorize} as unknown as ReturnType<typeof createAccountSecurity>,{inspect} as unknown as ReturnType<typeof createRefreshStore>,{stage} as unknown as ReturnType<typeof createRefreshRotation>,origin);
 return {identity,authorize,scope,inspect,stage,staged,port};
}
it('derives session and current generation from verified identity and storage',async()=>{
 const f=fixture(),signal=new AbortController().signal;
 expect(await f.port.refresh(request(),owner,signal)).toBe(f.staged);expect(f.inspect).toHaveBeenCalledWith(owner,session,signal);expect(f.stage).toHaveBeenCalledWith(f.scope,signal);
});
it('refuses owner mismatch before storage or rotation',async()=>{
 const f=fixture();expect(await f.port.refresh(request(),'other',new AbortController().signal)).toEqual({status:'notCreated'});expect(f.inspect).not.toHaveBeenCalled();expect(f.stage).not.toHaveBeenCalled();
});
it('refuses held, missing and expired records without rotating',async()=>{
 for(const record of [{status:'absent'},{status:'found',state:'held'},{status:'found',state:'ready',scope:{expiresAt:Date.now()-1}}]){
  const f=fixture();f.inspect.mockResolvedValue(record);expect(await f.port.refresh(request(),owner,new AbortController().signal)).toEqual({status:'notCreated'});expect(f.stage).not.toHaveBeenCalled();
 }
});
it('surfaces ambiguous inspection without starting a provider',async()=>{
 const f=fixture();f.inspect.mockResolvedValue({status:'unconfirmed'});await expect(f.port.refresh(request(),owner,new AbortController().signal)).rejects.toThrow('Account refresh unavailable');expect(f.stage).not.toHaveBeenCalled();
});
it('rechecks revocation after storage lookup and refuses invalid origin',async()=>{
 const f=fixture();f.identity.isCurrent.mockResolvedValue(false);expect(await f.port.refresh(request(),owner,new AbortController().signal)).toEqual({status:'notCreated'});expect(f.stage).not.toHaveBeenCalled();
 const g=fixture();expect(await g.port.refresh(new Request('https://foreign.example/api/account/refresh',{method:'POST',headers:{origin}}),owner,new AbortController().signal)).toEqual({status:'notCreated'});expect(g.authorize).not.toHaveBeenCalled();
});
