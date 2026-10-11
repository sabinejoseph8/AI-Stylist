import type {SimulatedTranscriptionSocket} from './transcription-socket-wire.ts';
/** Dormant construction cannot emit events until start. No URL or key is supplied. */
export function prepareNoteOpener(options:{simulation?:boolean;construct:()=>{socket:SimulatedTranscriptionSocket;start:()=>void}}){
 if(options.simulation!==true)throw Error('Live notebook opening is disabled.');
 return async(signal:AbortSignal,receive:(value:unknown)=>void)=>{
  if(signal.aborted)throw Error('Opening canceled.');
  const transport=options.construct(),raw=transport.socket;
  let settled=false,ended=false,closed=false,failed=false,detached=false;
  let resolve!:(value:{socket:SimulatedTranscriptionSocket;detachInitialEvents:()=>void})=>void;
  const pending=new Promise<{socket:SimulatedTranscriptionSocket;detachInitialEvents:()=>void}>(r=>{resolve=r;});
  const listeners:Array<[string,EventListener]>=[];
  const detach=()=>{
   if(detached){if(failed)throw Error('Opening cleanup unverified.');return;}detached=true;
   for(const [type,listener] of listeners){try{raw.removeEventListener(type,listener);}catch{failed=true;}}
   signal.removeEventListener('abort',abort);
   if(failed)throw Error('Opening cleanup unverified.');
  };
  const close=()=>{
   ended=true;
   if(!closed){closed=true;try{raw.close();}catch{failed=true;}}
   try{detach();}catch{failed=true;}
   if(failed)throw Error('Opening cleanup unverified.');
  };
  const socket:SimulatedTranscriptionSocket={
   get readyState(){return ended?3:raw.readyState;},get bufferedAmount(){return raw.bufferedAmount;},
   send:data=>{if(ended)throw Error('Opening ended.');raw.send(data);},close,
   addEventListener:raw.addEventListener.bind(raw),removeEventListener:raw.removeEventListener.bind(raw),dispatchEvent:raw.dispatchEvent.bind(raw),
  };
  // Return every constructed resource, including failures, so startup observes
  // sticky cleanup uncertainty instead of losing it through a rejected promise.
  const settle=()=>{if(settled)return;settled=true;resolve({socket,detachInitialEvents:detach});};
  const stop=()=>{ended=true;try{close();}catch{failed=true;}settle();};
  const abort=()=>stop();
  const message:EventListener=event=>{
   if(ended||detached)return;
   try{
    const data=(event as MessageEvent<unknown>).data;
    if(typeof data!=='string'||data.length>16384||new TextEncoder().encode(data).byteLength>16384)throw Error();
    receive(JSON.parse(data));
   }catch{stop();}
  };
  listeners.push(['message',message],['open',()=>{if(!ended)settle();}],['error',stop],['close',stop]);
  try{
   for(const [type,listener] of listeners)raw.addEventListener(type,listener);
   signal.addEventListener('abort',abort,{once:true});
   if(signal.aborted)stop();else transport.start();
  }catch{stop();}
  return pending;
 };
}
