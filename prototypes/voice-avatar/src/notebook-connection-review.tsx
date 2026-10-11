import {PreferenceClarificationPanel} from './notebook-preference-review.tsx';
import type {PreferenceClarification} from './preference-clarification.ts';
import React,{useEffect,useRef,useState} from 'react';
import {createNotebookRehearsal} from './note-browser-rehearsal.ts';
import {FIELDS} from './notebook-state.ts';
import type {NoteUpdate} from './note-update-wire.ts';
import type {PreparedBrowserNoteSession} from './note-browser-session.ts';
export function NotebookConnectionReview(){
 const owner=useRef<ReturnType<typeof createNotebookRehearsal>|null>(null);
 const [clarification,setClarification]=useState<PreferenceClarification|null>(null);
 const [notes,setNotes]=useState<NoteUpdate|null>(null),[status,setStatus]=useState<ReturnType<PreparedBrowserNoteSession['status']>|null>(null),[turns,setTurns]=useState(0);
 useEffect(()=>()=>owner.current?.dispose(),[]);
 useEffect(()=>{if(!notes)return;const frame=requestAnimationFrame(()=>owner.current?.session.rendered(notes.sequence));return()=>cancelAnimationFrame(frame);},[notes,status]);
 function start(){owner.current?.dispose();setTurns(0);owner.current=createNotebookRehearsal({simulation:true,page:window,visibility:document,changed:setNotes,clarificationChanged:setClarification,status:setStatus});}
 async function play(){const current=owner.current;if(current&&await current.play())setTurns(current.turns());}
 const active=Boolean(status&&status.state!=='ended'&&status.state!=='cleanup-held');
 return <details className="camera-panel"><summary>Review the prepared notebook connection</summary>
 <p>This separate rehearsal uses generated silence and scripted transcript events in this page. No microphone, camera, network connection or paid service is started. Its notes are separate from the main notebook.</p>
 <h3>Read before starting</h3><ol>
 <li>Choose Start connection rehearsal. The status should say it is ready.</li>
 <li>Choose Play first simulated turn. Wait for Emerald green to appear as To confirm and the status to return to ready.</li>
 <li>Choose Confirm color. Emerald green should become Confirmed.</li>
 <li>Choose Show connection preference explanation. A scripted conflict should appear; no look is approved and no saved preference is changed.</li>
 <li>Choose Play correction. The explanation should disappear. Wait for Blue to replace Emerald green as To confirm.</li>
 <li>Choose Confirm color. Blue should become Confirmed.</li>
 <li>Choose End rehearsal. The notes should disappear and the status should say the check ended. Leaving this tab also ends it.</li>
 </ol>
 <p role="status" aria-live="polite" aria-atomic="true">{status?.message??'The connection rehearsal has not started.'}</p>
 <button onClick={start} disabled={active}>Start connection rehearsal</button>
 <button onClick={()=>void play()} disabled={!active||status?.state!=='ready'||turns>=2}>{turns===0?'Play first simulated turn':'Play correction'}</button>
 <button onClick={()=>owner.current?.explain()} disabled={!active||status?.state!=='ready'||notes?.notes.color.status!=='confirmed'}>Show connection preference explanation</button>
 <button onClick={()=>owner.current?.session.confirm('color')} disabled={!active||status?.state!=='ready'||notes?.notes.color.status!=='tentative'}>Confirm color</button>
 <button onClick={()=>owner.current?.dispose()} disabled={!active}>End rehearsal</button>
 {notes&&<section className="notebook" aria-label="Connection rehearsal notes"><h3>Rehearsal Styling Notes</h3><div className="notes-list">{FIELDS.map(([field,label])=><div className="note-row" key={field}><div><h4>{label}</h4><p>{notes.notes[field].value||'Not specified'}</p><span>{notes.notes[field].status==='tentative'?'To confirm':notes.notes[field].status==='confirmed'?'Confirmed':'Not specified'}</span></div></div>)}</div><PreferenceClarificationPanel record={clarification}/></section>}
 </details>;
}
