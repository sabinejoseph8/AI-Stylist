import {randomUUID} from 'node:crypto';
import {sanitizeImage} from './sanitize-image.ts';
type Staged=Readonly<{id:string;ownerId:string;key:string;checksum:string;width:number;height:number;contentType:'image/webp'}>;
/** Trusted server adapters must make records durable and serialize reference checks. */
export interface MediaLifecyclePort {
 stage(record:Staged):Promise<void>;
 putIfAbsent(key:string,bytes:Uint8Array):Promise<void>;
 commit(id:string,ownerId:string,checksum:string):Promise<void>;
 beginDelete(id:string,ownerId:string,revision:number):Promise<Readonly<{key:string;deletionToken:string}>>;
 remove(key:string):Promise<void>;
 finishDelete(id:string,ownerId:string,deletionToken:string):Promise<void>;
}
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function owner(value:string){if(typeof value!=='string'||!uuid.test(value))throw Error('Verified owner required');return value.toLowerCase();}
/** ownerId is from verified server auth, not the upload request body. No live adapter attached. */
export async function saveImage(port:MediaLifecyclePort,ownerId:string,consent:boolean,input:Uint8Array,contentType:string){
 const actor=owner(ownerId);
 if(consent!==true)throw Error('Explicit save required');
 const image=await sanitizeImage(input,contentType);
 const id=randomUUID();
 const key=`${actor}/${id}.webp`;
 const record=Object.freeze({id,ownerId:actor,key,checksum:image.checksum,width:image.width,height:image.height,contentType:image.contentType});
 try{
  // Persist staging before writing an object. Any ambiguous outcome stays pending
  // for reconciliation. Never erase metadata just because a response was lost.
  await port.stage(record);
  await port.putIfAbsent(key,image.bytes);
  await port.commit(id,actor,image.checksum);
  return Object.freeze({id,width:image.width,height:image.height});
 }catch{throw Error('Image save requires reconciliation');}
}
export async function deleteImage(port:MediaLifecyclePort,ownerId:string,id:string,revision:number,confirm:boolean){
 const actor=owner(ownerId);
 if(typeof id!=='string'||!uuid.test(id)||!Number.isSafeInteger(revision)||revision<1||confirm!==true)throw Error('Invalid deletion');
 try{
  // Adapter must lock metadata, refuse existing references, and mark deleting
  // atomically. New references must refuse deleting assets before releasing lock.
  const pending=await port.beginDelete(id,actor,revision);
  if(typeof pending.key!=='string'||!new RegExp(`^${actor}/[A-Za-z0-9_-]{1,128}\\.(webp|png|jpg|jpeg)$`).test(pending.key)||
   typeof pending.deletionToken!=='string'||!uuid.test(pending.deletionToken))throw Error('Invalid deletion claim');
  await port.remove(pending.key);
  await port.finishDelete(id,actor,pending.deletionToken);
 }catch{throw Error('Image deletion not confirmed');}
}
