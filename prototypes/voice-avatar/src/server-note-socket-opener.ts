import WebSocket from 'ws';
import {boundedNoteStartupDiagnostic,providerErrorDiagnostic} from './note-startup-diagnostics.ts';
import type {NoteStartupDiagnostic} from './note-startup-diagnostics.ts';
import type {SimulatedTranscriptionSocket} from './transcription-socket-wire.ts';
import {TRANSCRIPTION_CONNECTION_PLAN} from './transcription-connection-plan.ts';
export const NOTE_TRANSCRIPTION_SOCKET_URL=TRANSCRIPTION_CONNECTION_PLAN.url;
type Raw=Pick<WebSocket,'on'|'off'|'send'|'close'|'terminate'|'readyState'|'bufferedAmount'>;
type Connect=(url:string,options:WebSocket.ClientOptions)=>Raw;
/** Dormant single-use server opener. No environment access or normal startup
 * attachment. Calling open is network activation and requires the reviewed
 * allowance/consent owner. URL compatibility remains live-unverified. */
export function prepareServerNoteSocketOpener(options:{apiKey:string;connect?:Connect;diagnostic?:NoteStartupDiagnostic}){
 const diagnostic=boundedNoteStartupDiagnostic(options.diagnostic);
 const unavailable=()=>Error('Notebook transcription connection unavailable.');
 if(typeof options.apiKey!=='string'||! /^[A-Za-z0-9_-]{16,512}$/.test(options.apiKey))throw unavailable();
 let key:string|null=options.apiKey,used=false;let stopCurrent:(()=>void)|undefined;
 const connect=options.connect??((url,init)=>new WebSocket(url,init));
 const open=(signal:AbortSignal,initialEvent:(event:unknown)=>void)=>{
  if(used||key===null||signal.aborted)return Promise.reject(unavailable());used=true;
  return new Promise<{socket:SimulatedTranscriptionSocket;detachInitialEvents:()=>void}>((resolve,reject)=>{
   diagnostic('provider-connecting');
   let raw:Raw;try{raw=connect(NOTE_TRANSCRIPTION_SOCKET_URL,{headers:{Authorization:`Bearer ${key}`},followRedirects:false,maxPayload:16384,handshakeTimeout:5000,perMessageDeflate:false});}catch{diagnostic('provider-connect-failed');key=null;reject(unavailable());return;}
   key=null;let ended=false,cleanupFailed=false,opened=false,first=true,initial:typeof initialEvent|null=initialEvent;
   const events=new EventTarget();
   const stop=()=>{
    if(ended)return;ended=true;clearTimeout(timer);signal.removeEventListener('abort',stop);
    raw.off('open',onOpen);raw.off('message',onMessage);raw.off('close',onClose);raw.off('unexpected-response',onUnexpected);
    // Keep the sanitized error sink attached through asynchronous termination.
    try{raw.terminate();}catch{cleanupFailed=true;}
    initial=null;events.dispatchEvent(new Event('close'));reject(unavailable());
   };
   const socket=events as SimulatedTranscriptionSocket;
   socket.send=(data:string)=>{if(ended||raw.readyState!==1)throw unavailable();try{raw.send(data);}catch{throw unavailable();}};socket.close=()=>{stop();if(cleanupFailed)throw unavailable();};
   Object.defineProperties(socket,{readyState:{get:()=>ended?3:raw.readyState},bufferedAmount:{get:()=>ended?65537:raw.bufferedAmount}});
   const onOpen=()=>{if(ended)return;diagnostic('provider-open');opened=true;clearTimeout(timer);resolve({socket,detachInitialEvents:()=>{initial=null;}});};
   const onClose=()=>{if(!ended)diagnostic('provider-closed');stop();};
   const onError=()=>{if(!ended)diagnostic('provider-transport-error');stop();};
   const onUnexpected=(_request:unknown,response:{statusCode?:number;destroy?:()=>void})=>{
    if(ended)return;const status=response?.statusCode;const code=[400,401,403,404,429,500].includes(status??0)?`provider-handshake-${status}`:'provider-handshake-other';diagnostic(code as import('./note-startup-diagnostics.ts').NoteStartupCode);try{response?.destroy?.();}catch{}stop();
   };
   const onMessage=(data:WebSocket.RawData,isBinary:boolean)=>{
    if(ended)return;
    try{
     if(!opened||isBinary)throw unavailable();
     const bytes=Buffer.isBuffer(data)?data:Buffer.from(data as ArrayBuffer);
     if(bytes.byteLength>16384)throw unavailable();
     const encoded=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
     const parsed:unknown=JSON.parse(encoded);const type=parsed&&typeof parsed==='object'?(parsed as {type?:unknown}).type:undefined;
     if(type==='error')diagnostic(providerErrorDiagnostic(parsed));
     if(first){first=false;if(!initial)throw unavailable();diagnostic(type==='session.created'?'provider-first-created':'provider-first-unexpected');initial(parsed);}
     else events.dispatchEvent(new MessageEvent('message',{data:encoded}));
    }catch{diagnostic('provider-invalid-packet');stop();}
   };
   const timer=setTimeout(()=>{diagnostic('provider-opening-timeout');stop();},5000);stopCurrent=stop;
   raw.on('open',onOpen);raw.on('message',onMessage);raw.on('close',onClose);raw.on('error',onError);raw.on('unexpected-response',onUnexpected);
   signal.addEventListener('abort',stop,{once:true});if(signal.aborted)stop();
  });
 };
 return Object.freeze({open,end:()=>{key=null;used=true;stopCurrent?.();}});
}
