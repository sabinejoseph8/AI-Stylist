import type {CatalogProduct} from './catalog-contract.ts';
import type {prepareAffiliateLinks} from './prepared-affiliate-links.ts';
type Selection={revision:number;product:CatalogProduct};
type Request={size:string|null;destination:string|null};
/** Disabled server-side composition. readCurrent selects the item belonging to
 * the checked look; allowed consults its current preference permit. No browser
 * claim, URL, product selection or verdict is accepted as authority. */
export function prepareAffiliateActions(options:{simulation?:boolean;links:ReturnType<typeof prepareAffiliateLinks>;readCurrent:()=>Selection|null;allowed:()=>boolean}){
 if(options.simulation!==true)throw Error('Live affiliate actions are disabled.');
 let ended=false,epoch=0;
 const permits=new WeakMap<object,{epoch:number;revision:number;product:string;request:Request}>();
 const read=()=>{const value=options.readCurrent();if(!value||!Number.isSafeInteger(value.revision)||value.revision<0)return null;return structuredClone(value);};
 return Object.freeze({
  issue(now:number,request:Request):object|null{
   const generation=++epoch;
   try{
    if(ended||!options.allowed())return null;
    const current=read(),captured=structuredClone(request);
    if(!current||!options.links.describe(current.product,now,captured)||!options.allowed()||ended||generation!==epoch)return null;
    const permit=Object.freeze({});permits.set(permit,{epoch:generation,revision:current.revision,product:JSON.stringify(current.product),request:captured});return permit;
   }catch{return null;}
  },
  resolve(permit:object,now:number){
   try{
    const bound=permits.get(permit);if(!bound)return null;permits.delete(permit);
    if(ended||bound.epoch!==epoch||!options.allowed())return null;
    const current=read();if(!current||current.revision!==bound.revision||JSON.stringify(current.product)!==bound.product)return null;
    const metadata=options.links.describe(current.product,now,bound.request);
    if(!metadata||!options.allowed())return null;
    return !ended&&bound.epoch===epoch?metadata:null;
   }catch{return null;}
  },
  invalidate(){epoch++;},
  end(){ended=true;epoch++;},
 });
}
