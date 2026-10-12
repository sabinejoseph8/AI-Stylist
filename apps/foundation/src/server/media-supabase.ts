import type {MediaLifecyclePort} from './media-lifecycle.ts';
import type {MediaReconcilePort} from './media-reconcile.ts';

export interface MediaRpc {call(name:string,payload:Record<string,unknown>):Promise<unknown>}
export interface OwnerMediaRpc extends MediaRpc {readonly ownerId:string}
export type MediaObjectStore=Pick<MediaLifecyclePort,'putIfAbsent'|'remove'>&Pick<MediaReconcilePort,'inspect'>;
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const checksum=/^[a-f0-9]{64}$/;

/**
 * Local preparation only. A trusted server composition must verify ownerId and
 * supply ownerRpc using that customer's authenticated context. serviceRpc is
 * reserved for the protected service-only functions. No route constructs this.
 */
export function createMediaSupabasePort(ownerId:string,serviceRpc:MediaRpc,ownerRpc:OwnerMediaRpc,storage:MediaObjectStore):MediaLifecyclePort&MediaReconcilePort{
 if(typeof ownerId!=='string'||!uuid.test(ownerId)||typeof serviceRpc?.call!=='function'||typeof ownerRpc?.call!=='function'||
  typeof storage?.putIfAbsent!=='function'||typeof storage?.inspect!=='function'||typeof storage?.remove!=='function')throw Error('Media configuration unavailable');
 const actor=ownerId.toLowerCase();
 if(ownerRpc.ownerId!==actor)throw Error('Media configuration unavailable');
 const path=new RegExp(`^${actor}/[A-Za-z0-9_-]{1,128}\\.(?:webp|png|jpe?g)$`);
 function identity(id:string,owner:string){if(typeof id!=='string'||!uuid.test(id)||owner!==actor)throw Error('Media operation unavailable');return id.toLowerCase();}
 function key(value:string){if(typeof value!=='string'||!path.test(value))throw Error('Media operation unavailable');return value;}
 async function call(rpc:MediaRpc,name:string,payload:Record<string,unknown>){
  try{return await rpc.call(name,payload);}catch{throw Error('Media operation unavailable');}
 }
 async function acknowledged(name:string,payload:Record<string,unknown>){
  if(await call(serviceRpc,name,payload)!==true)throw Error('Media operation unavailable');
 }
 return Object.freeze({
  async stage(record){
   if(!record||typeof record!=='object'||Array.isArray(record)||Object.keys(record).sort().join(',')!=='checksum,contentType,height,id,key,ownerId,width')throw Error('Media operation unavailable');
   const id=identity(record.id,record.ownerId);
   if(record.key!==`${actor}/${id}.webp`||record.contentType!=='image/webp'||typeof record.checksum!=='string'||!checksum.test(record.checksum)||
    !Number.isSafeInteger(record.width)||!Number.isSafeInteger(record.height)||record.width<1||record.height<1||record.width>8192||record.height>8192||record.width*record.height>16000000)throw Error('Media operation unavailable');
   await acknowledged('stylist_stage_media',{p_id:id,p_owner:actor,p_checksum:record.checksum,p_width:record.width,p_height:record.height});
  },
  async putIfAbsent(value,bytes){
   const validated=key(value);
   if(!uuid.test(validated.slice(actor.length+1,-5))||!validated.endsWith('.webp'))throw Error('Media operation unavailable');
   try{await storage.putIfAbsent(validated,bytes);}catch{throw Error('Media operation unavailable');}
  },
  async read(id,owner){return await call(serviceRpc,'stylist_read_media_operation',{p_id:identity(id,owner),p_owner:actor});},
  async inspect(value){
   try{return await storage.inspect(key(value));}catch{return {state:'unknown'} as const;}
  },
  async commit(id,owner,hash){
   const asset=identity(id,owner);if(typeof hash!=='string'||!checksum.test(hash))throw Error('Media operation unavailable');
   await acknowledged('stylist_commit_media',{p_id:asset,p_owner:actor,p_checksum:hash});
  },
  async beginDelete(id,owner,revision){
   const asset=identity(id,owner);if(!Number.isSafeInteger(revision)||revision<1)throw Error('Media operation unavailable');
   // This function derives auth.uid() itself; the service credential cannot claim a customer.
   const result=await call(ownerRpc,'stylist_begin_media_delete',{p_id:asset,p_expected_revision:revision,p_confirm:true});
   if(!result||typeof result!=='object'||Array.isArray(result))throw Error('Media operation unavailable');
   const row=result as Record<string,unknown>;
   if(Object.keys(row).sort().join(',')!=='deletionToken,key'||typeof row.key!=='string'||typeof row.deletionToken!=='string'||!uuid.test(row.deletionToken))throw Error('Media operation unavailable');
   return Object.freeze({key:key(row.key),deletionToken:row.deletionToken.toLowerCase()});
  },
  async remove(value){try{await storage.remove(key(value));}catch{throw Error('Media operation unavailable');}},
  async finishDelete(id,owner,token){
   const asset=identity(id,owner);if(typeof token!=='string'||!uuid.test(token))throw Error('Media operation unavailable');
   await acknowledged('stylist_finish_media_delete',{p_id:asset,p_owner:actor,p_token:token.toLowerCase()});
  },
 } satisfies MediaLifecyclePort&MediaReconcilePort);
}
