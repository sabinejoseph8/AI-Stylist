import {assessCatalogProduct,validateCatalogPolicy,validateCatalogProduct} from '../../../../packages/catalog-contracts/src/index.ts';
import type {CatalogPolicy,CatalogProduct} from '../../../../packages/catalog-contracts/src/index.ts';
export type SourceSnapshot=Readonly<{policy:CatalogPolicy;products:readonly CatalogProduct[]}>;
export type ShopSelection=Readonly<{kind:'shop';sourceId:string;productId:string;variantId:string;size:string|null}>;
export type OwnedSelection=Readonly<{kind:'owned';referenceId:string}>;
export type BrokenLink=Readonly<{key:string;checkedAt:number}>;
export type EvidenceReason='invalid-selection'|'invalid-source'|'unknown-product'|'ownership-unconfirmed'|'duplicate-item'|'stale'|'price-unknown'|'unavailable'|'availability-unknown'|'size-unverified'|'delivery-unverified'|'synthetic'|'checkout-disabled'|'link-broken'|'unsupported-market';
const id=(value:unknown):value is string=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(value);
const text=(value:unknown,max:number)=>value===null||typeof value==='string'&&value.trim().length>0&&value.length<=max;
const exact=(value:unknown,keys:readonly string[]):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
const keyOf=(item:{sourceId:string;productId:string;variantId:string})=>[item.sourceId,item.productId,item.variantId].join(':');
const freeze=<T>(value:T):T=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
function shop(value:unknown):value is ShopSelection{return exact(value,['kind','sourceId','productId','variantId','size'])&&value.kind==='shop'&&id(value.sourceId)&&id(value.productId)&&id(value.variantId)&&text(value.size,60);}
class UnsupportedMarket extends Error {}
const sourceReason=(error:unknown):EvidenceReason=>error instanceof UnsupportedMarket?'unsupported-market':'invalid-source';
function registry(sources:readonly SourceSnapshot[],now:number){
 if(!Number.isSafeInteger(now)||now<0||!Array.isArray(sources)||sources.length>8)throw Error();
 const records=new Map<string,{product:CatalogProduct;policy:CatalogPolicy}>(),seenSources=new Set<string>();
 for(const source of sources){
  const policy=structuredClone(source.policy);validateCatalogPolicy(policy);
  if(seenSources.has(policy.sourceId)||!Array.isArray(source.products)||source.products.length>200)throw Error();seenSources.add(policy.sourceId);
  const parents=new Map<string,string>();
  for(const input of source.products){if(input&&typeof input==='object'&&(typeof input.currency==='string'&&input.currency!=='USD'||typeof input.country==='string'&&input.country!=='US'))throw new UnsupportedMarket();const product=validateCatalogProduct(input,policy,now),key=keyOf(product),parent=JSON.stringify([product.name,product.category,product.productUrl]);if(records.has(key)||parents.has(product.productId)&&parents.get(product.productId)!==parent)throw Error();parents.set(product.productId,parent);records.set(key,{product,policy});}
 }
 return records;
}
/** Pure local preparation. Trusted normalized source snapshots only. No source
 * fetching, URL navigation, affiliate parameters, recommendation release or save.
 * Any hypothetical non-synthetic source used in tests is not retailer approval. */
export function prepareShoppingEstimate(lines:readonly (ShopSelection|OwnedSelection)[],sources:readonly SourceSnapshot[],confirmedOwnedIds:readonly string[],destination:string|null,now:number){
 const reasons=new Set<EvidenceReason>();let knownItemSubtotalCents=0,itemPricesComplete=true,synthetic=false,ownedExcluded=0;
 const result=()=>freeze({currency:'USD' as const,country:'US' as const,knownItemSubtotalCents,itemPricesComplete,shippingCents:null,taxCents:null,totalCents:null,budgetVerified:false as const,navigationEnabled:false as const,synthetic,ownedExcluded,reasons:[...reasons]});
 const hold=(reason:EvidenceReason)=>{reasons.add(reason);itemPricesComplete=false;};
 if(!Array.isArray(lines)||lines.length<1||lines.length>12||!Array.isArray(confirmedOwnedIds)||confirmedOwnedIds.length>24||!confirmedOwnedIds.every(id)||new Set(confirmedOwnedIds).size!==confirmedOwnedIds.length||!text(destination,80)){hold('invalid-selection');return result();}
 let records:ReturnType<typeof registry>;try{records=registry(sources,now);}catch(error){hold(sourceReason(error));return result();}
 const seen=new Set<string>();
 for(const line of lines){
  if(exact(line,['kind','referenceId'])&&line.kind==='owned'&&id(line.referenceId)){
   const key='owned:'+line.referenceId;if(seen.has(key)){hold('duplicate-item');continue;}seen.add(key);
   if(!confirmedOwnedIds.includes(line.referenceId)){hold('ownership-unconfirmed');continue;}ownedExcluded++;continue;
  }
  if(!shop(line)){hold('invalid-selection');continue;}
  const key=keyOf(line);if(seen.has(key)){hold('duplicate-item');continue;}seen.add(key);
  const record=records.get(key);if(!record){hold('unknown-product');continue;}
  const assessed=assessCatalogProduct(record.product,record.policy,now,{size:line.size,destination});synthetic ||=record.product.synthetic;
  for(const reason of assessed.reasons)reasons.add(reason as EvidenceReason);
  if(assessed.reasons.includes('stale')){itemPricesComplete=false;continue;}
  if(record.product.priceCents===null){itemPricesComplete=false;continue;}
  knownItemSubtotalCents+=record.product.priceCents;
 }
 return result();
}
export function prepareSourceLink(selection:ShopSelection,sources:readonly SourceSnapshot[],destination:string|null,now:number,broken:readonly BrokenLink[]=[]){
 const unavailable=(reasons:EvidenceReason[])=>freeze({status:'unavailable' as const,sourceUrlPreview:null,navigationEnabled:false as const,recovery:'refresh-source-evidence' as const,reasons});
 if(!shop(selection)||!text(destination,80)||!Array.isArray(broken)||broken.length>200||broken.some(value=>!exact(value,['key','checkedAt'])||typeof value.key!=='string'||value.key.length>242||typeof value.checkedAt!=='number'||!Number.isSafeInteger(value.checkedAt)||value.checkedAt<0||value.checkedAt>now))return unavailable(['invalid-selection']);
 try{
  const record=registry(sources,now).get(keyOf(selection));if(!record)return unavailable(['unknown-product']);
  const assessed=assessCatalogProduct(record.product,record.policy,now,{size:selection.size,destination});
  const reasons=assessed.reasons as EvidenceReason[];
  // A broken observation remains held until strictly newer source evidence.
  if(broken.some(value=>value.key===keyOf(selection)&&record.product.checkedAt<=value.checkedAt))reasons.push('link-broken');
  if(reasons.length||record.product.productUrl===null)return unavailable(reasons);
  // Return the source's exact string. No URL construction or affiliate rewriting.
  return freeze({status:'source-only-preview' as const,sourceUrlPreview:record.product.productUrl,navigationEnabled:false as const,recovery:null,reasons:[] as EvidenceReason[]});
 }catch(error){return unavailable([sourceReason(error)]);}
}
export function recordBrokenLink(selection:ShopSelection,checkedAt:number):BrokenLink|null{return shop(selection)&&Number.isSafeInteger(checkedAt)&&checkedAt>=0?Object.freeze({key:keyOf(selection),checkedAt}):null;}
