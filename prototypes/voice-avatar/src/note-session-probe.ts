import {NotebookState} from './notebook-state.ts';
import {PreparedLiveTranscription} from './live-transcription.ts';
import type {TranscriptionWire} from './live-transcription.ts';
import {PartialNoteCoordinator} from './partial-note-coordinator.ts';
import type {ExtractionInput} from './partial-note-coordinator.ts';
export type ProbeCapture={start:(accept:(pcm:ArrayBuffer)=>boolean,stopped:(reason:string)=>void)=>Promise<boolean>;stop:()=>void};
/** In-process simulated ownership integration, not an authenticated endpoint.
 * A future browser/server bridge must carry identities and authenticate ownership.
 * No real capture source, provider socket or extraction model is constructed here.
 */
export class NoteSessionProbe {
 private notebook:NotebookState;
 private capture:ProbeCapture;
 private controller=new AbortController();
 private transcription:PreparedLiveTranscription|null=null;
 private notes:PartialNoteCoordinator;
 private ended=false;
 private reason:string|null=null;
 private capturing=false;
 private acquiring=false;
 private generation=0;
 private audioSequence=0;
 private session:number;
 private unsubscribe:()=>void;
 private changed:(receipt:number|null)=>void;
 constructor(options:{simulation?:boolean;notebook:NotebookState;wire:TranscriptionWire;capture:ProbeCapture;extract:(input:ExtractionInput,signal:AbortSignal)=>Promise<unknown>;changed:(receipt:number|null)=>void}){
   if(options.simulation!==true)throw Error('Live note session is disabled.');
   this.notebook=options.notebook;this.capture=options.capture;this.changed=options.changed;this.session=this.notebook.snapshot().session;
   this.notes=new PartialNoteCoordinator({notebook:options.notebook,extract:options.extract,changed:receipt=>{
     if(this.ended)return;
     if(receipt===null){this.shutdown('extraction-held');return;}
     try{this.changed(receipt);}catch{this.shutdown('display-held');}
   }});
   this.unsubscribe=this.notebook.subscribe(()=>{if(this.notebook.snapshot().session!==this.session)this.shutdown('session-cleared');});
   this.transcription=new PreparedLiveTranscription({simulation:true,wire:options.wire,signal:this.controller.signal,
     emit:event=>{if(!this.ended&&!this.notes.accept(event))throw Error('Note input held.');},
     stopped:reason=>this.shutdown(reason)});
 }
 receive(event:unknown){return !this.ended&&this.transcription?.receive(event)===true;}
 async beginTurn(turnId:string):Promise<boolean>{
   if(this.ended||this.acquiring||this.capturing||!this.transcription?.beginTurn(turnId))return false;
   const generation=++this.generation;this.acquiring=true;
   try{
     const started=await this.capture.start(pcm=>{
       if(this.ended||generation!==this.generation||!this.transcription)return false;
       const accepted=this.transcription.append(pcm,this.audioSequence);
       if(accepted)this.audioSequence++;
       return accepted;
     },()=>{if(!this.ended&&generation===this.generation)this.shutdown('capture-stopped');});
     if(this.ended||generation!==this.generation){this.capture.stop();return false;}
     this.acquiring=false;this.capturing=started;
     if(!started)this.shutdown('capture-unavailable');return started;
   }catch{this.shutdown('capture-unavailable');return false;}
 }
 commit():boolean{
   if(this.ended||!this.capturing||!this.transcription)return false;
   // Stop source before commit; its synchronous stop callback is now obsolete.
   ++this.generation;this.capturing=false;
   try{this.capture.stop();}catch{this.shutdown('capture-cleanup-held');return false;}
   return this.transcription.commit();
 }
 acknowledgeRendered(receipt:number){return !this.ended&&this.notes.acknowledgeRendered(receipt);}
 private shutdown(reason:string){
   if(this.ended)return;this.ended=true;this.reason=reason;this.capturing=false;this.acquiring=false;++this.generation;
   this.unsubscribe();this.notes.cancel();this.controller.abort();
   if(this.transcription?.snapshot().cleanupFailed)this.reason='cleanup-unverified';
   try{this.capture.stop();}catch{this.reason='capture-cleanup-held';}
   this.notebook.clear();
   try{this.changed(null);}catch{/* Ended state and media cancellation remain committed. */}
 }
 end(){this.shutdown('ended');}
 disconnected(){this.shutdown('disconnected');}
 snapshot(){return{ended:this.ended,reason:this.reason,capturing:this.capturing,acquiring:this.acquiring,transcription:this.transcription?.snapshot()??null,notes:this.notes.snapshot(),liveEnabled:false as const};}
}
