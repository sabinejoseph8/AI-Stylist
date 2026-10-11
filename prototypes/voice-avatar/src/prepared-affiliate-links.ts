import {assessCatalogProduct,validateCatalogPolicy} from './catalog-contract.ts';
import type {CatalogPolicy,CatalogProduct} from './catalog-contract.ts';
export type PreparedAffiliateOffer={sourceId:string;productId:string;variantId:string;productUrl:string;affiliateUrl:string;programReference:string};
export type PreparedAffiliatePolicy={sourceId:string;programReference:string;trackingHosts:readonly string[];requiredParameters:Readonly<Record<string,string>>};
const id=(value:unknown):value is string=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(value);
const safeUrl=(value:string,hosts:readonly string[])=>{
 if(typeof value!=='string'||value.length>4096||/[\s\\]/.test(value))return null;
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&!url.hash&&hosts.includes(url.hostname)?url:null;}catch{return null;}
};
/** Disabled source preparation only. Policies/offers are trusted server fixtures,
 * never model or browser claims of approval. Does not create or fetch links. */
export function prepareAffiliateLinks(options:{simulation?:boolean;catalog:CatalogPolicy;policy:PreparedAffiliatePolicy;offers:readonly PreparedAffiliateOffer[]}){
 if(options.simulation!==true)throw Error('Live affiliate links are disabled.');
 const catalog=structuredClone(options.catalog),policy=structuredClone(options.policy),offers=structuredClone(options.offers);
 validateCatalogPolicy(catalog);
 if(catalog.synthetic||!catalog.capabilities.externalCheckout||policy.sourceId!==catalog.sourceId||!id(policy.programReference)||!Array.isArray(policy.trackingHosts)||!policy.trackingHosts.length||!policy.trackingHosts.every(host=>typeof host==='string'&&/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(host))||!policy.requiredParameters||typeof policy.requiredParameters!=='object'||Array.isArray(policy.requiredParameters)||!Object.keys(policy.requiredParameters).length||Object.entries(policy.requiredParameters).some(([key,value])=>!id(key)||typeof value!=='string'||!value.trim()||value.length>200)||!Array.isArray(offers)||offers.length>100)throw Error('Affiliate policy held.');
 const records=new Map<string,PreparedAffiliateOffer>();
 for(const offer of offers){
  const keys=['sourceId','productId','variantId','productUrl','affiliateUrl','programReference'];
  if(!offer||Object.keys(offer).length!==keys.length||!keys.every(key=>Object.hasOwn(offer,key))||offer.sourceId!==policy.sourceId||offer.programReference!==policy.programReference||!id(offer.productId)||!id(offer.variantId)||!safeUrl(offer.productUrl,catalog.permittedHosts))throw Error('Affiliate offer held.');
  const tracking=safeUrl(offer.affiliateUrl,policy.trackingHosts);
  if(!tracking||Object.entries(policy.requiredParameters).some(([key,value])=>tracking.searchParams.getAll(key).length!==1||tracking.searchParams.get(key)!==value))throw Error('Affiliate offer held.');
  const key=JSON.stringify([offer.productId,offer.variantId]);if(records.has(key))throw Error('Affiliate offer held.');records.set(key,offer);
 }
 return Object.freeze({
  // Metadata only: this cannot authorize a look, bypass preference validation,
  // prove an actual agreement, or count a click as earned revenue.
  describe(product:CatalogProduct,now:number,request:{size:string|null;destination:string|null}){
   try{
    const assessed=assessCatalogProduct(product,catalog,now,request);
    if(!assessed.eligible)return null;
    const item=assessed.product;
    const offer=records.get(JSON.stringify([item.productId,item.variantId]));
    if(!offer||item.productUrl!==offer.productUrl)return null;
    return Object.freeze({productUrl:offer.productUrl,affiliateUrl:offer.affiliateUrl,programReference:offer.programReference,disclosure:'We may earn a commission from qualifying purchases through this link.',earnsCommissionOnClick:false as const,liveEnabled:false as const});
   }catch{return null;}
  }
 });
}
