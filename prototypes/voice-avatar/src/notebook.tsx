import {NotebookPreferenceReview} from './notebook-preference-review.tsx';
import {NotebookDemoCatalog} from './notebook-demo-catalog.tsx';
import {NotebookConnectionReview} from './notebook-connection-review.tsx';
import {applyNotebookCommand} from './notebook-command.ts';
import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {FIELDS,NotebookState,checkFixture} from './notebook-state.ts';
import type {Field,Capture} from './notebook-state.ts';
import {NotebookCamera} from './notebook-camera.ts';
import {NotebookPresentation} from './notebook-presentation.ts';
import {PartialNoteCoordinator} from './partial-note-coordinator.ts';
import {LookRelease} from './look-release.ts';
import type {LookPermit} from './look-release.ts';
import './notebook.css';
import {REVIEW_SECTIONS} from './notebook-review-guide.ts';

function ReviewGuide(){return <div className="review-instructions"><p>Read all 18 steps before starting. This is a computer-only preview with simulated speech. No microphone or paid provider call is needed. The camera section is optional.</p>{REVIEW_SECTIONS.map(section=><section key={section.title}><h3>{section.title}</h3><ol start={section.start}>{section.steps.map((step,i)=><li key={i}>{step}</li>)}</ol></section>)}<p>When finished, report what worked, what was confusing, or any step that behaved differently. Real speech and image matching are not connected.</p></div>;}

