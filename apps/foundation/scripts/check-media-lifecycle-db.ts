/** Invoked only inside the isolated Python SQL rehearsal, never a hosted adapter. */
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {saveImage,deleteImage} from '../src/server/media-lifecycle.ts';
import {reconcileMedia} from '../src/server/media-reconcile.ts';
const container=process.argv[2];
if(!/^stylist-data-[a-f0-9]{10}$/.test(container??''))throw Error('Isolated container required');
const owner='00000000-0000-0000-0000-000000000001';
const other='00000000-0000-0000-0000-000000000002';
const literal=(v:string)=>"'"+v.replaceAll("'","''")+"'";
function sql(query:string){return execFileSync('docker',['exec','-i',container,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],{input:query,encoding:'utf8',timeout:10000,stdio:['pipe','pipe','pipe']}).trim();}
function service(query:string){return sql('set role service_role; '+query);}
function actor(query:string){return sql(`set role authenticated; set request.jwt.claim.sub=${literal(owner)}; `+query);}
const image=await sharp({create:{width:10,height:10,channels:3,background:'blue'}}).png().toBuffer();
for(const failure of ['none','stage','put','commit','remove','finish'] as const){
 const objects=new Map<string,Uint8Array>();let asset='';let key='';
 const port={
  async stage(r:{id:string;ownerId:string;checksum:string;width:number;height:number;key:string}){asset=r.id;key=r.key;service(`select public.stylist_stage_media(${literal(r.id)},${literal(r.ownerId)},${literal(r.checksum)},${r.width},${r.height});`);if(failure==='stage')throw Error('Lost acknowledgment');},
  async putIfAbsent(k:string,bytes:Uint8Array){assert(!objects.has(k));objects.set(k,Uint8Array.from(bytes));if(failure==='put')throw Error('Lost acknowledgment');},
  async commit(id:string,o:string,c:string){service(`select public.stylist_commit_media(${literal(id)},${literal(o)},${literal(c)});`);if(failure==='commit')throw Error('Lost acknowledgment');},
  async read(id:string,o:string){const raw=service(`select public.stylist_read_media_operation(${literal(id)},${literal(o)});`);return raw?JSON.parse(raw):null;},
  async inspect(k:string){const bytes=objects.get(k);return bytes?{state:'present' as const,checksum:createHash('sha256').update(bytes).digest('hex')}:{state:'absent' as const};},
  async beginDelete(id:string,_o:string,revision:number){return JSON.parse(actor(`select public.stylist_begin_media_delete(${literal(id)},${revision},true);`));},
  async remove(k:string){objects.delete(k);if(failure==='remove')throw Error('Lost acknowledgment');},
  async finishDelete(id:string,o:string,t:string){service(`select public.stylist_finish_media_delete(${literal(id)},${literal(o)},${literal(t)});`);if(failure==='finish')throw Error('Lost acknowledgment');},
 };
 if(['stage','put','commit'].includes(failure))await assert.rejects(saveImage(port,owner,true,image,'image/png'));
 else await saveImage(port,owner,true,image,'image/png');
 const wrongOwner=await reconcileMedia(port,other,asset);assert.equal(wrongOwner,'pending');
 const reconciled=await reconcileMedia(port,owner,asset);
 if(failure==='stage'){assert.equal(reconciled,'pending');assert.equal(objects.size,0);continue;}
 // A lost put response commits on recovery; a lost commit response reads ready.
 assert.equal(reconciled,'ready');
 assert(objects.has(key));
 if(failure==='remove'||failure==='finish')await assert.rejects(deleteImage(port,owner,asset,2,true));
 else await deleteImage(port,owner,asset,2,true);
 assert.equal(await reconcileMedia(port,owner,asset),'deleted');
 assert(!objects.has(key));
 assert.throws(()=>service('select * from stylist_private.media_deletion_receipts;'));
 assert.throws(()=>service(`select public.stylist_stage_media(${literal(asset)},${literal(owner)},${literal('a'.repeat(64))},10,10);`));
 assert.equal(service(`select public.stylist_read_media_operation(${literal(asset)},${literal(other)});`),'');
}
const legacyId=actor(`select id from public.stylist_media_assets where user_id=${literal(owner)} and storage_key=${literal(owner+'/fixture.jpg')};`);
assert(legacyId);
const legacyKey=owner+'/fixture.jpg';
const legacyObjects=new Set([legacyKey]);
const legacyPort={
 async read(id:string,o:string){const raw=service(`select public.stylist_read_media_operation(${literal(id)},${literal(o)});`);return raw?JSON.parse(raw):null;},
 async inspect(k:string){return legacyObjects.has(k)?{state:'present' as const,checksum:'legacy'}:{state:'absent' as const};},
 async commit(){throw Error('legacy record cannot be staged');},
 async beginDelete(id:string,_o:string,revision:number){return JSON.parse(actor(`select public.stylist_begin_media_delete(${literal(id)},${revision},true);`));},
 async remove(k:string){assert.equal(k,legacyKey);legacyObjects.delete(k);},
 async finishDelete(id:string,o:string,t:string){service(`select public.stylist_finish_media_delete(${literal(id)},${literal(o)},${literal(t)});`);},
 async stage(){throw Error('legacy record cannot be staged');},
 async putIfAbsent(){throw Error('legacy record cannot be staged');},
};
assert.equal(await reconcileMedia(legacyPort,owner,legacyId),'ready');
assert.equal(await reconcileMedia(legacyPort,other,legacyId),'pending');
await deleteImage(legacyPort,owner,legacyId,1,true);
assert.equal(await reconcileMedia(legacyPort,owner,legacyId),'deleted');
assert(!legacyObjects.has(legacyKey));
console.log('SQL-backed media lifecycle recovery: six lost-acknowledgment paths and legacy JPEG deletion pass. Storage is simulated.');
