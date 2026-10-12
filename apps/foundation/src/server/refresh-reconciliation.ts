import type {createRefreshStore} from './refresh-store.ts';
export interface CleanupScope {ownerId:string;sessionId:string;generation:number;leaseId:string|null}
export interface RevocationAuthority {
 /** Independently confirm exact provider-session termination. False/unknown includes transport errors, not just active sessions. */
 confirm(ownerId:string,sessionId:string,signal:AbortSignal):Promise<unknown>;
}
/** Trusted explicit invocation only. No route, scheduler, rotation retry or ownership reset. */
export function createRefreshReconciliation(store:ReturnType<typeof createRefreshStore>,authority:RevocationAuthority,deadlineMs=8000){
 if(typeof store?.inspect!=='function'||typeof store?.remove!=='function'||typeof authority?.confirm!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Cleanup reconciliation unavailable');
 const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;let pending=0;
 return Object.freeze({async reconcile(scope:CleanupScope,external:AbortSignal):Promise<'confirmed'|'stale'|'unconfirmed'>{
  if(!scope||!uuid.test(scope.ownerId)||!uuid.test(scope.sessionId)||!Number.isSafeInteger(scope.generation)||scope.generation<1||(scope.leaseId!==null&&!uuid.test(scope.leaseId))||external.aborted||pending>=4)return 'unconfirmed';
  const expected=Object.freeze({...scope});pending++;
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined,stop!:()=>void;
  const canceled=new Promise<'unconfirmed'>(resolve=>{stop=()=>{controller.abort();resolve('unconfirmed');};external.addEventListener('abort',stop,{once:true});timer=setTimeout(stop,deadlineMs);});
  const work=(async():Promise<'confirmed'|'stale'|'unconfirmed'>=>{
   try{
    if(controller.signal.aborted)return 'unconfirmed';
    const record=await store.inspect(expected.ownerId,expected.sessionId,controller.signal);
    if(controller.signal.aborted||record.status==='unconfirmed')return 'unconfirmed';
    if(record.status==='found'&&(record.scope.generation!==expected.generation||record.leaseId!==expected.leaseId))return 'stale';
    const proof=await authority.confirm(expected.ownerId,expected.sessionId,controller.signal);
    if(controller.signal.aborted||!proof||typeof proof!=='object'||Array.isArray(proof))return 'unconfirmed';
    const p=proof as Record<string,unknown>;
    if(Object.keys(p).sort().join(',')!=='ownerId,sessionId,status'||p.status!=='revoked'||p.ownerId!==expected.ownerId||p.sessionId!==expected.sessionId)return 'unconfirmed';
    if(record.status==='absent')return 'confirmed';
    // Store/SQL compare generation and lease again, fencing concurrent replacement.
    const removed=await store.remove(record.scope,record.leaseId,true,controller.signal);
    return !controller.signal.aborted&&removed==='confirmed'?'confirmed':'unconfirmed';
   }catch{return 'unconfirmed';}finally{pending--;}
  })();
  try{return await Promise.race([work,canceled]);}finally{if(timer)clearTimeout(timer);external.removeEventListener('abort',stop);}
 }});
}
