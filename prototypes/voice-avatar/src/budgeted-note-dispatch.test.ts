import {describe,it,expect,vi,afterEach} from 'vitest';
import {prepareBudgetedNoteDispatch} from './budgeted-note-dispatch.ts';
const input={turnId:'t1',text:'I like green',context:''};
const signal=()=>new AbortController().signal;
afterEach(()=>vi.useRealTimers());
describe('disabled exact-request dispatch composition',()=>{
 it('does not accept live mode',()=>{expect(()=>prepareBudgetedNoteDispatch({count:async()=>1,dispatch:async()=>null})).toThrow();});
 it('counts and dispatches the identical complete immutable serialized request',async()=>{
  let counted='';const dispatch=vi.fn(async(body:string)=>{expect(body).toBe(counted);return {ok:true};});
  const b=prepareBudgetedNoteDispatch({simulation:true,count:async body=>{counted=body;return 42;},dispatch});
  expect(await b.request(input,signal())).toEqual({ok:true});const body=JSON.parse(counted);
  expect(body.model).toBe('gpt-4.1-mini-2025-04-14');expect(body.instructions).toBeTruthy();expect(body.text.format.schema).toBeTruthy();
  expect(b.snapshot()).toMatchObject({attempts:1,inputTokens:42,outputTokens:2048,held:false});
 });
 it('holds counter errors without dispatch or exposing private errors',async()=>{
  const dispatch=vi.fn();const b=prepareBudgetedNoteDispatch({simulation:true,count:async()=>{throw Error('secret');},dispatch});
  await expect(b.request(input,signal())).rejects.toThrow('Budgeted extraction unavailable.');expect(dispatch).not.toHaveBeenCalled();expect(b.snapshot().held).toBe(true);
 });
 it('retains failed attempted dispatch accounting and refuses later work',async()=>{
  const dispatch=vi.fn(async()=>{throw Error('private');});const b=prepareBudgetedNoteDispatch({simulation:true,count:async()=>100,dispatch});
  await expect(b.request(input,signal())).rejects.toThrow();await expect(b.request(input,signal())).rejects.toThrow();
  expect(dispatch).toHaveBeenCalledTimes(1);expect(b.snapshot()).toMatchObject({attempts:1,inputTokens:100,held:true});
 });
 it('overlapping counters cannot exceed aggregate tokens',async()=>{
  const resolves:Array<(n:number)=>void>=[];const dispatch=vi.fn(async()=>null);
  const b=prepareBudgetedNoteDispatch({simulation:true,count:()=>new Promise<number>(r=>resolves.push(r)),dispatch});
  const a=b.request(input,signal()),c=b.request(input,signal());const results=Promise.allSettled([a,c]);
  resolves[0]!(600000);await Promise.resolve();await Promise.resolve();resolves[1]!(600000);await results;
  expect(dispatch).toHaveBeenCalledTimes(1);expect(b.snapshot()).toMatchObject({attempts:1,inputTokens:600000,held:true});
 });
 it('cancellation while counting never dispatches even after a late count',async()=>{
  let finish!:(n:number)=>void;const dispatch=vi.fn();const controller=new AbortController();
  const b=prepareBudgetedNoteDispatch({simulation:true,count:()=>new Promise<number>(r=>{finish=r;}),dispatch});
  const pending=b.request(input,controller.signal);const result=expect(pending).rejects.toThrow();controller.abort();await result;finish(1);await Promise.resolve();
  expect(dispatch).not.toHaveBeenCalled();expect(b.snapshot().held).toBe(false);
 });
 it('bounds an uncooperative counter with the local deadline',async()=>{
  vi.useFakeTimers();const dispatch=vi.fn();const b=prepareBudgetedNoteDispatch({simulation:true,count:()=>new Promise(()=>{}),dispatch});
  const pending=expect(b.request(input,signal())).rejects.toThrow();await vi.advanceTimersByTimeAsync(5000);await pending;expect(dispatch).not.toHaveBeenCalled();expect(vi.getTimerCount()).toBe(0);
 });
 it('explicit end aborts pending dispatch and retains its reservation',async()=>{
  let downstream:AbortSignal|undefined;const b=prepareBudgetedNoteDispatch({simulation:true,count:async()=>3,dispatch:async(_,s)=>{downstream=s;return new Promise(()=>{});}});
  const pending=expect(b.request(input,signal())).rejects.toThrow();await Promise.resolve();await Promise.resolve();expect(downstream).toBeDefined();b.end();await pending;
  expect(downstream?.aborted).toBe(true);expect(b.snapshot()).toMatchObject({attempts:1,inputTokens:3,held:true});
 });
 it('does not return a result when dispatch synchronously ends its owner',async()=>{
  let b!:ReturnType<typeof prepareBudgetedNoteDispatch>;
  b=prepareBudgetedNoteDispatch({simulation:true,count:async()=>1,dispatch:async()=>{b.end();return {stale:true};}});
  await expect(b.request(input,signal())).rejects.toThrow();expect(b.snapshot()).toMatchObject({attempts:1,held:true});
 });
 it('bounds counting requests before concurrent counters can complete',async()=>{
  const count=vi.fn(()=>new Promise<number>(()=>{})),dispatch=vi.fn();
  const b=prepareBudgetedNoteDispatch({simulation:true,count,dispatch});
  const pending=Array.from({length:65},()=>b.request(input,signal()));
  const results=await Promise.allSettled(pending);
  expect(results.every(r=>r.status==='rejected')).toBe(true);expect(count).toHaveBeenCalledTimes(64);expect(dispatch).not.toHaveBeenCalled();
  expect(b.snapshot()).toMatchObject({countRequests:64,attempts:0,held:true});
 });
 it('superseding a canceled count permits the next revision without refunds',async()=>{
  let call=0;const controller=new AbortController();const dispatch=vi.fn(async()=>null);
  const b=prepareBudgetedNoteDispatch({simulation:true,count:async()=>{if(++call===1)return new Promise<number>(()=>{});return 10;},dispatch});
  const first=expect(b.request(input,controller.signal)).rejects.toThrow();controller.abort();await first;
  await b.request({...input,text:'blue'},signal());expect(dispatch).toHaveBeenCalledTimes(1);
  expect(b.snapshot()).toMatchObject({countRequests:2,attempts:1,inputTokens:10,held:false});
 });
 it('pre-canceled input makes no counter or dispatch call',async()=>{
  const count=vi.fn(),dispatch=vi.fn(),controller=new AbortController();controller.abort();const b=prepareBudgetedNoteDispatch({simulation:true,count,dispatch});
  await expect(b.request(input,controller.signal)).rejects.toThrow();expect(count).not.toHaveBeenCalled();expect(dispatch).not.toHaveBeenCalled();
 });
});
