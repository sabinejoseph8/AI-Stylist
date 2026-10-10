import {FIELDS} from './notebook-state.ts';
import type {Field,Note,NotebookState} from './notebook-state.ts';
export type NoteUpdate={version:1;type:'notes';sessionId:string;sequence:number;notebookSession:number;revision:number;receipt:number|null;notes:Record<Field,Pick<Note,'value'|'status'|'revision'|'source'>>};
const object=(v:unknown):v is Record<string,unknown>=>Boolean(v)&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:readonly string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const integer=(v:unknown,min=0):v is number=>Number.isSafeInteger(v)&&(v as number)>=min;
const identity=(v:unknown):v is string=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(v);
export function decodeNoteUpdate(value:unknown):NoteUpdate{
 if(!object(value)||!exact(value,['version','type','sessionId','sequence','notebookSession','revision','receipt','notes'])||value.version!==1||value.type!=='notes'||!identity(value.sessionId)||!integer(value.sequence,1)||!integer(value.notebookSession,1)||!integer(value.revision)||!(value.receipt===null||integer(value.receipt,1))||!object(value.notes)||!exact(value.notes,FIELDS.map(([id])=>id)))throw Error('Notebook update held.');
 for(const [field] of FIELDS){const note=value.notes[field];if(!object(note)||!exact(note,['value','status','revision','source'])||typeof note.value!=='string'||note.value.length>160||!integer(note.revision)||note.revision>(value.revision as number)||!['missing','tentative','confirmed'].includes(note.status as string)||![null,'speech','touch'].includes(note.source as null|string)||((note.status==='missing')?note.value!=='':!note.value.trim()||note.source===null))throw Error('Notebook update held.');}
 return structuredClone(value) as NoteUpdate;
}
/** Whitelist the seven notes; never send transcripts, pictures, profile data or gates. */
export function encodeNoteUpdate(sessionId:string,sequence:number,snapshot:ReturnType<NotebookState['snapshot']>,receipt:number|null):NoteUpdate{
 return decodeNoteUpdate({version:1,type:'notes',sessionId,sequence,notebookSession:snapshot.session,revision:snapshot.revision,receipt,notes:Object.fromEntries(FIELDS.map(([field])=>{const {value,status,revision,source}=snapshot.notes[field];return[field,{value,status,revision,source}];}))});
}
/** Browser-side state preparation. No socket, microphone, persistence or HTML output.
 * The UI must acknowledge only after committing the exact current update. */
export class NoteUpdateClient {
 private sessionId:string|null=null;
 private current:NoteUpdate|null=null;
 private ended=false;
 private acknowledged=0;
 ready(value:unknown):boolean{
   if(this.ended||this.sessionId||!object(value)||!exact(value,['version','type','sessionId','simulation','liveEnabled'])||value.version!==1||value.type!=='ready'||!identity(value.sessionId)||value.simulation!==true||value.liveEnabled!==false)return false;
   this.sessionId=value.sessionId;return true;
 }
 accept(value:unknown):boolean{
   if(this.ended||!this.sessionId)return false;
   let update:NoteUpdate;try{update=decodeNoteUpdate(value);}catch{return false;}
   if(update.sessionId!==this.sessionId||this.current&&(update.sequence<=this.current.sequence||update.notebookSession!==this.current.notebookSession||update.revision<this.current.revision))return false;
   if(this.current&&FIELDS.some(([field])=>{const old=this.current!.notes[field],next=update.notes[field];return next.revision<old.revision||next.revision===old.revision&&(next.value!==old.value||next.status!==old.status||next.source!==old.source);}))return false;
   this.current=update;return true;
 }
 rendered(updateSequence:number,commandSequence:number){
   const current=this.current;if(this.ended||!current||current.sequence!==updateSequence||current.sequence<=this.acknowledged||current.receipt===null||!integer(commandSequence))return null;
   this.acknowledged=current.sequence;
   return{version:1,type:'rendered',sessionId:this.sessionId!,sequence:commandSequence,receipt:current.receipt};
 }
 disconnect(){this.ended=true;this.sessionId=null;this.current=null;}
 snapshot(){return this.current?structuredClone(this.current):null;}
}
