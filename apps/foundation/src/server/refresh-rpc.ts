import {createSupabaseRpc,type SupabaseFetch} from './supabase-rpc.ts';
const allowed=new Set(['stylist_adopt_refresh','stylist_inspect_refresh','stylist_claim_refresh','stylist_finish_refresh','stylist_hold_refresh','stylist_remove_refresh']);
/** Explicitly injected, disconnected server transport. Reads no environment key and installs no route. */
export function createRefreshRpc(projectUrl:string,serviceKey:string,fetcher:SupabaseFetch,deadlineMs=8000){
 const rpc=createSupabaseRpc(projectUrl,serviceKey,fetcher,deadlineMs);
 return Object.freeze({async call(name:string,payload:Record<string,unknown>,signal:AbortSignal){
  if(!allowed.has(name)||signal.aborted)throw Error('Refresh storage unavailable');
  try{return await rpc.call(name,payload,signal);}catch{throw Error('Refresh storage unavailable');}
 }});
}
