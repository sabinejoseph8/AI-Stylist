/** Isolated SQL rehearsal; never a hosted retail adapter. */
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {saveRetailHistory} from '../src/server/retail-snapshot.ts';
import type {CatalogPolicy} from '../../../packages/catalog-contracts/src/index.ts';

const container=process.argv[2];
if(!/^stylist-data-[a-f0-9]{10}$/.test(container??''))throw Error('Isolated container required');
const owner='00000000-0000-0000-0000-000000000001';
const other='00000000-0000-0000-0000-000000000002';
const literal=(v:string)=>"'"+v.replaceAll("'","''")+"'";
function sql(query:string){return execFileSync('docker',['exec','-i',container,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],
 {input:query,encoding:'utf8',timeout:10000,stdio:['pipe','pipe','pipe']}).trim();}
const policy:CatalogPolicy={sourceId:'fixture',synthetic:false,permittedHosts:['shop.example'],imageHosts:['images.example'],
 rightsReferences:['synthetic-test-license'],maxAgeMs:1000,
 capabilities:{externalCheckout:true,embeddedCheckout:false,cartTransfer:false,orderTracking:false}};
const now=Date.now();
const product={sourceId:'fixture',productId:'dress',variantId:'m',name:'Dress',category:'dress',colors:['Blue'],size:'M',
 priceCents:35000,currency:'USD',country:'US',availability:'available',delivery:{status:'eligible',destination:'US'},
 image:{url:'https://images.example/dress.jpg',rightsReference:'synthetic-test-license'},productUrl:'https://shop.example/dress',
 checkedAt:now,sourceUpdatedAt:now-100,synthetic:false};
let writes=0;
const port={async store(id:string,snapshot:unknown){
 writes++;
 return sql(`set role service_role; select public.stylist_store_retail_history(${literal(id)},${literal(JSON.stringify(snapshot))}::jsonb);`);
}};
const saved=await saveRetailHistory(port,owner,true,product,policy,now);
assert.equal(writes,1);
assert.equal(saved.status,'saved-history');
assert.equal(sql(`set role authenticated; set request.jwt.claim.sub=${literal(owner)}; select product_id from public.stylist_retail_history where id=${literal(saved.id)};`),'dress');
assert.equal(sql(`set role authenticated; set request.jwt.claim.sub=${literal(other)}; select count(*) from public.stylist_retail_history where id=${literal(saved.id)};`),'0');
await assert.rejects(saveRetailHistory(port,owner,true,{...product,productUrl:'https://unapproved.example/dress'},policy,now));
await assert.rejects(saveRetailHistory(port,owner,true,product,policy,now+1001));
assert.equal(writes,1);
console.log('Validated catalog facts persist as owner-only saved history; unsafe and stale facts never reach SQL.');
