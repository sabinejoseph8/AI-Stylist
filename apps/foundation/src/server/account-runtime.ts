import type {RequestListener,Server} from 'node:http';
import type {Server as HttpsServer} from 'node:https';
import {readAccountRuntimeSettings} from './account-runtime-settings.ts';
import {prepareAccountApplication} from './account-application.ts';
import {createAccountNetwork} from './account-network.ts';
import {attachAccountShutdown} from './account-shutdown.ts';
/** Explicit orchestration. Preparation starts no listener, provider request or signal handler.
 * Caller owns HTTPS or a separately verified trusted proxy and privately supplied settings. */
export async function prepareAccountRuntime(env:Readonly<Record<string,string|undefined>>,send:typeof fetch,factory:(listener:RequestListener)=>Server|HttpsServer,signals:Parameters<typeof attachAccountShutdown>[0],report:(confirmed:boolean)=>void){
 if(typeof send!=='function'||typeof factory!=='function'||typeof signals?.on!=='function'||typeof signals?.removeListener!=='function'||typeof report!=='function')throw Error('Account runtime unavailable');
 const settings=readAccountRuntimeSettings(env);
 const app=await prepareAccountApplication({...settings,fetch:send},settings.buildDirectory);
 let network:ReturnType<typeof createAccountNetwork>;
 try{network=createAccountNetwork(app,factory);}catch{await app.close();throw Error('Account runtime unavailable');}
 let shutdown:ReturnType<typeof attachAccountShutdown>|undefined,startup:Promise<boolean>|undefined,closure:Promise<boolean>|undefined,closed=false;
 return Object.freeze({health:network.health,
  start(){
   if(closed||network.health().status==='closed'||network.health().status==='failed')return Promise.resolve(false);if(startup)return startup;
   startup=(async()=>{
    try{shutdown=attachAccountShutdown(signals,network,confirmed=>{closed=true;report(confirmed);});const started=await network.start(settings.port,settings.bindHost);if(started&&!closed)return true;}catch{/* No private details in runtime status. */}
    closed=true;if(shutdown)await shutdown.close();else await network.close();return false;
   })();return startup;
  },
  close(){if(closure)return closure;closed=true;closure=shutdown?shutdown.close():network.close();return closure;},
 });
}
