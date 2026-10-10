import {FIELDS} from './notebook-state.ts';
import type {NotebookState} from './notebook-state.ts';
import {NoteUpdateClient,encodeNoteUpdate} from './note-update-wire.ts';
type Snapshot=ReturnType<NotebookState['snapshot']>;
/** In-process UI integration of the prepared wire format, not a network client.
 * Local reference and gate controls stay local; displayed note values go through
 * the same decoder/revision checks prepared for the future private connection. */
export class NotebookPresentation {
 private client=new NoteUpdateClient();
 private notebookSession:number|null=null;
 private epoch=0;
 private sequence=0;
 private commandSequence=0;
 private id='';
 present(snapshot:Snapshot,receipt:number|null){
   if(this.notebookSession!==null&&snapshot.session<this.notebookSession)return null;
   if(snapshot.session!==this.notebookSession){
     this.client.disconnect();this.client=new NoteUpdateClient();this.notebookSession=snapshot.session;
     this.id=`local_view_${++this.epoch}`;this.commandSequence=0;
     this.client.ready({version:1,type:'ready',sessionId:this.id,simulation:true,liveEnabled:false});
   }
   const update=encodeNoteUpdate(this.id,++this.sequence,snapshot,receipt);
   if(!this.client.accept(update))return null;
   const accepted=this.client.snapshot()!;
   const view=structuredClone(snapshot);
   for(const [field] of FIELDS)view.notes[field]={...view.notes[field],...accepted.notes[field]};
   return {snapshot:view,sequence:accepted.sequence};
 }
 rendered(sequence:number):number|null{
   return this.client.rendered(sequence,++this.commandSequence)?.receipt??null;
 }
 disconnect(){this.client.disconnect();}
}
