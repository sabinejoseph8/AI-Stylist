import {validNoteExecution,noteExecutionOptions,isPrivateNotesTrialExecution} from './note-execution.ts';
import type {PrivateNotesTrialExecution} from './note-execution.ts';
import {prepareServerNoteHttpAdapter} from './server-note-http-adapter.ts';
import {prepareServerNoteSocketOpener} from './server-note-socket-opener.ts';
import {validatePrivateNotesTrialLedger} from './private-notes-trial-ledger.ts';
import type {PreparedRemoteNoteCapture} from './note-remote-capture.ts';
type HttpOptions=Parameters<typeof prepareServerNoteHttpAdapter>[0];
type SocketOptions=Parameters<typeof prepareServerNoteSocketOpener>[0];
/** Dormant explicit-mode composition. No secret loader, default transports, route
 * or initializer. Ledger data is not human financial/security authorization. */
export function preparePrivateNotesTrialTransports(options:{simulation?:boolean;privateTrial?:PrivateNotesTrialExecution;approvalId:string;reservationId:string;ledger:unknown;apiKey:string;request:HttpOptions['request'];connect:NonNullable<SocketOptions['connect']>;capture:PreparedRemoteNoteCapture}){
 const unavailable=()=>Error('Private notebook transports unavailable.');
 if(!validNoteExecution(options))throw unavailable();
 const execution=noteExecutionOptions(options);
 const ledger=validatePrivateNotesTrialLedger(options.ledger);
 if(ledger.approval.id!==options.approvalId||ledger.reservation?.id!==options.reservationId||ledger.reservation?.state!=='reserved'||typeof options.request!=='function'||typeof options.connect!=='function')throw unavailable();
 if(isPrivateNotesTrialExecution(execution.privateTrial)&&(execution.privateTrial.approvalId!==options.approvalId||execution.privateTrial.reservationId!==options.reservationId))throw unavailable();
 if(options.capture.snapshot().liveEnabled!==isPrivateNotesTrialExecution(execution.privateTrial))throw unavailable();
 let http:ReturnType<typeof prepareServerNoteHttpAdapter>|undefined;
 let socket:ReturnType<typeof prepareServerNoteSocketOpener>|undefined;
 let disposed=false;
 const dispose=()=>{
  if(disposed)return;disposed=true;let failed=false;
  // Attempt all cleanup even when a sibling reports uncertainty.
  for(const end of [()=>options.capture.end(),()=>socket?.end(),()=>http?.end()])try{end();}catch{failed=true;}
  if(failed)throw unavailable();
 };
 try{
  http=prepareServerNoteHttpAdapter({apiKey:options.apiKey,request:options.request});
  socket=prepareServerNoteSocketOpener({apiKey:options.apiKey,connect:options.connect});
 }catch{try{dispose();}catch{}throw unavailable();}
 return Object.freeze({
  open:(...args:Parameters<typeof socket.open>)=>{if(disposed)return Promise.reject(unavailable());return socket!.open(...args);},
  fetch:(...args:Parameters<typeof http.fetch>)=>{if(disposed)return Promise.reject(unavailable());return http!.fetch(...args);},
  countFetch:(...args:Parameters<typeof http.countFetch>)=>{if(disposed)return Promise.reject(unavailable());return http!.countFetch(...args);},
  capture:options.capture,dispose,
 });
}
