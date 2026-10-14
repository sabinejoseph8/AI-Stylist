import {LocalCatalog} from '../catalog/local-catalog.ts';
import {createSyntheticCatalog} from '../catalog/synthetic-catalog.ts';
import {prepareShoppingEstimate} from '../catalog/local-shopping-evidence.ts';
import type {CatalogAdapter,CatalogProduct} from '../../../../packages/catalog-contracts/src/index.ts';
import type {ShopSelection,OwnedSelection} from '../catalog/local-shopping-evidence.ts';
export type DraftPiece=Readonly<{id:string;name:string;slot:'main'|'layer'|'shoes';kind:'illustrated-product'|'owned-placeholder';image:string|null;sourceId:string|null;productId:string|null;variantId:string|null;priceCents:number|null;rightsReference:string|null}>;
export type DraftOutfit=Readonly<{kind:'illustrated-draft';items:readonly DraftPiece[];checkedAt:number;estimate:ReturnType<typeof prepareShoppingEstimate>;releaseEnabled:false;shoppingEnabled:false;saveEnabled:false}>;
export type DraftSnapshot=Readonly<{state:'idle'|'building'|'draft'|'held';draft:DraftOutfit|null;message:string}>;
/** Fixed local composition rehearsal. No AI, notebook, camera, recommendation
 * validator, save, account or shopping-action port. */
export class LocalDraftOutfit {
 private readonly adapter:CatalogAdapter;
 private readonly catalog:LocalCatalog;
 private readonly clock:()=>number;
 private generation=0;
 private closed=false;
 private state:DraftSnapshot['state']='idle';
 private draft:DraftOutfit|null=null;
 private message='Build a fixed illustrated draft. No recommendation is released.';
 private listeners=new Set<()=>void>();
 constructor(options:{clock?:()=>number;adapter?:CatalogAdapter}={}){try{this.clock=options.clock??Date.now;this.adapter=options.adapter??createSyntheticCatalog(this.clock());this.catalog=new LocalCatalog(this.adapter,this.clock);}catch{throw Error('Local draft configuration held.');}}
 subscribe(listener:()=>void){this.listeners.add(listener);return()=>{this.listeners.delete(listener);};}
 private publish(){for(const listener of [...this.listeners])try{listener();}catch{}}
 snapshot():DraftSnapshot{if(this.draft&&this.catalog.snapshot().state!=='ready'){this.generation++;this.draft=null;this.state='held';this.message='Sample source evidence expired or changed. No draft is released.';}return Object.freeze({state:this.state,draft:this.draft,message:this.message});}
 async build(options:{includeOwned:boolean;missingPrice:boolean}){
  const generation=++this.generation;this.draft=null;
  if(this.closed)return false;
  if(!options||Object.keys(options).length!==2||typeof options.includeOwned!=='boolean'||typeof options.missingPrice!=='boolean'){this.catalog.cancel();this.state='held';this.message='Choose the fixed sample controls. No draft was built.';this.publish();return false;}
  const includeOwned=options.includeOwned,missingPrice=options.missingPrice;this.state='building';this.message='Preparing a local illustrated draft.';this.publish();
  try{
   if(!await this.catalog.search({text:'',limit:4},{size:null,destination:null})){if(generation===this.generation){this.state='held';this.message='Sample source evidence is unavailable. No draft is released.';this.publish();}return false;}
   if(generation!==this.generation||this.closed)return false;
   const snapshot=this.catalog.snapshot();if(snapshot.state!=='ready')throw Error();
   const products:CatalogProduct[]=snapshot.items.map(row=>({...structuredClone(row.product)}));
   const dress=products.find(p=>p.productId==='sample_dress'&&p.variantId==='dress_m'),shoes=products.find(p=>p.productId==='sample_shoes'&&p.variantId==='shoes_8');
   if(products.length!==2||!dress||!shoes||dress.image.url!=='/demo-catalog/dress.svg'||shoes.image.url!=='/demo-catalog/shoes.svg')throw Error();
   if(missingPrice)dress.priceCents=null;
   const items:DraftPiece[]=[Object.freeze({id:'draft_dress',name:dress.name,slot:'main',kind:'illustrated-product',image:dress.image.url,sourceId:dress.sourceId,productId:dress.productId,variantId:dress.variantId,priceCents:dress.priceCents,rightsReference:dress.image.rightsReference})];
   if(includeOwned)items.push(Object.freeze({id:'illustrated_owned_jacket',name:'Illustrated owned-item placeholder',slot:'layer',kind:'owned-placeholder',image:null,sourceId:null,productId:null,variantId:null,priceCents:0,rightsReference:null}));
   items.push(Object.freeze({id:'draft_shoes',name:shoes.name,slot:'shoes',kind:'illustrated-product',image:shoes.image.url,sourceId:shoes.sourceId,productId:shoes.productId,variantId:shoes.variantId,priceCents:shoes.priceCents,rightsReference:shoes.image.rightsReference}));
   const lines:(ShopSelection|OwnedSelection)[]=products.map(p=>({kind:'shop',sourceId:p.sourceId,productId:p.productId,variantId:p.variantId,size:p.size}));
   if(includeOwned)lines.push({kind:'owned',referenceId:'illustrated_owned_jacket'});
   const now=this.clock(),estimate=prepareShoppingEstimate(lines,[{policy:this.adapter.policy,products}],includeOwned?['illustrated_owned_jacket']:[],null,now);
   if(estimate.reasons.some(reason=>['invalid-source','unsupported-market','stale'].includes(reason)))throw Error();
   const draft:DraftOutfit=Object.freeze({kind:'illustrated-draft',items:Object.freeze(items),checkedAt:Math.min(...products.map(p=>p.checkedAt)),estimate,releaseEnabled:false,shoppingEnabled:false,saveEnabled:false});
   if(generation!==this.generation||this.closed)return false;
   if(this.catalog.snapshot().state!=='ready')throw Error();
   this.draft=draft;this.state='draft';this.message='Illustrated draft only. Suitability and recommendation release are unavailable.';this.publish();return true;
  }catch{if(generation===this.generation&&!this.closed){this.draft=null;this.state='held';this.message='The fixed sample draft could not be prepared. No recommendation is released.';this.publish();}return false;}
 }
 clear(){this.generation++;this.catalog.clear();this.draft=null;this.state='idle';this.message='Illustrated draft cleared. Saved data is unchanged.';this.publish();}
 end(){this.closed=true;this.clear();}
}
