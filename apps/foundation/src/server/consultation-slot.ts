/** Prepared service-only database port. No route, Auth or provider is connected.
 * Unknown outcomes hold this instance; this is not durable restart admission. */
export interface ConsultationRpc {call(name:string,payload:Record<string,unknown>):Promise<unknown>}
export type ConsultationLease=Readonly<{sessionId:string;token:string;fence:number;state:'reserved'|'provider';expiresAt:string}>;
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const validId=(x:unknown):x is string=>typeof x==='string'&&uuid.test(x);
function lease(value:unknown):ConsultationLease{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error();
 const x=value as Record<string,unknown>;
 if(Object.keys(x).sort().join(',')!=='expiresAt,fence,sessionId,state,token'||!validId(x.sessionId)||!validId(x.token)||
  !Number.isSafeInteger(x.fence)||(x.fence as number)<1||(x.state!=='reserved'&&x.state!=='provider')||
  typeof x.expiresAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(x.expiresAt)||!Number.isFinite(Date.parse(x.expiresAt)))throw Error();
 return Object.freeze({sessionId:x.sessionId,token:x.token,fence:x.fence as number,state:x.state,expiresAt:x.expiresAt});
}
export function createConsultationSlot(ownerId:string,rpc:ConsultationRpc,deadlineMs=8000){
 if(!validId(ownerId)||typeof rpc?.call!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)
 throw Error('Consultation configuration unavailable');
 let inFlight=false,uncertain=false;const invoke=rpc.call.bind(rpc);
 async function call(name:string,payload:Record<string,unknown>){
  if(inFlight||uncertain)throw Error('Consultation operation uncertain');
  inFlight=true;let timer:ReturnType<typeof setTimeout>|undefined;
  // A timeout does not cancel an already submitted database mutation. Do not retry.
  try{return await Promise.race([Promise.resolve().then(()=>invoke(name,payload)),new Promise<never>((_,reject)=>{
   timer=setTimeout(()=>reject(Error()),deadlineMs);
  })]);}catch{uncertain=true;throw Error('Consultation operation uncertain');}
  finally{if(timer)clearTimeout(timer);inFlight=false;}
 }
 return Object.freeze({
  async claim(sessionId:string,reconnectToken:string|null=null):Promise<ConsultationLease|null>{
   if(!validId(sessionId)||(reconnectToken!==null&&!validId(reconnectToken)))throw Error('Consultation input unavailable');
   const raw=await call('stylist_claim_consultation',{p_owner:ownerId,p_session:sessionId,p_token:reconnectToken});
   if(raw===null)return null;
   try{
    const result=lease(raw);
    if(result.sessionId!==sessionId||(reconnectToken!==null&&result.token!==reconnectToken)||
      (reconnectToken===null&&result.state!=='reserved'))throw Error();
    return result;
   }catch{uncertain=true;throw Error('Consultation operation uncertain');}
  },
  async update(value:ConsultationLease,action:'provider'|'heartbeat'|'check'|'end',cleanupVerified=false):Promise<boolean>{
   let record:ConsultationLease;
   try{record=lease(value);if(!['provider','heartbeat','check','end'].includes(action)||typeof cleanupVerified!=='boolean'||
    (cleanupVerified&&action!=='end'))throw Error();}catch{throw Error('Consultation input unavailable');}
   const result=await call('stylist_update_consultation',{p_owner:ownerId,p_session:record.sessionId,p_token:record.token,
    p_fence:record.fence,p_action:action,p_cleanup_verified:cleanupVerified});
   if(typeof result!=='boolean'){uncertain=true;throw Error('Consultation operation uncertain');}
   return result;
  },
 });
}
