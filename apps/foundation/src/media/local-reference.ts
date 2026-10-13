export type Ownership='owned'|'inspiration';
export type LocalPhoto=Readonly<{id:number;url:string}>;
export type LocalReference=Readonly<{photo:LocalPhoto;description:string;ownership:Ownership}>;
export type PhotoSnapshot=Readonly<{photos:readonly LocalPhoto[];selected:number|null;reference:LocalReference|null;loading:boolean;message:string;reset:number}>;
export type LocalPhotoPorts={normalize:(file:Blob)=>Promise<Blob>;createURL:(blob:Blob)=>string;revokeURL:(url:string)=>void};
/** Browser-memory references only. No provider, upload, database or storage port. */
export class LocalReferenceStore {
 private photos:LocalPhoto[]=[];
 private reference:LocalReference|null=null;
 private selected:number|null=null;
 private loading=false;
 private message='Choose a clothing photo or use your camera. Nothing is uploaded.';
 private generation=0;
 private serial=0;
 private reset=0;
 private urls=new Set<string>();
 private blobs=new Map<string,Blob>();
 private listeners=new Set<()=>void>();
 private readonly ports:LocalPhotoPorts;
 constructor(ports:LocalPhotoPorts){this.ports=ports;}
 subscribe(listener:()=>void){this.listeners.add(listener);return()=>{this.listeners.delete(listener);};}
 snapshot():PhotoSnapshot{return Object.freeze({photos:Object.freeze([...this.photos]),selected:this.selected,reference:this.reference,loading:this.loading,message:this.message,reset:this.reset});}
 private notify(){for(const listener of [...this.listeners])try{listener();}catch{}}
 private release(url:string){if(!this.urls.has(url))return;this.urls.delete(url);this.blobs.delete(url);try{this.ports.revokeURL(url);}catch{}}
 private prune(){const kept=new Set(this.photos.map(photo=>photo.url));if(this.reference)kept.add(this.reference.photo.url);for(const url of [...this.urls])if(!kept.has(url))this.release(url);}
 async choose(files:readonly Blob[]){
  const generation=++this.generation;
  if(!Array.isArray(files)||files.length<1||files.length>4||files.some(file=>!(file instanceof Blob)||file.size===0||file.size>8*1024*1024)||files.reduce((size,file)=>size+file.size,0)>16*1024*1024){this.loading=false;this.message='Choose 1 to 4 JPEG, PNG or WebP photos, up to 8 MB each and 16 MB together.';this.notify();return false;}
  this.loading=true;this.message='Preparing photos on this device. The confirmed reference stays unchanged.';this.notify();
  const prepared:LocalPhoto[]=[];
  try{
   for(const file of files){
    if(generation!==this.generation)return false;
    let timer:ReturnType<typeof setTimeout>|undefined;
    const normalized=await Promise.race([this.ports.normalize(file),new Promise<never>((_resolve,reject)=>{timer=setTimeout(()=>reject(Error('Photo unavailable')),8000);})]).finally(()=>{if(timer!==undefined)clearTimeout(timer);});
    if(generation!==this.generation)return false;
    if(!(normalized instanceof Blob)||normalized.type!=='image/webp'||normalized.size<1||normalized.size>8*1024*1024)throw Error('Photo unavailable');
    const url=this.ports.createURL(normalized);this.urls.add(url);this.blobs.set(url,normalized);prepared.push(Object.freeze({id:++this.serial,url}));
   }
   if(generation!==this.generation)return false;
   this.photos=prepared;this.selected=prepared[0].id;this.loading=false;
   this.message='Photos ready. Describe one garment and confirm whether it is owned or inspiration. No recognition was run.';this.prune();this.notify();return true;
  }catch{
   if(generation===this.generation){this.loading=false;this.message='A photo could not be prepared. Use a smaller JPEG, PNG or WebP, or capture a camera still. Your confirmed reference is unchanged.';this.notify();}
   return false;
  }finally{for(const photo of prepared)if(!this.photos.includes(photo)&&this.reference?.photo!==photo)this.release(photo.url);}
 }
 select(id:number){if(this.loading||!this.photos.some(photo=>photo.id===id))return false;this.selected=id;this.message='Selected photo changed. Confirm it before replacing the reference.';this.notify();return true;}
 confirm(description:string,ownership:Ownership|null){
  const photo=this.photos.find(photo=>photo.id===this.selected);
  if(this.loading||!photo||typeof description!=='string'||!description.trim()||description.length>160||!['owned','inspiration'].includes(ownership??''))return false;
  this.reference=Object.freeze({photo,description:description.trim(),ownership:ownership!});this.message='Reference confirmed for this session only. It has not been saved to Wardrobe.';this.prune();this.notify();return true;
 }
 exportOwned(){const reference=this.reference;if(!reference||reference.ownership!=='owned')return null;const blob=this.blobs.get(reference.photo.url);return blob?Object.freeze({photo:reference.photo,description:reference.description,ownership:'owned' as const,blob}):null;}
 remove(id:number){++this.generation;this.loading=false;this.photos=this.photos.filter(photo=>photo.id!==id);if(this.reference?.photo.id===id)this.reference=null;if(this.selected===id)this.selected=this.photos[0]?.id??null;this.prune();this.message='Photo removed from this session.';this.notify();}
 cancelPending(){++this.generation;this.loading=false;this.prune();this.notify();}
 clear(){++this.generation;this.loading=false;this.photos=[];this.selected=null;this.reference=null;this.reset++;for(const url of [...this.urls])this.release(url);this.message='Session photos cleared. Separately saved sample wardrobe copies are unchanged.';this.notify();}
}
