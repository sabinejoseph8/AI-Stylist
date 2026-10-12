import {readFile,lstat} from 'node:fs/promises';
import {isAbsolute} from 'node:path';
import {createServer} from 'node:https';
import {prepareAccountRuntime} from './account-runtime.ts';
import {createAccountTransport} from './account-transport.ts';
/** Separately selected direct-TLS entry. Does not implement or assume Render proxy trust. */
export async function startAccountHttps(env:Readonly<Record<string,string|undefined>>,send:typeof fetch,signals:Parameters<typeof prepareAccountRuntime>[3],report:(confirmed:boolean)=>void){
 async function material(path:string|undefined){
  if(typeof path!=='string'||!isAbsolute(path)||path.includes('\0'))throw Error();
  const metadata=await lstat(path);if(!metadata.isFile()||metadata.isSymbolicLink()||metadata.size<1||metadata.size>65536)throw Error();
  const value=await readFile(path);if(value.length<1||value.length>65536)throw Error();return value;
 }
 let runtime:Awaited<ReturnType<typeof prepareAccountRuntime>>|undefined;
 try{
  const key=await material(env.ACCOUNT_TLS_KEY_FILE),cert=await material(env.ACCOUNT_TLS_CERT_FILE);
  runtime=await prepareAccountRuntime(env,send,listener=>{
   const server=createServer({key,cert,minVersion:'TLSv1.2'},createAccountTransport(env.ACCOUNT_APP_ORIGIN!,listener));
   server.requestTimeout=15000;server.headersTimeout=10000;server.keepAliveTimeout=5000;server.maxHeadersCount=64;server.maxRequestsPerSocket=100;return server;
  },signals,report);
  if(!await runtime.start())throw Error();return runtime;
 }catch{await runtime?.close().catch(()=>false);throw Error('Account HTTPS startup unavailable');}
}
if(import.meta.main){
 void startAccountHttps(process.env,fetch,process,confirmed=>{if(!confirmed)process.exitCode=1;}).catch(()=>{process.stderr.write('Account HTTPS startup unavailable.\n');process.exitCode=1;});
}
