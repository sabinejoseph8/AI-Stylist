import {decodeNoteAudio} from './note-audio-frame.ts';
import type {ProbeCapture} from './note-session-probe.ts';
/** Injected simulated browser audio source. No microphone, socket, logging,
 * persistence or retries. A NoteSessionProbe owns acquisition and cancellation. */
export class PreparedRemoteNoteCapture implements ProbeCapture {
 private accept:((pcm:ArrayBuffer)=>boolean)|null=null;
 private stopped:((reason:string)=>void)|null=null;
 private ended=false;
 private sequence=0;
 constructor(options:{simulation?:boolean}){if(options.simulation!==true)throw Error('Live notebook capture is disabled.');}
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
 snapshot(){return{ended:this.ended,capturing:Boolean(this.accept),frames:this.sequence,liveEnabled:false as const};}
}
