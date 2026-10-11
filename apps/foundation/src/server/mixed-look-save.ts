import type {CatalogAdapter} from '../../../../packages/catalog-contracts/src/index.ts';
import {prepareRetailSnapshot} from './retail-snapshot.ts';

const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const catalogId=/^[A-Za-z0-9_-]{1,80}$/;
function record(value:unknown):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value);}
function exact(value:Record<string,unknown>,keys:string[]){return Object.keys(value).length===keys.length&&keys.every(k=>Object.hasOwn(value,k));}
function label(value:unknown){if(typeof value!=='string'||value.trim().length<1||value.trim().length>120)throw Error('Invalid look');return value.trim();}
type PreparedItem=Readonly<{kind:'owned';assetId:string;label:string}|{kind:'retail';snapshot:ReturnType<typeof prepareRetailSnapshot>;label:string}>;
export interface MixedLookPort {
 save(ownerId:string,label:string,items:readonly PreparedItem[],consent:true,id:string|null,expectedRevision:number):Promise<Readonly<{id:string;revision:number}>>;
}
/** Catalog facts are fetched from trusted adapters, never accepted from a customer payload. */
export async function saveMixedLook(port:MixedLookPort,adapters:ReadonlyMap<string,CatalogAdapter>,ownerId:string,input:unknown,now:number){
 if(typeof ownerId!=='string'||!uuid.test(ownerId)||!Number.isSafeInteger(now)||now<0||!record(input)||
  !exact(input,['label','items','consent','id','expectedRevision'])||input.consent!==true||
  !(input.id===null||typeof input.id==='string'&&uuid.test(input.id))||
  typeof input.expectedRevision!=='number'||!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0||
  (input.id===null&&input.expectedRevision!==0)||!Array.isArray(input.items)||
  input.items.length<1||input.items.length>20)throw Error('Invalid look');
 const title=label(input.label);
 const requests=input.items.map((entry:unknown)=>{
  if(!record(entry)||typeof entry.kind!=='string')throw Error('Invalid look');
  const itemLabel=label(entry.label);
  if(entry.kind==='owned'){
   if(!exact(entry,['kind','assetId','label'])||typeof entry.assetId!=='string'||!uuid.test(entry.assetId))throw Error('Invalid look');
   return {kind:'owned' as const,assetId:entry.assetId.toLowerCase(),label:itemLabel};
  }
  if(entry.kind==='retail'){
   if(!exact(entry,['kind','sourceId','productId','variantId','label'])||
    typeof entry.sourceId!=='string'||!catalogId.test(entry.sourceId)||
    typeof entry.productId!=='string'||!catalogId.test(entry.productId)||
    typeof entry.variantId!=='string'||!catalogId.test(entry.variantId))throw Error('Invalid look');
   return {kind:'retail' as const,sourceId:entry.sourceId,productId:entry.productId,variantId:entry.variantId,label:itemLabel};
  }
  throw Error('Invalid look');
 });
 const identities=requests.map(r=>r.kind==='owned'?`owned:${r.assetId}`:`retail:${r.sourceId}:${r.productId}:${r.variantId}`);
 if(new Set(identities).size!==identities.length)throw Error('Duplicate look item');
 const items:PreparedItem[]=[];
 for(const request of requests){
  if(request.kind==='owned'){items.push(Object.freeze(request));continue;}
  const adapter=adapters.get(request.sourceId);
  if(!adapter||adapter.policy.sourceId!==request.sourceId)throw Error('Retail source unavailable');
  const product=await adapter.get(request.productId,request.variantId);
  if(!product||product.productId!==request.productId||product.variantId!==request.variantId)throw Error('Retail source unavailable');
  items.push(Object.freeze({kind:'retail',snapshot:prepareRetailSnapshot(product,adapter.policy,now),label:request.label}));
 }
 const saved=await port.save(ownerId.toLowerCase(),title,Object.freeze(items),true,input.id?.toLowerCase()??null,input.expectedRevision);
 if(!saved||typeof saved.id!=='string'||!uuid.test(saved.id)||!Number.isSafeInteger(saved.revision)||saved.revision<1)throw Error('Look save unavailable');
 return Object.freeze({id:saved.id.toLowerCase(),revision:saved.revision});
}
