import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
import {ConnectionProbeAdmission} from './cvi-connection-probe-contract.ts';
import {ConnectionProbeSession} from './cvi-connection-probe-session.ts';
import {prepareProbePersistence,prepareProbeProvider,probePalConfiguration} from './cvi-connection-probe-provider.ts';
import {connectionProbeHost} from './cvi-connection-probe-host.ts';
import {loadConnectionProbeAssets} from './cvi-connection-probe-assets.ts';
/** Separate explicit startup. This never provisions a PAL or starts a room.
 * Operators supply verified settings; booleans do not replace the documented
 * quota/fees/configuration readback. Missing or stale preflight disables Start. */
if(process.argv.length!==3||process.argv[2]!=='--activate-connection-probe')throw Error('Connection probe activation requires review.');
const required=(name:string)=>{const value=process.env[name];if(!value||/[\r\n]/.test(value))throw Error('Connection probe configuration requires review.');return value;};
const origin=required('PREVIEW_ORIGIN'),password=required('PREVIEW_PASSWORD'),callbackKey=required('CVI_PROBE_CALLBACK_KEY');
if(process.env.CVI_PROBE_REPLACEMENT_APPROVED!=='true')throw Error('Connection probe approval requires review.');
const palId=required('CVI_PROBE_PAL_ID'),tavusKey=required('TAVUS_API_KEY'),supabaseKey=required('SUPABASE_SECRET_KEY');
const preflightAt=Date.parse(required('CVI_PROBE_PREFLIGHT_UTC')),freeMinutes=Number(required('CVI_PROBE_FREE_MINUTES'));
const wallAtBoot=Date.now(),monoAtBoot=performance.now();
const preflightValid=()=>{
 const wall=Date.now(),elapsed=performance.now()-monoAtBoot;
 return Number.isFinite(preflightAt)&&Number.isFinite(freeMinutes)&&freeMinutes>=5&&freeMinutes<=20&&process.env.CVI_PROBE_FREE_NO_OVERAGE_VERIFIED==='true'&&process.env.CVI_PROBE_NO_OTHER_ROOMS_VERIFIED==='true'&&wall>=preflightAt&&wall-preflightAt<300000&&elapsed>=0&&Math.abs(wall-wallAtBoot-elapsed)<5000;
};
const port=Number(process.env.PORT??'10000');if(!Number.isSafeInteger(port)||port<1||port>65535)throw Error('Connection probe port unavailable.');
const store=prepareProbePersistence({url:required('SUPABASE_URL'),headers:{apikey:supabaseKey,Authorization:'Bearer '+supabaseKey},fetch});
const provider=prepareProbeProvider({fetch,apiKey:tavusKey,palId,configuration:probePalConfiguration(origin,callbackKey),diagnostic:report=>console.log('Probe PAL readback:',JSON.stringify(report))});
await provider.verifyConfiguration();
const session=new ConnectionProbeSession({admission:new ConnectionProbeAdmission(store),provider,monotonicNow:()=>performance.now()});
const assets=await loadConnectionProbeAssets(fileURLToPath(new URL('../dist',import.meta.url)));
const cache=new Map<string,Uint8Array>();for(const path of assets.paths()){const value=await assets.getAsset(path,new AbortController().signal);if(value)cache.set(path,value);}
const owner=connectionProbeHost({preview:{origin,password},credential:callbackKey,session,available:async()=>(await store.read() as {reservation:unknown}).reservation===null,operatorPreflightValid:preflightValid,asset:path=>cache.get(path)??null});
const server=createServer((req,res)=>{void owner.handle(req,res).catch(()=>{if(!res.headersSent){res.statusCode=503;res.end();}else res.destroy();});});
server.requestTimeout=5000;server.headersTimeout=5000;server.keepAliveTimeout=5000;server.maxHeadersCount=32;
const timer=setInterval(()=>owner.tick(),1000);let closing=false;
const close=()=>{if(closing)return;closing=true;clearInterval(timer);void owner.close().finally(()=>{server.close();server.closeIdleConnections();});};
process.once('SIGTERM',close);process.once('SIGINT',close);
server.on('error',()=>{console.error('Connection probe listener unavailable.');process.exitCode=1;close();});
server.listen(port,'0.0.0.0',()=>console.log('Private connection probe listening; no room started.'));
