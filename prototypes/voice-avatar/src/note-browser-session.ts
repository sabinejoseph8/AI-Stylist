import type {PreferenceClarification} from './preference-clarification.ts';
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
 private endReason: 'stopped'|'connection'|'hidden'|'capture'|'display'|null=null;
 constructor(options:{simulation?:boolean;socket:SimulatedBrowserSocket;capture:BrowserNoteCapture;changed:(notes:NoteUpdate|null)=>void;clarificationChanged?:(record:PreferenceClarification|null)=>void}){
   if(options.simulation!==true)throw Error('Live browser note session is disabled.');
   this.capture=options.capture;this.changed=options.changed;
   this.controller=new NoteBrowserController({simulation:true,socket:options.socket,clarificationChanged:options.clarificationChanged,changed:notes=>{
     if(this.controller.snapshot().ended){this.stop('connection');return;}
     try{this.changed(notes);}catch{this.stop('display');}
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
     },()=>{if(!this.ended&&generation===this.generation)this.stop('capture');});
     if(this.ended||generation!==this.generation){this.stopCapture();return false;}
     this.acquiring=false;this.capturing=started;if(!started)this.stop('capture');return started;
   }catch{this.stop('capture');return false;}
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
 disconnected(){this.stop('connection');}
 hidden(){this.stop('hidden');}
 stop(reason: 'stopped'|'connection'|'hidden'|'capture'|'display'='stopped'){
   if(this.ended)return;this.endReason=reason;this.ended=true;++this.generation;this.acquiring=false;this.capturing=false;
   this.stopCapture();this.controller.stop();try{this.changed(null);}catch{/* Local content is cleared even if UI cleanup fails. */}
 }
 status(){
   const connection=this.controller.snapshot();
   // Fixed local messages only. Never echo capture errors, provider text or notes.
   if(this.cleanupFailed)return{state:'cleanup-held',message:'The check ended, but device cleanup could not be confirmed. Close this tab and check the camera and microphone indicators.'} as const;
   if(this.ended){
     const messages={stopped:'The check ended. Temporary notes were cleared.',connection:'The connection ended. Temporary notes were cleared.',hidden:'The page was hidden. The check ended and temporary notes were cleared.',capture:'The device check could not continue. Temporary notes were cleared.',display:'The notebook could not update safely. The check ended and temporary notes were cleared.'};
     return{state:'ended',message:messages[this.endReason??'stopped']} as const;
   }
   if(this.acquiring)return{state:'requesting-device',message:'Waiting for microphone permission in this simulated check.'} as const;
   if(this.capturing&&!connection.audioActive)return{state:'waiting-turn',message:'Waiting for the connection to accept this turn. Audio is not being sent.'} as const;
   if(this.capturing)return{state:'capturing',message:'The simulated capture is active.'} as const;
   if(connection.awaitingProvider)return{state:'processing',message:'Capture has stopped. Waiting for the transcript and notes to finish.'} as const;
   if(connection.pending)return{state:'waiting-command',message:'Waiting for the notebook connection.'} as const;
   if(!connection.ready)return{state:'connecting',message:'Waiting for the simulated notebook connection.'} as const;
   return{state:'ready',message:'Ready for a simulated turn. Live microphone access is disabled.'} as const;
 }
 snapshot(){return{status:this.status(),ended:this.ended,acquiring:this.acquiring,capturing:this.capturing,turnStarted:this.begun,cleanupFailed:this.cleanupFailed,connection:this.controller.snapshot(),liveEnabled:false as const};}
}
