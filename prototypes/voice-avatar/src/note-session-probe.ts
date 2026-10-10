import {applyNotebookCommand} from './notebook-command.ts';
import {NotebookState} from './notebook-state.ts';
import type {Field} from './notebook-state.ts';
import {PreparedLiveTranscription} from './live-transcription.ts';
import type {TranscriptionWire} from './live-transcription.ts';
import {PartialNoteCoordinator} from './partial-note-coordinator.ts';
import type {ExtractionInput} from './partial-note-coordinator.ts';
export type ProbeCapture={start:(accept:(pcm:ArrayBuffer)=>boolean,stopped:(reason:string)=>void)=>Promise<boolean>;stop:()=>void;receive?:(frame:ArrayBuffer)=>boolean;end?:()=>void};
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
 private invalidated:()=>void;
 private turnId:string|null=null;
 private committedTurn:string|null=null;
 private providerCommitted=false;
 private settledTurn:string|null=null;
 private turnReady:(turnId:string)=>void;
 constructor(options:{simulation?:boolean;notebook:NotebookState;wire:TranscriptionWire;capture:ProbeCapture;extract:(input:ExtractionInput,signal:AbortSignal)=>Promise<unknown>;changed:(receipt:number|null)=>void;invalidated?:()=>void;turnReady?:(turnId:string)=>void}){
   if(options.simulation!==true)throw Error('Live note session is disabled.');
   this.notebook=options.notebook;this.capture=options.capture;this.changed=options.changed;this.invalidated=options.invalidated??(()=>{});this.session=this.notebook.snapshot().session;this.turnReady=options.turnReady??(()=>{});
   this.notes=new PartialNoteCoordinator({notebook:options.notebook,extract:options.extract,settled:turnId=>{this.settledTurn=turnId;this.releaseTurn();},invalidated:()=>{if(!this.ended){try{options.invalidated?.();}catch{this.shutdown('display-held');}}},changed:receipt=>{
     if(this.ended)return;
     if(receipt===null){this.shutdown('extraction-held');return;}
     try{this.changed(receipt);}catch{this.shutdown('display-held');}
   }});
   this.unsubscribe=this.notebook.subscribe(()=>{if(this.notebook.snapshot().session!==this.session)this.shutdown('session-cleared');});
   this.transcription=new PreparedLiveTranscription({simulation:true,wire:options.wire,signal:this.controller.signal,
     emit:event=>{if(!this.ended&&!this.notes.accept(event))throw Error('Note input held.');},
     stopped:reason=>this.shutdown(reason)});
 }
 audio(frame:ArrayBuffer):boolean{
   if(this.ended||!this.capturing||!this.capture.receive)return false;
   try{return this.capture.receive(frame);}catch{this.shutdown('audio-held');return false;}
 }
 receive(event:unknown){
   if(this.ended||this.transcription?.receive(event)!==true)return false;
   if((event as {type?:unknown})?.type==='input_audio_buffer.committed'&&this.committedTurn!==null){
     this.providerCommitted=true;this.releaseTurn();
   }
   return !this.ended;
 }
 private releaseTurn(){
   if(this.ended||!this.providerCommitted||!this.committedTurn||this.settledTurn!==this.committedTurn)return;
   const turn=this.committedTurn;this.committedTurn=null;this.providerCommitted=false;
   try{this.turnReady(turn);}catch{this.shutdown('display-held');}
 }
 async beginTurn(turnId:string):Promise<boolean>{
   if(this.ended||this.acquiring||this.capturing||this.committedTurn!==null||!this.transcription?.beginTurn(turnId))return false;
   this.turnId=turnId;const generation=++this.generation;this.acquiring=true;
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
   this.committedTurn=this.turnId;this.providerCommitted=false;this.turnId=null;return this.transcription.commit();
 }
 /** A touch command may change only the exact field version the client saw. */
 edit(field:Field,value:string,expectedRevision:number):boolean{
   if(this.ended)return false;
   try{if(!applyNotebookCommand(this.notebook,{type:'edit',session:this.session,field,value,expectedRevision}))return false;this.invalidated();return !this.ended;}
   catch{this.shutdown('display-held');return false;}
 }
 confirm(field:Field,expectedRevision:number):boolean{
   if(this.ended)return false;
   try{if(!applyNotebookCommand(this.notebook,{type:'confirm',session:this.session,field,expectedRevision}))return false;this.invalidated();return !this.ended;}
   catch{this.shutdown('display-held');return false;}
 }
 acknowledgeRendered(receipt:number){return !this.ended&&this.notes.acknowledgeRendered(receipt);}
 private shutdown(reason:string){
   if(this.ended)return;this.ended=true;this.reason=reason;this.turnId=null;this.committedTurn=null;this.settledTurn=null;this.providerCommitted=false;this.capturing=false;this.acquiring=false;++this.generation;
   this.unsubscribe();this.notes.cancel();this.controller.abort();
   if(this.transcription?.snapshot().cleanupFailed)this.reason='cleanup-unverified';
   try{this.capture.stop();}catch{this.reason='capture-cleanup-held';}
   // Try the terminal release independently even if stopping capture failed.
   try{this.capture.end?.();}catch{this.reason='capture-cleanup-held';}
   this.notebook.clear();
   try{this.changed(null);}catch{/* Ended state and media cancellation remain committed. */}
 }
 end(){this.shutdown('ended');}
 disconnected(){this.shutdown('disconnected');}
 snapshot(){return{ended:this.ended,reason:this.reason,capturing:this.capturing,acquiring:this.acquiring,transcription:this.transcription?.snapshot()??null,notes:this.notes.snapshot(),liveEnabled:false as const};}
}
