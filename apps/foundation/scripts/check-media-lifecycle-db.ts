/** Invoked only inside the isolated Python SQL rehearsal, never a hosted adapter. */
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {saveImage,deleteImage} from '../src/server/media-lifecycle.ts';
import {reconcileMedia} from '../src/server/media-reconcile.ts';
import {createMediaSupabasePort} from '../src/server/media-supabase.ts';
import {createSupabaseRpc} from '../src/server/supabase-rpc.ts';
import {createSupabaseStorage} from '../src/server/supabase-storage.ts';
const container=process.argv[2];
if(!/^stylist-data-[a-f0-9]{10}$/.test(container??''))throw Error('Isolated container required');
const owner='00000000-0000-0000-0000-000000000001',other='00000000-0000-0000-0000-000000000002';
const literal=(v:string)=>"'"+v.replaceAll("'","''")+"'";
function sql(query:string){return execFileSync('docker',['exec','-i',container,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],{input:query,encoding:'utf8',timeout:10000,stdio:['pipe','pipe','pipe']}).trim();}
function service(query:string){return sql('set role service_role; '+query);}
function actor(query:string){return sql(`set role authenticated; set request.jwt.claim.sub=${literal(owner)}; `+query);}
const reply=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
type Failure='none'|'stage'|'put'|'commit'|'remove'|'finish';
function prepared(objects:Map<string,Uint8Array>,failure:Failure='none'){
 const captured={asset:'',key:''};
 const rpc=createSupabaseRpc('https://fixture.supabase.co','synthetic-test-key-never-live',async(url,init)=>{
  const name=new URL(url).pathname.split('/').at(-1),p=JSON.parse(init.body as string);
  const id=literal(p.p_id),user=literal(p.p_owner);let value:unknown;
  switch(name){
   case 'stylist_stage_media':
    assert(Number.isSafeInteger(p.p_width)&&Number.isSafeInteger(p.p_height));captured.asset=p.p_id;captured.key=`${p.p_owner}/${p.p_id}.webp`;
    service(`select public.stylist_stage_media(${id},${user},${literal(p.p_checksum)},${p.p_width},${p.p_height});`);
    if(failure==='stage')throw Error('Lost stage acknowledgment');value=true;break;
   case 'stylist_read_media_operation':{const raw=service(`select public.stylist_read_media_operation(${id},${user});`);value=raw?JSON.parse(raw):null;break;}
   case 'stylist_commit_media':
    service(`select public.stylist_commit_media(${id},${user},${literal(p.p_checksum)});`);
    if(failure==='commit')throw Error('Lost commit acknowledgment');value=true;break;
   case 'stylist_finish_media_delete':
    service(`select public.stylist_finish_media_delete(${id},${user},${literal(p.p_token)});`);
    if(failure==='finish')throw Error('Lost finish acknowledgment');value=true;break;
   default:throw Error('Unexpected service RPC');
  }
  return reply(value);
 });
 const customer={ownerId:owner,async call(name:string,p:Record<string,unknown>){
  assert.equal(name,'stylist_begin_media_delete');assert(Number.isSafeInteger(p.p_expected_revision));assert.equal(p.p_confirm,true);
  return JSON.parse(actor(`select public.stylist_begin_media_delete(${literal(String(p.p_id))},${p.p_expected_revision},true);`));
 }};
 const store=createSupabaseStorage('https://fixture.supabase.co','synthetic-test-key-never-live',async(url,init)=>{
  const path=new URL(url).pathname;
  if(init.method==='POST'){
   assert(path.startsWith('/storage/v1/object/stylist-wardrobe/'));const key=path.slice('/storage/v1/object/stylist-wardrobe/'.length);
   assert.equal(new Headers(init.headers).get('x-upsert'),'false');if(objects.has(key))return reply({},409);
   objects.set(key,new Uint8Array(init.body as ArrayBuffer));if(failure==='put')throw Error('Lost upload acknowledgment');
   return reply({Id:key.split('/')[1]!.slice(0,-5),Key:`stylist-wardrobe/${key}`});
  }
  if(init.method==='GET'){
   assert(path.startsWith('/storage/v1/object/authenticated/stylist-wardrobe/'));const key=path.slice('/storage/v1/object/authenticated/stylist-wardrobe/'.length),bytes=objects.get(key);
   return bytes?new Response(Uint8Array.from(bytes).buffer,{headers:{'content-type':key.endsWith('.jpg')?'image/jpeg':'image/webp'}}):new Response(null,{status:404});
  }
  assert.equal(init.method,'DELETE');assert.equal(path,'/storage/v1/object/stylist-wardrobe');
  const {prefixes}=JSON.parse(new TextDecoder().decode(init.body as ArrayBuffer));assert.equal(prefixes.length,1);const key=prefixes[0];
  const removed=objects.delete(key);if(failure==='remove')throw Error('Lost deletion acknowledgment');
  return reply(removed?[{name:key,bucket_id:'stylist-wardrobe'}]:[]);
 });
 return {captured,port:createMediaSupabasePort(owner,rpc,customer,store)};
}
const image=await sharp({create:{width:10,height:10,channels:3,background:'blue'}}).png().toBuffer();
for(const failure of ['none','stage','put','commit','remove','finish'] as const){
 const objects=new Map<string,Uint8Array>(),{port,captured}=prepared(objects,failure);
 if(['stage','put','commit'].includes(failure))await assert.rejects(saveImage(port,owner,true,image,'image/png'));
 else await saveImage(port,owner,true,image,'image/png');
 const {asset,key}=captured;
 assert.equal(await reconcileMedia(port,other,asset),'pending');const reconciled=await reconcileMedia(port,owner,asset);
 if(failure==='stage'){assert.equal(reconciled,'pending');assert.equal(objects.size,0);continue;}
 assert.equal(reconciled,'ready');assert(objects.has(key));
 if(failure==='remove'||failure==='finish')await assert.rejects(deleteImage(port,owner,asset,2,true));
 else await deleteImage(port,owner,asset,2,true);
 assert.equal(await reconcileMedia(port,owner,asset),'deleted');assert(!objects.has(key));
 assert.throws(()=>service('select * from stylist_private.media_deletion_receipts;'));
 assert.throws(()=>service(`select public.stylist_stage_media(${literal(asset)},${literal(owner)},${literal('a'.repeat(64))},10,10);`));
 assert.equal(service(`select public.stylist_read_media_operation(${literal(asset)},${literal(other)});`),'');
}
const legacyKey=owner+'/fixture.jpg',legacyId=actor(`select id from public.stylist_media_assets where user_id=${literal(owner)} and storage_key=${literal(legacyKey)};`);assert(legacyId);
const legacyObjects=new Map([[legacyKey,new TextEncoder().encode('synthetic legacy JPEG object')]]),{port:legacyPort}=prepared(legacyObjects);
assert.equal(await reconcileMedia(legacyPort,owner,legacyId),'ready');assert.equal(await reconcileMedia(legacyPort,other,legacyId),'pending');
await deleteImage(legacyPort,owner,legacyId,1,true);assert.equal(await reconcileMedia(legacyPort,owner,legacyId),'deleted');assert(!legacyObjects.has(legacyKey));
console.log('SQL-backed media lifecycle recovery through prepared RPC/Storage adapters: six lost-acknowledgment paths and legacy JPEG deletion pass. Storage HTTP and customer RPC authentication are simulated.');
