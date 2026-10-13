import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import WebSocket from 'ws';
import {prepareReservedNotesStartupDiagnostic} from './reserved-notes-startup-diagnostic.ts';
import {preparePrivateNotesTrialPersistence} from './private-notes-trial-persistence.ts';
import {prepareServerNoteSocketOpener} from './server-note-socket-opener.ts';
import {boundedNoteStartupDiagnostic} from './note-startup-diagnostics.ts';
import type {NoteStartupDiagnostic} from './note-startup-diagnostics.ts';
const reviewedConfigurations=new WeakSet<object>();
export function startupDiagnosticConfiguration(args:string[],env:Record<string,string|undefined>){
 const id=env.NOTES_STARTUP_DIAGNOSTIC_APPROVAL_ID;
 if(!Array.isArray(args)||args.length!==1||!['--run-approved-notes-startup-diagnostic','--run-approved-minimal-notes-startup-diagnostic'].includes(args[0]!)||env.NOTES_STARTUP_DIAGNOSTIC_FINANCIAL_APPROVED!=='true'||env.NOTES_STARTUP_DIAGNOSTIC_SECURITY_APPROVED!=='true'||env.NOTES_STARTUP_DIAGNOSTIC_SCOPE!=='startup-only'||typeof id!=='string'||!/^notes_startup_diag_[A-Za-z0-9_-]{1,60}$/.test(id))throw Error('Startup diagnostic requires separate review.');
 const minimal=args[0]==='--run-approved-minimal-notes-startup-diagnostic';
 if(minimal?(env.NOTES_STARTUP_DIAGNOSTIC_PROFILE!=='minimal'||!/^notes_startup_diag_minimal_[A-Za-z0-9_-]{1,50}$/.test(id)):(env.NOTES_STARTUP_DIAGNOSTIC_PROFILE!==undefined||id.startsWith('notes_startup_diag_minimal_')))throw Error('Startup diagnostic requires separate review.');
 const config=Object.freeze({approvalId:id,supabaseUrl:env.SUPABASE_URL??'',profile:minimal?'minimal' as const:undefined});reviewedConfigurations.add(config);return config;
}
/** No default transport, key loader, environment access, listen or initializer. */
export function prepareStartupDiagnosticRuntime(config:ReturnType<typeof startupDiagnosticConfiguration>,options:{loadSecrets:()=>{supabaseKey:string;openAIKey:string};request:typeof fetch;connect:NonNullable<Parameters<typeof prepareServerNoteSocketOpener>[0]['connect']>;diagnostic?:NoteStartupDiagnostic}){
 if(!config||!reviewedConfigurations.has(config))throw Error('Startup diagnostic requires separate review.');
 const safe=config;
 let key:string|null=null,openAIKey:string|null=null;const report=boundedNoteStartupDiagnostic(options.diagnostic);
 const lifetime=new AbortController();let ended=false;
 const store=preparePrivateNotesTrialPersistence({privateTrialAdmission:true,approvedTrialId:safe.approvalId,url:safe.supabaseUrl,fetch:async(url,init)=>{
  if(key===null)throw Error('Diagnostic store unavailable.');
  return options.request(url,{...init,headers:{'Content-Type':'application/json',Accept:'application/json',apikey:key,...(key.startsWith('sb_secret_')?{}:{Authorization:`Bearer ${key}`})},signal:init.signal,redirect:'error',credentials:'omit',cache:'no-store'});
 }});
 try{const secrets=options.loadSecrets();if(!secrets||typeof secrets.supabaseKey!=='string'||typeof secrets.openAIKey!=='string'||! /^[A-Za-z0-9_+/.=-]{32,2048}$/.test(secrets.supabaseKey)||! /^[A-Za-z0-9_-]{16,512}$/.test(secrets.openAIKey))throw Error();key=secrets.supabaseKey;openAIKey=secrets.openAIKey;}catch{throw Error('Diagnostic credentials unavailable.');}
 let active:ReturnType<typeof prepareServerNoteSocketOpener>|undefined;
 const runner=prepareReservedNotesStartupDiagnostic({authorization:{approvalId:safe.approvalId,financialApproved:true,securityApproved:true,scope:'startup-only',profile:safe.profile},store,diagnostic:report,makeOpener:()=>{
  if(ended||openAIKey===null)throw Error('Diagnostic ended.');active=prepareServerNoteSocketOpener({apiKey:openAIKey,connect:options.connect,diagnostic:report});openAIKey=null;return active;
 }});
 return{run:async(signal:AbortSignal)=>{try{return await runner.run(AbortSignal.any([signal,lifetime.signal]));}finally{ended=true;lifetime.abort();try{active?.end();}catch{}key=null;openAIKey=null;}},end:()=>{ended=true;openAIKey=null;lifetime.abort();try{active?.end();}catch{}}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 void(async()=>{
  const config=startupDiagnosticConfiguration(process.argv.slice(2),process.env);
  const runtime=prepareStartupDiagnosticRuntime(config,{loadSecrets:()=>({supabaseKey:process.env.SUPABASE_SECRET_KEY??'',openAIKey:process.env.OPENAI_API_KEY??''}),request:fetch,connect:(url,init)=>new WebSocket(url,init),diagnostic:code=>process.stdout.write('Startup diagnostic stage: '+code+'\n')});
  const controller=new AbortController(),stop=()=>controller.abort();for(const name of ['SIGINT','SIGTERM'] as const)process.once(name,stop);
  try{const result=await runtime.run(controller.signal);process.stdout.write(JSON.stringify(result)+'\n');if(!result.result||!result.outcomeRecorded)process.exitCode=1;}finally{runtime.end();for(const name of ['SIGINT','SIGTERM'] as const)process.off(name,stop);}
 })().catch(()=>{process.stderr.write('Startup diagnostic unavailable; no retry authorized.\n');process.exitCode=1;});
}
