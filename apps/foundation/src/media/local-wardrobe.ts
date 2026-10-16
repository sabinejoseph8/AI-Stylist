import {isNormalizedPreviewPhoto} from './normalized-preview-photo.ts';
import type {LocalPhoto} from './local-reference.ts';
export type WardrobeItem=Readonly<{id:number;url:string;description:string}>;
export type OwnedExport=Readonly<{photo:LocalPhoto;description:string;ownership:'owned';blob:Blob}>;
export type WardrobeSnapshot=Readonly<{items:readonly WardrobeItem[];selected:readonly number[];message:string}>;
/** Explicit browser-memory copies only. This is not a customer wardrobe repository. */
export class LocalWardrobe {
 private items:WardrobeItem[]=[];
 private blobs=new Map<number,Blob>();
 private sources=new WeakMap<LocalPhoto,number>();
 private selected:number[]=[];
 private serial=0;
 private message='No sample wardrobe items saved. Photos clear on refresh or closing this page.';
 private listeners=new Set<()=>void>();
 private readonly ports:{createURL:(blob:Blob)=>string;revokeURL:(url:string)=>void};
 constructor(ports:{createURL:(blob:Blob)=>string;revokeURL:(url:string)=>void}){this.ports=ports;}
 subscribe(listener:()=>void){this.listeners.add(listener);return()=>{this.listeners.delete(listener);};}
 snapshot():WardrobeSnapshot{return Object.freeze({items:Object.freeze([...this.items]),selected:Object.freeze([...this.selected]),message:this.message});}
 private publish(message:string){this.message=message;for(const listener of [...this.listeners])try{listener();}catch{}}
 save(source:OwnedExport|null){
  if(!source||source.ownership!=='owned'||!source.description.trim()||source.description.length>160||!isNormalizedPreviewPhoto(source.blob)){this.publish('Confirm an owned garment before saving it.');return false;}
  const existing=this.sources.get(source.photo);if(existing&&this.blobs.has(existing)){this.publish('This photo is already in the sample wardrobe. Edit its description in Wardrobe.');return false;}
  if(this.items.length>=24||[...this.blobs.values()].reduce((total,blob)=>total+blob.size,source.blob.size)>32*1024*1024){this.publish('Sample wardrobe limit reached: 24 items or 32 MB. Remove an item first.');return false;}
  let url:string;try{url=this.ports.createURL(source.blob);}catch{this.publish('The sample copy could not be created. Your session reference is unchanged.');return false;}
  const id=++this.serial;this.blobs.set(id,source.blob);this.sources.set(source.photo,id);this.items.push(Object.freeze({id,url,description:source.description.trim()}));this.publish('Owned item copied to sample wardrobe memory. It stays after End, but clears on refresh.');return true;
 }
 edit(id:number,description:string){if(typeof description!=='string'||!description.trim()||description.length>160||!this.blobs.has(id))return false;this.items=this.items.map(item=>item.id===id?Object.freeze({...item,description:description.trim()}):item);this.publish('Sample wardrobe description updated. The original session reference is unchanged.');return true;}
 select(id:number,checked:boolean){if(!this.blobs.has(id))return false;if(checked&&!this.selected.includes(id)){if(this.selected.length>=4){this.publish('Select up to four sample wardrobe items.');return false;}this.selected.push(id);}else if(!checked)this.selected=this.selected.filter(value=>value!==id);this.publish('Sample styling selection updated. No stylist or AI service is connected.');return true;}
 clearSelection(){this.selected=[];this.publish('Session selection cleared. Explicitly saved sample wardrobe items remain until refresh.');}
 remove(id:number){const item=this.items.find(item=>item.id===id);if(!item)return false;this.items=this.items.filter(item=>item.id!==id);this.selected=this.selected.filter(value=>value!==id);this.blobs.delete(id);try{this.ports.revokeURL(item.url);}catch{}this.publish('Sample wardrobe copy removed. A separately confirmed session reference is unchanged.');return true;}
 exportItems(){return Object.freeze(this.items.map(item=>Object.freeze({id:item.id,description:item.description,blob:this.blobs.get(item.id)!})));}
 clear(){for(const item of [...this.items])this.remove(item.id);this.selected=[];this.sources=new WeakMap();this.publish('Sample wardrobe cleared.');}
}
