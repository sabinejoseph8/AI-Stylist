export type CatalogProduct={sourceId:string;productId:string;variantId:string;name:string;category:string;colors:string[];size:string|null;priceCents:number|null;currency:'USD';country:'US';availability:'available'|'unavailable'|'unknown';delivery:{status:'eligible'|'ineligible'|'unknown';destination:string|null};image:{url:string;rightsReference:string};productUrl:string|null;checkedAt:number;sourceUpdatedAt:number|null;synthetic:boolean};
export type CatalogPolicy={sourceId:string;synthetic:boolean;permittedHosts:readonly string[];imageHosts:readonly string[];rightsReferences:readonly string[];maxAgeMs:number;capabilities:{externalCheckout:boolean;embeddedCheckout:false;cartTransfer:false;orderTracking:false}};
export type CatalogQuery={text:string;category?:string;limit:number};
export interface CatalogAdapter {readonly policy:CatalogPolicy;search(query:CatalogQuery):Promise<readonly CatalogProduct[]>;get(productId:string,variantId:string):Promise<CatalogProduct|null>}
const object=(v:unknown):v is Record<string,unknown>=>Boolean(v)&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const text=(v:unknown,max=160):v is string=>typeof v==='string'&&Boolean(v.trim())&&v.length<=max;
const id=(v:unknown):v is string=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(v);
function url(value:unknown,hosts:readonly string[]){if(typeof value!=='string')return false;try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.hash&&hosts.includes(u.hostname);}catch{return false;}}
export function validateCatalogPolicy(policy:CatalogPolicy){
 if(!id(policy.sourceId)||typeof policy.synthetic!=='boolean'||!Number.isSafeInteger(policy.maxAgeMs)||policy.maxAgeMs<=0||policy.maxAgeMs>86400000||!Array.isArray(policy.rightsReferences)||!policy.rightsReferences.length||!policy.rightsReferences.every(r=>text(r,200))||!Array.isArray(policy.permittedHosts)||!Array.isArray(policy.imageHosts)||![...policy.permittedHosts,...policy.imageHosts].every(h=>typeof h==='string'&&/^[a-z0-9.-]+$/.test(h)&&!h.includes('..'))||!object(policy.capabilities)||!exact(policy.capabilities,['externalCheckout','embeddedCheckout','cartTransfer','orderTracking'])||typeof policy.capabilities.externalCheckout!=='boolean'||policy.capabilities.embeddedCheckout!==false||policy.capabilities.cartTransfer!==false||policy.capabilities.orderTracking!==false||policy.synthetic&&policy.capabilities.externalCheckout)throw Error('Catalog policy held.');
}
/** Policy is trusted adapter configuration, not an AI/customer-supplied assertion. */
export function validateCatalogProduct(input:unknown,policy:CatalogPolicy,now:number):CatalogProduct{
 validateCatalogPolicy(policy);
 const fail=()=>{throw Error('Catalog product held.');};
 if(!Number.isSafeInteger(now)||now<0||!object(input)||!exact(input,['sourceId','productId','variantId','name','category','colors','size','priceCents','currency','country','availability','delivery','image','productUrl','checkedAt','sourceUpdatedAt','synthetic']))return fail();
 if(input.sourceId!==policy.sourceId||input.synthetic!==policy.synthetic||!id(input.productId)||!id(input.variantId)||!text(input.name)||!text(input.category,80)||!Array.isArray(input.colors)||input.colors.length>12||!input.colors.every(c=>text(c,60))||!(input.size===null||text(input.size,60))||!(input.priceCents===null||Number.isSafeInteger(input.priceCents)&&(input.priceCents as number)>=0&&(input.priceCents as number)<=10000000)||input.currency!=='USD'||input.country!=='US'||!['available','unavailable','unknown'].includes(input.availability as string))return fail();
 if(!object(input.delivery)||!exact(input.delivery,['status','destination'])||!['eligible','ineligible','unknown'].includes(input.delivery.status as string)||!(input.delivery.destination===null||text(input.delivery.destination,80))||input.delivery.status!=='unknown'&&!input.delivery.destination)return fail();
 if(!object(input.image)||!exact(input.image,['url','rightsReference'])||!policy.rightsReferences.includes(input.image.rightsReference as string))return fail();
 const imageOk=policy.synthetic?typeof input.image.url==='string'&&/^\/demo-catalog\/[a-z0-9_-]+\.svg$/.test(input.image.url):url(input.image.url,policy.imageHosts);
 if(!imageOk||policy.synthetic&&input.productUrl!==null||!policy.synthetic&&!url(input.productUrl,policy.permittedHosts))return fail();
 if(!Number.isSafeInteger(input.checkedAt)||(input.checkedAt as number)<0||(input.checkedAt as number)>now||!(input.sourceUpdatedAt===null||Number.isSafeInteger(input.sourceUpdatedAt)&&(input.sourceUpdatedAt as number)>=0&&(input.sourceUpdatedAt as number)<=(input.checkedAt as number)))return fail();
 return structuredClone(input) as CatalogProduct;
}
export function assessCatalogProduct(product:CatalogProduct,policy:CatalogPolicy,now:number,request:{size:string|null;destination:string|null}){
 const item=validateCatalogProduct(product,policy,now);
 const reasons:string[]=[];
 if(item.synthetic)reasons.push('synthetic');
 if(now-item.checkedAt>policy.maxAgeMs)reasons.push('stale');
 if(item.priceCents===null)reasons.push('price-unknown');
 if(item.availability!=='available')reasons.push(item.availability==='unavailable'?'unavailable':'availability-unknown');
 if(!request.size||item.size!==request.size)reasons.push('size-unverified');
 if(!request.destination||item.delivery.status!=='eligible'||item.delivery.destination!==request.destination)reasons.push('delivery-unverified');
 if(!policy.capabilities.externalCheckout)reasons.push('checkout-disabled');
 return{eligible:reasons.length===0,reasons,product:item};
}
export function validateCatalogQuery(query:CatalogQuery){if(!object(query)||!Object.keys(query).every(k=>['text','category','limit'].includes(k))||typeof query.text!=='string'||query.text.length>200||query.category!==undefined&&!text(query.category,80)||!Number.isSafeInteger(query.limit)||query.limit<1||query.limit>20)throw Error('Catalog search held.');}
