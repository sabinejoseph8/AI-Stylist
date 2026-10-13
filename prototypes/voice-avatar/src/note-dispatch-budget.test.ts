import {describe,it,expect} from 'vitest';
import {prepareNoteDispatchBudget} from './note-dispatch-budget.ts';
describe('disabled aggregate notebook dispatch budget',()=>{
 it('requires explicit simulation',()=>{expect(()=>prepareNoteDispatchBudget({})).toThrow();});
 it('counts every attempted dispatch without a refund or reset',()=>{
  const b=prepareNoteDispatchBudget({simulation:true});b.reserve(500,2048);b.reserve(600,100);
  expect(b.snapshot()).toEqual({attempts:2,inputTokens:1100,outputTokens:2148,held:false,liveEnabled:false});
  expect(Object.keys(b).sort()).toEqual(['hold','reserve','snapshot']);expect(Object.isFrozen(b)).toBe(true);
 });
 it('permits the exact aggregate input limit, then holds permanently',()=>{
  const b=prepareNoteDispatchBudget({simulation:true});b.reserve(1_000_000,2048);
  expect(()=>b.reserve(1,1)).toThrow();expect(()=>b.reserve(1,1)).toThrow();expect(b.snapshot().attempts).toBe(1);
 });
 it('permits 64 requests and reserves their maximum output',()=>{
  const b=prepareNoteDispatchBudget({simulation:true});for(let i=0;i<64;i++)b.reserve(1,2048);
  expect(b.snapshot().outputTokens).toBe(131072);expect(()=>b.reserve(1,1)).toThrow();expect(b.snapshot().attempts).toBe(64);
 });
 for(const input of [0,-1,NaN,Infinity,1.5,Number.MAX_SAFE_INTEGER])it(`rejects uncertain input ${input}`,()=>{
  const b=prepareNoteDispatchBudget({simulation:true});expect(()=>b.reserve(input,2048)).toThrow();expect(b.snapshot()).toMatchObject({attempts:0,held:true});
 });
 for(const output of [0,-1,NaN,Infinity,1.5,2049])it(`rejects invalid output ${output}`,()=>{
  const b=prepareNoteDispatchBudget({simulation:true});expect(()=>b.reserve(1,output)).toThrow();expect(b.snapshot().held).toBe(true);
 });
 it('external snapshots cannot alter accounting and explicit uncertainty holds',()=>{
  const b=prepareNoteDispatchBudget({simulation:true});expect(Object.isFrozen(b.snapshot())).toBe(true);b.hold();expect(()=>b.reserve(1,1)).toThrow();
 });
});
