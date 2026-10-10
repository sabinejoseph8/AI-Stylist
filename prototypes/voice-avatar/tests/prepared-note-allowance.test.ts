import {describe,it,expect,vi} from 'vitest';
import {isDeepStrictEqual} from 'node:util';
import {createPreparedNoteServerOwner} from '../src/prepared-note-server-owner.ts';
import {PreparedNoteAllowance} from '../src/prepared-note-allowance.ts';
import type {PreparedNoteLedger} from '../src/prepared-note-allowance.ts';
const fixture=():PreparedNoteLedger=>({version:1,purpose:'notes-only-simulation',approval:{id:'synthetic_approval',attempts:2,centsPerAttempt:100,secondsPerAttempt:85},runs:[]});
function store(initial:unknown=fixture()){
 let saved=structuredClone(initial);
 const read=vi.fn(async()=>structuredClone(saved));
 const compareAndSwap=vi.fn(async(expected:PreparedNoteLedger,next:PreparedNoteLedger)=>{if(!isDeepStrictEqual(saved,expected))return false;saved=structuredClone(next);return true;});
 return{read,compareAndSwap,snapshot:()=>structuredClone(saved) as PreparedNoteLedger};
}
const owner=(persistence:ReturnType<typeof store>)=>new PreparedNoteAllowance({simulation:true,persistence});
describe('separate disabled notes-only allowance',()=>{
 it('requires explicit simulation before accessing persistence',()=>{const s=store();expect(()=>new PreparedNoteAllowance({persistence:s})).toThrow('disabled');expect(s.read).not.toHaveBeenCalled();});
 it('preserves lifetime usage across owners and refuses a third trial without refund',async()=>{
  const s=store(),a=owner(s),first=await a.reserve();await a.closeVerified(first);const b=owner(s),second=await b.reserve();await b.closeVerified(second);await expect(owner(s).reserve()).rejects.toThrow('requires review');expect(s.snapshot().runs).toHaveLength(2);expect(s.snapshot().runs.every(r=>r.closed)).toBe(true);expect(s.snapshot().approval).toEqual(fixture().approval);
 });
 it('blocks unresolved reservations after restart',async()=>{const s=store();await owner(s).reserve();await expect(owner(s).reserve()).rejects.toThrow('requires review');expect(s.compareAndSwap).toHaveBeenCalledTimes(1);});
 it('allows at most one concurrent winner across independent owners',async()=>{const s=store(),results=await Promise.allSettled([owner(s).reserve(),owner(s).reserve()]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(s.snapshot().runs).toHaveLength(1);});
 it('retains a hold after a write succeeds but its response fails, without retry',async()=>{
  const s=store(),original=s.compareAndSwap.getMockImplementation()!;s.compareAndSwap.mockImplementation(async(a,b)=>{await original(a,b);throw Error('private sentinel');});const a=owner(s);await expect(a.reserve()).rejects.toThrow('requires review');await expect(a.reserve()).rejects.toThrow('requires review');expect(s.snapshot().runs).toHaveLength(1);expect(s.compareAndSwap).toHaveBeenCalledTimes(1);expect(JSON.stringify(a.status())).not.toContain('sentinel');
 });
 it('holds a failed closure and leaves its reservation open',async()=>{const s=store(),a=owner(s),id=await a.reserve();s.compareAndSwap.mockResolvedValue(false);await expect(a.closeVerified(id)).rejects.toThrow('requires review');await expect(a.closeVerified(id)).rejects.toThrow('requires review');expect(s.compareAndSwap).toHaveBeenCalledTimes(2);expect(s.snapshot().runs[0]!.closed).toBe(false);});
 it.each([null,{version:1,runs:[]},{...fixture(),purpose:'spoken'},{...fixture(),approval:{...fixture().approval,attempts:0}},{...fixture(),approval:{...fixture().approval,secondsPerAttempt:86}},{...fixture(),secret:'unexpected'}])('rejects missing, legacy or malformed stores without initialization: %j',async(value)=>{const s=store(value);await expect(owner(s).reserve()).rejects.toThrow('requires review');expect(s.compareAndSwap).not.toHaveBeenCalled();expect(s.snapshot()).toEqual(value);});
 it('does not close an unknown reservation',async()=>{const s=store(),a=owner(s);await expect(a.closeVerified('unknown')).rejects.toThrow('requires review');expect(s.compareAndSwap).not.toHaveBeenCalled();expect(a.status()).toEqual({held:true,liveEnabled:false});});
});


describe('notes allowance owner boundary',()=>{
 it('rejects an exhausted separate allowance before constructing providers',async()=>{
  const ledger=fixture();ledger.approval.attempts=1;ledger.runs=[{id:'synthetic_closed',closed:true}];const s=store(ledger),createTransports=vi.fn(()=>{throw Error('must not run');});
  const preview={origin:'https://fixture.onrender.com',password:'fixture_password_only_for_tests_123456'};
  const session=createPreparedNoteServerOwner({simulation:true,preview,allowance:owner(s),createTransports,changed:()=>{}});
  const result=await session.start({method:'GET',path:'/api/notebook-simulation',host:'fixture.onrender.com',origin:preview.origin,authorization:'Basic '+Buffer.from('stylist:'+preview.password).toString('base64'),signal:new AbortController().signal});
  expect(result.status).toBe(503);expect(session.status().state).toBe('held');expect(createTransports).not.toHaveBeenCalled();expect(s.compareAndSwap).not.toHaveBeenCalled();expect(s.snapshot()).toEqual(ledger);
 });
 it('does not initialize or retry a missing store',async()=>{const s=store();s.read.mockRejectedValue(Error('private sentinel'));const a=owner(s);await expect(a.reserve()).rejects.toThrow('requires review');await expect(a.reserve()).rejects.toThrow('requires review');expect(s.read).toHaveBeenCalledTimes(1);expect(s.compareAndSwap).not.toHaveBeenCalled();});
});
