import {NoteUpdateClient} from './note-update-wire.ts';
import type {NoteUpdate} from './note-update-wire.ts';
import {FIELDS} from './notebook-state.ts';
import type {Field} from './notebook-state.ts';
export type SimulatedBrowserSocket={send:(message:string)=>void;close:()=>void;bufferedAmount:number};
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
 private deadline:ReturnType<typeof setTimeout>|null=null;
 private overall:ReturnType<typeof setTimeout>;
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
   if(value.type==='notes'){
     if(!this.client.accept(value))return this.reject();this.notify();return !this.ended;
   }
   if(Object.keys(value).length!==4||!['version','type','sessionId','sequence'].every(k=>Object.hasOwn(value,k))||value.version!==1||value.type!=='accepted'||value.sessionId!==this.sessionId||this.pending===null||value.sequence!==this.pending)return this.reject();
   this.pending=null;if(this.deadline!==null)clearTimeout(this.deadline);this.deadline=null;
   // A note may arrive before its command acknowledgment. Re-notify so the UI
   // can acknowledge its committed display after the command slot is available.
   this.notify();return !this.ended;
 }
 private send(type:string,extra:Record<string,unknown>={}):boolean{
   if(this.ended||!this.sessionId||this.pending!==null||this.sequence>=256)return false;
   if(this.socket.bufferedAmount>65536)return this.reject();
   this.pending=++this.sequence;this.wait();
   try{this.socket.send(JSON.stringify({version:1,sessionId:this.sessionId,sequence:this.sequence,type,...extra}));return !this.ended;}
   catch{return this.reject();}
 }
 begin(turnId:string){return typeof turnId==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(turnId)&&this.send('begin',{turnId});}
 commit(){return this.send('commit');}
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
   if(this.ended)return;this.ended=true;clearTimeout(this.overall);if(this.deadline!==null)clearTimeout(this.deadline);
   this.pending=null;this.sessionId=null;this.client.disconnect();
   try{this.socket.close();}catch{/* Local data remains cleared; no remote cleanup claim. */}
   try{this.changed(null);}catch{/* No stale content retained in controller. */}
 }
 snapshot(){return{ended:this.ended,pending:this.pending!==null,notes:this.client.snapshot(),liveEnabled:false as const};}
}
