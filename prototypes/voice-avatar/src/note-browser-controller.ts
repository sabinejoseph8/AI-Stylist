import {encodeNoteAudio} from './note-audio-frame.ts';
import {NoteUpdateClient} from './note-update-wire.ts';
import type {NoteUpdate} from './note-update-wire.ts';
import {FIELDS} from './notebook-state.ts';
import type {Field} from './notebook-state.ts';
export type SimulatedBrowserSocket={send:(message:string|ArrayBuffer)=>void;close:()=>void;bufferedAmount:number};
const object=(v:unknown):v is Record<string,unknown>=>Boolean(v)&&typeof v==='object'&&!Array.isArray(v);
/** Disabled browser transport preparation. The caller injects a simulated socket
 * and forwards its events. This never constructs WebSocket or acquires media.
 * UI receipts must follow the exact committed display, never just receipt arrival. */
export class NoteBrowserController {
 private client=new NoteUpdateClient();
 private socket:SimulatedBrowserSocket;
 private changed:(update:NoteUpdate|null)=>void;
 private ended=false;
 private sessionId:string|null=null;
 private sequence=0;
 private pending:number|null=null;
 private pendingType:string|null=null;
 private capturing=false;
 private activeTurn:string|null=null;
 private awaitingTurn:string|null=null;
 private usedTurns=new Set<string>();
 private audioSequence=0;
 private deadline:ReturnType<typeof setTimeout>|null=null;
 private overall:ReturnType<typeof setTimeout>;
 private providerDeadline:ReturnType<typeof setTimeout>|null=null;
 constructor(options:{simulation?:boolean;socket:SimulatedBrowserSocket;changed:(update:NoteUpdate|null)=>void}){
   if(options.simulation!==true)throw Error('Live notebook browser connection is disabled.');
   this.socket=options.socket;this.changed=options.changed;
   this.overall=setTimeout(()=>this.stop(),85000);this.wait();
 }
 private wait(){if(this.deadline!==null)clearTimeout(this.deadline);this.deadline=setTimeout(()=>this.stop(),5000);}
 private notify(){try{this.changed(this.client.snapshot());}catch{this.stop();}}
 receive(value:unknown):boolean{
   if(this.ended||!object(value))return this.reject();
   if(!this.sessionId){
     if(!this.client.ready(value))return this.reject();
     this.sessionId=value.sessionId as string;if(this.deadline!==null)clearTimeout(this.deadline);this.deadline=null;return true;
   }
   if(value.type==='turn-ready'){
     if(Object.keys(value).length!==4||!['version','type','sessionId','turnId'].every(k=>Object.hasOwn(value,k))||value.version!==1||value.sessionId!==this.sessionId||!this.awaitingTurn||value.turnId!==this.awaitingTurn)return this.reject();
     this.awaitingTurn=null;if(this.providerDeadline!==null)clearTimeout(this.providerDeadline);this.providerDeadline=null;this.notify();return !this.ended;
   }
   if(value.type==='notes'){
     if(!this.client.accept(value))return this.reject();this.notify();return !this.ended;
   }
   if(Object.keys(value).length!==4||!['version','type','sessionId','sequence'].every(k=>Object.hasOwn(value,k))||value.version!==1||value.type!=='accepted'||value.sessionId!==this.sessionId||this.pending===null||value.sequence!==this.pending)return this.reject();
   if(this.pendingType==='begin')this.capturing=true;
   this.pendingType=null;this.pending=null;if(this.deadline!==null)clearTimeout(this.deadline);this.deadline=null;
   // A note may arrive before its command acknowledgment. Re-notify so the UI
   // can acknowledge its committed display after the command slot is available.
   this.notify();return !this.ended;
 }
 private send(type:string,extra:Record<string,unknown>={}):boolean{
   if(this.ended||!this.sessionId||this.pending!==null||this.sequence>=256)return false;
   if(this.socket.bufferedAmount>65536)return this.reject();
   this.pendingType=type;this.pending=++this.sequence;this.wait();
   try{this.socket.send(JSON.stringify({version:1,sessionId:this.sessionId,sequence:this.sequence,type,...extra}));return !this.ended;}
   catch{return this.reject();}
 }
 begin(turnId:string){
   if(this.ended||!this.sessionId||this.sequence>=256||this.capturing||this.awaitingTurn!==null||this.pending!==null||typeof turnId!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(turnId)||this.usedTurns.has(turnId)||this.usedTurns.size>=16)return false;
   this.activeTurn=turnId;this.usedTurns.add(turnId);return this.send('begin',{turnId});
 }
 commit(){if(!this.capturing||this.pending!==null)return false;this.capturing=false;this.awaitingTurn=this.activeTurn;this.activeTurn=null;this.providerDeadline=setTimeout(()=>this.stop(),5000);const sent=this.send('commit');if(!sent)this.stop();return sent;}
 audio(pcm:ArrayBuffer):boolean{
   if(this.ended||!this.capturing)return false;
   if(this.socket.bufferedAmount>65536)return this.reject();
   try{const frame=encodeNoteAudio(pcm,this.audioSequence);this.socket.send(frame);this.audioSequence++;return !this.ended;}catch{return this.reject();}
 }
 edit(field:Field,value:string){
   const update=this.client.snapshot();if(!update||!FIELDS.some(([id])=>id===field)||typeof value!=='string'||value.length>160)return false;
   return this.send('edit',{field,value,expectedRevision:update.notes[field].revision});
 }
 confirm(field:Field){
   const update=this.client.snapshot();if(!update||!FIELDS.some(([id])=>id===field)||!update.notes[field].value)return false;
   return this.send('confirm',{field,expectedRevision:update.notes[field].revision});
 }
 rendered(updateSequence:number){
   if(this.ended||this.pending!==null||this.sequence>=256||this.socket.bufferedAmount>65536)return false;
   const command=this.client.rendered(updateSequence,this.sequence+1);if(!command)return false;
   return this.send('rendered',{receipt:command.receipt});
 }
 private reject(){this.stop();return false;}
 disconnected(){this.stop();}
 stop(){
   if(this.ended)return;this.ended=true;clearTimeout(this.overall);if(this.deadline!==null)clearTimeout(this.deadline);if(this.providerDeadline!==null)clearTimeout(this.providerDeadline);
   this.activeTurn=null;this.awaitingTurn=null;this.usedTurns.clear();this.capturing=false;this.pendingType=null;this.pending=null;this.sessionId=null;this.client.disconnect();
   try{this.socket.close();}catch{/* Local data remains cleared; no remote cleanup claim. */}
   try{this.changed(null);}catch{/* No stale content retained in controller. */}
 }
 snapshot(){return{ended:this.ended,ready:this.sessionId!==null,audioActive:this.capturing,awaitingProvider:this.awaitingTurn!==null,pending:this.pending!==null,notes:this.client.snapshot(),liveEnabled:false as const};}
}
