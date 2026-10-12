import type {createAccountComposition} from './account-composition.ts';
import {createAccountNodeListener,type AccountNodeRoute} from './account-node.ts';
import {createSharedAccountAdmission,createSharedAdmissionPort,type AccountAdmissionRpc} from './account-admission-shared.ts';
import {accountJsonResponse} from './account-json.ts';
type Accounts=Pick<ReturnType<typeof createAccountComposition>,'routes'|'expireRecovery'|'close'|'cleanupHeld'>;
/** Explicit host wiring only. No environment reads, listener, credentials or work until start().
 * Caller owns TLS/proxy policy, static customer pages, server.listen and server.close. */
export function createAccountHost(origin:string,accounts:Accounts,rpc:AccountAdmissionRpc,options:Readonly<{intervalMs?:number;deadlineMs?:number}>={}){
 const intervalMs=options.intervalMs??60000,deadlineMs=options.deadlineMs??8000;
 if(typeof accounts?.routes!=='function'||typeof accounts?.expireRecovery!=='function'||typeof accounts?.close!=='function'||typeof accounts?.cleanupHeld!=='function'||typeof rpc?.call!=='function'||!Number.isSafeInteger(intervalMs)||intervalMs<1000||intervalMs>60000||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Account host unavailable');
 let closed=false,started=false,ready=false,inFlight=false,interval:ReturnType<typeof setInterval>|undefined;
 let maintenanceController:AbortController|undefined,starting:Promise<boolean>|undefined,closure:Promise<boolean>|undefined;
 const active=new Set<AbortController>();
 const admission=createSharedAccountAdmission(accounts.routes(),createSharedAdmissionPort(rpc),deadlineMs);
 const guarded=admission.routes();
 const selected=new Map<string,AccountNodeRoute>();
 for(const [path,route] of guarded)selected.set(path,Object.freeze({discardResponse:route.discardResponse,async handle(request:Request,signal:AbortSignal){
  if(closed||(!started||!ready||accounts.cleanupHeld())&&path!=='/api/account/sign-out')return accountJsonResponse(503,'unavailable');
  const controller=new AbortController(),stop=()=>controller.abort();active.add(controller);signal.addEventListener('abort',stop,{once:true});if(signal.aborted)stop();
  try{return await route.handle(request,controller.signal);}finally{active.delete(controller);signal.removeEventListener('abort',stop);}
 }}));
 const handle=createAccountNodeListener(origin,selected);
 async function maintain(){
  if(closed||!started||inFlight)return false;
  inFlight=true;const controller=new AbortController();maintenanceController=controller;let timer:ReturnType<typeof setTimeout>|undefined;
  const expired=new Promise<false>(resolve=>{timer=setTimeout(()=>{controller.abort();ready=false;resolve(false);},deadlineMs);});
  const work=Promise.all([Promise.resolve().then(()=>accounts.expireRecovery()),Promise.resolve().then(()=>rpc.call('stylist_expire_media_receipts',{p_limit:100},controller.signal))])
   .then(([recovery,count])=>!closed&&!controller.signal.aborted&&recovery===true&&Number.isSafeInteger(count)&&typeof count==='number'&&count>=0&&count<=100&&!accounts.cleanupHeld())
   .catch(()=>false).finally(()=>{inFlight=false;if(maintenanceController===controller)maintenanceController=undefined;});
  try{const ok=await Promise.race([work,expired]);if(!closed)ready=ok;return ok;}finally{if(timer)clearTimeout(timer);}
 }
 return Object.freeze({handle,
  health:()=>Object.freeze({status:closed?'closed':!started?'inactive':ready&&!accounts.cleanupHeld()?'ready':'unavailable',cleanupUnconfirmed:inFlight||admission.pending()>0||active.size>0||accounts.cleanupHeld()}),
  start(){
   if(closed)return Promise.resolve(false);if(starting)return starting;started=true;
   starting=maintain().then(ok=>{if(!closed){interval=setInterval(()=>{void maintain();},intervalMs);interval.unref();}return ok;});return starting;
  },
  /** Explicit hook also supports a host scheduler; overlap cannot start duplicate cleanup. */
  maintain,
  close(){
   if(closure)return closure;closed=true;ready=false;if(interval)clearInterval(interval);maintenanceController?.abort();for(const controller of active)controller.abort();
   closure=(async()=>{let timer:ReturnType<typeof setTimeout>|undefined;try{const result=await Promise.race([Promise.resolve().then(()=>accounts.close()).catch(()=>false),new Promise<false>(resolve=>{timer=setTimeout(()=>resolve(false),deadlineMs);})]);return result===true&&!inFlight&&admission.pending()===0&&active.size===0&&!accounts.cleanupHeld();}finally{if(timer)clearTimeout(timer);}})();return closure;
  },
 });
}
