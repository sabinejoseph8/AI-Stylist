import type {LocalDraftOutfit} from '../outfits/local-draft-outfit.ts';
import {LocalDiagnostics} from '../diagnostics/local-diagnostics.ts';
import {LocalSessionLifecycle} from '../session/local-session-lifecycle.ts';
import type {LocalPrivacy} from '../privacy/local-privacy.ts';
import type {LocalWardrobe} from '../media/local-wardrobe.ts';
import {LocalReferenceStore} from '../media/local-reference.ts';
import {normalizeBrowserImage} from '../media/browser-image.ts';
import {LocalMediaPanel} from './local-media-panel.tsx';
import React,{useEffect,useRef,useState} from 'react';
import {FIELDS} from '../../../../packages/style-contracts/src/index.ts';
import type {Field} from '../../../../packages/style-contracts/src/index.ts';
import {createNotebookPreview,NotebookPreviewController,PREVIEW_OWNER} from '../session/notebook-preview.ts';
import type {EditDraft} from '../session/notebook-preview.ts';

export function NotebookPanel({visible=true,wardrobe,privacy,draft:draftOutfit,onActiveChange}:{visible?:boolean;wardrobe?:LocalWardrobe;privacy?:LocalPrivacy;draft?:LocalDraftOutfit;onActiveChange?:(active:boolean)=>void}={}){
 const [diagnostics]=useState(()=>new LocalDiagnostics());
 const [wardrobeSnapshot,setWardrobeSnapshot]=useState(()=>wardrobe?.snapshot());
 useEffect(()=>wardrobe?.subscribe(()=>setWardrobeSnapshot(wardrobe.snapshot())),[wardrobe]);
 const [media]=useState(()=>new LocalReferenceStore({normalize:normalizeBrowserImage,createURL:blob=>URL.createObjectURL(blob),revokeURL:url=>URL.revokeObjectURL(url)}));
 const [mediaSnapshot,setMediaSnapshot]=useState(()=>media.snapshot());
 useEffect(()=>{const unsubscribe=media.subscribe(()=>setMediaSnapshot(media.snapshot()));return()=>{unsubscribe();media.clear();};},[media]);
 const [controller,setController]=useState(()=>new NotebookPreviewController(createNotebookPreview()));
 const [snapshot,setSnapshot]=useState(()=>controller.session.snapshot(PREVIEW_OWNER)!);
 const [expanded,setExpanded]=useState(false),[draft,setDraft]=useState<EditDraft|null>(null),[value,setValue]=useState(''),[message,setMessage]=useState('Sample notebook ready. No account, microphone or AI service is connected.');
 const [caption,setCaption]=useState(''),[selected,setSelected]=useState<Field[]>([]),[saved,setSaved]=useState<Partial<Record<Field,string>>>({});
 const sampleSequence=useRef(0);
 const sampleTimer=useRef<ReturnType<typeof setTimeout>|null>(null),originButton=useRef<HTMLButtonElement|null>(null),editInput=useRef<HTMLInputElement|null>(null);
 const cancelSample=()=>{if(sampleTimer.current!==null)clearTimeout(sampleTimer.current);sampleTimer.current=null;};
 const savedRef=useRef(saved);savedRef.current=saved;
 useEffect(()=>{
  if(!privacy)return;
  const unbindSession=privacy.bind('session',{read:()=>{const state=controller.session.snapshot(PREVIEW_OWNER)!;const photos=media.exportPhotos();const reference=media.snapshot().reference;return{data:{notes:FIELDS.map(([field,label])=>({field,label,value:state.notes[field].value,status:state.notes[field].status})),reference:reference?{description:reference.description,ownership:reference.ownership,photoId:'session_photo_'+reference.photo.id}:null},photos:photos.map(photo=>({id:'session_photo_'+photo.id,blob:photo.blob}))};},clear:()=>{cancelSample();controller.clear();media.clear();wardrobe?.clearSelection();setDraft(null);setValue('');setCaption('');setSelected([]);originButton.current=null;setMessage('Current sample session notes and photos cleared from privacy controls.');}});
  const unbindPreferences=privacy.bind('preferences',{read:()=>({data:Object.fromEntries((['color','style','budget','lookType'] as const).filter(field=>savedRef.current[field]!==undefined).map(field=>[field,savedRef.current[field]])),photos:[]}),clear:()=>{setSaved({});setSelected([]);}});
  const unsubscribeSession=controller.session.subscribe(()=>privacy.invalidate()),unsubscribeMedia=media.subscribe(()=>privacy.invalidate());
  return()=>{unsubscribeSession();unsubscribeMedia();unbindSession();unbindPreferences();};
 },[privacy,controller,media,wardrobe]);
 useEffect(()=>{privacy?.invalidate();},[saved,privacy]);
 useEffect(()=>{
  const lifecycle=new LocalSessionLifecycle(controller.session,PREVIEW_OWNER,{
   invalidateExport:()=>privacy?.invalidate(),
   clearTemporary:()=>{draftOutfit?.clear();media.clear();wardrobe?.clearSelection();cancelSample();setDraft(null);setValue('');setCaption('');setSelected([]);},
  },diagnostics);
  const refresh=()=>{const next=lifecycle.poll();if(next){setSnapshot(next);onActiveChange?.(next.state==='active');}};
  const unsubscribe=controller.session.subscribe(refresh);refresh();
  const timer=setInterval(refresh,1000);
  const visibility=()=>{if(document.hidden)controller.session.disconnect(PREVIEW_OWNER);else controller.session.reconnect(PREVIEW_OWNER);refresh();};
  const exit=()=>controller.end();document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',exit);
  return()=>{cancelSample();clearInterval(timer);unsubscribe();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',exit);controller.end();};
 },[controller,wardrobe,media,privacy,diagnostics,draftOutfit,onActiveChange]);
 useEffect(()=>{if(draft)editInput.current?.focus();},[draft]);
 const closeEdit=()=>{setDraft(null);setValue('');queueMicrotask(()=>originButton.current?.focus());};
 const startEdit=(field:Field,button:HTMLButtonElement)=>{const next=controller.beginEdit(field);if(next){originButton.current=button;setDraft(next);setValue(next.value);}};
 const playSample=()=>{
  cancelSample();
  const turn=controller.proposals.begin('sample_turn_'+(++sampleSequence.current));if(!turn)return;
  const first=controller.proposals.accept(turn,0,[{field:'occasion',value:'Outdoor wedding'}]);
  if(first.applied.includes('occasion'))setCaption('Sample: I’m going to an outdoor wedding.');
  // Capture each field's baseline before input starts. An unrelated touch edit
  // does not cancel this date; newer edits to the date itself stay protected.
  sampleTimer.current=setTimeout(()=>{sampleTimer.current=null;const result=controller.proposals.accept(turn,1,[{field:'season',value:'November; season not specified'}],true);if(result.applied.includes('season')){setCaption('Sample: I’m going to an outdoor wedding in November.');setMessage('Sample month added. No season was inferred. Confirm the details you want to use.');}},1200);
  setMessage('A scripted sample is arriving in two parts. You can edit or clear while it runs.');
 };
 const summary=FIELDS.filter(([id])=>snapshot.notes[id].value).map(([id])=>snapshot.notes[id].value).join(' · ')||'7 details to discover';
 const pending=Object.values(snapshot.notes).filter(note=>note.status==='tentative').length;
 const active=snapshot.state==='active';
 return <section className="notebook" aria-label="Local styling notebook preview"><span className="badge">Sample conversation only</span>
 <p className="muted">Use made-up details. This preview clears on refresh or End. The approved notes limits are 30 minutes without customer input, with a one-minute warning, and 5 minutes disconnected. This preview runs locally; saved sample preferences are separate.</p>
 <details open={expanded} onToggle={event=>setExpanded(event.currentTarget.open)}><summary><strong>My Styling Notes</strong><span>{summary}</span><span>{pending?`${pending} to confirm`:'No pending confirmations'}</span>{mediaSnapshot.reference&&<img className="reference-thumbnail" src={mediaSnapshot.reference.photo.url} alt={mediaSnapshot.reference.description}/>}</summary>
 <dl>{FIELDS.map(([id,label])=><div key={id}><dt>{label}</dt><dd>{snapshot.notes[id].value||'Not specified'} {snapshot.notes[id].status!=='missing'&&<span className={'note-state '+snapshot.notes[id].status}>{snapshot.notes[id].status==='tentative'?'To confirm':'Confirmed'}</span>}{snapshot.notes[id].origin==='touch'&&<small>Customer edit</small>}</dd><button disabled={!active} onClick={event=>startEdit(id,event.currentTarget)}>Edit {label.toLowerCase()}</button>{snapshot.notes[id].status==='tentative'&&<button disabled={!active} onClick={()=>{const result=controller.confirm(id);setMessage(result==='applied'?(id==='budget'&&controller.session.snapshot(PREVIEW_OWNER)!.notes.budget.status==='tentative'?'Add USD, maximum or target, and items-only scope before confirming the budget.':'Detail confirmed.'):'This detail changed. Review it again.');}}>Confirm {label.toLowerCase()}</button>}</div>)}</dl>
 {wardrobeSnapshot&&wardrobeSnapshot.selected.length>0&&active&&<section aria-label="Selected sample wardrobe items"><h3>Selected from sample wardrobe</h3><p className="muted">Owned items selected explicitly. No outfit or AI request is generated.</p><div className="photo-strip">{wardrobeSnapshot.items.filter(item=>wardrobeSnapshot.selected.includes(item.id)).map(item=><div key={item.id}><img src={item.url} alt={item.description}/><p>{item.description}</p><button onClick={()=>wardrobe?.select(item.id,false)}>Deselect {item.description}</button></div>)}</div></section>}
 <LocalMediaPanel wardrobe={wardrobe} model={media} active={active} visible={visible&&expanded} onInput={()=>controller.session.customerInput(PREVIEW_OWNER)}/>
 </details>
 {draft&&<form className="note-editor" onSubmit={event=>{event.preventDefault();const result=controller.save(draft,value);if(result==='applied'){setMessage('Customer edit applied. Ambiguous budgets remain To confirm.');closeEdit();}else{setMessage(result==='stale'?'This detail changed while you were editing. Cancel and reopen it.':'Enter a detail of 1 to 160 characters.');}}}><label htmlFor="note-edit">Edit {FIELDS.find(([id])=>id===draft.field)![1]}</label><input id="note-edit" ref={editInput} value={value} maxLength={160} onChange={event=>{if(controller.session.customerInput(PREVIEW_OWNER))setValue(event.target.value);}}/>{draft.field==='budget'&&<p className="muted">For a confirmed sample budget, use “USD 350 maximum (items only)”. Amounts alone stay To confirm.</p>}<button type="submit" disabled={!active}>Save</button><button type="button" onClick={closeEdit}>Cancel</button></form>}
 <p className="sample-caption" aria-label="Sample conversation captions">{caption||'Scripted sample captions appear here. No speech is being recorded.'}</p>
 <div className="notebook-actions"><button disabled={!active} onClick={playSample}>Play sample conversation</button><button disabled={!active} onClick={()=>{const ticket=controller.session.ticket(PREVIEW_OWNER);if(ticket){const result=controller.propose(ticket,'budget','USD 350 maximum (items only)',true,'speech');if(result==='applied'){setCaption('Sample correction: Actually, make my budget 350 US dollars maximum, for item prices only.');setMessage('Scripted voice correction applied. No microphone was used.');}}}}>Preview spoken budget correction</button><button disabled={!active} onClick={()=>{cancelSample();controller.clear();media.clear();wardrobe?.clearSelection();setCaption('');setSelected([]);closeEdit();setMessage('Session notes cleared. Sample profile preferences are unchanged.');}}>Clear session notes</button><button disabled={!active} onClick={()=>{cancelSample();controller.end();media.clear();setCaption('');setSelected([]);closeEdit();setMessage('Sample session ended and temporary notes cleared.');}}>End sample session</button>{!active&&<button onClick={()=>{cancelSample();setController(new NotebookPreviewController(createNotebookPreview(Date.now,saved)));setExpanded(false);setCaption('');setMessage('New sample session. Only explicitly saved sample preferences return.');}}>Start new sample session</button>}</div>
 <fieldset disabled={!active}><legend>Sample profile preferences</legend><p className="muted">Separate from the notebook. Selected confirmed values stay in this preview’s memory only, until refresh or closing this page.</p>{(['color','style','budget','lookType'] as const).map(id=><label className="note-choice" key={id}><input type="checkbox" checked={selected.includes(id)} disabled={snapshot.notes[id].status!=='confirmed'} onChange={event=>setSelected(items=>event.target.checked?[...items,id]:items.filter(item=>item!==id))}/>{FIELDS.find(([field])=>field===id)![1]}</label>)}<button disabled={selected.length===0} onClick={()=>{const projection=controller.session.selectedPreferences(PREVIEW_OWNER,selected);if(projection){setSaved(previous=>({...previous,...projection}));setSelected([]);setMessage('Only selected confirmed preferences saved to sample memory. Nothing was sent to a server.');}else setMessage('A selected preference changed or needs confirmation. Review your selection.');}}>Save selected sample preferences</button></fieldset>
 <p role="status" aria-live="polite" className="account-status">{snapshot.reason==='expired'?'Sample session expired and its notes were cleared.':snapshot.warning?'This sample session will clear after one more idle minute.':message}</p>
 </section>;
}
