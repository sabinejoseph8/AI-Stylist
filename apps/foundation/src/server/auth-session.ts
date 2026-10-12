import type {ActiveAuthSession} from './verified-identity.ts';
export interface AuthSessionRpc {call(name:string,payload:Record<string,unknown>):Promise<unknown>}
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
/** Prepared server-only boolean lookup. Use the bounded service RPC transport; no route installs it. */
export function createAuthSessionAuthority(rpc:AuthSessionRpc):ActiveAuthSession{
 if(typeof rpc?.call!=='function')throw Error('Session authority unavailable');
 return Object.freeze({async active(owner:string,session:string,signal:AbortSignal){
  if(typeof owner!=='string'||!uuid.test(owner)||typeof session!=='string'||!uuid.test(session)||signal.aborted)return false;
  try{const value=await rpc.call('stylist_auth_session_active',{p_owner:owner,p_session:session});return !signal.aborted&&value===true;}
  catch{return false;}
 }});
}
