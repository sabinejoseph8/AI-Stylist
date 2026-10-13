import {describe,it,expect,vi} from 'vitest';
import {createPreparedNoteTokenCounter,NOTE_TOKEN_COUNT_ENDPOINT} from './note-token-count-transport.ts';
import {buildOpenAINoteRequest} from './openai-note-extractor.ts';
import {prepareBudgetedNoteDispatch} from './budgeted-note-dispatch.ts';
const request=JSON.stringify(buildOpenAINoteRequest({turnId:'t1',text:'green',context:''}));
const signal=()=>new AbortController().signal;
const response=(value:unknown)=>new Response(JSON.stringify(value),{headers:{'content-type':'application/json'}});
describe('disabled provider input-token count transport',()=>{
 it('requires simulation without starting a request',()=>{const fetch=vi.fn();expect(()=>createPreparedNoteTokenCounter({fetch})).toThrow();expect(fetch).not.toHaveBeenCalled();});
 it('sends exact request bytes to the fixed endpoint with no redirect or cache',async()=>{
  const fetch=vi.fn(async(url:string,init:RequestInit)=>{expect(url).toBe(NOTE_TOKEN_COUNT_ENDPOINT);expect(init.body).toBe(request);expect(init.redirect).toBe('error');expect(init.cache).toBe('no-store');expect(init.headers).toEqual({'Content-Type':'application/json'});return response({object:'response.input_tokens',input_tokens:33});});
  expect(await createPreparedNoteTokenCounter({simulation:true,fetch})(request,signal())).toBe(33);
 });
 for(const value of [null,[],{}, {object:'other',input_tokens:1},{object:'response.input_tokens',input_tokens:0},{object:'response.input_tokens',input_tokens:-1},{object:'response.input_tokens',input_tokens:1.5},{object:'response.input_tokens',input_tokens:'33'},{object:'response.input_tokens',input_tokens:1,extra:'private'}])it('rejects malformed count envelope '+JSON.stringify(value),async()=>{
  const count=createPreparedNoteTokenCounter({simulation:true,fetch:async()=>response(value)});await expect(count(request,signal())).rejects.toThrow('Token counting unavailable.');
 });
 it('rejects foreign models and oversized requests before fetch',async()=>{
  const fetch=vi.fn(),count=createPreparedNoteTokenCounter({simulation:true,fetch});
  await expect(count('{"model":"other"}',signal())).rejects.toThrow();await expect(count(' '.repeat(32769),signal())).rejects.toThrow();expect(fetch).not.toHaveBeenCalled();
 });
 for(const [status,type] of [[500,'application/json'],[200,'text/html']] as const)it('holds HTTP/media errors '+status+type,async()=>{
  const count=createPreparedNoteTokenCounter({simulation:true,fetch:async()=>new Response('private',{status,headers:{'content-type':type}})});await expect(count(request,signal())).rejects.toThrow('Token counting unavailable.');
 });
 it('rejects oversized streamed content and cancels its reader',async()=>{
  const cancel=vi.fn();const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(32769));},cancel});
  const count=createPreparedNoteTokenCounter({simulation:true,fetch:async()=>new Response(stream,{headers:{'content-type':'application/json'}})});
  await expect(count(request,signal())).rejects.toThrow();expect(cancel).toHaveBeenCalled();
 });
 it('cancellation discards a late ignored-abort response body',async()=>{
  let finish!:(r:Response)=>void;const c=new AbortController(),cancel=vi.fn();const count=createPreparedNoteTokenCounter({simulation:true,fetch:()=>new Promise(r=>{finish=r;})});
  const pending=expect(count(request,c.signal)).rejects.toThrow();c.abort();await pending;
  finish(new Response(new ReadableStream({cancel}),{headers:{'content-type':'application/json'}}));await Promise.resolve();await Promise.resolve();expect(cancel).toHaveBeenCalled();
 });
 it('composes provider-counted budget before generation with identical bytes',async()=>{
  let counted='';const count=createPreparedNoteTokenCounter({simulation:true,fetch:async(_,init)=>{counted=String(init.body);return response({object:'response.input_tokens',input_tokens:99});}});
  const dispatch=vi.fn(async(body:string)=>{expect(body).toBe(counted);return 'result';});const owner=prepareBudgetedNoteDispatch({simulation:true,count,dispatch});
  expect(await owner.request({turnId:'t1',text:'green',context:''},signal())).toBe('result');expect(owner.snapshot()).toMatchObject({inputTokens:99,attempts:1});
 });
 it('invalid counter response prevents generation and permanently holds owner',async()=>{
  const count=createPreparedNoteTokenCounter({simulation:true,fetch:async()=>response({object:'response.input_tokens',input_tokens:'bad'})}),dispatch=vi.fn();
  const owner=prepareBudgetedNoteDispatch({simulation:true,count,dispatch});await expect(owner.request({turnId:'t1',text:'green',context:''},signal())).rejects.toThrow();expect(dispatch).not.toHaveBeenCalled();expect(owner.snapshot().held).toBe(true);
 });
});
