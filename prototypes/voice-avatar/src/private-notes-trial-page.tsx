import React,{useEffect,useRef,useState} from 'react';
import {preparePrivateNotesTrialBrowser} from './private-notes-trial-browser.ts';
import {StreamingMicrophone} from './streaming-microphone.ts';
import {NotebookConnectionEditor} from './notebook-connection-editor.tsx';
import type {NoteUpdate} from './note-update-wire.ts';
import type {PreparedBrowserNoteSession} from './note-browser-session.ts';
/** Availability is metadata only; server admission remains authoritative. */
export function PrivateNotesTrialPage(){
 const owner=useRef<ReturnType<typeof preparePrivateNotesTrialBrowser>|null>(null),used=useRef(false);
 const [available,setAvailable]=useState(false),[ack,setAck]=useState(false),[started,setStarted]=useState(false),[turns,setTurns]=useState(0),[closed,setClosed]=useState(false);
 const [notes,setNotes]=useState<NoteUpdate|null>(null),[status,setStatus]=useState<ReturnType<PreparedBrowserNoteSession['status']>|null>(null),[notice,setNotice]=useState('Checking whether the separately approved private trial is available.');
 useEffect(()=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);let mounted=true;
  void fetch('/api/private-notes-trial-availability',{credentials:'same-origin',cache:'no-store',redirect:'error',signal:controller.signal}).then(async response=>{
   if(response.status!==200||response.redirected||!response.body||!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type')??''))throw Error();
   const reader=response.body.getReader();const decoder=new TextDecoder('utf-8',{fatal:true});let text='',bytes=0;try{while(true){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>1024||controller.signal.aborted)throw Error();text+=decoder.decode(chunk.value,{stream:true});}text+=decoder.decode();}finally{void reader.cancel().catch(()=>{});reader.releaseLock();}
   const value=JSON.parse(text);
   if(!value||Object.keys(value).length!==3||value.version!==1||typeof value.enabled!=='boolean'||value.noticeVersion!=='notes-private-trial-v1')throw Error();
   if(mounted&&!controller.signal.aborted){setAvailable(value.enabled);setNotice(value.enabled?'One approved private trial is available. Read all steps before starting.':'Live testing is unavailable. No test or microphone has started.');}
  }).catch(()=>{if(mounted){setAvailable(false);setNotice('Live testing is unavailable. No test or microphone has started.');}}).finally(()=>clearTimeout(timer));
  return()=>{mounted=false;controller.abort();clearTimeout(timer);owner.current?.dispose();};
 },[]);
 useEffect(()=>{if(!notes)return;const frame=requestAnimationFrame(()=>owner.current?.session.rendered(notes.sequence));return()=>cancelAnimationFrame(frame);},[notes,status]);
 useEffect(()=>{if(!started)return;const timer=setInterval(()=>{const current=owner.current;if(!current){clearInterval(timer);return;}if(current.snapshot().transportClosed){setClosed(true);clearInterval(timer);}},100);const bound=setTimeout(()=>clearInterval(timer),90000);return()=>{clearInterval(timer);clearTimeout(bound);};},[started]);
 function start(){if(!available||!ack||used.current)return;used.current=true;setStarted(true);setAvailable(false);
  try{owner.current=preparePrivateNotesTrialBrowser({activationEnabled:true,consent:true,origin:window.location.origin,connect:url=>new WebSocket(url),capture:new StreamingMicrophone(),page:window,visibility:document,changed:setNotes,status:setStatus});}
  catch{setNotice('The private connection could not start. No replacement will be started.');}
 }
 async function turn(){if(turns>=2||owner.current?.session.status().state!=='ready')return;const next=turns+1;setTurns(next);await owner.current?.session.startTurn('private_turn_'+next);}
 const active=Boolean(status&&status.state!=='ended'&&status.state!=='cleanup-held');
 return <main className="notes-trial-page"><header><p className="eyebrow">AI Stylist · Private experiment</p><h1>My Styling Notes</h1><p>Microphone only · One connection · Two turns · No automatic retries</p></header>
 <section className="camera-panel"><h2>Read before using your microphone</h2><p>Your voice is sent to OpenAI for transcription, and transcript text is sent for note extraction. Provider retention terms apply. The app keeps these notes temporarily and clears them at End. Closing the connection does not prove provider deletion or final billing.</p><p>Use made-up styling details. Keep this page visible in a quiet room and close other voice calls. Do not refresh, close or switch tabs during the test. Leaving ends the test and keeps its reservation. No camera, avatar, photos or shopping links are used.</p><p>The limit is one start, two turns and at most 85 seconds including setup. If anything fails, report the visible message after the test. Do not start another attempt.</p></section>
 <section className="camera-panel"><h2>Complete test instructions</h2><ol>
 <li>Read every step, check the acknowledgment, then choose Start private notes test. Wait for Ready. Microphone access has not started yet.</li>
 <li>Choose Start turn and allow microphone access. Say: “I am going to an outdoor wedding in November. I prefer emerald green and a structured dress. My budget is five hundred dollars.” Continue: “I have not decided which shoes to wear.” Watch whether notes appear before you finish speaking.</li>
 <li>Choose Send turn. Wait for Ready and review the tentative notes. Missing or uncertain details must stay explicit; do not accept an inferred season, currency, cost scope or owned shoes.</li>
 <li>Choose Start turn again. Say: “Actually, my maximum is three hundred fifty US dollars for the new items only.” Choose Send turn and wait for Ready. Check that the budget stays at the corrected value.</li>
 <li>Choose Edit beside Budget. Enter 350, explicitly confirm item-price scope, then Save note. Check that the budget shows Confirmed. This does not save a profile.</li>
 <li>Choose End test. Check that notes clear, the browser connection closes and the phone microphone indicator turns off. If closure is not confirmed, close the tab and report that result. Do not retry.</li>
 <li>After the test, report whether notes appeared while you spoke, the budget correction stayed correct, touch confirmation worked, and End cleared notes and stopped the microphone.</li>
 </ol><label><input type="checkbox" checked={ack} disabled={started} onChange={e=>setAck(e.target.checked)}/>I understand the private experiment and consent to sending this test voice and text to OpenAI under the stated retention boundary.</label>
 <p role="status" aria-live="polite" aria-atomic="true">{status?.message??notice}</p>
 <button disabled={!available||!ack||started} onClick={start}>Start private notes test</button>
 <button disabled={!active||status?.state!=='ready'||turns>=2} onClick={()=>void turn()}>Start turn</button>
 <button disabled={!active||status?.state!=='capturing'} onClick={()=>owner.current?.session.commit()}>Send turn</button>
 <button disabled={!active} onClick={()=>owner.current?.dispose()}>End test</button>
 {started&&!active&&<p role="status">{closed?'Browser connection closed. Check that your microphone indicator is off.':'Connection closure is not confirmed. Close this tab if it does not finish. No replacement is allowed.'}</p>}
 </section>{notes&&owner.current&&<section className="notebook" aria-label="Temporary private styling notes"><h2>My Styling Notes</h2><NotebookConnectionEditor privateTrial notes={notes} ready={active&&status?.state==='ready'} session={owner.current.session}/></section>}
 <footer>Temporary notes · No profile saving · No remote deletion or billing-finalization claim</footer></main>;
}
