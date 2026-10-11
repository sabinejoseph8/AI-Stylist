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
const adapter=(fetcher:StorageFetch,deadline=8000)=>createSupabaseStorage('https://stylist-test.supabase.co','x'.repeat(30),fetcher,deadline);

describe('disabled Supabase Storage transport boundary',()=>{
 it('accepts only a Supabase HTTPS origin and bounded injected credentials',()=>{
  for(const url of ['http://stylist.supabase.co','https://evil.example','https://stylist.supabase.co/path','https://user@stylist.supabase.co'])
   expect(()=>createSupabaseStorage(url,'x'.repeat(30),vi.fn())).toThrow();
  expect(()=>createSupabaseStorage('https://stylist.supabase.co','short',vi.fn())).toThrow();
  expect(()=>createSupabaseStorage('https://stylist.supabase.co','x'.repeat(30),vi.fn(),8001)).toThrow();
 });
 it('uploads only a bounded normalized image to a fixed private bucket without upsert or redirects',async()=>{
  const fetcher=vi.fn(async(_url:string,_init:RequestInit)=>response(200));const store=adapter(fetcher);
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
 it('treats only a 404 as absent and other read failures as unknown',async()=>{
  expect(await adapter(vi.fn(async()=>response(404))).inspect(key)).toEqual({state:'absent'});
  expect(await adapter(vi.fn(async()=>response(403))).inspect(key)).toEqual({state:'unknown'});
  expect(await adapter(vi.fn(async()=>response(200,bytes,'text/html'))).inspect(key)).toEqual({state:'unknown'});
 });
 it('removes one exact key through the documented Storage object deletion route',async()=>{
  const fetcher=vi.fn(async(_url:string,_init:RequestInit)=>response(200));await adapter(fetcher).remove(key);
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
