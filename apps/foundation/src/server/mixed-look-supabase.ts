import type {MixedLookPort} from './mixed-look-save.ts';
import {createSupabaseRpc,type SupabaseFetch} from './supabase-rpc.ts';

/** Explicitly constructed only by a verified server composition; never exposed to browser code. */
export function createMixedLookSupabasePort(projectUrl:string,serviceKey:string,fetcher:SupabaseFetch):MixedLookPort{
 const rpc=createSupabaseRpc(projectUrl,serviceKey,fetcher);
 const port:MixedLookPort={async save(ownerId,label,items,consent,id,expectedRevision){
  const result=await rpc.call('stylist_save_mixed_look',{
   p_owner:ownerId,p_label:label,p_items:items,p_consent:consent,p_id:id,p_expected_revision:expectedRevision,
  });
  const row=Array.isArray(result)?result.length===1?result[0]:null:result;
  if(!row||typeof row!=='object'||Array.isArray(row))throw Error('Look save unavailable');
  const value=row as Record<string,unknown>;
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(String(value.id))||
   !Number.isSafeInteger(value.revision)||Number(value.revision)<1)throw Error('Look save unavailable');
  return Object.freeze({id:String(value.id).toLowerCase(),revision:Number(value.revision)});
 }};
 return Object.freeze(port);
}
