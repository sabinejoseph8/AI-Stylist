import {preparePreferenceClarification} from './preference-clarification.ts';
import type {PreferenceClarification} from './preference-clarification.ts';
import {NotebookState} from './notebook-state.ts';
import type {Field} from './notebook-state.ts';
import type {NoteSessionProbe} from './note-session-probe.ts';
import {createPreparedNoteProviderSession} from './prepared-note-provider-session.ts';
import {NOTE_EXTRACTION_MODEL} from './openai-note-extractor.ts';
import {PreparedRemoteNoteCapture} from './note-remote-capture.ts';
import {NoteConnectionScope} from './note-connection-scope.ts';
import {PreparedBrowserNoteSession} from './note-browser-session.ts';
import {bindSimulatedNoteLifecycle} from './note-browser-lifecycle.ts';
import {encodeNoteUpdate} from './note-update-wire.ts';
import type {NoteUpdate} from './note-update-wire.ts';
/** Entirely local fixture for reviewing prepared client/session contracts.
 * No WebSocket, microphone, fetch, provider, persistence or authentication claim. */
export function createNotebookRehearsal(options:{simulation?:boolean;page:EventTarget;visibility:EventTarget&{readonly hidden:boolean};changed:(notes:NoteUpdate|null)=>void;clarificationChanged?:(record:PreferenceClarification|null)=>void;status:(status:ReturnType<PreparedBrowserNoteSession['status']>)=>void}){
 if(options.simulation!==true)throw Error('Live notebook rehearsal is disabled.');
 const notebook=new NotebookState(),remote=new PreparedRemoteNoteCapture({simulation:true}),events=new EventTarget(),owner={};
 let probe!:NoteSessionProbe,id='',wireSequence=0,frame:((pcm:ArrayBuffer)=>boolean)|null=null,closed=false,turn=0;
 let pending=false,clarificationSequence=0,profileRevision=1;
 const timers=new Set<ReturnType<typeof setTimeout>>();
 const later=(fn:()=>void,ms=0)=>{const timer=setTimeout(()=>{timers.delete(timer);if(!closed)fn();},ms);timers.add(timer);};
 const emit=(value:unknown)=>{if(!closed)events.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(value)}));};
 const publish=(receipt:number|null)=>{if(id&&!closed)emit(encodeNoteUpdate(id,++wireSequence,notebook.snapshot(),receipt));};
 const provider=Object.assign(new EventTarget(),{readyState:1,bufferedAmount:0,send:(_text:string)=>{},close:()=>{}});
 const providerEvent=(value:unknown)=>provider.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(value)}));
 const scope=new NoteConnectionScope({simulation:true,create:()=>{
   const prepared=createPreparedNoteProviderSession({simulation:true,notebook,capture:remote,socket:provider,signal:new AbortController().signal,
     fetch:async(_url,init)=>{
       const input=JSON.parse(JSON.parse(init.body as string).input[0].content[0].text),value=String(input.currentFragment).match(/emerald green|blue/i)?.[0];
       return Response.json({model:NOTE_EXTRACTION_MODEL,status:'completed',output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:JSON.stringify({version:1,turnId:input.turnId,patches:value?[{field:'color',value,evidence:value}]:[]})}]}]});
     },changed:publish,invalidated:()=>publish(null),turnReady:turnId=>emit({version:1,type:'turn-ready',sessionId:id,turnId}),stopped:()=>stop()});
   probe=prepared.probe;return probe;
 }});
 const stop=()=>{if(closed)return;closed=true;timers.forEach(clearTimeout);timers.clear();frame=null;scope.close();events.dispatchEvent(new Event('close'));};
 const session=new PreparedBrowserNoteSession({simulation:true,capture:{start:async accept=>{frame=accept;return true;},stop:()=>{frame=null;}},changed:options.changed,clarificationChanged:options.clarificationChanged,
   socket:{bufferedAmount:0,close:stop,send:value=>{
     if(closed)throw Error('Rehearsal ended.');
     if(value instanceof ArrayBuffer){if(!scope.audio(owner,id,value))stop();return;}
     if(pending){stop();return;}pending=true;
     later(()=>{void scope.command(owner,JSON.parse(value)).then(accepted=>{pending=false;if(closed)return;if(!accepted){stop();return;}const command=JSON.parse(value);emit({version:1,type:'accepted',sessionId:id,sequence:command.sequence});}).catch(stop);});
   }}});
 const binding=bindSimulatedNoteLifecycle({simulation:true,session,socket:events,page:options.page,visibility:options.visibility,status:options.status});
 if(!closed){id=scope.open(owner)??'';if(!id){stop();}else{
   providerEvent({type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:'gpt-live-transcribe'},turn_detection:null}}}});
   emit({version:1,type:'ready',sessionId:id,simulation:true,liveEnabled:false});publish(null);
 }}
 async function play(){
   if(closed||turn>=2||!await session.startTurn(`rehearsal_${turn+1}`))return false;
   const current=++turn;
   // Give the owned begin command time to settle, then deliver 100ms of silence.
   const capture=()=>{if(closed)return;if(session.snapshot().connection.pending){later(capture,20);return;}
     for(let n=0;n<5;n++)if(!frame?.(new ArrayBuffer(960))){stop();return;}
     if(!session.commit()){stop();return;}
     later(()=>{
       providerEvent({type:'input_audio_buffer.committed',event_id:`commit_${current}`,item_id:`item_${current}`});
       const text=current===1?'I prefer Emerald green':'Actually, I prefer Blue';
       providerEvent({type:'conversation.item.input_audio_transcription.delta',event_id:`partial_${current}`,item_id:`item_${current}`,content_index:0,delta:text});
       later(()=>providerEvent({type:'conversation.item.input_audio_transcription.completed',event_id:`final_${current}`,item_id:`item_${current}`,content_index:0,transcript:text}),650);
     },100);
   };later(capture,200);return true;
 }
 function explain(mode:'single'|'multiple'='single'){
   if(closed||session.status().state!=='ready'||notebook.snapshot().notes.color.status!=='confirmed')return false;
   // Scripted held-check presentation only, not a real saved customer profile.
   if(mode==='multiple'){
     const current=notebook.snapshot();
     notebook.capture({session:current.session,field:'style',baseRevision:current.notes.style.revision,sequence:current.notes.style.sequence+1,value:'Structured',confirmed:false});
     publish(null);
   }
   emit({version:1,type:'clarification',sessionId:id,sequence:++clarificationSequence,record:null});
   const ticket=notebook.beginCheck();notebook.completeCheck(ticket,{outcome:'unknown',reason:'Scripted preference conflict.'});
   const record=preparePreferenceClarification({simulation:true,profileRevision,notebook:notebook.snapshot(),ticket,issues:mode==='multiple'?[{field:'color',reason:'request-conflict'},{field:'style',reason:'confirm-note'},{field:'budget',reason:'saved-uncertain'}]:[{field:'color',reason:'request-conflict'}]});
   emit({version:1,type:'clarification',sessionId:id,sequence:++clarificationSequence,record});return !closed;
 }
 function revise(){
   if(closed||session.status().state!=='ready'||!session.snapshot().connection.clarification)return false;
   emit({version:1,type:'clarification',sessionId:id,sequence:++clarificationSequence,record:null});
   profileRevision++;notebook.preferencesChanged();publish(null);
   const ticket=notebook.beginCheck();notebook.completeCheck(ticket,{outcome:'unknown',reason:'Scripted updated requirement.'});
   const record=preparePreferenceClarification({simulation:true,profileRevision,notebook:notebook.snapshot(),ticket,issues:[{field:'style',reason:'saved-uncertain'}]});
   emit({version:1,type:'clarification',sessionId:id,sequence:++clarificationSequence,record});return !closed;
 }
 // Deliberate local review controls. These never become wire commands.
 function replaceWhileEditing(field:Field){
   if(closed||session.status().state!=='ready')return false;
   const values:Record<Field,string>={occasion:'Indoor wedding',season:'December',color:'Blue',style:'Relaxed',budget:'USD 250 maximum (items only)',lookType:'Pantsuit',wardrobe:'My black blazer'};
   if(!Object.hasOwn(values,field))return false;
   const current=notebook.snapshot(),note=current.notes[field];
   const accepted=notebook.capture({session:current.session,field,baseRevision:note.revision,sequence:note.sequence+1,value:values[field],confirmed:false});
   if(accepted)publish(null);return accepted&&!closed;
 }
 function disconnect(){if(closed)return;session.disconnected();stop();}
 return{session,play,explain,revise,replaceWhileEditing,disconnect,turns:()=>turn,dispose:()=>{binding.dispose();stop();},snapshot:()=>({closed,turns:turn,server:probe?.snapshot()??null,notes:notebook.snapshot()})};
}
