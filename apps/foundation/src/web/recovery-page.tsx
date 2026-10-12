import React,{useEffect,useState} from 'react';
import {resolveAccountPage} from './account-page.ts';
import {RecoveryPanel,type RecoveryConfiguration} from './recovery-panel.tsx';
export type RecoveryLoader=(signal:AbortSignal)=>Promise<RecoveryConfiguration>;
/** Explicit composition only. The default App never mounts this connected screen. */
export async function prepareRecoveryPage(origin:string,href:string,load:RecoveryLoader,signal:AbortSignal){
 if(resolveAccountPage(origin,href).page!=='reset'||signal.aborted)throw Error('Recovery unavailable');
 const configuration=await load(signal);
 if(signal.aborted||!Number.isSafeInteger(configuration.expiresAt)||configuration.expiresAt<=Date.now()||configuration.expiresAt>Date.now()+300000||typeof configuration.provider?.reset!=='function')throw Error('Recovery unavailable');
 return configuration;
}
export function RecoveryPage({origin,href,load,onClose}:{origin:string;href:string;load:RecoveryLoader;onClose:()=>void}){
 const [result,setResult]=useState<{configuration?:RecoveryConfiguration;failed?:boolean;origin?:string;href?:string;load?:RecoveryLoader}>({});
 useEffect(()=>{
  const controller=new AbortController();setResult({});
  void prepareRecoveryPage(origin,href,load,controller.signal).then(configuration=>{if(!controller.signal.aborted)setResult({configuration,origin,href,load});},()=>{if(!controller.signal.aborted)setResult({failed:true,origin,href,load});});
  return()=>controller.abort();
 },[origin,href,load]);
 const current=result.origin===origin&&result.href===href&&result.load===load?result:{};
 return <section className="card" aria-label="Password recovery">{current.configuration?<RecoveryPanel configuration={current.configuration} onClose={onClose}/>:<><p role={current.failed?'alert':'status'}>{current.failed?'Recovery permission is unavailable. Request a new recovery link.':'Checking recovery permission.'}</p><button type="button" onClick={onClose}>Return to account options</button></>}</section>;
}
