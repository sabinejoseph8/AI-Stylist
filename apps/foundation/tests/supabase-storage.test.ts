import {createHash} from 'node:crypto';
import {describe,expect,it,vi} from 'vitest';
import {createSupabaseStorage,type StorageFetch,type StorageResponse} from '../src/server/supabase-storage.ts';

const owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const key=`${owner}/${id}.webp`;
const bytes=new TextEncoder().encode('synthetic webp payload');
function response(status:number,body:Uint8Array|null=null,type='application/json'):StorageResponse{
 return {status,headers:{get:(name)=>name.toLowerCase()==='content-type'?type:null},body:body?new ReadableStream<Uint8Array>({start(c){c.enqueue(body);c.close();}}):null};
}
const uploadAck=(name=key)=>response(200,new TextEncoder().encode(JSON.stringify({Id:id,Key:`stylist-wardrobe/${name}`})));
const deleteAck=(name=key)=>response(200,new TextEncoder().encode(JSON.stringify([{name,bucket_id:'stylist-wardrobe'}])));
const adapter=(fetcher:StorageFetch,deadline=8000)=>createSupabaseStorage('https://stylist-test.supabase.co','x'.repeat(30),fetcher,deadline);

describe('disabled Supabase Storage transport boundary',()=>{
 it('accepts only a Supabase HTTPS origin and bounded injected credentials',()=>{
  for(const url of ['http://stylist.supabase.co','https://evil.example','https://stylist.supabase.co/path','https://user@stylist.supabase.co'])
   expect(()=>createSupabaseStorage(url,'x'.repeat(30),vi.fn())).toThrow();
  expect(()=>createSupabaseStorage('https://stylist.supabase.co','short',vi.fn())).toThrow();
  expect(()=>createSupabaseStorage('https://stylist.supabase.co','x'.repeat(30),vi.fn(),8001)).toThrow();
 });
 it('uploads only a bounded normalized image to a fixed private bucket without upsert or redirects',async()=>{
  const fetcher=vi.fn(async(_url:string,_init:RequestInit)=>uploadAck());const store=adapter(fetcher);
  await store.putIfAbsent(key,bytes);
  const [url,init]=fetcher.mock.calls[0]!;
  expect(url).toBe(`https://stylist-test.supabase.co/storage/v1/object/stylist-wardrobe/${key}`);
  expect(init.method).toBe('POST');expect(init.redirect).toBe('error');expect(init.headers).toMatchObject({
   apikey:'x'.repeat(30),authorization:`Bearer ${'x'.repeat(30)}`,'content-type':'image/webp','x-upsert':'false',
  });
  expect(new Uint8Array(init.body as ArrayBuffer)).toEqual(bytes);
 });
 it('rejects unsafe keys and oversized uploads before network access',async()=>{
  const fetcher=vi.fn(async()=>response(200));const store=adapter(fetcher);
  for(const unsafe of [`../${id}.webp`,`${owner}/nested/${id}.webp`,`${owner}/bad%2f${id}.webp`,`https://evil/${id}.webp`])
   await expect(store.putIfAbsent(unsafe,bytes)).rejects.toThrow('Storage operation unavailable');
  await expect(store.putIfAbsent(key,new Uint8Array(10*1024*1024+1))).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
 });
 it('does not treat failed or redirected upload responses as success',async()=>{
  const store=adapter(vi.fn(async()=>response(409)));
  await expect(store.putIfAbsent(key,bytes)).rejects.toThrow('Storage operation unavailable');
 });
 it('hashes bytes read from the authenticated object endpoint and bounds them',async()=>{
  const fetcher=vi.fn(async(_url:string,_init:RequestInit)=>response(200,bytes,'image/webp'));
  const store=adapter(fetcher);
  expect(await store.inspect(key)).toEqual({state:'present',checksum:createHash('sha256').update(bytes).digest('hex')});
  expect(fetcher).toHaveBeenCalledWith(`https://stylist-test.supabase.co/storage/v1/object/authenticated/stylist-wardrobe/${key}`,expect.objectContaining({method:'GET',redirect:'error'}));
 });
 it('requires a structured NoSuchKey response for verified absence',async()=>{
  for(const status of [400,404])expect(await adapter(vi.fn(async()=>response(status,new TextEncoder().encode(JSON.stringify({code:'NoSuchKey',statusCode:'404',error:'not_found',message:'Object not found'}))))).inspect(key)).toEqual({state:'absent'});
  expect(await adapter(vi.fn(async()=>response(404))).inspect(key)).toEqual({state:'unknown'});
  expect(await adapter(vi.fn(async()=>response(403))).inspect(key)).toEqual({state:'unknown'});
  expect(await adapter(vi.fn(async()=>response(200,bytes,'text/html'))).inspect(key)).toEqual({state:'unknown'});
 });
 it('removes one exact key through the documented Storage object deletion route',async()=>{
  const fetcher=vi.fn(async(_url:string,_init:RequestInit)=>deleteAck());await adapter(fetcher).remove(key);
  const [url,init]=fetcher.mock.calls[0]!;
  expect(url).toBe('https://stylist-test.supabase.co/storage/v1/object/stylist-wardrobe');
  expect(init.method).toBe('DELETE');expect(JSON.parse(new TextDecoder().decode(init.body as ArrayBuffer))).toEqual({prefixes:[key]});
  await expect(adapter(vi.fn(async()=>response(500))).remove(key)).rejects.toThrow();
 });
 it('bounds response startup by the configured deadline and redacts provider errors',async()=>{
  const store=adapter(()=>new Promise(()=>{}),15);
  await expect(store.putIfAbsent(key,bytes)).rejects.toThrow('Storage operation unavailable');
 });
 it('cancels an oversized object stream and reports unknown',async()=>{
  let canceled=false;
  const huge=new ReadableStream<Uint8Array>({pull(c){c.enqueue(new Uint8Array(1024*1024));},cancel(){canceled=true;}});
  const response:StorageResponse={status:200,headers:{get:()=> 'image/webp'},body:huge};
  expect(await adapter(vi.fn(async()=>response)).inspect(key)).toEqual({state:'unknown'});
  await new Promise(resolve=>setTimeout(resolve,0));expect(canceled).toBe(true);
 });
 it('cancels a stalled object body at the deadline',async()=>{
  let canceled=false;
  const stalled=new ReadableStream<Uint8Array>({start(){},cancel(){canceled=true;}});
  const response:StorageResponse={status:200,headers:{get:()=> 'image/webp'},body:stalled};
  expect(await adapter(vi.fn(async()=>response),15).inspect(key)).toEqual({state:'unknown'});
  expect(canceled).toBe(true);
 });
});

