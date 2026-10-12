import {it,expect,vi} from 'vitest';
import {createRecoveryProvider} from '../src/server/recovery-provider.ts';
const owner='11111111-1111-4111-8111-111111111111',session='22222222-2222-4222-8222-222222222222';
const signal=()=>new AbortController().signal,input={code:'fixture',verifier:'a'.repeat(43)};
function fixture(){
 let current=true,absent=true,recovery=true;
 const identity={ownerId:owner,sessionId:session,isCurrent:async()=>current};
 const operations={exchange:async()=>({access_token:'fixture',token_type:'bearer'}),updatePassword:vi.fn(async()=>true),revoke:vi.fn(async()=>true)};
 const verifier={verify:async()=>identity,verifyRecovery:async()=>recovery?{...identity,expiresAt:Date.now()+300000}:null};
 const presence={confirm:async()=>absent?{status:'revoked' as const,ownerId:owner,sessionId:session}:{status:'unconfirmed' as const}};
 return {port:createRecoveryProvider(operations,verifier,presence),operations,setCurrent:(v:boolean)=>{current=v;},setAbsent:(v:boolean)=>{absent=v;},setRecovery:(v:boolean)=>{recovery=v;}};
}
it('provides reset-only one-use capability and requires independent cleanup proof',async()=>{
 const f=fixture(),grant=await f.port.exchange(input,signal());if('status' in grant)throw Error();
 expect(Object.keys(grant).sort()).toEqual(['discard','expiresAt','ownerId','resetPassword']);
 expect(await grant.resetPassword('made-up',signal())).toBe(true);expect(await grant.resetPassword('again',signal())).toBe(false);expect(f.operations.updatePassword).toHaveBeenCalledOnce();
 expect(await grant.discard(signal())).toBe(true);expect(await grant.discard(signal())).toBe(true);expect(f.operations.revoke).toHaveBeenCalledOnce();
});
it('refuses ordinary login authority but retains a cleanup capability',async()=>{
 const f=fixture();f.setRecovery(false);const grant=await f.port.exchange(input,signal());if('status' in grant)throw Error();
 expect(grant.ownerId).toBe('');expect(grant.expiresAt).toBe(0);expect(await grant.resetPassword('made-up',signal())).toBe(false);expect(f.operations.updatePassword).not.toHaveBeenCalled();expect(await grant.discard(signal())).toBe(true);
});
it('rechecks current authority and never accepts logout acknowledgment as absence',async()=>{
 const f=fixture(),grant=await f.port.exchange(input,signal());if('status' in grant)throw Error();f.setCurrent(false);f.setAbsent(false);
 expect(await grant.resetPassword('made-up',signal())).toBe(false);expect(await grant.discard(signal())).toBe(false);expect(f.operations.updatePassword).not.toHaveBeenCalled();
});
it('allows independent absence proof even when the logout reply is lost',async()=>{
 const f=fixture();f.operations.revoke.mockRejectedValueOnce(Error('private'));const grant=await f.port.exchange(input,signal());if('status' in grant)throw Error();expect(await grant.discard(signal())).toBe(true);
});
it('retains remote cleanup when identity verification throws',async()=>{
 const revoke=vi.fn(async()=>true),updatePassword=vi.fn(async()=>true);
 const port=createRecoveryProvider({exchange:async()=>({access_token:'fixture',token_type:'bearer'}),revoke,updatePassword},{verify:async()=>{throw Error('private');},verifyRecovery:async()=>{throw Error('private');}},{confirm:async()=>({status:'unconfirmed'})});
 const grant=await port.exchange(input,signal());if('status' in grant)throw Error();
 expect(await grant.resetPassword('made-up',signal())).toBe(false);expect(await grant.discard(signal())).toBe(false);expect(revoke).toHaveBeenCalledOnce();expect(updatePassword).not.toHaveBeenCalled();
});
