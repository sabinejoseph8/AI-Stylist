import type {TranscriptionWire} from './live-transcription.ts';
/** An injected, simulated socket only. This module never constructs a socket or
 * loads credentials, and does not enable the live transcription protocol. */
export type SimulatedTranscriptionSocket=EventTarget&{
 readonly readyState:number;readonly bufferedAmount:number;
 send:(data:string)=>void;close:()=>void;
};
export function prepareTranscriptionSocketWire(options:{simulation?:boolean;socket:SimulatedTranscriptionSocket;signal:AbortSignal;receive:(event:unknown)=>void;stopped:(reason:string)=>void}){
 if(options.simulation!==true)throw Error('Live transcription socket is disabled.');
 if(options.socket.readyState!==1)throw Error('Transcription socket unavailable.');
 let ended=false,cleanupFailed=false,events=0;
 const listeners:Array<[string,EventListener]>=[];
 const stop=(reason:string)=>{
  if(ended)return;ended=true;
  for(const [type,listener] of listeners)options.socket.removeEventListener(type,listener);
  options.signal.removeEventListener('abort',abort);
  try{options.socket.close();}catch{cleanupFailed=true;}
  try{options.stopped(cleanupFailed?'cleanup-unverified':reason);}catch{/* Already stopped. */}
 };
 const abort=()=>stop('canceled');
 const message:EventListener=event=>{
  if(ended)return;
  try{
   const data=(event as MessageEvent<unknown>).data;
   if(typeof data!=='string'||data.length>16384||new TextEncoder().encode(data).byteLength>16384||++events>512)throw Error();
   const value:unknown=JSON.parse(data);
   if(!value||typeof value!=='object'||Array.isArray(value)||typeof (value as {type?:unknown}).type!=='string')throw Error();
   options.receive(value);
  }catch{stop('event-held');}
 };
 listeners.push(['message',message],['close',()=>stop('disconnected')],['error',()=>stop('transport-held')]);
 for(const [type,listener] of listeners)options.socket.addEventListener(type,listener);
 options.signal.addEventListener('abort',abort,{once:true});
 if(options.signal.aborted)stop('canceled');
 const wire:TranscriptionWire={
  get bufferedAmount(){return ended?65537:options.socket.bufferedAmount;},
  send(event){
   if(ended)return false;
   try{
    if(options.socket.readyState!==1||!Number.isFinite(options.socket.bufferedAmount)||options.socket.bufferedAmount<0||options.socket.bufferedAmount>65536)throw Error();
    const encoded=JSON.stringify(event);
    if(typeof encoded!=='string'||new TextEncoder().encode(encoded).byteLength>16384)throw Error();
    options.socket.send(encoded);return true;
   }catch{stop('transport-held');return false;}
  },
  close:()=>stop('ended')
 };
 return{wire,stop:()=>stop('ended'),status:()=>({ended,cleanupRequested:ended,cleanupFailed})};
}
