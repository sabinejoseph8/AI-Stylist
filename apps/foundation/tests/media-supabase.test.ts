import {createHash} from 'node:crypto';
import {expect,it,vi} from 'vitest';
import sharp from 'sharp';
import {createMediaSupabasePort,type OwnerMediaRpc} from '../src/server/media-supabase.ts';
import {createSupabaseStorage} from '../src/server/supabase-storage.ts';
import {createSupabaseRpc} from '../src/server/supabase-rpc.ts';
import {deleteImage,saveImage} from '../src/server/media-lifecycle.ts';
import {reconcileMedia} from '../src/server/media-reconcile.ts';
const owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',other='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',token='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const key=`${owner}/${id}.webp`,bytes=new TextEncoder().encode('synthetic stored bytes');
const hash=createHash('sha256').update(bytes).digest('hex');
const record={id,ownerId:owner,key,checksum:hash,width:3,height:4,contentType:'image/webp' as const};
function setup(){
 const service={call:vi.fn(async(_name:string,_payload:Record<string,unknown>):Promise<unknown>=>true)};
 const customer={ownerId:owner,call:vi.fn(async(_name:string,_payload:Record<string,unknown>):Promise<unknown>=>({key,deletionToken:token}))};
 const storage={putIfAbsent:vi.fn(async(_key:string,_bytes:Uint8Array)=>{}),inspect:vi.fn(async(_key:string)=>({state:'present' as const,checksum:hash})),remove:vi.fn(async(_key:string)=>{})};
 return {service,customer,storage,port:createMediaSupabasePort(owner,service,customer,storage)};
}
it('uses service RPCs for stage/read/commit/finish and customer RPC only for the deletion claim',async()=>{
 const x=setup();await x.port.stage(record);await x.port.read(id,owner);await x.port.commit(id,owner,hash);expect(await x.port.beginDelete(id,owner,2)).toEqual({key,deletionToken:token});await x.port.finishDelete(id,owner,token);
 expect(x.service.call.mock.calls.map(c=>c[0])).toEqual(['stylist_stage_media','stylist_read_media_operation','stylist_commit_media','stylist_finish_media_delete']);
 expect(x.customer.call).toHaveBeenCalledExactlyOnceWith('stylist_begin_media_delete',{p_id:id,p_expected_revision:2,p_confirm:true});
 expect(x.service.call).toHaveBeenNthCalledWith(1,'stylist_stage_media',{p_id:id,p_owner:owner,p_checksum:hash,p_width:3,p_height:4});
});
it('refuses another owner before touching database or object adapters',async()=>{
 const x=setup();await expect(x.port.stage({...record,ownerId:other})).rejects.toThrow();await expect(x.port.read(id,other)).rejects.toThrow();await expect(x.port.commit(id,other,hash)).rejects.toThrow();await expect(x.port.beginDelete(id,other,1)).rejects.toThrow();await expect(x.port.finishDelete(id,other,token)).rejects.toThrow();await expect(x.port.remove(`${other}/${id}.webp`)).rejects.toThrow();expect(await x.port.inspect(`${other}/${id}.webp`)).toEqual({state:'unknown'});
 expect(x.service.call).not.toHaveBeenCalled();expect(x.customer.call).not.toHaveBeenCalled();expect(x.storage.inspect).not.toHaveBeenCalled();expect(x.storage.remove).not.toHaveBeenCalled();
});
it('rejects extra staging fields, mismatched keys and unbounded image dimensions',async()=>{
 const x=setup();for(const bad of [{...record,key:`${owner}/other.webp`},{...record,width:8193},{...record,width:8192,height:8192},{...record,checksum:'bad'},{...record,transcript:'private'}])await expect(x.port.stage(bad)).rejects.toThrow();expect(x.service.call).not.toHaveBeenCalled();
});
it('holds malformed and foreign deletion claims before object removal',async()=>{
 for(const bad of [{key:`${other}/${id}.webp`,deletionToken:token},{key,deletionToken:'bad'},{key,deletionToken:token,private:'detail'},null]){const x=setup();x.customer.call.mockResolvedValue(bad);await expect(deleteImage(x.port,owner,id,1,true)).rejects.toThrow();expect(x.storage.remove).not.toHaveBeenCalled();}
});
it('rejects uncertain database acknowledgments without finalizing the lifecycle',async()=>{
 const x=setup();x.service.call.mockResolvedValue(false);await expect(x.port.stage(record)).rejects.toThrow();await expect(x.port.commit(id,owner,hash)).rejects.toThrow();await expect(x.port.finishDelete(id,owner,token)).rejects.toThrow();x.service.call.mockRejectedValue(Error('secret provider detail'));await expect(x.port.commit(id,owner,hash)).rejects.toThrow('Media operation unavailable');
});
it('preserves legacy deletion keys through the authenticated claim and exact removal',async()=>{
 const x=setup(),legacy=`${owner}/fixture.jpg`;x.customer.call.mockResolvedValue({key:legacy,deletionToken:token});await deleteImage(x.port,owner,id,1,true);expect(x.storage.remove).toHaveBeenCalledExactlyOnceWith(legacy);expect(x.service.call).toHaveBeenCalledExactlyOnceWith('stylist_finish_media_delete',{p_id:id,p_owner:owner,p_token:token});
});
it('runs sanitized save through service RPC and Storage with only injected responses',async()=>{
 const calls:Array<{url:string;init:RequestInit}>=[];
 const fetcher=vi.fn(async(url:string,init:RequestInit)=>{calls.push({url,init});const value=url.includes('/storage/v1/object/')?JSON.stringify({Id:id,Key:new URL(url).pathname.slice('/storage/v1/object/'.length)}):'true';return new Response(value,{status:200,headers:{'content-type':'application/json'}});});
 const rpc=createSupabaseRpc('https://fixture.supabase.co','x'.repeat(30),fetcher),customer:OwnerMediaRpc={ownerId:owner,call:vi.fn(async()=>{throw Error('not part of save');})};
 const port=createMediaSupabasePort(owner,rpc,customer,createSupabaseStorage('https://fixture.supabase.co','x'.repeat(30),fetcher));
 const input=await sharp({create:{width:3,height:4,channels:3,background:'#008080'}}).png().toBuffer(),saved=await saveImage(port,owner,true,input,'image/png');
 expect(calls.map(c=>new URL(c.url).pathname)).toEqual(['/rest/v1/rpc/stylist_stage_media',`/storage/v1/object/stylist-wardrobe/${owner}/${saved.id}.webp`,'/rest/v1/rpc/stylist_commit_media']);
 const staged=JSON.parse(calls[0]!.init.body as string);expect(staged.p_owner).toBe(owner);expect(staged.p_width).toBe(3);const uploaded=new Uint8Array(calls[1]!.init.body as ArrayBuffer);expect(createHash('sha256').update(uploaded).digest('hex')).toBe(staged.p_checksum);expect(customer.call).not.toHaveBeenCalled();
});
it('reconciles staging from authenticated downloaded bytes and service commit acknowledgment',async()=>{
 const rpcFetch=vi.fn(async(_url:string,init:RequestInit)=>new Response(JSON.stringify((JSON.parse(init.body as string).p_checksum)?true:{id,ownerId:owner,key,checksum:hash,state:'staged',deletionToken:null}),{headers:{'content-type':'application/json'}}));
 const rpc=createSupabaseRpc('https://fixture.supabase.co','x'.repeat(30),rpcFetch),storageFetch=vi.fn(async()=>new Response(bytes,{headers:{'content-type':'image/webp'}}));
 const port=createMediaSupabasePort(owner,rpc,setup().customer,createSupabaseStorage('https://fixture.supabase.co','x'.repeat(30),storageFetch));expect(await reconcileMedia(port,owner,id)).toBe('ready');expect(rpcFetch).toHaveBeenCalledTimes(2);expect(storageFetch).toHaveBeenCalledOnce();expect(JSON.parse(rpcFetch.mock.calls[1]![1].body as string)).toEqual({p_id:id,p_owner:owner,p_checksum:hash});
});
it('does not commit staging when the downloaded checksum differs',async()=>{
 const x=setup();x.service.call.mockResolvedValue({id,ownerId:owner,key,checksum:'e'.repeat(64),state:'staged',deletionToken:null});expect(await reconcileMedia(x.port,owner,id)).toBe('pending');expect(x.service.call).toHaveBeenCalledOnce();
});
it('recognizes a deletion receipt without reading or removing an object again',async()=>{
 const x=setup();x.service.call.mockResolvedValue({id,ownerId:owner,key,checksum:null,state:'deleted',deletionToken:token});expect(await reconcileMedia(x.port,owner,id)).toBe('deleted');expect(x.storage.inspect).not.toHaveBeenCalled();expect(x.storage.remove).not.toHaveBeenCalled();
});
it('rejects a mismatched authenticated database context at construction',()=>{
 const x=setup();expect(()=>createMediaSupabasePort(owner,x.service,{...x.customer,ownerId:other},x.storage)).toThrow('Media configuration unavailable');
});
it('retains deletion metadata after an empty removal acknowledgment, then finalizes only from confirmed absence',async()=>{
 const x=setup();const db=vi.fn(async(_url:string,init:RequestInit)=>{
  const name=new URL(_url).pathname.split('/').at(-1);return new Response(JSON.stringify(name==='stylist_read_media_operation'?{id,ownerId:owner,key,checksum:hash,state:'deleting',deletionToken:token}:true),{headers:{'content-type':'application/json'}});
 });
 const rpc=createSupabaseRpc('https://fixture.supabase.co','x'.repeat(30),db);
 const storageFetch=vi.fn(async(_url:string,init:RequestInit)=>init.method==='DELETE'?new Response('[]',{headers:{'content-type':'application/json'}}):new Response(JSON.stringify({code:'NoSuchKey',statusCode:'404',error:'not_found'}),{status:400,headers:{'content-type':'application/json'}}));
 const port=createMediaSupabasePort(owner,rpc,x.customer,createSupabaseStorage('https://fixture.supabase.co','x'.repeat(30),storageFetch));
 await expect(deleteImage(port,owner,id,2,true)).rejects.toThrow('Image deletion not confirmed');expect(db).not.toHaveBeenCalled();
 expect(await reconcileMedia(port,owner,id)).toBe('deleted');expect(db).toHaveBeenCalledTimes(2);expect(storageFetch.mock.calls.map(c=>c[1].method)).toEqual(['DELETE','GET']);
 expect(db.mock.calls[1]![0]).toContain('/stylist_finish_media_delete');
});
