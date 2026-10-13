import {validNoteExecution} from './note-execution.ts';
import type {PrivateNotesTrialExecution} from './note-execution.ts';
import {boundedNoteStartupDiagnostic,providerErrorDiagnostic,providerErrorDetails} from './note-startup-diagnostics.ts';
import type {NoteStartupCode,NoteStartupDiagnostic} from './note-startup-diagnostics.ts';
import {prepareTranscriptionSocketWire} from './transcription-socket-wire.ts';
import type {SimulatedTranscriptionSocket} from './transcription-socket-wire.ts';
import {TRANSCRIPTION_MODEL} from './live-transcription.ts';
export const STARTUP_DIAGNOSTIC_EVENT_ID='notes_startup_diagnostic_v1';
type Opened={socket:SimulatedTranscriptionSocket;detachInitialEvents:()=>void};
export type StartupDiagnosticOpen=(signal:AbortSignal,initialEvent:(value:unknown)=>void)=>Promise<Opened>;
export type StartupDiagnosticOutcome='configuration-accepted'|'initial-rejected'|'configuration-rejected'|'incompatible-ack'|'invalid-event'|'opening-failed'|'timed-out'|'canceled';
/** One startup only. No microphone, capture, HTTP extraction or response API.
 * No default socket, key loader, environment access, listener or activation. */
export function prepareNotesStartupDiagnostic(options:{simulation?:boolean;privateTrial?:PrivateNotesTrialExecution;simulationProfile?:'minimal';open:StartupDiagnosticOpen;signal:AbortSignal;diagnostic?:NoteStartupDiagnostic}){
 if(!validNoteExecution(options)||typeof options.open!=='function')throw Error('Startup diagnostic is disabled.');
 // The alternate payload is offline preparation only. Existing live permits,
 // operator flags and reserved trials must not silently select a new experiment.
 if(options.simulationProfile!==undefined&&(options.simulation!==true||options.simulationProfile!=='minimal'))throw Error('Minimal startup diagnostic is simulation only.');
 const minimal=options.simulationProfile==='minimal';
 const report=boundedNoteStartupDiagnostic(options.diagnostic);
 let used=false;
 return{run:()=>{
  if(used)throw Error('Startup diagnostic is single use.');used=true;
  return new Promise<Readonly<{outcome:StartupDiagnosticOutcome;errorCorrelated:boolean;details:readonly NoteStartupCode[];cleanupRequested:true;remoteCleanupVerified:false}>>(resolve=>{
   const lifetime=new AbortController();let ended=false,created=false,opened:Opened|undefined,initial:unknown,hasInitial=false;
   let bridge:ReturnType<typeof prepareTranscriptionSocketWire>|undefined;let errorCorrelated=false;const details:NoteStartupCode[]=[];
   const stop=(outcome:StartupDiagnosticOutcome)=>{
    if(ended)return;ended=true;clearTimeout(timer);options.signal.removeEventListener('abort',abort);
    lifetime.abort();try{opened?.detachInitialEvents();}catch{}try{if(bridge)bridge.stop();else opened?.socket.close();}catch{}
    resolve(Object.freeze({outcome,errorCorrelated,details:Object.freeze([...details]),cleanupRequested:true as const,remoteCleanupVerified:false as const}));
   };
   const abort=()=>stop('canceled');const timer=setTimeout(()=>stop('timed-out'),10000);
   const receive=(value:unknown)=>{
    if(ended)return;
    try{const encoded=JSON.stringify(value);if(!encoded||new TextEncoder().encode(encoded).byteLength>16384)throw Error();}catch{stop('invalid-event');return;}
    if(!value||typeof value!=='object'||Array.isArray(value)){stop('invalid-event');return;}
    const event=value as Record<string,any>;
    if(event.type==='error'){
     report(providerErrorDiagnostic(event));for(const code of providerErrorDetails(event)){details.push(code);report(code);}
     errorCorrelated=created&&event.error?.event_id===STARTUP_DIAGNOSTIC_EVENT_ID;
     stop(created?'configuration-rejected':'initial-rejected');return;
    }
    if(!created){
     if(event.type!=='session.created'||!event.session||typeof event.session.id!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(event.session.id)){stop('invalid-event');return;}
     created=true;
     // The only permitted client command. There is deliberately no audio API.
     if(!bridge?.wire.send({event_id:STARTUP_DIAGNOSTIC_EVENT_ID,type:'session.update',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:minimal?{model:TRANSCRIPTION_MODEL}:{model:TRANSCRIPTION_MODEL,languages:['en'],delay:'low'},turn_detection:null}}}}))stop('opening-failed');
     return;
    }
    if(event.type!=='session.updated'){stop('invalid-event');return;}
    const input=event.session?.audio?.input;
    stop(event.session?.type==='transcription'&&input?.format?.type==='audio/pcm'&&input.format.rate===24000&&input.transcription?.model===TRANSCRIPTION_MODEL&&input.turn_detection===null?'configuration-accepted':'incompatible-ack');
   };
   options.signal.addEventListener('abort',abort,{once:true});if(options.signal.aborted){stop('canceled');return;}
   try{
    void options.open(lifetime.signal,value=>{
     if(ended)return;if(hasInitial){stop('invalid-event');return;}hasInitial=true;initial=value;if(opened)receive(value);
    }).then(result=>{
     opened=result;if(ended){try{result.detachInitialEvents();}catch{}try{result.socket.close();}catch{}return;}
     try{
      bridge=prepareTranscriptionSocketWire({...options,socket:result.socket,signal:lifetime.signal,receive,stopped:()=>stop('opening-failed')});
      if(hasInitial)receive(initial);
     }catch{stop('opening-failed');}
    },()=>stop('opening-failed')).catch(()=>stop('opening-failed'));
   }catch{stop('opening-failed');}
  });
 }};
}
