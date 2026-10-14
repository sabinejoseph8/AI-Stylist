export const PRIVACY_CATEGORIES=['session','preferences','wardrobe','looks','shopping'] as const;
export type PrivacyCategory=typeof PRIVACY_CATEGORIES[number];
export type ExportPhoto=Readonly<{id:string;blob:Blob}>;
export type PrivacySource=Readonly<{data:unknown;photos:readonly ExportPhoto[]}>;
export type PrivacyPort=Readonly<{read:()=>PrivacySource;clear:()=>void}>;
export type PreparedExport=Readonly<{generation:number;categories:readonly PrivacyCategory[];json:string}>;
export type PrivacySnapshot=Readonly<{busy:boolean;ready:PreparedExport|null;message:string}>;
export type ExportEncoder=(blob:Blob)=>Promise<string>;
export async function encodeExportPhoto(blob:Blob){const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(let offset=0;offset<bytes.length;offset+=32768)binary+=String.fromCharCode(...bytes.subarray(offset,offset+32768));return btoa(binary);}
/** Only explicit browser-memory sources. No account, credentials, provider or upload port. */
export class LocalPrivacy {
 private ports=new Map<PrivacyCategory,PrivacyPort>();
 private generation=0;
 private busy=false;
 private ready:PreparedExport|null=null;
 private verify:(()=>boolean)|null=null;
 private message='Choose the sample data categories to export or clear. Nothing leaves this device.';
 private listeners=new Set<()=>void>();
 private readonly encode:ExportEncoder;
 constructor(encode:ExportEncoder=encodeExportPhoto){this.encode=encode;}
 subscribe(listener:()=>void){this.listeners.add(listener);return()=>{this.listeners.delete(listener);};}
 snapshot():PrivacySnapshot{return Object.freeze({busy:this.busy,ready:this.ready,message:this.message});}
 private publish(message:string){this.message=message;for(const listener of [...this.listeners])try{listener();}catch{}}
 bind(category:PrivacyCategory,port:PrivacyPort){this.ports.set(category,port);this.invalidate();return()=>{if(this.ports.get(category)===port){this.ports.delete(category);this.invalidate();}};}
 invalidate(){++this.generation;this.busy=false;this.ready=null;this.verify=null;this.publish('Sample data changed. Prepare a fresh export if needed.');}
 cancel(){++this.generation;this.busy=false;this.ready=null;this.verify=null;this.publish('Sample export canceled. No download was started by cancellation.');}
 private selection(values:readonly PrivacyCategory[]){return Array.isArray(values)&&values.length>0&&values.length<=5&&new Set(values).size===values.length&&values.every(value=>PRIVACY_CATEGORIES.includes(value)&&this.ports.has(value))?PRIVACY_CATEGORIES.filter(value=>values.includes(value)):null;}
 clear(categories:readonly PrivacyCategory[]){const selected=this.selection(categories);if(!selected){this.publish('Choose available categories before clearing.');return false;}this.cancel();try{for(const category of selected)this.ports.get(category)!.clear();this.publish('Only selected sample categories were cleared. Other categories and files already downloaded are unchanged. No account or provider data was deleted.');return true;}catch{this.publish('Some sample categories could not be cleared. Review them before trying again.');return false;}}
 async prepare(categories:readonly PrivacyCategory[]){
  const selected=this.selection(categories);if(!selected){this.cancel();this.publish('Choose available categories before exporting.');return false;}
  const generation=++this.generation;this.ready=null;this.verify=null;this.busy=true;this.publish('Preparing only selected sample categories locally. You can cancel.');
  const deadline=setTimeout(()=>{if(generation===this.generation){this.cancel();this.publish('Export preparation expired. Prepare a smaller selection again.');}},30000);
  try{
   const sources=selected.map(category=>({category,source:this.ports.get(category)!.read()}));
   let bytes=0;const fingerprints=sources.map(({source})=>{const encoded=JSON.stringify(source.data);if(typeof encoded!=='string'||new TextEncoder().encode(encoded).byteLength>1024*1024)throw Error();for(const photo of source.photos){if(!(photo.blob instanceof Blob)||photo.blob.type!=='image/webp'||photo.blob.size<1||photo.blob.size>8*1024*1024||!/^[-a-z0-9_]{1,80}$/.test(photo.id))throw Error();bytes+=photo.blob.size;}return encoded;});
   if(bytes>32*1024*1024||generation!==this.generation)throw Error();
   const exported:Partial<Record<PrivacyCategory,unknown>>={};
   for(const {category,source} of sources){const photos=[];for(const photo of source.photos){if(generation!==this.generation)return false;let timer:ReturnType<typeof setTimeout>|undefined;const base64=await Promise.race([this.encode(photo.blob),new Promise<never>((_resolve,reject)=>{timer=setTimeout(()=>reject(Error()),8000);})]).finally(()=>{if(timer!==undefined)clearTimeout(timer);});if(generation!==this.generation)return false;if(typeof base64!=='string'||base64.length!==4*Math.ceil(photo.blob.size/3)||!/^[A-Za-z0-9+/]*={0,2}$/.test(base64))throw Error();photos.push({id:photo.id,type:'image/webp',base64});}exported[category]={data:source.data,photos};}
   if(generation!==this.generation)return false;
   const unchanged=()=>sources.every(({category,source},index)=>{const latest=this.ports.get(category)?.read();return !!latest&&JSON.stringify(latest.data)===fingerprints[index]&&latest.photos.length===source.photos.length&&latest.photos.every((photo,i)=>photo.id===source.photos[i].id&&photo.blob===source.photos[i].blob);});
   if(!unchanged())throw Error();
   const json=JSON.stringify({version:1,scope:'local-sample-only',categories:exported,limitations:['No real account or provider data.','Only selected current sample data is included.','Downloaded files are separate copies and are not deleted by clearing the app.']},null,2);
   if(new TextEncoder().encode(json).byteLength>48*1024*1024||generation!==this.generation)throw Error();
   this.verify=unchanged;this.ready=Object.freeze({generation,categories:Object.freeze(selected),json});this.busy=false;this.publish('Sample export ready. Review the selected categories, then download explicitly. Photos, if selected, are normalized WebP copies.');return true;
  }catch{if(generation===this.generation){this.busy=false;this.ready=null;this.verify=null;this.publish('Export unavailable, changed or too large. Choose fewer categories and prepare again. No download was started.');}return false;}finally{clearTimeout(deadline);}
 }
 current(prepared:PreparedExport){if(this.ready!==prepared||prepared.generation!==this.generation)return false;try{if(this.verify?.()&&this.ready===prepared&&prepared.generation===this.generation)return true;}catch{}this.invalidate();return false;}
 consume(prepared:PreparedExport){if(!this.current(prepared))return null;const json=prepared.json;this.ready=null;this.verify=null;this.publish('Sample download requested. Files already downloaded are outside these clear controls.');return json;}
}
