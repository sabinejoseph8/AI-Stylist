import type {createRefreshStore} from './refresh-store.ts';
import type {createRefreshReconciliation} from './refresh-reconciliation.ts';
/** One explicit page per call. No scheduler, revocation initiation or rotation retry. */
export function createRefreshScan(store:Pick<ReturnType<typeof createRefreshStore>,'discover'>,reconciliation:Pick<ReturnType<typeof createRefreshReconciliation>,'reconcile'>,deadlineMs=8000){
 if(typeof store?.discover!=='function'||typeof reconciliation?.reconcile!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Cleanup scan unavailable');
 let running=false;
 return Object.freeze({async page(after:string|null,limit:number,external:AbortSignal){
  let cursor=after,visited=0,confirmed=0,stale=0,unconfirmed=0;
  const result=(status:'page'|'interrupted'|'unavailable',endOfSweep=false)=>Object.freeze({status,nextAfter:cursor,visited,confirmed,stale,unconfirmed,endOfSweep});
  if(running||external.aborted||!Number.isSafeInteger(limit)||limit<1||limit>100||(after!==null&&!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(after)))return result('unavailable');
  running=true;const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined,stop!:()=>void;
  const canceled=new Promise<ReturnType<typeof result>>(resolve=>{stop=()=>{controller.abort();resolve(result('interrupted'));};external.addEventListener('abort',stop,{once:true});timer=setTimeout(stop,deadlineMs);});
  const work=(async()=>{
   try{
    if(controller.signal.aborted)return result('interrupted');
    const page=await store.discover(after,limit,controller.signal);
    if(controller.signal.aborted)return result('interrupted');
    if(page.status!=='found')return result('unavailable');
    for(const candidate of page.candidates){
     if(controller.signal.aborted)return result('interrupted');
     const outcome=await reconciliation.reconcile({...candidate.scope,leaseId:candidate.leaseId},controller.signal);
     if(controller.signal.aborted)return result('interrupted');
     visited++;if(outcome==='confirmed')confirmed++;else if(outcome==='stale')stale++;else unconfirmed++;
     cursor=candidate.scope.sessionId;
    }
    return result('page',page.candidates.length<limit);
   }catch{return result('unavailable');}finally{running=false;}
  })();
  try{return await Promise.race([work,canceled]);}finally{if(timer)clearTimeout(timer);external.removeEventListener('abort',stop);}
 }});
}
