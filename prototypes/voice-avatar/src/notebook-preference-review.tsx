import React,{useEffect,useRef,useState} from 'react';
import {FIELDS,NotebookState} from './notebook-state.ts';
import {encodeNoteUpdate} from './note-update-wire.ts';
import {preparePreferenceClarification} from './preference-clarification.ts';
import type {PreferenceClarification,ClarificationReason} from './preference-clarification.ts';
import {SimulatedClarificationClient} from './preference-clarification-wire.ts';
const messages:Record<ClarificationReason,string>={
 'confirm-note':'Confirm this note before the stylist checks the look.',
 'saved-uncertain':'A saved requirement needs clarification.',
 'request-conflict':'This request needs clarification against a saved requirement.',
 'saved-conflict':'Saved requirements need clarification together.',
 'unsupported-rule':'This prototype cannot check this saved requirement.'
};
export function PreferenceClarificationPanel({record}:{record:PreferenceClarification|null}){
 if(!record)return null;
 return <section aria-label="Preference clarification" role="status" aria-live="polite" aria-atomic="true"><h4>Let’s clarify your preferences</h4><ul>{record.issues.map(issue=><li key={issue.field+issue.reason}><strong>{FIELDS.find(([field])=>field===issue.field)?.[1]}:</strong> {messages[issue.reason]}</li>)}</ul><p>The suggestion stays on hold. Your saved preferences have not changed.</p></section>;
}
/** Local scripted presentation review. No network, devices or provider calls. */
export function NotebookPreferenceReview(){
 const owner=useRef<{client:SimulatedClarificationClient;notebook:NotebookState}|null>(null);
 const [record,setRecord]=useState<PreferenceClarification|null>(null),[color,setColor]=useState<string|null>(null),[status,setStatus]=useState('The preference review has not started.');
 useEffect(()=>()=>{owner.current?.client.stop();},[]);
 function start(){
  owner.current?.client.stop();const notebook=new NotebookState(),client=new SimulatedClarificationClient({simulation:true});
  notebook.edit('color','Emerald green');const ticket=notebook.beginCheck();notebook.completeCheck(ticket,{outcome:'unknown',reason:'Clarification required.'});
  client.notes(encodeNoteUpdate('preference_fixture',1,notebook.snapshot(),null));
  const safe=preparePreferenceClarification({simulation:true,profileRevision:1,notebook:notebook.snapshot(),ticket,issues:[{field:'color',reason:'request-conflict'}]});
  client.accept({version:1,type:'clarification',sessionId:'preference_fixture',sequence:1,record:safe});owner.current={client,notebook};setRecord(client.snapshot());setColor('Emerald green');setStatus('A simulated color request needs clarification. No look has been approved.');
 }
 function edit(){const active=owner.current;if(!active)return;active.client.clear();active.notebook.edit('color','Blue');active.client.notes(encodeNoteUpdate('preference_fixture',2,active.notebook.snapshot(),null));setRecord(active.client.snapshot());setColor('Blue');setStatus('The note changed. The old explanation cleared; a fresh preference check is still required.');}
 function end(){owner.current?.client.stop();owner.current=null;setRecord(null);setColor(null);setStatus('The preference review ended. Temporary notes and explanations were cleared.');}
 return <details className="camera-panel"><summary>Review preference explanations</summary><p>This local review uses scripted notes and strictly checked simulated messages. It does not connect to a server, use your devices, save a profile or start paid services.</p>
 <ol><li>Choose Show simulated preference conflict. Color should show Emerald green and a clarification explanation.</li><li>Choose Simulate a note edit. Color should change to Blue and the old explanation should disappear. This does not approve a look.</li><li>Choose End preference review. The temporary note should disappear.</li></ol>
 <button onClick={start}>Show simulated preference conflict</button><button onClick={edit} disabled={color!=='Emerald green'}>Simulate a note edit</button><button onClick={end} disabled={color===null}>End preference review</button>
 <p role="status" aria-live="polite">{status}</p>{color&&<section className="notebook" aria-label="Preference review notes"><h3>My Styling Notes</h3><p><strong>Color:</strong> {color} <span>Confirmed · simulated note</span></p><PreferenceClarificationPanel record={record}/></section>}</details>;
}
