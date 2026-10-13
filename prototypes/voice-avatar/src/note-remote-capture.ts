import {validNoteExecution,noteExecutionOptions,isPrivateNotesTrialExecution} from './note-execution.ts';
import type {PrivateNotesTrialExecution} from './note-execution.ts';
import {decodeNoteAudio} from './note-audio-frame.ts';
import type {ProbeCapture} from './note-session-probe.ts';
/** Injected browser audio source under an explicit execution mode. No microphone,
 * socket, logging, persistence or retries. The session owns cancellation. */
export class PreparedRemoteNoteCapture implements ProbeCapture {
 private liveEnabled=false;
 private accept:((pcm:ArrayBuffer)=>boolean)|null=null;
 private stopped:((reason:string)=>void)|null=null;
 private ended=false;
 private sequence=0;
 constructor(options:{simulation?:boolean;privateTrial?:PrivateNotesTrialExecution}){if(!validNoteExecution(options))throw Error('Live notebook capture is disabled.');
 const execution=noteExecutionOptions(options);
   this.liveEnabled=isPrivateNotesTrialExecution(execution.privateTrial);}
 async start(accept:(pcm:ArrayBuffer)=>boolean,stopped:(reason:string)=>void){
   if(this.ended||this.accept)return false;this.accept=accept;this.stopped=stopped;return true;
 }
 receive(frame:ArrayBuffer):boolean{
   if(this.ended||!this.accept)return false;
   try{const {pcm,sequence}=decodeNoteAudio(frame);if(sequence!==this.sequence)return this.fail();
     if(!this.accept(pcm))return this.fail();this.sequence++;return !this.ended;
   }catch{return this.fail();}
 }
 private fail(){const stopped=this.stopped;this.end();try{stopped?.('audio-held');}catch{/* The owner must remain stopped. */}return false;}
 stop(){this.accept=null;this.stopped=null;}
 end(){this.ended=true;this.stop();}
 snapshot(){return{ended:this.ended,capturing:Boolean(this.accept),frames:this.sequence,liveEnabled:this.liveEnabled};}
}