type Photo={url:string;label:string;kind:'owned'|'inspiration'};
const state=new NotebookState();
const phrases:[Field,string,string,boolean][]=[
  ['occasion','Outdoor wedding','I’m going to an outdoor wedding…',true],
  ['season','November; season not specified','…in November…',false],
  ['style','Elegant','…something elegant…',true],
  ['color','Emerald green','…preferably emerald green…',true],
  ['budget','500; currency and meaning to confirm','…and my budget is five hundred dollars.',false],
];
const fixture={occasion:'Outdoor wedding',color:'Emerald green',style:'Elegant',lookType:'Dress',newItemCents:32000,currency:'USD' as const,excludedColors:[]};
function App(){
  const [presentation]=useState(()=>new NotebookPresentation());
  const [snap,setSnap]=useState(()=>presentation.present(state.snapshot(),null)!.snapshot),[open,setOpen]=useState(false),[notice,setNotice]=useState('Your notebook is ready.'),[caption,setCaption]=useState('A simulated conversation will appear here.'),[playing,setPlaying]=useState(false);
  const editVersion=useRef<{field:Field;session:number;revision:number}|null>(null);
  const [editError,setEditError]=useState('');
  const [editing,setEditing]=useState<Field|null>(null),[draft,setDraft]=useState(''),[budgetAmount,setBudgetAmount]=useState('350'),[budgetScope,setBudgetScope]=useState(false);
  const [photo,setPhoto]=useState<Photo|null>(null),[pendingPhoto,setPendingPhoto]=useState<Photo|null>(null),[photoError,setPhotoError]=useState(''),[enlarged,setEnlarged]=useState(false);
  const [cameraOn,setCameraOn]=useState(false),[cameraPending,setCameraPending]=useState(false),[cameraMessage,setCameraMessage]=useState('Camera is off. Photo upload is always available.');
  const [lookRelease]=useState(()=>new LookRelease(state));
  const [lookPermit,setLookPermit]=useState<LookPermit|null>(null);
  const [excludeGreen,setExcludeGreen]=useState(false),[checkMode,setCheckMode]=useState('normal');
  const timers=useRef<ReturnType<typeof setTimeout>[]>([]),sequence=useRef(0),uploadEpoch=useRef(0),urls=useRef(new Set<string>()),cameraTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const video=useRef<HTMLVideoElement|null>(null),dialog=useRef<HTMLDialogElement|null>(null),zoom=useRef<HTMLDialogElement|null>(null),editOrigin=useRef<HTMLButtonElement|null>(null);
  const camera=useRef(new NotebookCamera(constraints=>navigator.mediaDevices.getUserMedia(constraints)));
  const presentSnapshot=(receipt:number|null=null)=>{const result=presentation.present(state.snapshot(),receipt);if(!result){setNotice('Notebook update held. Clear the session before continuing.');return;}setSnap(result.snapshot);setRenderReceipt(result.sequence);};
  const update=(message?:string)=>{presentSnapshot();if(message)setNotice(message);};
  const turnNumber=useRef(0);
  const [renderReceipt,setRenderReceipt]=useState<number|null>(null);
  const [speech]=useState(()=>new PartialNoteCoordinator({notebook:state,syntheticFixture:true,nextSequence:()=>++sequence.current,
    extract:async input=>phrases.filter(([, ,text])=>input.text.includes(text)).map(([field,value,evidence,confirmed])=>({field,value,evidence,confirmed})),
    invalidated:()=>{presentSnapshot();setNotice('Speech changed. Obsolete notes cleared while the correction is checked.');},
    changed:receipt=>{presentSnapshot(receipt);setNotice('Styling notes updated. Confirm uncertain details.');}}));
  // A committed React update plus the next frame is a browser render acknowledgment,
  // not proof of physical display timing or representative live latency.
  useEffect(()=>{if(renderReceipt===null)return;const frame=requestAnimationFrame(()=>{const receipt=presentation.rendered(renderReceipt);if(receipt!==null)speech.acknowledgeRendered(receipt);});return()=>cancelAnimationFrame(frame);},[snap,renderReceipt,speech,presentation]);
  const later=(fn:()=>void,ms:number)=>{const id=setTimeout(fn,ms);timers.current.push(id);};
  const stopSimulation=()=>{speech.cancel();timers.current.forEach(clearTimeout);timers.current=[];setPlaying(false);};
  const revoke=(url:string)=>{URL.revokeObjectURL(url);urls.current.delete(url);};
  const stopCamera=(message='Camera is off. Your confirmed photo remains in the notebook.')=>{clearTimeout(cameraTimer.current);camera.current.stop();if(video.current)video.current.srcObject=null;setCameraOn(false);setCameraPending(false);setCameraMessage(message);};
  useEffect(()=>{
    const hide=()=>{if(document.hidden){lookRelease.end();setLookPermit(null);stopSimulation();stopCamera('Camera stopped when you left this page.');}};
    const exit=()=>{lookRelease.end();uploadEpoch.current++;stopSimulation();camera.current.stop();clearTimeout(cameraTimer.current);urls.current.forEach(url=>URL.revokeObjectURL(url));urls.current.clear();state.clear();speech.reset();setRenderReceipt(null);presentSnapshot();presentation.disconnect();setPhoto(null);setPendingPhoto(null);setEnlarged(false);};
    document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',exit);
    return()=>{exit();document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',exit);};
  },[]);
  useEffect(()=>{if(editing)dialog.current?.showModal();else if(dialog.current?.open)dialog.current.close();},[editing]);
  useEffect(()=>{if(enlarged)zoom.current?.showModal();else if(zoom.current?.open)zoom.current.close();},[enlarged]);
  function startStory(){
    stopSimulation();setPlaying(true);const turnId=`sample_${++turnNumber.current}`;let cumulative='';
    phrases.forEach(([, ,text],i)=>{
      cumulative+=`${cumulative?' ':''}${text}`;const partial=cumulative;
      later(()=>{setCaption(text);speech.accept({version:1,eventId:`${turnId}_${i}`,turnId,sequence:i,role:'user',text:partial,final:i===phrases.length-1});},(i+1)*1100);
    });
    later(()=>{setPlaying(false);setCaption('Simulated turn finished. Would you prefer a dress or a pantsuit?');},6600);
  }
  function correctBudget(){
    const before=state.snapshot();
    const obsolete:Capture={session:before.session,field:'budget',baseRevision:before.notes.budget.revision,sequence:++sequence.current,value:'USD 500 maximum (items only)',confirmed:true};
    state.capture({...obsolete,sequence:++sequence.current,value:'USD 350 maximum (items only)'});update('Budget corrected to a USD 350 maximum for items only.');setCaption('“Actually, make my budget $350, maximum, for the items only.”');
    later(()=>{const accepted=state.capture(obsolete);update(accepted?'Older result applied.':'An older $500 result arrived. Your $350 correction was kept.');},1400);
  }
  function loadEdit(field:Field){const current=state.snapshot();editVersion.current={field,session:current.session,revision:current.notes[field].revision};setDraft(current.notes[field].value);setBudgetAmount(current.notes.budget.value.match(/^(?:USD )?(\d+(?:\.\d{1,2})?)/)?.[1]??'');setBudgetScope(current.notes.budget.status==='confirmed');setEditError('');}
  function edit(field:Field,origin:HTMLButtonElement){editOrigin.current=origin;loadEdit(field);setEditing(field);}
  function closeEdit(){dialog.current?.close();setEditing(null);editVersion.current=null;setEditError('');editOrigin.current?.focus();}
  function confirmNote(field:Field){const accepted=applyNotebookCommand(state,{type:'confirm',session:snap.session,field,expectedRevision:snap.notes[field].revision});update(accepted?'Your note was confirmed.':'This note changed. Review its latest value before confirming.');}
  function saveEdit(){
    const version=editVersion.current;if(!editing||!version||version.field!==editing)return;
    let value=draft;
    if(editing==='budget'){if(!budgetScope||!/^\d+(?:\.\d{1,2})?$/.test(budgetAmount)||Number(budgetAmount)>100000)return;value=`USD ${budgetAmount} maximum (items only)`;}
    const accepted=applyNotebookCommand(state,{type:'edit',session:version.session,field:editing,expectedRevision:version.revision,value});
    if(!accepted){setEditError('This note changed while you were editing. Your draft has not replaced it. Load the latest note, then make your changes again.');update();return;}
    update('Your note was updated for this session.');closeEdit();
  }
  async function prepareFile(file:File){
    const epoch=++uploadEpoch.current;setPhotoError('');
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024){setPhotoError('Choose a JPEG, PNG or WebP photo smaller than 8 MB.');return;}
    const url=URL.createObjectURL(file);urls.current.add(url);
    const image=new Image();
    image.onload=()=>{if(epoch!==uploadEpoch.current){revoke(url);return;}if(image.naturalWidth*image.naturalHeight>24_000_000){revoke(url);setPhotoError('Choose a photo smaller than 24 megapixels.');return;}setPendingPhoto(previous=>{if(previous)revoke(previous.url);return {url,label:'My clothing item',kind:'owned'};});};
    image.onerror=()=>{revoke(url);if(epoch===uploadEpoch.current)setPhotoError('That photo could not be opened. Try another image.');};image.src=url;
  }
  function confirmPhoto(){if(!pendingPhoto?.label.trim())return;if(photo)revoke(photo.url);state.setReference({label:pendingPhoto.label,kind:pendingPhoto.kind});setPhoto({...pendingPhoto,label:pendingPhoto.label.trim()});setPendingPhoto(null);update('Your confirmed item is visible in the notebook. It has not been saved to a wardrobe.');}
  function removePhoto(){uploadEpoch.current++;if(photo)revoke(photo.url);setPhoto(null);state.setReference(null);update('Reference removed. Any previous look approval was cleared.');}
  async function startCamera(){
    if(cameraPending||cameraOn)return;setCameraPending(true);setCameraMessage('Waiting for camera permission. Microphone stays off.');
    // Bound the permission request as well as the active preview.
    cameraTimer.current=setTimeout(()=>stopCamera('Two-minute camera check finished.'),120000);
    try{const stream=await camera.current.start();if(!stream)return;if(document.hidden){stopCamera();return;}setCameraPending(false);setCameraOn(true);
      stream.getVideoTracks().forEach(track=>track.addEventListener('ended',()=>stopCamera('Camera disconnected. Upload a photo instead.'),{once:true}));
      if(video.current){video.current.srcObject=stream;await video.current.play();}setCameraMessage('Camera is on locally. Capture a still, then confirm the item.');
    }catch{stopCamera('Camera is unavailable or permission was denied. Upload a photo instead.');}
  }
  function captureStill(){const v=video.current;if(!v?.videoWidth||!v.videoHeight)return;const canvas=document.createElement('canvas');const scale=Math.min(1,1280/v.videoWidth);canvas.width=Math.round(v.videoWidth*scale);canvas.height=Math.round(v.videoHeight*scale);canvas.getContext('2d')?.drawImage(v,0,0,canvas.width,canvas.height);const epoch=uploadEpoch.current;
    canvas.toBlob(blob=>{if(blob&&epoch===uploadEpoch.current)void prepareFile(new File([blob],'camera-item.jpg',{type:'image/jpeg'}));},'image/jpeg',0.85);
  }
  function clear(){if(editing)closeEdit();stopSimulation();stopCamera();uploadEpoch.current++;urls.current.forEach(url=>URL.revokeObjectURL(url));urls.current.clear();setPhoto(null);setPendingPhoto(null);setPhotoError('');setEnlarged(false);state.clear();speech.reset();setRenderReceipt(null);setExcludeGreen(false);setCaption('A simulated conversation will appear here.');update('Session cleared. No notebook content was saved.');}
  function runCheck(){
    const ticket=lookRelease.begin({id:'emerald_sample',description:'A dress, neutral shoes and a small bag. Fixture item-price estimate: USD 320. Shipping, tax and real availability are not verified.'});
    setLookPermit(null);const snapshot=state.snapshot();update();const mode=checkMode;
    later(()=>{
      const result=mode==='timeout'?{outcome:'unknown' as const,reason:'The check timed out. No look was released.'}:mode==='malformed'?{outcome:'unknown' as const,reason:'The check returned an invalid result. No look was released.'}:checkFixture(snapshot,{...fixture,excludedColors:excludeGreen?['Emerald green']:[]});
      setLookPermit(lookRelease.complete(ticket,result));update();
    },1800);
  }
  const releasedLook=lookPermit?lookRelease.visual(lookPermit):null;
  const pendingCount=FIELDS.filter(([id])=>snap.notes[id].status==='tentative').length;
  const summary=FIELDS.filter(([id])=>snap.notes[id].value).map(([id])=>snap.notes[id].value).join(' · ')||'Your occasion, colors and ideas will appear here.';
  return <main className="consultation">
    <header className="masthead"><span>AI STYLIST / STUDIO NOTES</span><span>Local prototype</span></header>
    <section className="intro"><p className="eyebrow">A conversation, thoughtfully captured</p><h1>Your next look<br/><em>starts with you.</em></h1><p>Tell your stylist what you have in mind. Your notes stay close by, ready to refine.</p></section>
    <details className="full-test-guide"><summary>Read full test instructions</summary><ReviewGuide/></details>
    <aside className="prototype-notice">Notebook preview with simulated speech. No connected avatar, AI extraction, real products or account saving. Uploaded photos and camera frames stay in this page’s memory and are cleared on reload.</aside>
    <div className="workspace"><div className="conversation-column">
    <section className="stylist-stage" aria-label="Simulated stylist conversation"><div className="stage-monogram" aria-hidden="true">S</div><p className="eyebrow">Your personal stylist</p><h2>Let’s find your direction.</h2><p>No live avatar connected in this notebook preview.</p><div className="caption"><span>Simulated captions</span><p>{caption}</p></div>
      <button className="primary" onClick={startStory} disabled={playing}>Play sample description</button>{playing&&<button onClick={stopSimulation}>Pause sample</button>}
      <button onClick={correctBudget}>Simulate “Actually, make it $350”</button>
      <NotebookConnectionReview/><NotebookPreferenceReview/>
      <NotebookDemoCatalog/>
    </section>
    <section className="notebook" aria-labelledby="notebook-title"><div className="notebook-heading"><div><p className="eyebrow">Your session journal</p><h2 id="notebook-title">My Styling Notes</h2></div><button aria-expanded={open} aria-controls="notebook-content" onClick={()=>setOpen(!open)}>{open?'Close notebook':'Open notebook'}</button></div>
      <div className="summary"><p>{summary}</p><span>{pendingCount?`${pendingCount} to confirm`:'No pending confirmations'}</span>{photo&&<button className="thumbnail" onClick={()=>setEnlarged(true)}><img src={photo.url} alt={photo.label}/><span>{photo.label} · {photo.kind==='owned'?'Owned':'Inspiration'}</span></button>}</div>
      <div id="notebook-content" hidden={!open}>
      <div className="notes-list">{FIELDS.map(([id,label])=>{const note=snap.notes[id];return <div className="note-row" key={id}><div><h3>{label}</h3><p>{note.value||'Not specified'}</p><span className={`note-status ${note.status}`}>{note.status==='missing'?'○ Not specified':note.status==='tentative'?'? To confirm':'✓ Confirmed'}{note.source==='touch'?' · Edited by you':''}</span></div><div className="note-actions"><button onClick={e=>edit(id,e.currentTarget)} aria-label={`Edit ${label.toLowerCase()}`}>Edit</button>{note.status==='tentative'&&id!=='budget'&&<button onClick={()=>confirmNote(id)}>Confirm</button>}</div></div>;})}</div>
      <section className="item-reference"><p className="eyebrow">A piece to begin with</p><h3>Style around this item</h3>{photo?<><button className="photo-print" onClick={()=>setEnlarged(true)}><img src={photo.url} alt={photo.label}/><span>Enlarge {photo.label}</span></button><p>{photo.label} · {photo.kind==='owned'?'Owned item':'Inspiration only'}</p><button onClick={removePhoto}>Remove reference</button></>:<p>Add an actual clothing photo. Nothing is saved to your wardrobe automatically.</p>}
        <label className="upload-button">{photo?'Choose a replacement photo':'Choose a clothing photo'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.currentTarget.files?.[0];if(file)void prepareFile(file);e.currentTarget.value='';}}/></label><p className="hint">JPEG, PNG or WebP · up to 8 MB. The existing reference stays until you confirm a replacement.</p>{photoError&&<p role="alert">{photoError}</p>}
        {pendingPhoto&&<div className="photo-confirm"><h4>Confirm your item</h4><img src={pendingPhoto.url} alt="New clothing photo awaiting confirmation"/><label>Item description<input maxLength={100} value={pendingPhoto.label} onChange={e=>setPendingPhoto({...pendingPhoto,label:e.target.value})}/></label><label>This item is<select value={pendingPhoto.kind} onChange={e=>setPendingPhoto({...pendingPhoto,kind:e.target.value as Photo['kind']})}><option value="owned">Owned by me</option><option value="inspiration">Inspiration only</option></select></label><p>No image recognition is connected. Please describe the clothing yourself.</p><button className="primary" disabled={!pendingPhoto.label.trim()} onClick={confirmPhoto}>Use this item in my notebook</button><button onClick={()=>{revoke(pendingPhoto.url);setPendingPhoto(null);uploadEpoch.current++;}}>Cancel new photo</button></div>}
        <details className="camera-panel"><summary>Show an item with my camera</summary><p>Local preview only. No recording, upload or stylist viewing. Stops after two minutes or when you leave this page.</p><video ref={video} muted playsInline aria-label="Local clothing camera preview" hidden={!cameraOn}/><p role="status">{cameraMessage}</p><button onClick={()=>void startCamera()} disabled={cameraOn||cameraPending}>Start local camera</button><button onClick={captureStill} disabled={!cameraOn}>Capture a still</button><button onClick={()=>stopCamera()} disabled={!cameraOn&&!cameraPending}>Stop camera</button></details>
      </section>
      <section className="saved-fixture"><h3>Saved preference fixture</h3><label><input type="checkbox" checked={excludeGreen} onChange={e=>{setExcludeGreen(e.target.checked);state.preferencesChanged();update('Synthetic saved preference changed. The previous look check was invalidated.');}}/> Avoid emerald green</label><p>For testing conflicts only. This does not edit or save a real profile.</p></section>
      <button className="clear-button" onClick={clear}>Clear this session</button>
      </div>
    </section></div>
    <section className="look-area" aria-labelledby="look-title"><p className="eyebrow">One look at a time</p><h2 id="look-title">The next chapter.</h2><p>A look appears here only after its current preference check passes.</p><div className="check-controls"><label>Simulated check<select value={checkMode} onChange={e=>setCheckMode(e.target.value)}><option value="normal">Normal fixture check</option><option value="timeout">Timeout</option><option value="malformed">Invalid result</option></select></label><button className="primary" onClick={runCheck}>Check sample look</button></div>
      {snap.gate?.state==='checking'?<div className="held-look" role="status"><span aria-hidden="true">◎</span><h3>Checking your preferences</h3><p>The candidate stays hidden while we check.</p></div>:releasedLook?<article className="sample-look"><span className="eyebrow">Synthetic sample · no shopping links</span><div className="look-collage" aria-label="Illustrated sample of an emerald dress, neutral shoes and small bag"><svg viewBox="0 0 320 300" role="img" aria-label="Simplified garment illustration, not real product photography"><path d="M100 30 L130 18 L150 55 L170 18 L200 30 L184 110 L225 265 L75 265 L116 110Z" fill="#146356"/><path d="M130 18 Q150 45 170 18" fill="none" stroke="#0e4c42" strokeWidth="5"/><path d="M250 208 Q265 225 293 227 L301 246 L250 246Z" fill="#b28c66"/><path d="M245 100 H301 V140 H245Z" fill="#c5ae8e"/><path d="M258 100 V88 Q272 70 287 88 V100" fill="none" stroke="#8a6e4c" strokeWidth="4"/></svg></div><h3>Emerald, elegantly</h3><p>{releasedLook.description}</p><p>{snap.gate?.reason}</p></article>:<div className="held-look"><span aria-hidden="true">✧</span><h3>{snap.gate?'A little clarification first':'Room for your next look'}</h3><p>{snap.gate?.reason||'Confirm your notes, then check the sample. No candidate has been released.'}</p></div>}
      <details className="test-guide"><summary>How to review this prototype</summary><ReviewGuide/></details>
    </section></div><p className="session-status" role="status" aria-live="polite" aria-atomic="true">{notice}</p>
    <footer>Private session notes · No profile or wardrobe saving in this prototype</footer>
    <dialog ref={dialog} onCancel={e=>{e.preventDefault();closeEdit();}} aria-labelledby="edit-title"><h2 id="edit-title">Edit {FIELDS.find(([id])=>id===editing)?.[1]}</h2>{editing==='budget'?<><label>Maximum amount in USD<input autoFocus inputMode="decimal" value={budgetAmount} onChange={e=>setBudgetAmount(e.target.value)}/></label><label className="checkbox"><input type="checkbox" checked={budgetScope} onChange={e=>setBudgetScope(e.target.checked)}/> I mean a maximum for item prices only. Shipping and tax are separate.</label><p>Targets, ranges and other cost scopes remain To confirm in this prototype.</p></>:<label>Value<input autoFocus maxLength={160} value={draft} onChange={e=>setDraft(e.target.value)}/></label>}{editError&&<div role="alert"><p>{editError}</p><button onClick={()=>{if(editing)loadEdit(editing);}}>Load latest note</button></div>}<button className="primary" onClick={saveEdit} disabled={editing==='budget'&&(!budgetScope||!/^\d+(?:\.\d{1,2})?$/.test(budgetAmount)||Number(budgetAmount)>100000)}>Save note</button><button onClick={closeEdit}>Cancel</button></dialog>
    <dialog ref={zoom} onCancel={()=>setEnlarged(false)} aria-label="Clothing photo enlarged">{photo&&<><img className="enlarged-photo" src={photo.url} alt={photo.label}/><p>{photo.label}</p></>}<button onClick={()=>setEnlarged(false)}>Close photo</button></dialog>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
