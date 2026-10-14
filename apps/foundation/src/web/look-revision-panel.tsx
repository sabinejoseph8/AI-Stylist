import React,{useEffect,useState} from 'react';
import type {LocalLookFeedback,RestoreOutcome} from '../feedback/local-look-feedback.ts';
import {SampleLookCard} from './saved-looks-panel.tsx';
const money=(value:number|null)=>value===null?'Incomplete':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value/100);
export function LookRevisionPanel({model}:{model:LocalLookFeedback}){
 const [snapshot,setSnapshot]=useState(()=>model.snapshot());
 const [selected,setSelected]=useState(''),[outcome,setOutcome]=useState<RestoreOutcome>('pass');
 useEffect(()=>model.subscribe(()=>setSnapshot(model.snapshot())),[model]);
 useEffect(()=>{const poll=setInterval(()=>setSnapshot(model.snapshot()),250);return()=>clearInterval(poll);},[model]);
 useEffect(()=>{if(!snapshot.history.some(h=>String(h.id)===selected))setSelected('');},[snapshot.history,selected]);
 const comparison=selected?model.compare(Number(selected)):null;
 return <section className="revision-review" aria-label="Sample comparison and undo">
  <h3>Compare and revisit samples</h3>
  <p>Earlier samples are held for comparison only. Restoring runs fresh local checks against current protected pieces and the simulated outcome. It never releases a real recommendation.</p>
  <button disabled={!snapshot.undoAvailable} onClick={()=>model.undoFeedback()}>Undo latest sample feedback</button>
  <p>Undo changes the latest feedback action only. It does not restore earlier pieces or change saved preferences.</p>
  <label>Earlier sample revision<select value={selected} onChange={event=>{model.cancelRestore();setSelected(event.target.value);}}><option value="">Choose a sample revision</option>{snapshot.history.map(h=><option key={h.id} value={h.id}>{h.label}{snapshot.currentHistoryId===h.id?' (shown now)':''}</option>)}</select></label>
  {comparison&&<div aria-label="Sample revision comparison">
   <p>Current illustrative subtotal: <strong>{money(comparison.currentSubtotalCents)}</strong>. Earlier illustrative subtotal: <strong>{money(comparison.earlierSubtotalCents)}</strong>. Shipping and tax are unknown.</p>
   <p>Stayed: {comparison.stayed.join(', ')||'No unchanged pieces'}.</p>
   <p>Current replacements: {comparison.changed.join(', ')||'None'}.</p>
   <p>Earlier pieces: {comparison.removed.join(', ')||'None'}.</p>
   <details><summary>View earlier sample, not a recommendation</summary><SampleLookCard look={comparison.earlier.look}/></details>
  </div>}
  <label>Simulated restore outcome<select value={outcome} onChange={event=>{model.cancelRestore();setOutcome(event.target.value as RestoreOutcome);}}><option value="pass">Sample pass</option><option value="unknown">Uncertain</option><option value="blocked">Conflict</option><option value="no-match">No match</option><option value="timeout">Timeout</option></select></label>
  <button disabled={!comparison||snapshot.pending||snapshot.restoreAttempts>=3} onClick={()=>{const ticket=model.beginRestore(Number(selected));if(ticket)void Promise.resolve().then(()=>model.completeRestore(ticket,outcome));}}>Check and restore sample</button>
  <p>Restore checks used: {snapshot.restoreAttempts} of 3. No automatic retries.</p>
  <p role="status">{snapshot.restoreStatus==='pass'?'Sample restored only. Real recommendation and audio remain unavailable.':snapshot.restoreStatus==='checking'?'Checking earlier sample.':snapshot.restoreStatus==='needs-check'?'Current sample needs fresh checks.':snapshot.restoreStatus==='idle'?'No restore check started.':`Restore held: ${snapshot.restoreStatus}. Current pieces and feedback remain.`}</p>
 </section>;
}
