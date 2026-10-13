import {NotebookState} from './notebook-state.ts';
import {createPrivateNotesTrialExecution} from './note-execution.ts';
import {createPreparedNoteProviderSession} from './prepared-note-provider-session.ts';
import {PreparedRemoteNoteCapture} from './note-remote-capture.ts';
import {NoteConnectionScope} from './note-connection-scope.ts';
import {PreparedBrowserNoteSession} from './note-browser-session.ts';
import {bindNoteBrowserLifecycle} from './note-browser-lifecycle.ts';
import {encodeNoteUpdate} from './note-update-wire.ts';
import {NOTE_EXTRACTION_MODEL} from './openai-note-extractor.ts';
import {TRANSCRIPTION_MODEL} from './live-transcription.ts';
import type {PrivateNotesPageRehearsal} from './private-notes-trial-page.tsx';
/** Scripted local QA only. No global fetch, WebSocket, microphone, credentials,
 * durable allowance or human approval. Not imported by the production entry. */
export function createPrivateNotesPageRehearsal(options:{simulation?:boolean;page:EventTarget;visibility:EventTarget&{readonly hidden:boolean}}):PrivateNotesPageRehearsal{
 if(options.simulation!==true)throw Error('Page rehearsal is disabled.');
 return{simulation:true,availability:async signal=>{if(signal.aborted)throw Error('Rehearsal ended.');return Response.json({version:1,enabled:true,noticeVersion:'notes-private-trial-v1'});},open:(changed,status)=>{
  const capability=createPrivateNotesTrialExecution({financialApproved:true,securityApproved:true,ledger:{version:1,purpose:'notes-only-private-trial',approval:{id:'synthetic_page_not_approval',cents:200,maxSeconds:85,maxTurns:2,maxExtractions:64,maxInputTokens:1000000,maxOutputTokens:2048},reservation:{id:'synthetic_page_run',state:'reserved'}}});
  const execution={privateTrial:capability},notebook=new NotebookState(),remote=new PreparedRemoteNoteCapture(execution),events=new EventTarget(),connection={};
  let id='',sequence=0,turn=0,closed=false,disposed=false,pending=false;const timers=new Set<ReturnType<typeof setTimeout>>();
  const later=(action:()=>void,ms=0)=>{const timer=setTimeout(()=>{timers.delete(timer);if(!closed)action();},ms);timers.add(timer);};
  const emit=(value:unknown)=>{if(!closed)events.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(value)}));};
  const publish=(receipt:number|null)=>{if(!closed&&id)emit(encodeNoteUpdate(id,++sequence,notebook.snapshot(),receipt));};
  const provider=Object.assign(new EventTarget(),{readyState:1,bufferedAmount:0,send:(_value:string)=>{},close:()=>{}});
  const providerEvent=(value:unknown)=>provider.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(value)}));
  const text=()=>turn===1?'USD 500 maximum (items only)':'USD 350 maximum (items only)';
  const scope=new NoteConnectionScope({...execution,create:()=>createPreparedNoteProviderSession({...execution,notebook,capture:remote,socket:provider,signal:new AbortController().signal,
   countFetch:async()=>Response.json({object:'response.input_tokens',input_tokens:100}),fetch:async(_url,init)=>{const input=JSON.parse(JSON.parse(init.body as string).input[0].content[0].text);return Response.json({model:NOTE_EXTRACTION_MODEL,status:'completed',output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:JSON.stringify({version:1,turnId:input.turnId,patches:[{field:'budget',value:input.currentFragment,evidence:input.currentFragment}]})}]}]});},changed:publish,invalidated:()=>publish(null),turnReady:turnId=>emit({version:1,type:'turn-ready',sessionId:id,turnId}),stopped:()=>stop()}).probe});
  const stop=()=>{if(closed)return;closed=true;for(const timer of timers)clearTimeout(timer);timers.clear();scope.close();events.dispatchEvent(new Event('close'));};
  const session=new PreparedBrowserNoteSession({privateTrial:true,changed,socket:{bufferedAmount:0,close:stop,send:value=>{
   if(closed)throw Error('Rehearsal ended.');if(value instanceof ArrayBuffer){if(!scope.audio(connection,id,value))stop();return;}if(pending){stop();return;}pending=true;
   later(()=>{const command=JSON.parse(value);void scope.command(connection,command).then(accepted=>{pending=false;if(closed)return;if(!accepted){stop();return;}emit({version:1,type:'accepted',sessionId:id,sequence:command.sequence});if(command.type==='commit')later(()=>{providerEvent({type:'input_audio_buffer.committed',event_id:'commit_'+turn,item_id:'page_item_'+turn});providerEvent({type:'conversation.item.input_audio_transcription.completed',event_id:'final_'+turn,item_id:'page_item_'+turn,content_index:0,transcript:text()});},100);}).catch(stop);});
  }},capture:{start:async accept=>{
   const current=++turn;
   const feed=()=>{if(closed)return;if(session.snapshot().connection.pending){later(feed,20);return;}for(let n=0;n<5;n++)if(!accept(new ArrayBuffer(960))){stop();return;}providerEvent({type:'conversation.item.input_audio_transcription.delta',event_id:'delta_'+current,item_id:'page_item_'+current,content_index:0,delta:text()});};later(feed,150);return true;
  },stop:()=>{}}});
  const binding=bindNoteBrowserLifecycle({privateTrial:true,session,socket:events,page:options.page,visibility:options.visibility,status});
  id=scope.open(connection)??'';if(!id)stop();else{providerEvent({type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:TRANSCRIPTION_MODEL},turn_detection:null}}}});emit({version:1,type:'ready',sessionId:id,simulation:false,liveEnabled:true});publish(null);}
  return{session,dispose:()=>{disposed=true;binding.dispose();stop();},snapshot:()=>({disposed,consentSent:true,transportClosed:closed,session:session.snapshot()})};
 }};
}
