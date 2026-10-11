import React,{useEffect,useRef,useState} from 'react';
import {FIELDS} from './notebook-state.ts';
import type {Field} from './notebook-state.ts';
import type {NoteUpdate} from './note-update-wire.ts';
import type {NoteEditVersion} from './note-browser-controller.ts';
import type {PreparedBrowserNoteSession} from './note-browser-session.ts';
export function budgetEditValue(amount:string,scope:boolean):string|null{
 if(!scope||!/^\d+(?:\.\d{1,2})?$/.test(amount)||Number(amount)>100000)return null;
 return `USD ${amount} maximum (items only)`;
}
export function noteEditVersion(notes:NoteUpdate,field:Field):NoteEditVersion{
 return{sessionId:notes.sessionId,notebookSession:notes.notebookSession,revision:notes.notes[field].revision};
}
/** Touch changes affect this temporary simulated session only. No profile writes. */
export function NotebookConnectionEditor({notes,ready,session,rehearsal}:{notes:NoteUpdate;ready:boolean;session:PreparedBrowserNoteSession;rehearsal?:{replace:(field:Field)=>boolean;disconnect:()=>void}}){
 const input=useRef<HTMLInputElement>(null);
 const dialog=useRef<HTMLDialogElement>(null),origin=useRef<HTMLButtonElement|null>(null);
 const [field,setField]=useState<Field|null>(null),[version,setVersion]=useState<NoteEditVersion|null>(null);
 const [draft,setDraft]=useState(''),[amount,setAmount]=useState(''),[scope,setScope]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 useEffect(()=>{if(field){dialog.current?.showModal();}else dialog.current?.close();},[field]);
 useEffect(()=>()=>{dialog.current?.close();},[]);
 function load(id:Field){setVersion(noteEditVersion(notes,id));setDraft(notes.notes[id].value);setAmount(notes.notes[id].value.match(/^USD (\d+(?:\.\d{1,2})?) maximum \(items only\)$/)?.[1]??'');setScope(false);setError('');}
 function close(){dialog.current?.close();setField(null);setVersion(null);setDraft('');setAmount('');setScope(false);setError('');origin.current?.focus();}
 function cancel(){setMessage('Editing canceled. Your draft was discarded; the latest notebook note is unchanged.');close();}
 function save(){
   if(!field||!version||!ready)return;
   const value=field==='budget'?budgetEditValue(amount,scope):draft.trim();if(value===null||value.length>160)return;
   if(!session.edit(field,value,version)){setError('The note changed or the connection is busy. Your draft was not sent. Load the latest note and review it again.');return;}
   setMessage('Your change was sent. Wait for the notebook to confirm it. A fresh preference check is still required.');close();
 }
 function confirm(id:Field){if(!ready)return;setMessage(session.confirm(id,noteEditVersion(notes,id))?'Confirmation sent. A fresh preference check is still required.':'Confirmation was not sent. Review the current note and connection status.');}
 return <>
 <p role="status" aria-live="polite">{message}</p>
 <div className="notes-list">{FIELDS.map(([id,label])=><div className="note-row" key={id}><div><h4>{label}</h4><p>{notes.notes[id].value||'Not specified'}</p><span>{notes.notes[id].status==='tentative'?'To confirm':notes.notes[id].status==='confirmed'?'Confirmed':'Not specified'}</span></div><div className="note-actions"><button disabled={!ready} onClick={e=>{origin.current=e.currentTarget;load(id);setField(id);}} aria-label={`Edit rehearsal ${label.toLowerCase()}`}>Edit</button>{notes.notes[id].status==='tentative'&&id!=='budget'&&<button disabled={!ready} onClick={e=>{const edit=e.currentTarget.previousElementSibling;if(edit instanceof HTMLButtonElement)edit.focus();confirm(id);}} aria-label={`Confirm rehearsal ${label.toLowerCase()}`}>Confirm</button>}</div></div>)}</div>
 <dialog ref={dialog} aria-labelledby="connection-edit-title" onCancel={e=>{e.preventDefault();cancel();}}><h3 id="connection-edit-title">Edit rehearsal {FIELDS.find(([id])=>id===field)?.[1]}</h3>
 <p>This changes only the temporary rehearsal note. It does not save a customer preference or approve a look.</p>
 {field==='budget'?<><label>Maximum amount in USD<input ref={input} autoFocus inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)}/></label><label><input type="checkbox" checked={scope} onChange={e=>setScope(e.target.checked)}/>I mean a maximum for item prices only. Shipping and tax are separate.</label><p>Targets, ranges and other currencies or cost scopes need clarification.</p></>:<label>Note value<input ref={input} autoFocus maxLength={160} value={draft} onChange={e=>setDraft(e.target.value)}/></label>}
 {error&&<div role="alert"><p>{error}</p><button disabled={!ready} onClick={()=>{if(field){load(field);setMessage('Latest note loaded for review. Nothing was sent.');input.current?.focus();}}}>Load latest note</button></div>}
 {rehearsal&&<fieldset><legend>Simulated failure checks</legend><p>Read first: Simulate newer note changes the temporary server note while keeping your draft open. Save should refuse the old draft. Load latest note replaces your draft for review. Simulate connection loss ends the rehearsal and clears all notes and this draft.</p><button disabled={!ready} onClick={()=>{if(field&&rehearsal.replace(field))setMessage('A scripted newer note arrived. Your open draft is unchanged.');}}>Simulate newer note</button><button onClick={rehearsal.disconnect}>Simulate connection loss</button></fieldset>}
 <button disabled={!ready||field==='budget'&&budgetEditValue(amount,scope)===null} onClick={save}>Save rehearsal note</button><button onClick={cancel}>Cancel</button>
 </dialog>
 </>;
}
