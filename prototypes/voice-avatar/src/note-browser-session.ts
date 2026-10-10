import {NoteBrowserController} from './note-browser-controller.ts';
import type {SimulatedBrowserSocket} from './note-browser-controller.ts';
import type {NoteUpdate} from './note-update-wire.ts';
import type {Field} from './notebook-state.ts';
export type BrowserNoteCapture={start:(accept:(pcm:ArrayBuffer)=>boolean,stopped:(reason:string)=>void)=>Promise<boolean>;stop:()=>void};
/** Bounded simulated orchestration preparation. No default microphone/socket,
 * browser listeners, credentials or provider. startTurn must be a user action.
 * Permission is requested in that action; pre-ack frames are discarded locally,
 * never queued or sent. Later turns require matched provider-ready signaling. */
export class PreparedBrowserNoteSession {
 private controller:NoteBrowserController;
 private capture:BrowserNoteCapture;
 private changed:(notes:NoteUpdate|null)=>void;
 private generation=0;
 private acquiring=false;
 private capturing=false;
 private begun=false;
 private ended=false;
 private cleanupFailed=false;
 constructor(options:{simulation?:boolean;socket:SimulatedBrowserSocket;capture:BrowserNoteCapture;changed:(notes:NoteUpdate|null)=>void}){
   if(options.simulation!==true)throw Error('Live browser note session is disabled.');
   this.capture=options.capture;this.changed=options.changed;
   this.controller=new NoteBrowserController({simulation:true,socket:options.socket,changed:notes=>{
     if(this.controller.snapshot().ended){this.stop();return;}
     try{this.changed(notes);}catch{this.stop();}
   }});
 }
 receive(value:unknown){return !this.ended&&this.controller.receive(value);}
 async startTurn(turnId:string):Promise<boolean>{
   if(this.ended||this.acquiring||this.capturing||!this.controller.begin(turnId))return false;
   this.begun=true;this.acquiring=true;const generation=++this.generation;
   try{
     // Start immediately in the explicit gesture, before awaiting permission or
     // server acknowledgment. StreamingMicrophone resumes AudioContext here.
     const started=await this.capture.start(pcm=>{
       if(this.ended||generation!==this.generation)return false;
       if(!this.controller.snapshot().audioActive)return true; // Discard; no audio queue.
       return this.controller.audio(pcm);
     },()=>{if(!this.ended&&generation===this.generation)this.stop();});
     if(this.ended||generation!==this.generation){this.stopCapture();return false;}
     this.acquiring=false;this.capturing=started;if(!started)this.stop();return started;
   }catch{this.stop();return false;}
 }
 commit():boolean{
   if(this.ended||this.acquiring||!this.capturing||this.controller.snapshot().pending)return false;
   ++this.generation;this.capturing=false;this.stopCapture();
   if(this.cleanupFailed){this.stop();return false;}
   const committed=this.controller.commit();if(!committed)this.stop();return committed;
 }
 edit(field:Field,value:string){return !this.ended&&this.controller.edit(field,value);}
 confirm(field:Field){return !this.ended&&this.controller.confirm(field);}
 rendered(sequence:number){return !this.ended&&this.controller.rendered(sequence);}
 private stopCapture(){try{this.capture.stop();}catch{this.cleanupFailed=true;}}
 disconnected(){this.stop();}
 hidden(){this.stop();}
 stop(){
   if(this.ended)return;this.ended=true;++this.generation;this.acquiring=false;this.capturing=false;
   this.stopCapture();this.controller.stop();try{this.changed(null);}catch{/* Local content is cleared even if UI cleanup fails. */}
 }
 snapshot(){return{ended:this.ended,acquiring:this.acquiring,capturing:this.capturing,turnStarted:this.begun,cleanupFailed:this.cleanupFailed,connection:this.controller.snapshot(),liveEnabled:false as const};}
}
