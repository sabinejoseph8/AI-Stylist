import {afterEach,expect,it,vi} from 'vitest';
import {createDurableRecoveryAdmission} from '../src/server/recovery-durable-admission.ts';
import type {RecoveryAdmissionPort,RecoveryAdmissionReceipt} from '../src/server/recovery-durable-admission.ts';
import {createCodeRecoveryOwner} from '../src/server/account-recovery.ts';
const binding={storeId:'00000000-0000-4000-8000-000000000001',policyId:'a'.repeat(64)};
const context={subjectKey:'b'.repeat(64),generation:1},signal=()=>new AbortController().signal;
const grant=()=>({ownerId:'00000000-0000-4000-8000-000000000002',expiresAt:Date.now()+60000,resetPassword:vi.fn(async()=>true),discard:vi.fn(async()=>true)});
function fixture(limit=3){
 const records=new Map<string,string>();let missing=false;
 const acknowledge=(r:RecoveryAdmissionReceipt,status:string)=>({...binding,operationId:r.operationId,status});
 const port={
  reserve:vi.fn(async(r:RecoveryAdmissionReceipt,_s:AbortSignal)=>{
   if(missing)throw Error('synthetic private error');
   if(records.size>=limit||[...records.values()].some(x=>['reserved','resetting','held'].includes(x)))return acknowledge(r,'denied');
   records.set(r.operationId,'reserved');return acknowledge(r,'reserved');
  }),
  claimReset:vi.fn(async(r:RecoveryAdmissionReceipt,_s:AbortSignal)=>{
   if(missing||records.get(r.operationId)!=='reserved')throw Error('synthetic private error');
   records.set(r.operationId,'resetting');return acknowledge(r,'resetting');
  }),
  settle:vi.fn(async(r:RecoveryAdmissionReceipt&{outcome:'completed'|'rejected'|'held';cleanupVerified:boolean},_s:AbortSignal)=>{
   if(missing||!['reserved','resetting'].includes(records.get(r.operationId)??''))throw Error('synthetic private error');
   records.set(r.operationId,r.outcome);return acknowledge(r,r.outcome);
  }),
 };
 const value=grant(),provider={exchange:vi.fn(async(_input:string,_s:AbortSignal)=>value)};
 const make=(deadline=1000)=>createDurableRecoveryAdmission(binding,port,provider,deadline);
 return {port,value,provider,make,records,setMissing:(value:boolean)=>missing=value,acknowledge};
}
afterEach(()=>vi.useRealTimers());
it('reserves before provider work and keeps the reservation while the user holds reset permission',async()=>{
 const f=fixture(),owner=f.make(),value=await owner.exchange(context,'synthetic-code',signal());
 expect(f.port.reserve.mock.invocationCallOrder[0]).toBeLessThan(f.provider.exchange.mock.invocationCallOrder[0]);expect([...f.records.values()]).toEqual(['reserved']);
 expect(f.port.settle).not.toHaveBeenCalled();expect('status' in value).toBe(false);if('status' in value)throw Error();
 expect(await value.discard(signal())).toBe(true);expect([...f.records.values()]).toEqual(['rejected']);expect(f.value.resetPassword).not.toHaveBeenCalled();
});
it('claims the durable reset phase before the password request and confirms cleanup before success',async()=>{
 const f=fixture(),guard=f.make(),owner=createCodeRecoveryOwner({verifyCode:(_input,s)=>guard.exchange(context,'synthetic',s)}),result=await owner.confirm({},signal());
 if(result.status!=='resetRequired')throw Error();expect((await result.reset('made-up',signal())).status).toBe('resetComplete');
 expect(f.port.claimReset.mock.invocationCallOrder[0]).toBeLessThan(f.value.resetPassword.mock.invocationCallOrder[0]);
 expect(f.value.discard.mock.invocationCallOrder[0]).toBeLessThan(f.port.settle.mock.invocationCallOrder[0]);expect([...f.records.values()]).toEqual(['completed']);
 expect((await result.reset('again',signal())).status).toBe('unconfirmed');expect(f.value.resetPassword).toHaveBeenCalledOnce();
});
it('never sends email, code, password, JWT or provider results to the storage port',async()=>{
 const f=fixture(),guard=f.make(),value=await guard.exchange(context,'synthetic-private-code',signal());if('status' in value)throw Error();await value.resetPassword('synthetic-private-password',signal());await value.discard(signal());
 const payloads=JSON.stringify([f.port.reserve.mock.calls,f.port.claimReset.mock.calls,f.port.settle.mock.calls]);
 expect(payloads).not.toMatch(/synthetic-private|access_token|refresh_token|email|password/);expect(f.port.reserve.mock.calls[0][0]).toMatchObject({...binding,subjectKey:context.subjectKey,generation:1});
});
it.each([null,true,{status:'reserved'},{...binding,operationId:'substituted',status:'reserved'},{...binding,operationId:'substituted',status:'reserved',extra:true}])('refuses malformed or unrelated reserve acknowledgment %j',async response=>{
 const f=fixture();f.port.reserve.mockResolvedValueOnce(response as never);const guard=f.make();expect(await guard.exchange(context,'synthetic',signal())).toEqual({status:'notCreated'});expect(guard.cleanupHeld()).toBe(true);expect(f.provider.exchange).not.toHaveBeenCalled();
});
it('refuses wrong store/policy acknowledgment before provider work',async()=>{
 for(const change of [{storeId:'00000000-0000-4000-8000-000000000099'},{policyId:'c'.repeat(64)}]){
  const f=fixture();f.port.reserve.mockImplementationOnce(async r=>({...f.acknowledge(r,'reserved'),...change}));expect(await f.make().exchange(context,'synthetic',signal())).toEqual({status:'notCreated'});expect(f.provider.exchange).not.toHaveBeenCalled();
 }
});
it('fresh guards share counters without refunding discarded attempts',async()=>{
 const f=fixture(1),first=await f.make().exchange(context,'synthetic',signal());if('status' in first)throw Error();await first.discard(signal());
 expect(await f.make().exchange(context,'synthetic',signal())).toEqual({status:'notCreated'});expect(f.provider.exchange).toHaveBeenCalledOnce();expect(f.records.size).toBe(1);
});
it('competing guards cannot both pass an outstanding reservation',async()=>{
 const f=fixture(),values=await Promise.all([f.make().exchange(context,'synthetic',signal()),f.make().exchange(context,'synthetic',signal())]);expect(f.provider.exchange).toHaveBeenCalledOnce();expect(values.filter(v=>'status' in v)).toHaveLength(1);
 for(const v of values)if(!('status' in v))await v.discard(signal());
});
it('missing persistent state never calls the provider or initializes a replacement',async()=>{
 const f=fixture();f.setMissing(true);for(let n=0;n<2;n++)expect(await f.make().exchange(context,'synthetic',signal())).toEqual({status:'notCreated'});expect(f.provider.exchange).not.toHaveBeenCalled();expect(f.records.size).toBe(0);
});
it('unconfirmed provider cleanup retains a hold across fresh guards',async()=>{
 const f=fixture(),guard=f.make(),value=await guard.exchange(context,'synthetic',signal());if('status' in value)throw Error();f.value.discard.mockResolvedValueOnce(false);
 expect(await value.discard(signal())).toBe(false);expect(guard.cleanupHeld()).toBe(true);expect([...f.records.values()]).toEqual(['held']);expect(await f.make().exchange(context,'synthetic',signal())).toEqual({status:'notCreated'});
});
it('lost settlement acknowledgment cannot report reset complete or permit a fresh attempt',async()=>{
 const f=fixture(),guard=f.make(),owner=createCodeRecoveryOwner({verifyCode:(_input,s)=>guard.exchange(context,'synthetic',s)});
 f.port.settle.mockRejectedValueOnce(Error('synthetic private detail'));const result=await owner.confirm({},signal());if(result.status!=='resetRequired')throw Error();
 expect((await result.reset('made-up',signal())).status).toBe('unconfirmed');expect(owner.cleanupHeld()).toBe(true);expect([...f.records.values()]).toEqual(['resetting']);expect(await f.make().exchange(context,'synthetic',signal())).toEqual({status:'notCreated'});
});
it('a malformed reset claim never starts the password operation',async()=>{
 const f=fixture(),guard=f.make(),value=await guard.exchange(context,'synthetic',signal());if('status' in value)throw Error();f.port.claimReset.mockResolvedValueOnce({status:'resetting'} as never);
 expect(await value.resetPassword('made-up',signal())).toBe(false);expect(f.value.resetPassword).not.toHaveBeenCalled();expect(await value.discard(signal())).toBe(false);expect([...f.records.values()]).toEqual(['held']);
});
it('a failed password outcome keeps a durable hold even when cleanup is confirmed',async()=>{
 const f=fixture(),guard=f.make(),value=await guard.exchange(context,'synthetic',signal());if('status' in value)throw Error();f.value.resetPassword.mockResolvedValueOnce(false);
 expect(await value.resetPassword('made-up',signal())).toBe(false);expect(await value.discard(signal())).toBe(false);expect([...f.records.values()]).toEqual(['held']);
});
it('concurrent password submissions claim the reset once',async()=>{
 const f=fixture(),value=await f.make().exchange(context,'synthetic',signal());if('status' in value)throw Error();const results=await Promise.all([value.resetPassword('made-up',signal()),value.resetPassword('again',signal())]);expect(results.sort()).toEqual([false,true]);expect(f.port.claimReset).toHaveBeenCalledOnce();expect(f.value.resetPassword).toHaveBeenCalledOnce();await value.discard(signal());
});
it('cancellation while reserving does not start the provider after a late grant',async()=>{
 const f=fixture();let release!:(value:unknown)=>void,request!:RecoveryAdmissionReceipt;
 f.port.reserve.mockImplementationOnce(async r=>{request=r;f.records.set(r.operationId,'reserved');return new Promise(resolve=>release=resolve) as never;});
 const guard=f.make(),stop=new AbortController(),pending=guard.exchange(context,'synthetic',stop.signal);stop.abort();expect(await pending).toEqual({status:'notCreated'});
 release(f.acknowledge(request,'reserved'));await vi.waitFor(()=>expect([...f.records.values()]).toEqual(['held']));expect(f.provider.exchange).not.toHaveBeenCalled();
});
it('cancellation while verification ignores abort still cleans a late capability and holds the reservation',async()=>{
 const f=fixture();let release!:(value:ReturnType<typeof grant>)=>void;f.provider.exchange.mockImplementationOnce(()=>new Promise(r=>release=r));
 const guard=f.make(),stop=new AbortController(),pending=guard.exchange(context,'synthetic',stop.signal);await vi.waitFor(()=>expect(f.provider.exchange).toHaveBeenCalledOnce());stop.abort();await pending;release(f.value);
 await vi.waitFor(()=>expect([...f.records.values()]).toEqual(['held']));expect(f.value.discard).toHaveBeenCalledOnce();expect(f.value.resetPassword).not.toHaveBeenCalled();
});
it('timeouts keep ignored reserve operations within four underlying slots',async()=>{
 const f=fixture();f.port.reserve.mockImplementation(()=>new Promise(()=>{}));const guard=f.make(5);
 await Promise.all(Array.from({length:4},()=>guard.exchange(context,'synthetic',signal())));await guard.exchange(context,'synthetic',signal());expect(f.port.reserve).toHaveBeenCalledTimes(4);expect(guard.cleanupHeld()).toBe(true);expect(f.provider.exchange).not.toHaveBeenCalled();
});
it('close discards a delivered capability and prevents later password dispatch',async()=>{
 const f=fixture(),guard=f.make(),value=await guard.exchange(context,'synthetic',signal());if('status' in value)throw Error();expect(await guard.close()).toBe(true);expect(await value.resetPassword('made-up',signal())).toBe(false);expect(f.value.resetPassword).not.toHaveBeenCalled();expect(await guard.exchange(context,'synthetic',signal())).toEqual({status:'notCreated'});
});
it('invalid context and canceled input never reach the storage port',async()=>{
 const f=fixture(),guard=f.make(),stopped=new AbortController();stopped.abort();await guard.exchange(context,'synthetic',stopped.signal);
 for(const change of [{subjectKey:'sample@example.test'},{generation:0},{generation:NaN},{extra:'synthetic-private'}])await guard.exchange({...context,...change},'synthetic',signal());expect(f.port.reserve).not.toHaveBeenCalled();
});
it('expiry is rechecked after a delayed reset claim',async()=>{
 const f=fixture(),value=await f.make().exchange(context,'synthetic',signal());if('status' in value)throw Error();let release!:(value:unknown)=>void,request!:RecoveryAdmissionReceipt;
 f.port.claimReset.mockImplementationOnce(async r=>{request=r;return new Promise(resolve=>release=resolve) as never;});
 const pending=value.resetPassword('made-up',signal());await vi.waitFor(()=>expect(f.port.claimReset).toHaveBeenCalledOnce());vi.useFakeTimers();vi.setSystemTime(value.expiresAt+1);release(f.acknowledge(request,'resetting'));expect(await pending).toBe(false);expect(f.value.resetPassword).not.toHaveBeenCalled();await value.discard(signal());
});
it('discard is idempotent and cannot release a reset still in flight as successful',async()=>{
 const f=fixture();let release!:(value:boolean)=>void;f.value.resetPassword.mockImplementationOnce(()=>new Promise(r=>release=r));const value=await f.make().exchange(context,'synthetic',signal());if('status' in value)throw Error();
 const pending=value.resetPassword('made-up',signal());await vi.waitFor(()=>expect(f.value.resetPassword).toHaveBeenCalledOnce());expect(await value.discard(signal())).toBe(false);release(true);expect(await pending).toBe(false);expect(await value.discard(signal())).toBe(false);expect(f.port.settle).toHaveBeenCalledOnce();expect([...f.records.values()]).toEqual(['held']);
});
it('configuration and context snapshots cannot add secret fields to durable requests',async()=>{
 const f=fixture();expect(()=>createDurableRecoveryAdmission({...binding,secret:'synthetic'} as typeof binding,f.port,f.provider)).toThrow();
 const selected={...binding},ctx={...context},guard=createDurableRecoveryAdmission(selected,f.port,f.provider),pending=guard.exchange(ctx,'synthetic',signal());
 selected.storeId='substituted';ctx.subjectKey='c'.repeat(64);const value=await pending;expect(f.port.reserve.mock.calls[0][0]).toMatchObject({...binding,subjectKey:context.subjectKey});if(!('status' in value))await value.discard(signal());
});
it('lost reset-claim acknowledgment retains a hold and never starts the password operation',async()=>{
 const f=fixture(),value=await f.make().exchange(context,'synthetic',signal());if('status' in value)throw Error();f.port.claimReset.mockImplementationOnce(async r=>{f.records.set(r.operationId,'resetting');throw Error('synthetic');});
 expect(await value.resetPassword('made-up',signal())).toBe(false);expect(f.value.resetPassword).not.toHaveBeenCalled();expect(await value.discard(signal())).toBe(false);expect([...f.records.values()]).toEqual(['held']);
});
it('cleanup timeout stays held and never becomes success when cleanup eventually responds',async()=>{
 const f=fixture(),guard=f.make(5),value=await guard.exchange(context,'synthetic',signal());if('status' in value)throw Error();let release!:(value:boolean)=>void;f.value.discard.mockImplementationOnce(()=>new Promise(r=>release=r));
 expect(await value.discard(signal())).toBe(false);expect([...f.records.values()]).toEqual(['held']);release(true);await Promise.resolve();expect(await value.discard(signal())).toBe(false);expect(await f.make().exchange(context,'synthetic',signal())).toEqual({status:'notCreated'});
});
it('malformed settlement acknowledgment cannot release the local cleanup hold',async()=>{
 const f=fixture(),guard=f.make(),value=await guard.exchange(context,'synthetic',signal());if('status' in value)throw Error();f.port.settle.mockResolvedValueOnce({status:'rejected'} as never);expect(await value.discard(signal())).toBe(false);expect(guard.cleanupHeld()).toBe(true);expect([...f.records.values()]).toEqual(['reserved']);
});
