import {describe,it,expect,vi} from 'vitest';
import {createConsultationSlot} from '../src/server/consultation-slot.ts';
const owner='00000000-0000-0000-0000-000000000001';
const session='00000000-0000-0000-0000-000000000002';
const token='00000000-0000-0000-0000-000000000003';
const record={sessionId:session,token,fence:1,state:'reserved' as const,expiresAt:'2026-10-12T00:00:00Z'};
describe('prepared consultation slot',()=>{
 it('binds the trusted owner and returns immutable validated lease',async()=>{
  const call=vi.fn(async()=>record);const slot=createConsultationSlot(owner,{call});
  const got=await slot.claim(session);expect(got).toEqual(record);expect(Object.isFrozen(got)).toBe(true);
  expect(call).toHaveBeenCalledWith('stylist_claim_consultation',{p_owner:owner,p_session:session,p_token:null});
 });
 it('keeps busy distinct from an uncertain response',async()=>{
  expect(await createConsultationSlot(owner,{call:async()=>null}).claim(session)).toBeNull();
  for(const raw of [undefined,false,{}, {...record,extra:'private'},{...record,sessionId:owner},{...record,fence:1.5},
   {...record,fence:Number.MAX_SAFE_INTEGER+1},{...record,state:'free'},{...record,expiresAt:'invalid'},
   {...record,expiresAt:'0'},{...record,token:'bad'},{...record,state:'provider'}]){
   await expect(createConsultationSlot(owner,{call:async()=>raw}).claim(session)).rejects.toThrow('uncertain');
  }
 });
 it('checks reconnect session and token without exposing raw errors',async()=>{
  const call=vi.fn(async()=>({...record,state:'provider'}));
  expect((await createConsultationSlot(owner,{call}).claim(session,token))?.state).toBe('provider');
  await expect(createConsultationSlot(owner,{call:async()=>({...record,token:owner})}).claim(session,token)).rejects.toThrow('uncertain');
  await expect(createConsultationSlot(owner,{call:async()=>{throw Error('secret');}}).claim(session)).rejects.toThrow(/^Consultation operation uncertain$/);
 });
 it('rejects bad configuration and input before RPC',async()=>{
  const call=vi.fn();expect(()=>createConsultationSlot('bad',{call})).toThrow();
  for(const delay of [0,8001,NaN])expect(()=>createConsultationSlot(owner,{call},delay)).toThrow();
  const slot=createConsultationSlot(owner,{call});await expect(slot.claim('bad')).rejects.toThrow();
  await expect(slot.claim(session,'bad')).rejects.toThrow();
  await expect(slot.update(record,'heartbeat',true)).rejects.toThrow();
  await expect(slot.update({...record,fence:0},'check')).rejects.toThrow();expect(call).not.toHaveBeenCalled();
 });
 it('requires exact boolean acknowledgments for every mutation',async()=>{
  for(const action of ['provider','heartbeat','check','end'] as const){
   const call=vi.fn(async()=>true);expect(await createConsultationSlot(owner,{call}).update(record,action)).toBe(true);
   expect(call.mock.calls[0]).toBeDefined();
   expect(await createConsultationSlot(owner,{call:async()=>false}).update(record,action)).toBe(false);
   await expect(createConsultationSlot(owner,{call:async()=>({ok:true})}).update(record,action)).rejects.toThrow('uncertain');
  }
 });
 it('bounds a stalled call and discards late results without retry',async()=>{
  let finish!:(x:unknown)=>void;const call=vi.fn(()=>new Promise<unknown>(resolve=>{finish=resolve;}));
  const slot=createConsultationSlot(owner,{call},5);const pending=slot.claim(session);
  await expect(slot.claim(session)).rejects.toThrow('uncertain');
  await expect(pending).rejects.toThrow('uncertain');finish(record);
  await new Promise(resolve=>setTimeout(resolve,0));expect(call).toHaveBeenCalledTimes(1);
 });
});

it.each(['timeout','transport','claim-shape','update-shape'] as const)('holds the slot after an uncertain %s outcome, including late success',async mode=>{
 vi.useFakeTimers();try{
  let finish!:(raw:unknown)=>void;
  const call=vi.fn(async()=>{if(mode==='timeout')return new Promise(resolve=>{finish=resolve;});if(mode==='transport')throw Error('Synthetic transport error');return {unexpected:true};});
  const slot=createConsultationSlot(owner,{call},5),first=mode==='update-shape'?slot.update(record,'provider'):slot.claim(session);
  const rejected=expect(first).rejects.toThrow('Consultation operation uncertain');await vi.advanceTimersByTimeAsync(5);await rejected;
  if(mode==='timeout'){finish(record);await Promise.resolve();}
  const nextClaim=expect(slot.claim(session)).rejects.toThrow('Consultation operation uncertain');await vi.advanceTimersByTimeAsync(5);await nextClaim;const nextUpdate=expect(slot.update(record,'check')).rejects.toThrow('Consultation operation uncertain');await vi.advanceTimersByTimeAsync(5);await nextUpdate;expect(call).toHaveBeenCalledTimes(1);
 }finally{vi.useRealTimers();}
});
it('known refusal and busy responses do not poison subsequent explicit operations',async()=>{const call=vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(false).mockResolvedValueOnce(record);const slot=createConsultationSlot(owner,{call});expect(await slot.claim(session)).toBeNull();expect(await slot.update(record,'check')).toBe(false);expect(await slot.claim(session)).toEqual(record);expect(call).toHaveBeenCalledTimes(3);});
it('a competing call cannot poison the original successful operation',async()=>{let finish!:(raw:unknown)=>void;const call=vi.fn(()=>new Promise(resolve=>{finish=resolve;}));const slot=createConsultationSlot(owner,{call});const first=slot.claim(session);await vi.waitFor(()=>expect(finish).toBeTypeOf('function'));await expect(slot.claim(session)).rejects.toThrow('uncertain');finish(record);expect(await first).toEqual(record);call.mockResolvedValueOnce(true);expect(await slot.update(record,'check')).toBe(true);expect(call).toHaveBeenCalledTimes(2);});
it('captures the RPC function so later caller mutation cannot replace the transport',async()=>{const original=vi.fn(async()=>record),replacement=vi.fn(async()=>null),rpc:{call:()=>Promise<unknown>}={call:original};const slot=createConsultationSlot(owner,rpc);rpc.call=replacement;expect(await slot.claim(session)).toEqual(record);expect(original).toHaveBeenCalledTimes(1);expect(replacement).not.toHaveBeenCalled();});
it('invalid local input never submits a mutation or creates an uncertain outcome',async()=>{const call=vi.fn(async()=>record),slot=createConsultationSlot(owner,{call});await expect(slot.claim('invalid')).rejects.toThrow('input unavailable');expect(call).not.toHaveBeenCalled();expect(await slot.claim(session)).toEqual(record);expect(call).toHaveBeenCalledTimes(1);});