it('rejects malformed owner IDs and reserves upload keys for new WebP assets',async()=>{
 const fetcher=vi.fn(async()=>response(200));const store=adapter(fetcher);
 for(const value of [`${'-'.repeat(36)}/${id}.webp`,`${owner}/fixture.jpg`,`${owner}/fixture.webp`])await expect(store.putIfAbsent(value,bytes)).rejects.toThrow();
 expect(fetcher).not.toHaveBeenCalled();
});
it('keeps a legacy single-file key readable and removable',async()=>{
 const legacy=`${owner}/${'a'.repeat(128)}.jpeg`;
 const fetcher=vi.fn(async(_url:string,init:RequestInit)=>init.method==='GET'?response(200,bytes,'image/jpeg'):deleteAck(legacy));
 const store=adapter(fetcher);
 expect((await store.inspect(legacy)).state).toBe('present');await store.remove(legacy);expect(fetcher).toHaveBeenCalledTimes(2);
});
it('never hashes a partial response as a full object',async()=>{
 expect(await adapter(vi.fn(async()=>response(206,bytes,'image/webp'))).inspect(key)).toEqual({state:'unknown'});
 const partial=response(200,bytes,'image/webp');partial.headers.get=name=>name==='content-range'?'bytes 0-2/90':name==='content-type'?'image/webp':null;
 expect(await adapter(vi.fn(async()=>partial)).inspect(key)).toEqual({state:'unknown'});
});
it('uses one deadline for response headers and the remaining object body',async()=>{
 vi.useFakeTimers();let canceled=false;
 try{
  const store=adapter(async()=>{await new Promise(resolve=>setTimeout(resolve,15));return {status:200,headers:{get:name=>name==='content-type'?'image/webp':null},body:new ReadableStream<Uint8Array>({cancel(){canceled=true;}})};},25);
  const read=store.inspect(key);await vi.advanceTimersByTimeAsync(26);expect(await read).toEqual({state:'unknown'});expect(canceled).toBe(true);
 }finally{vi.useRealTimers();}
});
it('does not wait indefinitely for a broken body cancellation',async()=>{
 const stalledCancel=new ReadableStream<Uint8Array>({cancel(){return new Promise(()=>{});}});
 const store=adapter(async()=>({status:409,headers:{get:()=>null},body:stalledCancel}),15);let timer:ReturnType<typeof setTimeout>;
 try{await expect(Promise.race([store.remove(key),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('held by cancel')),100);})])).rejects.toThrow('Storage operation unavailable');}finally{clearTimeout(timer!);}
});
it('cancels a response that arrives after the request deadline',async()=>{
 vi.useFakeTimers();let canceled=false;
 try{
  const store=adapter(async()=>{await new Promise(resolve=>setTimeout(resolve,30));return {status:200,headers:{get:()=>null},body:new ReadableStream<Uint8Array>({cancel(){canceled=true;}})};},15);
  const result=store.inspect(key);await vi.advanceTimersByTimeAsync(16);expect(await result).toEqual({state:'unknown'});await vi.advanceTimersByTimeAsync(20);expect(canceled).toBe(true);
 }finally{vi.useRealTimers();}
});
it('holds a successful HTTP status without an exact upload acknowledgment',async()=>{
 for(const value of [true,{Id:id,Key:`stylist-wardrobe/${owner}/wrong.webp`},{Id:'bad',Key:`stylist-wardrobe/${key}`}]){
  await expect(adapter(async()=>response(200,new TextEncoder().encode(JSON.stringify(value)))).putIfAbsent(key,bytes)).rejects.toThrow('Storage operation unavailable');
 }
});
it('holds a deletion acknowledgment for no object, another key or another bucket',async()=>{
 for(const value of [[],[{name:`${owner}/other.jpg`,bucket_id:'stylist-wardrobe'}],[{name:key,bucket_id:'other'}],true]){
  await expect(adapter(async()=>response(200,new TextEncoder().encode(JSON.stringify(value)))).remove(key)).rejects.toThrow('Storage operation unavailable');
 }
});
it('bounds mutation acknowledgments and rejects malformed JSON',async()=>{
 for(const body of ['{',JSON.stringify('x'.repeat(65537))])await expect(adapter(async()=>response(200,new TextEncoder().encode(body))).remove(key)).rejects.toThrow();
});

it('holds ambiguous missing-object responses rather than deleting metadata',async()=>{
 for(const value of [{code:'NoSuchBucket',statusCode:'404',error:'not_found'},{code:'NoSuchKey',statusCode:'403',error:'not_found'},{code:'NoSuchKey',statusCode:'404',error:'AccessDenied'},true]){
  expect(await adapter(async()=>response(400,new TextEncoder().encode(JSON.stringify(value)))).inspect(key)).toEqual({state:'unknown'});
 }
 for(const body of ['{',JSON.stringify({code:'NoSuchKey',statusCode:'404',error:'not_found',message:'x'.repeat(65537)})]){
  expect(await adapter(async()=>response(400,new TextEncoder().encode(body))).inspect(key)).toEqual({state:'unknown'});
 }
});
