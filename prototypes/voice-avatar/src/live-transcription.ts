import {Buffer} from 'node:buffer';

export const LIVE_TRANSCRIPTION_ENABLED=false;
export const TRANSCRIPTION_MODEL='gpt-live-transcribe';
export type PartialTranscript={version:1;eventId:string;turnId:string;sequence:number;role:'user';text:string;final:boolean};
export type TranscriptionWire={bufferedAmount:number;send:(event:object)=>boolean;close:()=>void};
type Turn={id:string;item:string|null;text:string;sequence:number;final:boolean};
const id=(v:unknown):v is string=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(v);
const object=(v:unknown):v is Record<string,any>=>Boolean(v)&&typeof v==='object'&&!Array.isArray(v);
/** Server-only protocol preparation. No socket, key loading, route or live enable
 * switch is provided. A caller must inject a simulated wire explicitly. A later
 * live owner must enforce authentication, allowance and verified socket cleanup.
 */
export class PreparedLiveTranscription {
 private wire:TranscriptionWire;
 private emit:(event:PartialTranscript)=>void;
 private stopped:(reason:string)=>void;
 private timer:ReturnType<typeof setTimeout>;
 private ready=false;
 private ended=false;
 private cleanupRequested=false;
 private cleanupFailed=false;
 private current:Turn|null=null;
 private pending:Turn|null=null;
 private turns=new Map<string,Turn>();
 private seen=new Set<string>();
 private used=new Set<string>();
 private audioSequence=0;
 private bytes=0;
 private turnBytes=0;
 private abort:()=>void;
 private signal:AbortSignal;
 constructor(options:{simulation?:boolean;wire:TranscriptionWire;signal:AbortSignal;emit:(event:PartialTranscript)=>void;stopped:(reason:string)=>void}){
   if(options.simulation!==true)throw Error('Live transcription is disabled.');
   this.wire=options.wire;this.emit=options.emit;this.stopped=options.stopped;this.signal=options.signal;
   this.abort=()=>this.stop('canceled');
   this.timer=setTimeout(()=>this.stop('configuration-timeout'),5000);
   if(this.signal.aborted){this.stop('canceled');return;}
   this.signal.addEventListener('abort',this.abort,{once:true});
   this.send({type:'session.update',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:TRANSCRIPTION_MODEL,languages:['en'],delay:'low'},turn_detection:null}}}});
 }
 private send(event:object):boolean {
   if(this.ended)return false;
   try{if(this.wire.bufferedAmount>65536||this.wire.send(event)!==true){this.stop('transport-held');return false;}return true;}
   catch{this.stop('transport-held');return false;}
 }
 private stop(reason:string){
   if(this.ended)return;this.ended=true;this.ready=false;clearTimeout(this.timer);this.signal.removeEventListener('abort',this.abort);
   this.current=null;this.pending=null;this.turns.clear();this.seen.clear();this.used.clear();
   this.cleanupRequested=true;
   try{this.wire.close();}catch{this.cleanupFailed=true;}
   try{this.stopped(this.cleanupFailed?'cleanup-unverified':reason);}catch{/* The owner is already stopped. */}
 }
 beginTurn(turnId:string):boolean {
   if(!this.ready||this.ended||this.current||this.pending)return false;
   if(!id(turnId)||this.used.has(turnId)||this.used.size>=16){this.stop('turn-bound');return false;}
   this.used.add(turnId);this.current={id:turnId,item:null,text:'',sequence:0,final:false};this.turnBytes=0;return true;
 }
 /** 20 ms mono PCM16 frames from the existing 24 kHz streaming microphone. */
 append(pcm:ArrayBuffer,sequence:number):boolean {
   if(!this.ready||!this.current||this.pending||this.ended)return false;
   if(!(pcm instanceof ArrayBuffer)||pcm.byteLength!==960||sequence!==this.audioSequence||!Number.isSafeInteger(sequence)||this.bytes+pcm.byteLength>4_080_000){this.stop('audio-bound');return false;}
   this.audioSequence++;this.bytes+=pcm.byteLength;this.turnBytes+=pcm.byteLength;
   return this.send({type:'input_audio_buffer.append',audio:Buffer.from(pcm).toString('base64')});
 }
 commit():boolean {
   if(!this.ready||!this.current||this.pending||this.ended)return false;
   if(this.turnBytes<4800){this.stop('empty-or-short-turn');return false;}
   this.pending=this.current;
   return this.send({type:'input_audio_buffer.commit'});
 }
 receive(value:unknown):boolean {
   if(this.ended)return false;
   if(!object(value)||typeof value.type!=='string'){this.stop('invalid-event');return false;}
   if(value.type==='error'||value.type==='conversation.item.input_audio_transcription.failed'){this.stop('provider-failed');return false;}
   if(value.type==='session.created')return true;
   if(value.type==='session.updated'){
     const input=value.session?.audio?.input;
     if(this.ready||value.session?.type!=='transcription'||input?.format?.type!=='audio/pcm'||input.format.rate!==24000||input?.transcription?.model!==TRANSCRIPTION_MODEL||input?.turn_detection!==null){this.stop('configuration-mismatch');return false;}
     this.ready=true;clearTimeout(this.timer);this.timer=setTimeout(()=>this.stop('time-limit'),85000);return true;
   }
   if(!['input_audio_buffer.committed','conversation.item.input_audio_transcription.delta','conversation.item.input_audio_transcription.completed'].includes(value.type))return true;
   if(!this.ready||!id(value.event_id)||!id(value.item_id)){this.stop('invalid-event');return false;}
   if(this.seen.has(value.event_id))return false;
   if(this.seen.size>=256){this.stop('event-bound');return false;}this.seen.add(value.event_id);
   if(value.type==='input_audio_buffer.committed'){
     const turn=this.pending;if(!turn||turn.item&&turn.item!==value.item_id||this.turns.has(value.item_id)&&this.turns.get(value.item_id)!==turn){this.stop('item-mismatch');return false;}
     turn.item=value.item_id;this.turns.set(value.item_id,turn);this.pending=null;this.current=null;return true;
   }
   if(value.content_index!==0){this.stop('invalid-content');return false;}
   let turn=this.turns.get(value.item_id);
   if(!turn){turn=this.current??undefined;if(!turn||turn.item&&turn.item!==value.item_id){this.stop('item-mismatch');return false;}turn.item=value.item_id;this.turns.set(value.item_id,turn);}
   if(turn.final)return false;
   const final=value.type.endsWith('.completed'),piece=final?value.transcript:value.delta;
   if(typeof piece!=='string'||piece.length>4000){this.stop('transcript-bound');return false;}
   const text=final?piece:turn.text+piece;
   if(text.length>4000){this.stop('transcript-bound');return false;}
   turn.text=text;turn.final=final;
   // An older turn may complete after a newer turn begins. Do not resurrect it.
   if([...this.used].at(-1)!==turn.id||!text.trim())return false;
   const event:PartialTranscript={version:1,eventId:value.event_id,turnId:turn.id,sequence:++turn.sequence,role:'user',text,final};
   try{this.emit(event);}catch{this.stop('consumer-held');return false;}
   return true;
 }
 disconnected(){this.stop('disconnected');}
 end(){this.stop('ended');}
 snapshot(){return{ready:this.ready,ended:this.ended,audioBytes:this.bytes,turnCount:this.used.size,cleanupRequested:this.cleanupRequested,cleanupFailed:this.cleanupFailed,remoteCleanupVerified:false as const,liveEnabled:false as const};}
}
