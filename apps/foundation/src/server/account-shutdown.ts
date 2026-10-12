type Signal='SIGTERM'|'SIGINT';
type Signals={on(signal:Signal,listener:()=>void):unknown;removeListener(signal:Signal,listener:()=>void):unknown};
/** Explicit deployment shutdown wiring. Never starts accounts or exits the process. */
export function attachAccountShutdown(signals:Signals,network:{close():Promise<boolean>},report:(confirmed:boolean)=>void){
 if(typeof signals?.on!=='function'||typeof signals?.removeListener!=='function'||typeof network?.close!=='function'||typeof report!=='function')throw Error('Account shutdown unavailable');
 let closing:Promise<boolean>|undefined,attached=true;
 const detach=()=>{if(!attached)return;attached=false;signals.removeListener('SIGTERM',stop);signals.removeListener('SIGINT',stop);};
 const stop=()=>{void close();};
 const close=()=>{
  if(closing)return closing;
  closing=Promise.resolve().then(()=>network.close()).then(result=>result===true,()=>false).then(confirmed=>{detach();try{report(confirmed);}catch{/* Reporting cannot change cleanup evidence. */}return confirmed;});
  return closing;
 };
 signals.on('SIGTERM',stop);signals.on('SIGINT',stop);
 return Object.freeze({close,detach});
}
