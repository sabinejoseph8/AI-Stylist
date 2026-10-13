export type SamplePiece=Readonly<{id:string;name:string;slot:'main'|'layer'|'shoes'|'accessory';color:string;owned:boolean;priceCents:number|null}>;
export type SampleLook=Readonly<{id:string;title:string;kind:'sample-only';items:readonly SamplePiece[];estimate:Readonly<{currency:'USD';date:string;subtotalCents:number|null}>}>;
export type SavedLookSnapshot=Readonly<{looks:readonly SampleLook[];opened:SampleLook|null;message:string}>;
function record(value:unknown,keys:readonly string[]):value is Record<string,unknown>{if(!value||typeof value!=='object'||Object.getPrototypeOf(value)!==Object.prototype)return false;const own=Reflect.ownKeys(value);return own.length===keys.length&&own.every(key=>typeof key==='string'&&keys.includes(key)&&Object.getOwnPropertyDescriptor(value,key)?.get===undefined&&Object.getOwnPropertyDescriptor(value,key)?.set===undefined);}
const text=(value:unknown,max:number):value is string=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
/** Strict sample-only projection. No notebook, feedback, history, image, link or account port. */
export function projectSampleLook(value:unknown):SampleLook|null{
 if(!record(value,['id','title','kind','items','estimate'])||value.kind!=='sample-only'||!text(value.id,48)||!/^sample_[a-z0-9_]+$/.test(value.id)||!text(value.title,80)||!Array.isArray(value.items)||value.items.length<1||value.items.length>4)return null;
 if(Object.getPrototypeOf(value.items)!==Array.prototype||Reflect.ownKeys(value.items).length!==value.items.length+1||Array.from({length:value.items.length},(_unused,index)=>index).some(index=>!Object.prototype.hasOwnProperty.call(Object.getOwnPropertyDescriptor(value.items,index)??{},'value')))return null;
 const items:SamplePiece[]=[],ids=new Set<string>(),slots=new Set<string>();
 for(const item of value.items){
  if(!record(item,['id','name','slot','color','owned','priceCents'])||!text(item.id,48)||!text(item.name,80)||typeof item.slot!=='string'||!['main','layer','shoes','accessory'].includes(item.slot)||typeof item.color!=='string'||!/^#[0-9a-fA-F]{6}$/.test(item.color)||typeof item.owned!=='boolean'||!(item.priceCents===null||(Number.isSafeInteger(item.priceCents)&&Number(item.priceCents)>=0&&Number(item.priceCents)<=1000000))||ids.has(item.id)||slots.has(String(item.slot))||(item.owned&&item.priceCents!==0))return null;
  ids.add(item.id);slots.add(String(item.slot));items.push(Object.freeze({id:item.id,name:item.name,slot:item.slot as SamplePiece['slot'],color:item.color,owned:item.owned,priceCents:item.priceCents as number|null}));
 }
 const estimate=value.estimate;if(!record(estimate,['currency','date','subtotalCents'])||estimate.currency!=='USD'||typeof estimate.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(estimate.date)||!Number.isFinite(Date.parse(estimate.date))||new Date(estimate.date).toISOString().slice(0,10)!==estimate.date)return null;
 const subtotal=items.some(item=>!item.owned&&item.priceCents===null)?null:items.reduce((sum,item)=>sum+(item.owned?0:item.priceCents??0),0);if(estimate.subtotalCents!==subtotal)return null;
 return Object.freeze({id:value.id,title:value.title,kind:'sample-only',items:Object.freeze(items),estimate:Object.freeze({currency:'USD',date:estimate.date,subtotalCents:subtotal})});
}
export class LocalSavedLooks {
 private looks:SampleLook[]=[];
 private opened:SampleLook|null=null;
 private message='No sample looks saved. Nothing is stored in an account.';
 private listeners=new Set<()=>void>();
 subscribe(listener:()=>void){this.listeners.add(listener);return()=>{this.listeners.delete(listener);};}
 snapshot():SavedLookSnapshot{return Object.freeze({looks:Object.freeze([...this.looks]),opened:this.opened,message:this.message});}
 private publish(message:string){this.message=message;for(const listener of [...this.listeners])try{listener();}catch{}}
 save(input:unknown){const look=projectSampleLook(input);if(!look){this.publish('Only a valid sample look without notes, feedback or history can be saved.');return false;}if(this.looks.some(value=>value.id===look.id)){this.publish('This sample look is already saved.');return false;}if(this.looks.length>=12){this.publish('Sample memory holds up to twelve looks. Remove one first.');return false;}this.looks.push(look);this.publish('Sample look saved in browser memory only. No notebook, feedback, profile or Wardrobe item was saved.');return true;}
 reopen(id:string){const look=this.looks.find(value=>value.id===id);if(!look)return false;this.opened=look;this.publish('Viewing a saved sample, not a current recommendation. Fresh preference and product checks are unavailable. No notebook was restored.');return true;}
 close(){this.opened=null;this.publish('Saved sample closed. No notebook values were changed.');}
 remove(id:string){if(!this.looks.some(value=>value.id===id))return false;this.looks=this.looks.filter(value=>value.id!==id);if(this.opened?.id===id)this.opened=null;this.publish('Sample look removed. Wardrobe copies and sample preferences are unchanged.');return true;}
 clear(){this.looks=[];this.opened=null;this.publish('Sample look memory cleared.');}
}
export const SAMPLE_LOOKS:readonly SampleLook[]=Object.freeze([
 projectSampleLook({id:'sample_emerald',title:'Emerald structure',kind:'sample-only',items:[{id:'dress',name:'Illustrated emerald dress',slot:'main',color:'#176653',owned:false,priceCents:14000},{id:'jacket',name:'Illustrated owned jacket',slot:'layer',color:'#d8ceb9',owned:true,priceCents:0},{id:'shoes',name:'Illustrated flat shoes',slot:'shoes',color:'#3b3633',owned:false,priceCents:6500}],estimate:{currency:'USD',date:'2026-10-13',subtotalCents:20500}})!,
 projectSampleLook({id:'sample_blue',title:'Blue evening',kind:'sample-only',items:[{id:'dress',name:'Illustrated blue dress',slot:'main',color:'#365d7f',owned:false,priceCents:12000},{id:'bag',name:'Illustrated bag, price unknown',slot:'accessory',color:'#8d684f',owned:false,priceCents:null}],estimate:{currency:'USD',date:'2026-10-13',subtotalCents:null}})!
]);
