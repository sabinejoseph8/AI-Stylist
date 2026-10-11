import {PreferenceClarificationPanel} from './notebook-preference-review.tsx';
import type {PreferenceClarification} from './preference-clarification.ts';
import React,{useEffect,useRef,useState} from 'react';
import {createNotebookRehearsal} from './note-browser-rehearsal.ts';
import {NotebookTimingReview} from './notebook-timing-review.tsx';
import type {NoteTiming} from './note-timing.ts';
import {NotebookConnectionEditor} from './notebook-connection-editor.tsx';
import type {NoteUpdate} from './note-update-wire.ts';
import type {PreparedBrowserNoteSession} from './note-browser-session.ts';
export function NotebookConnectionReview(){
 const startButton=useRef<HTMLButtonElement>(null),hadNotes=useRef(false);
 const owner=useRef<ReturnType<typeof createNotebookRehearsal>|null>(null);
 const [holdTiming,setHoldTiming]=useState(false);
 const [timing,setTiming]=useState<ReturnType<NoteTiming['report']>|null>(null);
 const [clarification,setClarification]=useState<PreferenceClarification|null>(null);
 const [notes,setNotes]=useState<NoteUpdate|null>(null),[status,setStatus]=useState<ReturnType<PreparedBrowserNoteSession['status']>|null>(null),[turns,setTurns]=useState(0);
 useEffect(()=>()=>owner.current?.dispose(),[]);
 useEffect(()=>{if(!notes||holdTiming)return;const frame=requestAnimationFrame(()=>owner.current?.session.rendered(notes.sequence));return()=>cancelAnimationFrame(frame);},[notes,status,holdTiming]);
 useEffect(()=>{if(hadNotes.current&&!notes&&document.activeElement===document.body)startButton.current?.focus();hadNotes.current=Boolean(notes);},[notes]);
 function start(){owner.current?.dispose();setHoldTiming(false);setTurns(0);owner.current=createNotebookRehearsal({simulation:true,page:window,visibility:document,changed:setNotes,clarificationChanged:setClarification,status:setStatus});}
 async function play(){const current=owner.current;if(current&&await current.play())setTurns(current.turns());}
 const active=Boolean(status&&status.state!=='ended'&&status.state!=='cleanup-held');
 useEffect(()=>{if(!active){setTiming(null);return;}const update=()=>setTiming(owner.current?.snapshot().server?.notes.timing??null);update();const timer=setInterval(update,200);return()=>clearInterval(timer);},[active]);
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
 <button ref={startButton} onClick={start} disabled={active}>Start connection rehearsal</button>
 <button onClick={()=>void play()} disabled={!active||status?.state!=='ready'||turns>=2}>{turns===0?'Play first simulated turn':'Play correction'}</button>
 <button onClick={()=>owner.current?.explain()} disabled={!active||status?.state!=='ready'||notes?.notes.color.status!=='confirmed'}>Show connection preference explanation</button>
 <button onClick={()=>owner.current?.session.confirm('color')} disabled={!active||status?.state!=='ready'||notes?.notes.color.status!=='tentative'}>Confirm color</button>
 <h4>Local timing review</h4><p>To review timing outcomes, start a rehearsal, select Hold timing acknowledgments, then play the first turn. Open Local timing diagnostics: the displayed update should stay Pending with no measured p95. Edit Color and save a different value: the previous update should become Canceled. End and restart the rehearsal: all counts should be zero. This control deliberately withholds the display receipt for this local fixture; it does not simulate live speed or provider failure.</p><label><input type="checkbox" checked={holdTiming} disabled={!active} onChange={event=>setHoldTiming(event.target.checked)}/> Hold timing acknowledgments (local rehearsal only)</label>
 <h4>Touch editing checks</h4><p>After the first turn, choose Edit beside any rehearsal note. Change its value and choose Save rehearsal note, or Cancel to keep the original. Confirm tentative notes with Confirm. Budget requires a USD maximum and explicit item-price scope. A change clears the old explanation immediately; a new check is still required. Escape cancels editing and restores focus. End rehearsal or leave the tab to clear notes and any open draft.</p><h4>Additional preference checks</h4><p>After confirming a color, choose Show multiple preference issues. Color should need clarification, Style should say To confirm, and Budget should remain Not specified. Then choose Simulate changed saved requirements twice: only the latest Style explanation should remain. Focus stays on the button; the explanations use a polite screen-reader announcement. End rehearsal clears everything. These are scripted requirements, not a saved customer profile.</p>
 <button onClick={()=>owner.current?.explain('multiple')} disabled={!active||status?.state!=='ready'||notes?.notes.color.status!=='confirmed'}>Show multiple preference issues</button>
 <button onClick={()=>owner.current?.revise()} disabled={!active||status?.state!=='ready'||!clarification}>Simulate changed saved requirements</button>
 <button onClick={()=>owner.current?.dispose()} disabled={!active}>End rehearsal</button>
 {notes&&<section className="notebook" aria-label="Connection rehearsal notes"><h3>Rehearsal Styling Notes</h3>{owner.current&&<NotebookConnectionEditor notes={notes} ready={active&&status?.state==='ready'} session={owner.current.session} rehearsal={{replace:owner.current.replaceWhileEditing,disconnect:owner.current.disconnect}}/>}<PreferenceClarificationPanel record={clarification}/>{active&&<NotebookTimingReview report={timing}/>}</section>}
 </details>;
}
