import {FIELDS} from './notebook-state.ts';
import type {NotebookState,Field} from './notebook-state.ts';
export type NotebookCommand={type:'edit';session:number;field:Field;expectedRevision:number;value:string}|{type:'confirm';session:number;field:Field;expectedRevision:number};
/** Domain revision check shared by the visible simulation and server owner.
 * Session is a notebook epoch, not authentication or customer identity.
 * Observer failures propagate so the owner can stop rather than hide failure. */
export function applyNotebookCommand(notebook:NotebookState,command:unknown):boolean{
 if(!command||typeof command!=='object'||Array.isArray(command))return false;
 const c=command as Record<string,unknown>,keys=c.type==='edit'?['type','session','field','expectedRevision','value']:['type','session','field','expectedRevision'];
 if(Object.keys(c).length!==keys.length||!keys.every(k=>Object.hasOwn(c,k))||!['edit','confirm'].includes(c.type as string)||!FIELDS.some(([id])=>id===c.field)||!Number.isSafeInteger(c.session)||!Number.isSafeInteger(c.expectedRevision)||(c.expectedRevision as number)<0)return false;
 const field=c.field as Field,snapshot=notebook.snapshot();
 if(c.session!==snapshot.session||c.expectedRevision!==snapshot.notes[field].revision)return false;
 if(c.type==='edit'){
   if(typeof c.value!=='string'||c.value.length>160)return false;
   notebook.edit(field,c.value);
 }else{if(!snapshot.notes[field].value)return false;notebook.confirm(field);}
 return true;
}
