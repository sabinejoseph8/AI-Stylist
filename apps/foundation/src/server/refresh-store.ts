import type {createRefreshEnvelopes,RefreshScope} from './refresh-envelope.ts';
export interface RefreshStoreRpc {call(name:string,payload:Record<string,unknown>,signal:AbortSignal):Promise<unknown>}
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
type Reply={status:'unconfirmed'}|{status:'confirmed';value:unknown};
/** Disconnected server-only ownership adapter; never expose this object or its capabilities through JSON. */
export function createRefreshStore(rpc:RefreshStoreRpc,codec:ReturnType<typeof createRefreshEnvelopes>,deadlineMs=8000){
 if(typeof rpc?.call!=='function'||typeof codec?.seal!=='function'||typeof codec?.open!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Refresh storage unavailable');
 let pending=0;
 const ids=(owner:unknown,session:unknown)=>typeof owner==='string'&&uuid.test(owner)&&typeof session==='string'&&uuid.test(session);
 const generation=(value:unknown)=>Number.isSafeInteger(value)&&(value as number)>0;
 const payload=(scope:RefreshScope)=>({p_owner:scope.ownerId,p_session:scope.sessionId,p_generation:scope.generation});
 async function call(name:string,input:Record<string,unknown>,external:AbortSignal):Promise<Reply>{
  if(external.aborted||pending>=4)return {status:'unconfirmed'};
  pending++;const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;let stop!:()=>void;
  const canceled=new Promise<Reply>(resolve=>{stop=()=>{controller.abort();resolve({status:'unconfirmed'});};external.addEventListener('abort',stop,{once:true});timer=setTimeout(stop,deadlineMs);});
  const work=Promise.resolve().then(async():Promise<Reply>=>{try{if(controller.signal.aborted)return {status:'unconfirmed'};const value=await rpc.call(name,input,controller.signal);return controller.signal.aborted?{status:'unconfirmed'}:{status:'confirmed',value};}catch{return {status:'unconfirmed'};}finally{pending--;}});
  try{return await Promise.race([work,canceled]);}finally{if(timer)clearTimeout(timer);external.removeEventListener('abort',stop);}
 }
 function row(value:unknown,owner:string,session:string){
  if(!value||typeof value!=='object'||Array.isArray(value))return null;const x=value as Record<string,unknown>;
  if(Object.keys(x).sort().join(',')!=='envelope,expires_at_ms,generation,lease_id,owner_id,session_id,state'||x.owner_id!==owner||x.session_id!==session||!generation(x.generation)||!generation(x.expires_at_ms)||typeof x.state!=='string'||!['ready','rotating','held'].includes(x.state))return null;
  if(x.state==='ready'?x.lease_id!==null:typeof x.lease_id!=='string'||!uuid.test(x.lease_id))return null;
  return {scope:Object.freeze({ownerId:owner,sessionId:session,generation:x.generation as number,expiresAt:x.expires_at_ms as number}),state:x.state as 'ready'|'rotating'|'held',leaseId:x.lease_id as string|null,envelope:x.envelope};
 }
 async function mutation(name:string,input:Record<string,unknown>,signal:AbortSignal){const result=await call(name,input,signal);return result.status==='confirmed'&&typeof result.value==='boolean'?result.value?'confirmed' as const:'refused' as const:'unconfirmed' as const;}
 return Object.freeze({
  async discover(after:string|null,limit:number,signal:AbortSignal){
   if((after!==null&&!uuid.test(after))||!Number.isSafeInteger(limit)||limit<1||limit>100)return {status:'unconfirmed' as const};
   const result=await call('stylist_list_refresh_candidates',{p_after:after,p_limit:limit},signal);
   if(result.status!=='confirmed'||!Array.isArray(result.value)||result.value.length>limit)return {status:'unconfirmed' as const};
   const candidates=[];let previous=after;
   for(const item of result.value){
    if(!item||typeof item!=='object'||Array.isArray(item)||Object.keys(item).sort().join(',')!=='expires_at_ms,generation,lease_id,owner_id,session_id,state'||!ids(item.owner_id,item.session_id))return {status:'unconfirmed' as const};
    const value=row({...item,envelope:null},item.owner_id,item.session_id);
    if(!value||(previous!==null&&value.scope.sessionId<=previous))return {status:'unconfirmed' as const};
    previous=value.scope.sessionId;candidates.push(Object.freeze({scope:value.scope,state:value.state,leaseId:value.leaseId}));
   }
   return Object.freeze({status:'found' as const,candidates:Object.freeze(candidates),nextAfter:previous});
  },
  async adopt(secret:string,scope:RefreshScope,signal:AbortSignal){
   try{if(scope.generation!==1||!ids(scope.ownerId,scope.sessionId))return 'refused' as const;const envelope=codec.seal(secret,scope);return await mutation('stylist_adopt_refresh',{p_owner:scope.ownerId,p_session:scope.sessionId,p_expiry:scope.expiresAt,p_envelope:envelope},signal);}catch{return 'refused' as const;}
  },
  async inspect(owner:string,session:string,signal:AbortSignal){
   if(!ids(owner,session))return {status:'unconfirmed' as const};const result=await call('stylist_inspect_refresh',{p_owner:owner,p_session:session},signal);
   if(result.status!=='confirmed')return result;if(result.value===null)return {status:'absent' as const};
   const value=row(result.value,owner,session);return value?Object.freeze({status:'found' as const,scope:value.scope,state:value.state,leaseId:value.leaseId}):{status:'unconfirmed' as const};
  },
  async claim(owner:string,session:string,expected:number,signal:AbortSignal){
   if(!ids(owner,session)||!generation(expected))return {status:'refused' as const};
   const result=await call('stylist_claim_refresh',{p_owner:owner,p_session:session,p_generation:expected},signal);
   if(result.status!=='confirmed')return result;if(result.value===null)return {status:'refused' as const};
   const value=row(result.value,owner,session);
   if(!value||value.state!=='rotating'||value.scope.generation!==expected||!value.leaseId)return {status:'unconfirmed' as const};
   let secret=codec.open(value.envelope,value.scope);
   if(secret===null)return {status:'unconfirmed' as const};
   return Object.freeze({status:'claimed' as const,scope:value.scope,leaseId:value.leaseId,readSecret:()=>{const value=secret;secret=null;return value;},clearSecret:()=>{secret=null;}});
  },
  async finish(secret:string,scope:RefreshScope,leaseId:string,nextExpiry:number,signal:AbortSignal){
   try{if(!ids(scope.ownerId,scope.sessionId)||!generation(scope.generation)||typeof leaseId!=='string'||!uuid.test(leaseId)||scope.generation>=Number.MAX_SAFE_INTEGER)return 'refused' as const;
    const envelope=codec.seal(secret,{...scope,generation:scope.generation+1,expiresAt:nextExpiry});
    return await mutation('stylist_finish_refresh',{...payload(scope),p_lease:leaseId,p_expiry:nextExpiry,p_envelope:envelope},signal);
   }catch{return 'refused' as const;}
  },
  async remove(scope:RefreshScope,leaseId:string|null,revocationConfirmed:boolean,signal:AbortSignal){
   if(revocationConfirmed!==true||!ids(scope.ownerId,scope.sessionId)||!generation(scope.generation)||(leaseId!==null&&(typeof leaseId!=='string'||!uuid.test(leaseId))))return 'refused' as const;
   return mutation('stylist_remove_refresh',{...payload(scope),p_lease:leaseId,p_revoked:true},signal);
  },
  async hold(scope:RefreshScope,leaseId:string,signal:AbortSignal){
   if(!ids(scope.ownerId,scope.sessionId)||!generation(scope.generation)||typeof leaseId!=='string'||!uuid.test(leaseId))return 'refused' as const;
   return mutation('stylist_hold_refresh',{...payload(scope),p_lease:leaseId},signal);
  },
 });
}
