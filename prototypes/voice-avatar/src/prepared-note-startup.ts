import {createPreparedNoteProviderSession} from './prepared-note-provider-session.ts';
import type {SimulatedTranscriptionSocket} from './transcription-socket-wire.ts';
type Session=ReturnType<typeof createPreparedNoteProviderSession>;
type SessionOptions=Parameters<typeof createPreparedNoteProviderSession>[0];
type Opened={socket:SimulatedTranscriptionSocket;detachInitialEvents:()=>void};
/** Disabled startup orchestration. The injected opener observes initial events
 * from its first packet, including events received before its promise resolves.
 * No URL, credentials, route or actual connection constructor is supplied. */
export function prepareNoteStartup(options:{
 simulation?:boolean;signal:AbortSignal;
 open:(signal:AbortSignal,initialEvent:(value:unknown)=>void)=>Promise<Opened>;
 session:Omit<SessionOptions,'simulation'|'socket'|'signal'|'ready'|'stopped'>;
 ready?:()=>void;stopped?:()=>void;
}){
 if(options.simulation!==true)throw Error('Live notebook startup is disabled.');
 const controller=new AbortController();
 let settleOpening!:()=>void;
 const openingSettled=new Promise<void>(resolve=>{settleOpening=resolve;});
 let state:'opening'|'awaiting-created'|'configuring'|'ready'|'ended'='opening';
 let created=false,opened:Opened|undefined,session:Session|undefined,cleanupFailed=false,reason:string|null=null;
 let detached=false,closed=false,handingOver=false;
 const detach=()=>{if(!opened||detached)return;detached=true;try{opened.detachInitialEvents();}catch{cleanupFailed=true;}};
 const close=()=>{if(!opened||closed)return;closed=true;try{opened.socket.close();}catch{cleanupFailed=true;}};
 const stop=(why:string)=>{
  if(state==='ended')return;
  state='ended';reason=why;clearTimeout(timer);options.signal.removeEventListener('abort',abort);
  controller.abort();detach();if(session)session.end();else close();
  try{options.stopped?.();}catch{/* State and cancellation already settled. */}
 };
 const abort=()=>stop('canceled');
 const timer=setTimeout(()=>stop('startup-timeout'),5000);
 const handOver=()=>{
  if(!opened||!created||state==='ended'||handingOver)return;
  handingOver=true;state='configuring';
  const raw=opened.socket;
  const socket:SimulatedTranscriptionSocket={
   get readyState(){return raw.readyState;},get bufferedAmount(){return raw.bufferedAmount;},
   send:data=>raw.send(data),close,
   addEventListener:raw.addEventListener.bind(raw),removeEventListener:raw.removeEventListener.bind(raw),dispatchEvent:raw.dispatchEvent.bind(raw),
  };
  try{
   session=createPreparedNoteProviderSession({...options.session,simulation:true,socket,signal:controller.signal,
    ready:()=>{if(state==='ended')return;detach();if(cleanupFailed){stop('cleanup-unverified');return;}state='ready';clearTimeout(timer);try{options.ready?.();}catch{stop('consumer-held');}},
    stopped:()=>stop('provider-stopped'),
   });
   if(controller.signal.aborted)session.end();
  }catch{stop('provider-startup-held');}
 };
 const initialEvent=(value:unknown)=>{
  if(state==='ended')return;
  if(handingOver){if(value&&typeof value==='object'&&(value as {type?:unknown}).type==='session.created')stop('startup-event-held');return;}
  // Only one bounded creation envelope belongs to this opening. Other events
  // cannot bypass startup or supply transcript content before configuration.
  try{
   const encoded=JSON.stringify(value);
   if(!encoded||new TextEncoder().encode(encoded).byteLength>16384||!value||typeof value!=='object'||Array.isArray(value))throw Error();
   const event=value as Record<string,unknown>;
   if(created||event.type!=='session.created'||!event.session||typeof event.session!=='object'||Array.isArray(event.session))throw Error();
   const sessionId=(event.session as Record<string,unknown>).id;
   if(typeof sessionId!=='string'||! /^[a-zA-Z0-9_-]{1,80}$/.test(sessionId))throw Error();
   created=true;handOver();
  }catch{stop('startup-event-held');}
 };
 options.signal.addEventListener('abort',abort,{once:true});
 if(options.signal.aborted){stop('canceled');settleOpening();}
 else{
  try{
   void options.open(controller.signal,initialEvent).then(result=>{
    opened=result;
    if(state==='ended'){detach();close();return;}
    if(result.socket.readyState!==1){stop('opening-held');return;}
    state='awaiting-created';handOver();
   },()=>stop('opening-held')).catch(()=>stop('opening-held')).finally(settleOpening);
  }catch{stop('opening-held');settleOpening();}
 }
 return{
  end:()=>stop('ended'),
  openingSettled,
  active:():Session|null=>state==='ready'&&session&&!session.status().ended?session:null,
  status:()=>Object.freeze({state,reason,created,cleanupFailed:cleanupFailed||Boolean(session?.status().cleanupFailed),remoteCleanupVerified:false as const,liveEnabled:false as const}),
 };
}
