import {validNoteExecution,noteExecutionOptions,isPrivateNotesTrialExecution} from './note-execution.ts';
import type {PrivateNotesTrialExecution} from './note-execution.ts';
import {NoteSessionProbe} from './note-session-probe.ts';
import type {ProbeCapture} from './note-session-probe.ts';
import {NotebookState} from './notebook-state.ts';
import {prepareBudgetedNoteDispatch} from './budgeted-note-dispatch.ts';
import {createPreparedNoteTokenCounter} from './note-token-count-transport.ts';
import {decodeOpenAINoteResponse} from './openai-note-extractor.ts';
import {createPreparedOpenAINoteExtractor} from './openai-note-extractor.ts';
import {createPreparedNoteExtractionTransport} from './note-extraction-transport.ts';
import type {SimulatedExtractionFetch} from './note-extraction-transport.ts';
import {prepareTranscriptionSocketWire} from './transcription-socket-wire.ts';
import type {SimulatedTranscriptionSocket} from './transcription-socket-wire.ts';
/** Protocol composition for explicit simulation or a reserved private-trial
 * capability. Transports are injected; this creates no sockets, credentials or
 * live route. Private trials always require counted extraction. */
export function createPreparedNoteProviderSession(options:{simulation?:boolean;privateTrial?:PrivateNotesTrialExecution;socket:SimulatedTranscriptionSocket;fetch:SimulatedExtractionFetch;countFetch?:SimulatedExtractionFetch;signal:AbortSignal;notebook:NotebookState;capture:ProbeCapture;changed:(receipt:number|null)=>void;invalidated?:()=>void;inputStarted?:()=>void;turnReady?:(turnId:string)=>void;stopped?:()=>void;ready?:()=>void}){
 if(!validNoteExecution(options))throw Error('Live provider note session is disabled.');
 const execution=noteExecutionOptions(options);
 if(isPrivateNotesTrialExecution(execution.privateTrial)&&typeof options.countFetch!=='function')throw Error('Private trial requires counted extraction.');
 const controller=new AbortController();let ended=false,ready=false;
 let budgeted:ReturnType<typeof prepareBudgetedNoteDispatch>|undefined;
 let probe:NoteSessionProbe|undefined,binding:ReturnType<typeof prepareTranscriptionSocketWire>|undefined;
 const stop=()=>{
  if(ended)return;ended=true;options.signal.removeEventListener('abort',stop);
  controller.abort();budgeted?.end();probe?.end();binding?.stop();
  // A probe may call us while its own shutdown is still on the stack.
  // Notify after that stack settles so the lease sees final cleanup failures.
  queueMicrotask(()=>{try{options.stopped?.();}catch{/* Owners are already stopped. */}});
 };
 const transport=createPreparedNoteExtractionTransport({...execution,fetch:options.fetch});
 if(options.countFetch)budgeted=prepareBudgetedNoteDispatch({...execution,count:createPreparedNoteTokenCounter({...execution,fetch:options.countFetch}),dispatch:(serialized,signal)=>transport(JSON.parse(serialized),signal)});
 const budgetOwner=budgeted;
 const extract=budgetOwner?async(input:Parameters<typeof budgetOwner.request>[0],signal:AbortSignal)=>decodeOpenAINoteResponse(await budgetOwner.request(input,signal),input):createPreparedOpenAINoteExtractor({...execution,request:transport});
 try{
  binding=prepareTranscriptionSocketWire({...execution,socket:options.socket,signal:controller.signal,receive:event=>{probe?.receive(event);if(!ended&&!ready&&probe?.snapshot().transcription?.ready){ready=true;options.ready?.();}},stopped:stop});
  options.signal.addEventListener('abort',stop,{once:true});
  if(options.signal.aborted)stop();
  probe=new NoteSessionProbe({...execution,notebook:options.notebook,capture:options.capture,wire:binding.wire,extract,changed:options.changed,invalidated:options.invalidated,inputStarted:options.inputStarted,turnReady:options.turnReady});
  if(ended)probe.end();
 }catch{stop();throw Error('Prepared provider note session unavailable.');}
 return{probe,end:stop,status:()=>({ended:ended||probe!.snapshot().ended,cleanupFailed:binding!.status().cleanupFailed||['capture-cleanup-held','cleanup-unverified'].includes(probe!.snapshot().reason??''),remoteCleanupVerified:false as const,liveEnabled:isPrivateNotesTrialExecution(execution.privateTrial)})};
}
