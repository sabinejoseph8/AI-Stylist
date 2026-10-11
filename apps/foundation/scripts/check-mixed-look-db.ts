/** Isolated SQL and synthetic catalog rehearsal, never a hosted service adapter. */
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {saveMixedLook} from '../src/server/mixed-look-save.ts';
import type {CatalogAdapter,CatalogPolicy,CatalogProduct} from '../../../packages/catalog-contracts/src/index.ts';

const container=process.argv[2];const assetId=process.argv[3];
if(!/^stylist-data-[a-f0-9]{10}$/.test(container??'')||!/^00000000-0000-0000-0000-[a-f0-9]{12}$/.test(assetId??''))throw Error('Isolated fixture required');
const owner='00000000-0000-0000-0000-000000000001';const other='00000000-0000-0000-0000-000000000002';
const literal=(v:string)=>"'"+v.replaceAll("'","''")+"'";
function sql(query:string){return execFileSync('docker',['exec','-i',container,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],
 {input:query,encoding:'utf8',timeout:10000,stdio:['pipe','pipe','pipe']}).trim();}
const policy:CatalogPolicy={sourceId:'fixture',synthetic:false,permittedHosts:['shop.example'],imageHosts:['images.example'],
 rightsReferences:['synthetic-test-license'],maxAgeMs:1000,capabilities:{externalCheckout:true,embeddedCheckout:false,cartTransfer:false,orderTracking:false}};
const now=Date.now();
const product:CatalogProduct={sourceId:'fixture',productId:'dress',variantId:'m',name:'Dress',category:'dress',colors:['Blue'],size:'M',
 priceCents:35000,currency:'USD',country:'US',availability:'available',delivery:{status:'eligible',destination:'US'},
 image:{url:'https://images.example/dress.jpg',rightsReference:'synthetic-test-license'},productUrl:'https://shop.example/dress',
 checkedAt:now,sourceUpdatedAt:now-100,synthetic:false};
const adapter:CatalogAdapter={policy,search:async()=>[],get:async()=>product};
const adapters=new Map<string,CatalogAdapter>([['fixture',adapter]]);
let writes=0;
const port={async save(id:string,label:string,items:readonly unknown[],consent:true,lookId:string|null,revision:number){
 writes++;
 const raw=sql(`set role service_role; select row_to_json(t) from public.stylist_save_mixed_look(${literal(id)},${literal(label)},${literal(JSON.stringify(items))}::jsonb,${consent},${lookId?literal(lookId):'null'},${revision}) t;`);
 const row=JSON.parse(raw);return{id:row.id,revision:row.revision};
}};
const request={label:'Wedding',consent:true,id:null,expectedRevision:0,items:[
 {kind:'owned',assetId,label:'Jacket'},{kind:'retail',sourceId:'fixture',productId:'dress',variantId:'m',label:'Dress'}]};
const saved=await saveMixedLook(port,adapters,owner,request,now);
assert.equal(writes,1);
assert.equal(sql(`set role authenticated; set request.jwt.claim.sub=${literal(owner)}; select count(*) from public.stylist_saved_look_items where look_id=${literal(saved.id)};`),'2');
assert.equal(sql(`set role authenticated; set request.jwt.claim.sub=${literal(other)}; select count(*) from public.stylist_saved_look_items where look_id=${literal(saved.id)};`),'0');
const prior=Number(sql('select count(*) from public.stylist_retail_history;'));
await assert.rejects(saveMixedLook(port,adapters,owner,{...request,items:[{...request.items[1],productUrl:'https://unapproved.example'}]},now));
assert.equal(writes,1);
sql(`set role authenticated; set request.jwt.claim.sub=${literal(owner)}; select public.stylist_delete_saved_look(${literal(saved.id)},1,true);`);
assert.equal(Number(sql('select count(*) from public.stylist_retail_history;')),prior-1);
console.log('Trusted catalog lookup and atomic mixed-look SQL save pass with owner isolation and history cleanup.');
