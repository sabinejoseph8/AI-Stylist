import {validateCatalogPolicy,validateCatalogProduct,validateCatalogQuery} from './catalog-contract.ts';
import type {CatalogAdapter,CatalogPolicy,CatalogProduct,CatalogQuery} from './catalog-contract.ts';
export const DEMO_CREATED_AT=1791590400000;
const policy=(sourceId:string):CatalogPolicy=>({sourceId,synthetic:true,permittedHosts:[],imageHosts:[],rightsReferences:['original-demo-illustrations-v1'],maxAgeMs:86400000,capabilities:{externalCheckout:false,embeddedCheckout:false,cartTransfer:false,orderTracking:false}});
// Two raw formats exercise normalization without pretending to be retailer APIs.
const alpha=[{sku:'demo_dress',variant:'dress_m',title:'Demo emerald dress',kind:'Dress',color:'Emerald green',size:'M',cents:24000,art:'dress'}, {sku:'demo_shoes',variant:'shoes_8',title:'Demo neutral low shoes',kind:'Shoes',color:'Neutral',size:'8',cents:6000,art:'shoes'}];
const beta=[{id:'demo_bag',option:'bag_one',description:'Demo neutral bag',taxonomy:'Bag',attributes:{colors:['Neutral'],size:'One size'},price:{amount:'20.00'},artwork:'bag'}, {id:'demo_jacket',option:'jacket_m',description:'Demo blue jacket',taxonomy:'Jacket',attributes:{colors:['Blue'],size:'M'},price:{amount:'100.00'},artwork:'jacket'}];
const normalize=(sourceId:string,fields:Pick<CatalogProduct,'productId'|'variantId'|'name'|'category'|'colors'|'size'|'priceCents'>,art:string):CatalogProduct=>({...fields,sourceId,currency:'USD',country:'US',availability:'unknown',delivery:{status:'unknown',destination:null},image:{url:`/demo-catalog/${art}.svg`,rightsReference:'original-demo-illustrations-v1'},productUrl:null,checkedAt:DEMO_CREATED_AT,sourceUpdatedAt:DEMO_CREATED_AT,synthetic:true});
function adapter(config:CatalogPolicy,products:CatalogProduct[]):CatalogAdapter{
 validateCatalogPolicy(config);const snapshot=structuredClone(config);const items=products.map(p=>validateCatalogProduct(p,snapshot,DEMO_CREATED_AT));
 return{get policy(){return structuredClone(snapshot);},async search(query:CatalogQuery){validateCatalogQuery(query);const term=query.text.trim().toLowerCase();return structuredClone(items.filter(p=>(!query.category||p.category===query.category)&&[p.name,...p.colors,p.category].join(' ').toLowerCase().includes(term)).slice(0,query.limit));},async get(productId,variantId){return structuredClone(items.find(p=>p.productId===productId&&p.variantId===variantId)??null);}};
}
export function createDemoAdapters():readonly CatalogAdapter[]{return[
 adapter(policy('demo_alpha'),alpha.map(p=>normalize('demo_alpha',{productId:p.sku,variantId:p.variant,name:p.title,category:p.kind,colors:[p.color],size:p.size,priceCents:p.cents},p.art))),
 adapter(policy('demo_beta'),beta.map(p=>normalize('demo_beta',{productId:p.id,variantId:p.option,name:p.description,category:p.taxonomy,colors:p.attributes.colors,size:p.attributes.size,priceCents:Math.round(Number(p.price.amount)*100)},p.artwork)))
];}
