import {it,expect,vi} from 'vitest';
import {createSupabaseRpc} from '../src/server/supabase-rpc.ts';

const url='https://example.supabase.co';const key='private-server-key-value-123456';
function response(body:string,status=200,type='application/json'){return new Response(body,{status,headers:{'content-type':type}});}
it('sends a bounded server RPC to the configured HTTPS project',async()=>{
 const fetcher=vi.fn(async(_url:string,_init:RequestInit)=>response('{"ok":true}'));
 const rpc=createSupabaseRpc(url,key,fetcher as never);
 expect(await rpc.call('stylist_example_read',{})).toEqual({ok:true});
 expect(fetcher).toHaveBeenCalledOnce();
 const [target,init]=fetcher.mock.calls[0];
 expect(target).toBe(`${url}/rest/v1/rpc/stylist_example_read`);
 expect(init.method).toBe('POST');expect(init.redirect).toBe('error');
 expect(new Headers(init.headers).get('authorization')).toBe(`Bearer ${key}`);
 expect(init.body).toBe('{}');
});
it('rejects destinations that could redirect the server key elsewhere',()=>{
 for(const bad of ['http://example.supabase.co','https://evil.example','https://user:pw@example.supabase.co','https://example.supabase.co/path','https://example.supabase.co:444'])
  expect(()=>createSupabaseRpc(bad,key,async()=>response('{}') as never)).toThrow();
 expect(()=>createSupabaseRpc(url,'short',async()=>response('{}') as never)).toThrow();
});
it('rejects unsafe RPC names and oversized requests before sending',async()=>{
 const fetcher=vi.fn(async()=>response('{}'));const rpc=createSupabaseRpc(url,key,fetcher as never);
 await expect(rpc.call('../stylist_bad',{})).rejects.toThrow();
 await expect(rpc.call('stylist_test',{value:'x'.repeat(70*1024)})).rejects.toThrow();
 await expect(rpc.call('stylist_test',{value:'🌿'.repeat(17*1024)})).rejects.toThrow();
 expect(fetcher).not.toHaveBeenCalled();
});
it('sanitizes transport, status, content type and malformed JSON failures',async()=>{
 const failing=createSupabaseRpc(url,key,(async()=>{throw Error(key)}) as never);
 await expect(failing.call('stylist_test',{})).rejects.toThrow('Supabase operation unavailable');
 for(const fetcher of [
  async()=>response('{"message":"secret"}',403),
  async()=>response('{}',200,'text/html'),
  async()=>response('{bad'),
 ])await expect(createSupabaseRpc(url,key,fetcher as never).call('stylist_test',{})).rejects.toThrow('Supabase operation unavailable');
});
it('rejects and cancels responses that exceed the read limit',async()=>{
 let cancelled=false;
 const body=new ReadableStream<Uint8Array>({start(controller){controller.enqueue(new Uint8Array(70*1024));},cancel(){cancelled=true;}});
 const fetcher=async()=>({status:200,headers:new Headers({'content-type':'application/json'}),body});
 await expect(createSupabaseRpc(url,key,fetcher as never).call('stylist_test',{})).rejects.toThrow('Supabase operation unavailable');
 expect(cancelled).toBe(true);
});
it('aborts a fetch that ignores the configured deadline',async()=>{
 let signal:AbortSignal|undefined;
 const fetcher=async(_url:string,init:RequestInit)=>{signal=init.signal as AbortSignal;return await new Promise<never>(()=>{});};
 await expect(createSupabaseRpc(url,key,fetcher as never,20).call('stylist_test',{})).rejects.toThrow('Supabase operation unavailable');
 expect(signal?.aborted).toBe(true);
});
it('cancels a response body that never completes',async()=>{
 let cancelled=false;
 const body=new ReadableStream<Uint8Array>({pull(){return new Promise<void>(()=>{});},cancel(){cancelled=true;}});
 const fetcher=async()=>({status:200,headers:new Headers({'content-type':'application/json'}),body});
 await expect(createSupabaseRpc(url,key,fetcher as never,20).call('stylist_test',{})).rejects.toThrow('Supabase operation unavailable');
 expect(cancelled).toBe(true);
});
it('redacts serialization failures before any request',async()=>{
 const fetcher=vi.fn(async()=>response('{}'));const rpc=createSupabaseRpc(url,key,fetcher);
 const circular:Record<string,unknown>={};circular.self=circular;
 for(const value of [circular,{value:1n},{toJSON(){throw Error('private content');}},{toJSON(){return undefined;}}])await expect(rpc.call('stylist_test',value)).rejects.toThrow('Supabase operation unavailable');
 expect(fetcher).not.toHaveBeenCalled();
});
it('contains a rejecting cancellation without exposing a provider error',async()=>{
 const body=new ReadableStream<Uint8Array>({cancel(){return Promise.reject(Error('private detail'));}});
 const rpc=createSupabaseRpc(url,key,async()=>({status:403,headers:new Headers(),body}));
 await expect(rpc.call('stylist_test',{})).rejects.toThrow('Supabase operation unavailable');
 await new Promise(resolve=>setTimeout(resolve,0));
});
