import {isPrivateNotesTrialExecution,noteExecutionOptions} from './note-execution.ts';
import type {PrivateNotesTrialExecution,NoteExecutionOptions} from './note-execution.ts';
import {PreviewGate,validatePreview} from './preview-gate.ts';
import type {PreviewConfig} from './preview-gate.ts';
import {NotebookState} from './notebook-state.ts';
import {prepareNoteStartup} from './prepared-note-startup.ts';
import type {PrivateNotesTrialLedgerOwner} from './private-notes-trial-ledger.ts';
type Startup=ReturnType<typeof prepareNoteStartup>;
type SessionOptions=Parameters<typeof prepareNoteStartup>[0]['session'];
type Request={method:string;path:string;host:string;origin:string;authorization?:string;consent:boolean;signal:AbortSignal};
export type PrivateNotesTrialActivation={approvalId:string;financialApproved:boolean;securityApproved:boolean;authorize:(reservationId:string,signal:AbortSignal)=>Promise<PrivateNotesTrialExecution>};
export function validatePrivateNotesTrialActivation(value:PrivateNotesTrialActivation){
 if(!value||value.financialApproved!==true||value.securityApproved!==true||! /^[A-Za-z0-9_-]{1,80}$/.test(value.approvalId)||typeof value.authorize!=='function')throw Error('Private notes trial activation is disabled.');
 return Object.freeze({...value});
}
type Transports={open:Parameters<typeof prepareNoteStartup>[0]['open'];fetch:SessionOptions['fetch'];countFetch:NonNullable<SessionOptions['countFetch']>;capture:SessionOptions['capture'];dispose:()=>void};
/** Protected dormant notes-only preparation, not a live route or spending grant.
 * No app startup import, default provider, key loader, persistence initializer,
 * avatar, recommendations, retry or reservation release. */
export function preparePrivateNotesTrialOwner(options:{simulation?:boolean;activation?:PrivateNotesTrialActivation;preview:PreviewConfig;allowance:Pick<PrivateNotesTrialLedgerOwner,'reserve'|'recordOutcome'>;createTransports:(reservationId:string,execution:NoteExecutionOptions)=>Transports;publish:(snapshot:ReturnType<NotebookState['snapshot']>,receipt:number|null)=>void;turnReady?:(turnId:string)=>void;stopped?:()=>void}){
 const activation=options.activation?validatePrivateNotesTrialActivation(options.activation):undefined;
 if((options.simulation!==undefined&&typeof options.simulation!=='boolean')||(options.simulation===true?activation!==undefined:!activation||activation.financialApproved!==true||activation.securityApproved!==true||! /^[A-Za-z0-9_-]{1,80}$/.test(activation.approvalId)||typeof activation.authorize!=='function'))throw Error('Private notes trial activation is disabled.');
 const target=validatePreview(options.preview),gate=new PreviewGate(options.preview);
 let state:'idle'|'starting'|'active'|'closing'|'held'='idle';
 return{
  status:()=>Object.freeze({state,activationEnabled:Boolean(activation),remoteCleanupVerified:false as const}),
  async start(request:Request){
   if(request.method!=='GET'||request.path!=='/api/private-notes-trial-preparation'||request.host!==target.host||request.origin!==target.origin||request.consent!==true)return{status:403 as const};
   const auth=gate.check(request.authorization);if(auth!==200)return{status:auth};
   if(state!=='idle')return{status:409 as const};if(request.signal.aborted)return{status:499 as const};
   state='starting';const controller=new AbortController(),notebook=new NotebookState();
   let reservation:string|undefined,startup:Startup|undefined,transports:Transports|undefined,ending=false,turns=0,finishPromise:Promise<void>|undefined;
   const finish=():Promise<void>=>{
    if(finishPromise)return finishPromise;
    let settle!:()=>void;finishPromise=new Promise<void>(r=>settle=r);ending=true;state='closing';
    clearTimeout(timer);request.signal.removeEventListener('abort',stop);
    void(async()=>{
     controller.abort();startup?.end();if(startup)await startup.openingSettled;
     try{transports?.dispose();}catch{/* Uncertainty is retained regardless. */}
     notebook.clear();try{options.publish(notebook.snapshot(),null);}catch{/* Cleared session stays closed. */}
     if(reservation)try{await options.allowance.recordOutcome(reservation,'held');}catch{/* Never retry an uncertain write. */}
     state='held';
    })().then(()=>{settle();try{options.stopped?.();}catch{}},()=>{state='held';settle();try{options.stopped?.();}catch{}});return finishPromise;
   };
   const stop=()=>{ending=true;controller.abort();if(reservation)void finish();};
   const timer=setTimeout(stop,85000);request.signal.addEventListener('abort',stop,{once:true});
   try{reservation=await options.allowance.reserve();}
   catch{clearTimeout(timer);request.signal.removeEventListener('abort',stop);controller.abort();state='held';return{status:503 as const};}
   if(ending||request.signal.aborted){await finish();return{status:499 as const};}
   try{
    let execution:NoteExecutionOptions={simulation:true};
    if(activation){
     const capability=await new Promise<PrivateNotesTrialExecution>((resolve,reject)=>{
      const abort=()=>reject(Error('Private trial authorization canceled.'));
      controller.signal.addEventListener('abort',abort,{once:true});
      if(controller.signal.aborted){controller.signal.removeEventListener('abort',abort);abort();return;}
      void Promise.resolve().then(()=>activation.authorize(reservation!,controller.signal)).then(resolve,reject).finally(()=>controller.signal.removeEventListener('abort',abort));
     });
     if(ending||controller.signal.aborted||!isPrivateNotesTrialExecution(capability)||capability.reservationId!==reservation||capability.approvalId!==activation.approvalId)throw Error();
     execution={privateTrial:capability};
    }
    if(ending||controller.signal.aborted)throw Error();
    execution=noteExecutionOptions(execution);
    transports=options.createTransports(reservation,execution);if(typeof transports.countFetch!=='function'||typeof transports.dispose!=='function')throw Error();
    let settleReady!:(value:boolean)=>void;const ready=new Promise<boolean>(r=>settleReady=r);
    startup=prepareNoteStartup({...execution,signal:controller.signal,open:transports.open,session:{notebook,capture:transports.capture,fetch:transports.fetch,countFetch:transports.countFetch,changed:receipt=>options.publish(notebook.snapshot(),receipt),invalidated:()=>options.publish(notebook.snapshot(),null),turnReady:options.turnReady},ready:()=>settleReady(true),stopped:()=>{queueMicrotask(()=>{stop();settleReady(false);});}});
    if(!await ready||ending||!startup.active()){await finish();return{status:499 as const};}
   }catch{await finish();return{status:503 as const};}
   state='active';const probe=startup.active()!.probe;
   return{status:200 as const,snapshot:()=>notebook.snapshot(),probeSnapshot:()=>probe.snapshot(),
    beginTurn:async(id:string)=>{if(ending)return false;if(turns>=2){await finish();return false;}turns++;return probe.beginTurn(id);},
    commitTurn:()=>ending?false:probe.commit(),
    audio:(frame:ArrayBuffer)=>ending?false:probe.audio(frame),
    edit:probe.edit.bind(probe),confirm:probe.confirm.bind(probe),acknowledgeRendered:probe.acknowledgeRendered.bind(probe),
    end:finish,
   };
  }
 };
}
