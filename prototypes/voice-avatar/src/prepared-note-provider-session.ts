import {NoteSessionProbe} from './note-session-probe.ts';
import type {ProbeCapture} from './note-session-probe.ts';
import {NotebookState} from './notebook-state.ts';
import {createPreparedOpenAINoteExtractor} from './openai-note-extractor.ts';
import {createPreparedNoteExtractionTransport} from './note-extraction-transport.ts';
import type {SimulatedExtractionFetch} from './note-extraction-transport.ts';
import {prepareTranscriptionSocketWire} from './transcription-socket-wire.ts';
import type {SimulatedTranscriptionSocket} from './transcription-socket-wire.ts';
/** Consolidated disabled provider preparation. Both transports must be injected
 * simulations. No socket creation, credentials, route or live activation. */
export function createPreparedNoteProviderSession(options:{simulation?:boolean;socket:SimulatedTranscriptionSocket;fetch:SimulatedExtractionFetch;signal:AbortSignal;notebook:NotebookState;capture:ProbeCapture;changed:(receipt:number|null)=>void;invalidated?:()=>void;turnReady?:(turnId:string)=>void}){
 if(options.simulation!==true)throw Error('Live provider note session is disabled.');
 const controller=new AbortController();let ended=false;
 let probe:NoteSessionProbe|undefined,binding:ReturnType<typeof prepareTranscriptionSocketWire>|undefined;
 const stop=()=>{
  if(ended)return;ended=true;options.signal.removeEventListener('abort',stop);
  controller.abort();probe?.end();binding?.stop();
 };
 const extract=createPreparedOpenAINoteExtractor({simulation:true,request:createPreparedNoteExtractionTransport({simulation:true,fetch:options.fetch})});
 try{
  binding=prepareTranscriptionSocketWire({simulation:true,socket:options.socket,signal:controller.signal,receive:event=>{probe?.receive(event);},stopped:stop});
  options.signal.addEventListener('abort',stop,{once:true});
  if(options.signal.aborted)stop();
  probe=new NoteSessionProbe({simulation:true,notebook:options.notebook,capture:options.capture,wire:binding.wire,extract,changed:options.changed,invalidated:options.invalidated,turnReady:options.turnReady});
  if(ended)probe.end();
 }catch{stop();throw Error('Prepared provider note session unavailable.');}
 return{probe,end:stop,status:()=>({ended:ended||probe!.snapshot().ended,cleanupFailed:binding!.status().cleanupFailed||['capture-cleanup-held','cleanup-unverified'].includes(probe!.snapshot().reason??''),liveEnabled:false as const})};
}
