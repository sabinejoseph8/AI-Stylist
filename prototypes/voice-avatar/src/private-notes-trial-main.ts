import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import WebSocket from 'ws';
import {validatePreview} from './preview-gate.ts';
import {preparePrivateNotesTrialRuntime} from './private-notes-trial-runtime.ts';
import {loadPrivateNotesTrialAssets} from './private-notes-trial-assets.ts';
/** Operator configuration only. Never derive these approvals from browser input
 * or an existing ledger. The normal server and package start command are unchanged. */
export function privateNotesTrialConfiguration(args:string[],env:Record<string,string|undefined>){
 const unavailable=()=>Error('Private notebook activation requires review.');
 if(args.length!==1||args[0]!=='--activate-private-notes-trial'||env.PRIVATE_NOTES_TRIAL_FINANCIAL_APPROVED!=='true'||env.PRIVATE_NOTES_TRIAL_SECURITY_APPROVED!=='true')throw unavailable();
 const approvalId=env.PRIVATE_NOTES_TRIAL_APPROVAL_ID??'',port=Number(env.PORT??'10000');
 if(!/^[A-Za-z0-9_-]{1,80}$/.test(approvalId)||!Number.isInteger(port)||port<1||port>65535)throw unavailable();
 const preview={origin:env.PREVIEW_ORIGIN??env.RENDER_EXTERNAL_URL??'',password:env.PREVIEW_PASSWORD??''};validatePreview(preview);
 return{activation:{approvalId,financialApproved:true,securityApproved:true},preview,supabaseUrl:env.SUPABASE_URL??'',port};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 void(async()=>{
  const config=privateNotesTrialConfiguration(process.argv.slice(2),process.env);
  const assets=await loadPrivateNotesTrialAssets(resolve(dirname(fileURLToPath(import.meta.url)),'../dist'));
  const runtime=preparePrivateNotesTrialRuntime({...config,getAsset:assets.getAsset,loadSecrets:()=>({supabaseKey:process.env.SUPABASE_SECRET_KEY??'',openAIKey:process.env.OPENAI_API_KEY??''}),request:(url,init)=>fetch(url,init),connect:(url,init)=>new WebSocket(url,init)});
  runtime.server.on('error',()=>{runtime.dispose();process.stderr.write('Private notebook server unavailable.\n');process.exitCode=1;});
  runtime.server.listen(config.port,'0.0.0.0',()=>process.stdout.write('Private notebook preview listening.\n'));
  const stop=()=>{runtime.dispose();runtime.server.closeAllConnections();runtime.server.close();};
  for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,stop);
 })().catch(()=>{process.stderr.write('Private notebook activation requires review.\n');process.exitCode=1;});
}
