import {assessCatalogProduct,validateCatalogPolicy,validateCatalogProduct,validateCatalogQuery} from '../../../../packages/catalog-contracts/src/index.ts';
import type {CatalogAdapter,CatalogPolicy,CatalogProduct,CatalogQuery} from '../../../../packages/catalog-contracts/src/index.ts';
export type CatalogRequest=Readonly<{size:string|null;destination:string|null}>;
export type CatalogState='idle'|'loading'|'ready'|'held';
export type CatalogResult=Readonly<{product:Readonly<CatalogProduct>;eligible:false;reasons:readonly string[]}>;
export type CatalogSnapshot=Readonly<{state:CatalogState;reason:'none'|'invalid-request'|'source-unavailable'|'invalid-data'|'stale'|'clock-invalid'|'canceled';items:readonly CatalogResult[]}>;
const freeze=<T>(value:T):T=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const validId=(value:unknown):value is string=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(value);
function request(value:CatalogRequest){if(!value||Object.keys(value).length!==2||!Object.hasOwn(value,'size')||!Object.hasOwn(value,'destination')||!([['size',60],['destination',80]] as const).every(([key,max])=>value[key]===null||typeof value[key]==='string'&&value[key]!.trim().length>0&&value[key]!.length<=max))throw Error();return Object.freeze({...value});}
/** Local-only synthetic boundary. No real feed, recommendation release, cache,
 * credential, URL navigation, checkout, persistence, log or network implementation.
 * Injected adapters must be synthetic; late adapter promises cannot publish. */
export class LocalCatalog {
 private readonly adapter:CatalogAdapter;
 private readonly policy:CatalogPolicy;
 private readonly clock:()=>number;
 private observedTime:number;
 private generation=0;
 private state:CatalogState='idle';
 private reason:CatalogSnapshot['reason']='none';
 private items:readonly CatalogResult[]=[];
 constructor(adapter:CatalogAdapter,clock:()=>number=Date.now){
  try{
   const policy=structuredClone(adapter.policy);validateCatalogPolicy(policy);
   if(!policy.synthetic||policy.capabilities.externalCheckout)throw Error();
   const now=clock();if(!Number.isSafeInteger(now)||now<0)throw Error();
   this.policy=freeze(policy);this.adapter=adapter;this.clock=clock;this.observedTime=now;
  }catch{throw Error('Local catalog configuration held.');}
 }
 private time(){const now=this.clock();if(!Number.isSafeInteger(now)||now<this.observedTime)throw Error();this.observedTime=now;return now;}
 private hold(reason:CatalogSnapshot['reason']){this.state='held';this.reason=reason;this.items=[];}
 private sourceUnchanged(){return JSON.stringify(this.adapter.policy)===JSON.stringify(this.policy);}
 snapshot():CatalogSnapshot{
  try{const now=this.time();if(!this.sourceUnchanged()){++this.generation;this.hold('invalid-data');}else if(this.items.some(item=>now-item.product.checkedAt>this.policy.maxAgeMs)){++this.generation;this.hold('stale');}}catch{++this.generation;this.hold('clock-invalid');}
  return Object.freeze({state:this.state,reason:this.reason,items:this.items});
 }
 cancel(){++this.generation;this.hold('canceled');}
 clear(){++this.generation;this.state='idle';this.reason='none';this.items=[];}
 async search(query:CatalogQuery,selection:CatalogRequest){
  let safeQuery:CatalogQuery,safeRequest:CatalogRequest;
  try{validateCatalogQuery(query);safeQuery=Object.freeze({...query});safeRequest=request(selection);}catch{++this.generation;this.hold('invalid-request');return false;}
  return this.run(()=>this.adapter.search(safeQuery),safeRequest,safeQuery.limit,null,safeQuery.category);
 }
 async get(productId:string,variantId:string,selection:CatalogRequest){
  let safeRequest:CatalogRequest;
  try{if(!validId(productId)||!validId(variantId))throw Error();safeRequest=request(selection);}catch{++this.generation;this.hold('invalid-request');return false;}
  return this.run(async()=>{const item=await this.adapter.get(productId,variantId);return item===null?[]:[item];},safeRequest,1,{productId,variantId});
 }
 private async run(load:()=>Promise<readonly CatalogProduct[]>,selection:CatalogRequest,limit:number,identity:{productId:string;variantId:string}|null,category?:string){
  const generation=++this.generation;this.items=[];this.state='loading';this.reason='none';
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
   try{this.time();}catch{this.hold('clock-invalid');return false;}
   if(!this.sourceUnchanged()){this.hold('invalid-data');return false;}
   const raw=await Promise.race([load(),new Promise<never>((_resolve,reject)=>{timer=setTimeout(()=>reject(Error()),2000);})]);
   if(generation!==this.generation)return false;
   let now:number;try{now=this.time();}catch{this.hold('clock-invalid');return false;}
   if(!this.sourceUnchanged()||!Array.isArray(raw)||raw.length>limit){this.hold('invalid-data');return false;}
   const rows:CatalogResult[]=[];const seen=new Set<string>(),parents=new Map<string,string>();
   for(const input of raw){
    let product:CatalogProduct;try{product=validateCatalogProduct(input,this.policy,now);}catch{this.hold('invalid-data');return false;}
    if(identity&&(product.productId!==identity.productId||product.variantId!==identity.variantId)||category&&product.category!==category){this.hold('invalid-data');return false;}
    const key=product.productId+':'+product.variantId,parent=JSON.stringify([product.name,product.category,product.productUrl]);
    if(seen.has(key)||parents.has(product.productId)&&parents.get(product.productId)!==parent){this.hold('invalid-data');return false;}
    seen.add(key);parents.set(product.productId,parent);
    if(now-product.checkedAt>this.policy.maxAgeMs){this.hold('stale');return false;}
    const assessed=assessCatalogProduct(product,this.policy,now,selection);
    rows.push(freeze({product:assessed.product,eligible:false as const,reasons:assessed.reasons}));
   }
   if(generation!==this.generation)return false;
   this.items=Object.freeze(rows);this.state='ready';this.reason='none';return true;
  }catch{if(generation===this.generation)this.hold('source-unavailable');return false;}finally{if(timer!==undefined)clearTimeout(timer);}
 }
}
