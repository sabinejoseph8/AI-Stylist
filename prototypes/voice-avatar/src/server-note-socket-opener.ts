import WebSocket from 'ws';
import type {SimulatedTranscriptionSocket} from './transcription-socket-wire.ts';
export const NOTE_TRANSCRIPTION_SOCKET_URL='wss://api.openai.com/v1/realtime?model=gpt-live-transcribe';
type Raw=Pick<WebSocket,'on'|'off'|'send'|'close'|'terminate'|'readyState'|'bufferedAmount'>;
type Connect=(url:string,options:WebSocket.ClientOptions)=>Raw;
/** Dormant single-use server opener. No environment access or normal startup
 * attachment. Calling open is network activation and requires the reviewed
 * allowance/consent owner. URL compatibility remains live-unverified. */
export function prepareServerNoteSocketOpener(options:{apiKey:string;connect?:Connect}){
 const unavailable=()=>Error('Notebook transcription connection unavailable.');
 if(typeof options.apiKey!=='string'||! /^[A-Za-z0-9_-]{16,512}$/.test(options.apiKey))throw unavailable();
 let key:string|null=options.apiKey,used=false;let stopCurrent:(()=>void)|undefined;
 const connect=options.connect??((url,init)=>new WebSocket(url,init));
 const open=(signal:AbortSignal,initialEvent:(event:unknown)=>void)=>{
  if(used||key===null||signal.aborted)return Promise.reject(unavailable());used=true;
  return new Promise<{socket:SimulatedTranscriptionSocket;detachInitialEvents:()=>void}>((resolve,reject)=>{
   let raw:Raw;try{raw=connect(NOTE_TRANSCRIPTION_SOCKET_URL,{headers:{Authorization:`Bearer ${key}`},followRedirects:false,maxPayload:16384,handshakeTimeout:5000,perMessageDeflate:false});}catch{key=null;reject(unavailable());return;}
   key=null;let ended=false,cleanupFailed=false,opened=false,first=true,initial:typeof initialEvent|null=initialEvent;
   const events=new EventTarget();
   const stop=()=>{
    if(ended)return;ended=true;clearTimeout(timer);signal.removeEventListener('abort',stop);
    raw.off('open',onOpen);raw.off('message',onMessage);raw.off('close',onClose);
    // Keep the sanitized error sink attached through asynchronous termination.
    try{raw.terminate();}catch{cleanupFailed=true;}
    initial=null;events.dispatchEvent(new Event('close'));reject(unavailable());
   };
   const socket=events as SimulatedTranscriptionSocket;
   socket.send=(data:string)=>{if(ended||raw.readyState!==1)throw unavailable();try{raw.send(data);}catch{throw unavailable();}};socket.close=()=>{stop();if(cleanupFailed)throw unavailable();};
   Object.defineProperties(socket,{readyState:{get:()=>ended?3:raw.readyState},bufferedAmount:{get:()=>ended?65537:raw.bufferedAmount}});
   const onOpen=()=>{if(ended)return;opened=true;clearTimeout(timer);resolve({socket,detachInitialEvents:()=>{initial=null;}});};
   const onClose=()=>stop();
   const onMessage=(data:WebSocket.RawData,isBinary:boolean)=>{
    if(ended)return;
    try{
     if(!opened||isBinary)throw unavailable();
     const bytes=Buffer.isBuffer(data)?data:Buffer.from(data as ArrayBuffer);
     if(bytes.byteLength>16384)throw unavailable();
     const encoded=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
     if(first){first=false;if(!initial)throw unavailable();initial(JSON.parse(encoded));}
     else events.dispatchEvent(new MessageEvent('message',{data:encoded}));
    }catch{stop();}
   };
   const timer=setTimeout(stop,5000);stopCurrent=stop;
   raw.on('open',onOpen);raw.on('message',onMessage);raw.on('close',onClose);raw.on('error',stop);
   signal.addEventListener('abort',stop,{once:true});if(signal.aborted)stop();
  });
 };
 return Object.freeze({open,end:()=>{key=null;used=true;stopCurrent?.();}});
}
