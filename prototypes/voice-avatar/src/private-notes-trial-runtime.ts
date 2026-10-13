import {createPrivateNotesTrialServer} from './private-notes-trial-server.ts';
import {preparePrivateNotesTrialPersistence} from './private-notes-trial-persistence.ts';
import {PrivateNotesTrialLedgerOwner,validatePrivateNotesTrialLedger} from './private-notes-trial-ledger.ts';
import {createPrivateNotesTrialExecution} from './note-execution.ts';
import {preparePrivateNotesTrialTransports} from './private-notes-trial-transports.ts';
import {validatePrivateNotesTrialActivation} from './private-notes-trial-owner.ts';
import {validatePreview} from './preview-gate.ts';
import type {PrivateNotesTrialExecution} from './note-execution.ts';
import type {PrivateNotesTrialLedger} from './private-notes-trial-ledger.ts';
type ServerOptions=Parameters<typeof createPrivateNotesTrialServer>[0];
type TransportOptions=Parameters<typeof preparePrivateNotesTrialTransports>[0];
/** Explicit server-only composition. No default fetch, connector, credential
 * loader, initializer or listen call. Trusted approval configuration must reflect
 * the separately recorded human decision, never a client or ledger assertion. */
export function preparePrivateNotesTrialRuntime(options:{activation:{approvalId:string;financialApproved:boolean;securityApproved:boolean};preview:ServerOptions['preview'];supabaseUrl:string;loadSecrets:()=>{supabaseKey:string;openAIKey:string};request:TransportOptions['request'];connect:TransportOptions['connect'];getAsset:ServerOptions['getAsset']}){
 const unavailable=()=>Error('Private notebook runtime unavailable.');
 const approval=validatePrivateNotesTrialActivation({...options.activation,authorize:async()=>{throw unavailable();}});validatePreview(options.preview);
 if(typeof options.loadSecrets!=='function'||typeof options.request!=='function'||typeof options.connect!=='function'||typeof options.getAsset!=='function')throw unavailable();
 let supabaseKey:string|null=null,openAIKey:string|null=null,disposed=false;
 const lifetime=new AbortController(),bundles=new Set<ReturnType<typeof preparePrivateNotesTrialTransports>>(),records=new WeakMap<PrivateNotesTrialExecution,PrivateNotesTrialLedger>();
 // URL validation is performed by the persistence constructor before secrets load.
 const persistence=preparePrivateNotesTrialPersistence({privateTrialAdmission:true,url:options.supabaseUrl,fetch:async(url,init)=>{
  if(disposed||supabaseKey===null||!init.signal)throw unavailable();
  const response=await options.request(url,{...init,headers:{'Content-Type':'application/json',Accept:'application/json',apikey:supabaseKey,...(supabaseKey.startsWith('sb_secret_')?{}:{Authorization:`Bearer ${supabaseKey}`})},signal:AbortSignal.any([init.signal,lifetime.signal]),redirect:'error',credentials:'omit',cache:'no-store'});
  if(disposed){void response.body?.cancel().catch(()=>{});throw unavailable();}return response;
 }});
 try{const secrets=options.loadSecrets();if(!secrets||typeof secrets.supabaseKey!=='string'||! /^[A-Za-z0-9_+/.=-]{32,2048}$/.test(secrets.supabaseKey)||typeof secrets.openAIKey!=='string'||! /^[A-Za-z0-9_-]{16,512}$/.test(secrets.openAIKey))throw unavailable();supabaseKey=secrets.supabaseKey;openAIKey=secrets.openAIKey;}catch{throw unavailable();}
 const read=async(signal?:AbortSignal)=>{if(disposed||signal?.aborted)throw unavailable();const ledger=validatePrivateNotesTrialLedger(await persistence.read(signal));if(disposed||signal?.aborted||ledger.approval.id!==approval.approvalId)throw unavailable();return ledger;};
 const allowance=new PrivateNotesTrialLedgerOwner({read,compareAndSwap:persistence.compareAndSwap});
 const disposeTransports=()=>{if(disposed)return;disposed=true;lifetime.abort();for(const bundle of [...bundles])try{bundle.dispose();}catch{/* Reserved history remains consumed. */}bundles.clear();supabaseKey=null;openAIKey=null;};
 try{
  const owner=createPrivateNotesTrialServer({preview:options.preview,getAsset:options.getAsset,readLedger:read,allowance,activation:{...approval,authorize:async(reservationId,signal)=>{
   const ledger=await read(signal);if(ledger.reservation?.id!==reservationId||ledger.reservation.state!=='reserved')throw unavailable();
   const capability=createPrivateNotesTrialExecution({financialApproved:approval.financialApproved,securityApproved:approval.securityApproved,ledger});records.set(capability,ledger);return capability;
  }},createTransports:(reservationId,execution,capture)=>{
   const capability=execution.privateTrial,ledger=capability&&records.get(capability);if(disposed||!capability||!ledger||openAIKey===null)throw unavailable();records.delete(capability);
   const bundle=preparePrivateNotesTrialTransports({...execution,approvalId:approval.approvalId,reservationId,ledger,apiKey:openAIKey,request:(url,init)=>{if(disposed||!init.signal)return Promise.reject(unavailable());return options.request(url,{...init,signal:AbortSignal.any([init.signal,lifetime.signal])});},connect:options.connect,capture});
   bundles.add(bundle);return{...bundle,dispose:()=>{bundles.delete(bundle);bundle.dispose();}};
  }});
  const dispose=()=>{owner.dispose();disposeTransports();};owner.server.once('close',disposeTransports);
  return{server:owner.server,dispose,snapshot:()=>({disposed,activeTransportBundles:bundles.size,network:owner.snapshot().network,remoteCleanupVerified:false as const})};
 }catch{disposeTransports();throw unavailable();}
}
