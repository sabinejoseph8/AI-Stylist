import {PrivateNotesTrialLedgerOwner,validatePrivateNotesTrialLedger} from './private-notes-trial-ledger.ts';
import type {PrivateNotesTrialPersistence} from './private-notes-trial-ledger.ts';
import {createPrivateNotesTrialExecution} from './note-execution.ts';
import type {PrivateNotesTrialExecution} from './note-execution.ts';
import {prepareNotesStartupDiagnostic,createMinimalStartupExecution} from './notes-startup-diagnostic.ts';
import type {StartupDiagnosticOpen} from './notes-startup-diagnostic.ts';
import type {NoteStartupDiagnostic} from './note-startup-diagnostics.ts';
/** Trusted server preparation only. A stored row or a client flag is not approval.
 * The live operator must separately authorize a new startup-only experiment. */
export function prepareReservedNotesStartupDiagnostic(options:{authorization:{approvalId:string;financialApproved:boolean;securityApproved:boolean;scope:'startup-only';profile?:'minimal'};store:PrivateNotesTrialPersistence;makeOpener:(permit:PrivateNotesTrialExecution)=>{open:StartupDiagnosticOpen;end:()=>void};diagnostic?:NoteStartupDiagnostic}){
 const supplied=options.authorization,unavailable=()=>Error('Startup diagnostic requires separate authorization.');
 if(!supplied||supplied.financialApproved!==true||supplied.securityApproved!==true||supplied.scope!=='startup-only'||typeof supplied.approvalId!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(supplied.approvalId)||typeof options.store?.read!=='function'||typeof options.store?.compareAndSwap!=='function'||typeof options.makeOpener!=='function')throw unavailable();
 if(supplied.profile!==undefined&&supplied.profile!=='minimal')throw unavailable();
 if(supplied.profile==='minimal'&&!/^notes_startup_diag_minimal_[A-Za-z0-9_-]{1,50}$/.test(supplied.approvalId))throw unavailable();
 const a=Object.freeze({...supplied});
 let used=false;
 return{run:async(signal:AbortSignal)=>{
  if(used||signal.aborted)throw unavailable();used=true;
  // Bound each store operation even if the injected port never settles. An
  // uncertain write remains consumed/held; no retry or initializer exists.
  const bounded=async<T>(call:()=>Promise<T>,observeAbort:boolean):Promise<T>=>{
   let timer:ReturnType<typeof setTimeout>|undefined,abort:()=>void=()=>{};
   const limit=new Promise<never>((_r,reject)=>{abort=()=>reject(unavailable());timer=setTimeout(abort,8000);if(observeAbort){signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();}});
   try{return await Promise.race([Promise.resolve().then(call),limit]);}finally{clearTimeout(timer);signal.removeEventListener('abort',abort);}
  };
  const read=async()=>{const value=validatePrivateNotesTrialLedger(await bounded(()=>options.store.read(signal),true));if(value.approval.id!==a.approvalId)throw unavailable();return value;};
  const owner=new PrivateNotesTrialLedgerOwner({read,compareAndSwap:(before,after)=>bounded(()=>options.store.compareAndSwap(before,after),true)});
  let reservation:string|undefined,attempted=false,opener:ReturnType<typeof options.makeOpener>|undefined;
  let result:Awaited<ReturnType<ReturnType<typeof prepareNotesStartupDiagnostic>['run']>>|undefined,outcomeRecorded=false;
  try{
   const before=await read();if(before.reservation!==null||signal.aborted)throw unavailable();
   attempted=true;reservation=await owner.reserve();if(signal.aborted)throw unavailable();
   const reserved=await read();if(reserved.reservation?.id!==reservation||reserved.reservation.state!=='reserved'||signal.aborted)throw unavailable();
   const permit=createPrivateNotesTrialExecution({financialApproved:true,securityApproved:true,ledger:reserved});
   opener=options.makeOpener(permit);if(signal.aborted)throw unavailable();
   result=await prepareNotesStartupDiagnostic({privateTrial:permit,minimalExecution:a.profile==='minimal'?createMinimalStartupExecution(permit):undefined,open:opener.open,signal,diagnostic:options.diagnostic}).run();
  }catch{/* Never expose raw store/provider errors or retry an uncertain write. */}
  finally{
   try{opener?.end();}catch{}
   if(reservation){
    // Cleanup cannot rely on an aborted acquisition signal. Retain the same
    // immutable approval/reservation and attempt a bounded held transition.
    const cleanupOwner=new PrivateNotesTrialLedgerOwner({read:async()=>{const value=validatePrivateNotesTrialLedger(await bounded(()=>options.store.read(),false));if(value.approval.id!==a.approvalId)throw unavailable();return value;},compareAndSwap:(before,after)=>bounded(()=>options.store.compareAndSwap(before,after),false)});
    try{await cleanupOwner.recordOutcome(reservation,'held');outcomeRecorded=true;}catch{}
   }
  }
  return Object.freeze({result:result??null,reservationAttempted:attempted,reservationAcknowledged:reservation!==undefined,outcomeRecorded,remoteCleanupVerified:false as const});
 }};
}
