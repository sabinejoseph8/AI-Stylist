import React,{useEffect,useRef,useState} from 'react';
import {createNotebookRehearsal} from './note-browser-rehearsal.ts';
import {NotebookConnectionEditor} from './notebook-connection-editor.tsx';
import type {NoteUpdate} from './note-update-wire.ts';
import type {PreparedBrowserNoteSession} from './note-browser-session.ts';
/** Reviewable page only. No live connector, microphone or credential path. */
export function NotesTrialPreparation(){
 const owner=useRef<ReturnType<typeof createNotebookRehearsal>|null>(null);
 const [ack,setAck]=useState(false),[used,setUsed]=useState(false),[turns,setTurns]=useState(0);
 const [notes,setNotes]=useState<NoteUpdate|null>(null),[status,setStatus]=useState<ReturnType<PreparedBrowserNoteSession['status']>|null>(null);
 const active=Boolean(used&&status&&status.state!=='ended'&&status.state!=='cleanup-held');
 useEffect(()=>()=>owner.current?.dispose(),[]);
 useEffect(()=>{if(!notes)return;const id=requestAnimationFrame(()=>owner.current?.session.rendered(notes.sequence));return()=>cancelAnimationFrame(id);},[notes,status]);
 function start(){if(!ack||used)return;setUsed(true);owner.current=createNotebookRehearsal({simulation:true,scenario:'budget',page:window,visibility:document,changed:setNotes,status:setStatus});}
 async function play(){const current=owner.current;if(current&&await current.play())setTurns(current.turns());}
 return <main className="notes-trial-page"><header><p className="eyebrow">AI Stylist · Private preparation</p><h1>My Styling Notes</h1><p>Review the complete flow before a future microphone test.</p></header>
 <section className="camera-panel" aria-labelledby="trial-boundary"><h2 id="trial-boundary">Live testing is disabled</h2><p>This page uses scripted words and generated silence on your computer. It starts no microphone, camera, network connection or paid service. Checking the box does not authorize spending or send consent to a provider.</p><p>A future live trial would send your voice for transcription and text for note extraction to OpenAI. Provider retention terms apply. Temporary notes would clear at End; closing a connection would not prove provider deletion or final billing. Use made-up styling details only.</p><p>The proposed live limit is one start, two turns and at most 85 seconds including setup, with no retry. The additional $2 allowance has not been approved.</p></section>
 <section className="camera-panel" aria-labelledby="trial-instructions"><h2 id="trial-instructions">Read all steps first</h2><ol>
 <li>Keep this page visible. Switching tabs, refreshing or closing it ends the rehearsal.</li>
 <li>Check the acknowledgment below, then choose Start local rehearsal. Wait for Ready.</li>
 <li>Choose Play first budget turn. Wait for USD 500 maximum (items only) to appear as To confirm and the status to return to Ready.</li>
 <li>Choose Play budget correction. Wait for USD 350 maximum (items only) to replace it.</li>
 <li>Choose Edit beside Budget. Enter 350, check the item-price scope, and save. Confirm the notebook shows Confirmed.</li>
 <li>Choose End rehearsal. Notes should disappear. No second start is available on this page load.</li>
 </ol><label><input type="checkbox" checked={ack} disabled={used} onChange={e=>setAck(e.target.checked)}/> I understand this is a local rehearsal with no microphone or paid connection.</label>
 <p role="status" aria-live="polite" aria-atomic="true">{status?.message??'Not started. Live connection and microphone controls are unavailable.'}</p>
 <button disabled={!ack||used} onClick={start}>Start local rehearsal</button>
 <button disabled={!active||status?.state!=='ready'||turns>=2} onClick={()=>void play()}>{turns===0?'Play first budget turn':'Play budget correction'}</button>
 <button disabled={!active} onClick={()=>owner.current?.dispose()}>End rehearsal</button>
 </section>{notes&&owner.current&&<section className="notebook" aria-label="Temporary trial rehearsal notes"><h2>My Styling Notes</h2><NotebookConnectionEditor notes={notes} ready={active&&status?.state==='ready'} session={owner.current.session}/></section>}
 <footer>Preparation only · Temporary notes · No profile saving</footer></main>;
}
