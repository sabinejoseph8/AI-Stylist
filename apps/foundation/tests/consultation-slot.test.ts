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
