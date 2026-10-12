import type {IncomingMessage,ServerResponse} from 'node:http';
import {Readable} from 'node:stream';
export interface AccountNodeRoute {
 handle(request:Request,signal:AbortSignal):Promise<Response>;
 /** Revoke the returned lease if response delivery fails. Must be idempotent. */
 discardResponse?(response:Response):Promise<unknown>;
}
/** Disconnected Node listener for explicit handlers. Does not install routes or configure TLS/proxy trust. */
export function createAccountNodeListener(origin:string,routes:ReadonlyMap<string,AccountNodeRoute>,deadlineMs=10000){
 const base=new URL(origin);
 if(base.protocol!=='https:'||base.origin!==origin||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>10000)throw Error('Account server unavailable');
 const selected=new Map(routes);
 for(const [path,route] of selected)if((path!=='/account/recovery'&&!/^\/api\/account\/[a-z-]+$/.test(path)&&!/^\/auth\/callback\/(google|apple|recovery)$/.test(path))||typeof route?.handle!=='function')throw Error('Account server unavailable');
 let pending=0;
 return async(req:IncomingMessage,res:ServerResponse)=>{
  if(pending>=4){res.writeHead(429,{'cache-control':'no-store'});res.end();return;}
  pending++;
  const controller=new AbortController();let response:Response|undefined,route:AccountNodeRoute|undefined,finished=false,cleaned=false;
  let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
  const discard=async()=>{if(!cleaned&&response&&route){cleaned=true;await route.discardResponse?.(response);}};
  const stop=()=>{if(!finished){controller.abort();if(reader)void reader.cancel().catch(()=>{});void discard().catch(()=>{});}};
  req.once('aborted',stop);res.once('close',stop);
  const timer=setTimeout(()=>{stop();if(!res.destroyed)res.destroy();},deadlineMs);
  try{
   const unique=new Set<string>();
   for(let index=0;index<req.rawHeaders.length;index+=2){const name=req.rawHeaders[index]!.toLowerCase();if(['host','origin','cookie','authorization'].includes(name)){if(unique.has(name))throw Error();unique.add(name);}}
   if(req.headers.host!==base.host||!req.url?.startsWith('/')||req.url.startsWith('//'))throw Error();
   const url=new URL(req.url,base);route=selected.get(url.pathname);
   if(!route){res.writeHead(404,{'cache-control':'no-store'});res.end();return;}
   const headers=new Headers();
   for(const [key,value] of Object.entries(req.headers))if(value!==undefined){if(Array.isArray(value))for(const item of value)headers.append(key,item);else headers.set(key,value);}
   const init:RequestInit&{duplex?:'half'}={method:req.method,headers,signal:controller.signal};
   if(req.method!=='GET'&&req.method!=='HEAD'){init.body=Readable.toWeb(req) as ReadableStream<Uint8Array>;init.duplex='half';}
   response=await route.handle(new Request(url,init),controller.signal);
   if(controller.signal.aborted||res.destroyed){await discard();return;}
   // Account contracts are small JSON; bound even an accidentally misconfigured handler.
   reader=response.body?.getReader();let size=0;const chunks:Uint8Array[]=[];
   if(reader)try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>16384)throw Error();chunks.push(part.value);}}finally{void reader.cancel().catch(()=>{});reader.releaseLock();}
   if(controller.signal.aborted||res.destroyed){await discard();return;}
   const out:Record<string,string|string[]>={};
   response.headers.forEach((value,key)=>{if(key!=='set-cookie')out[key]=value;});
   const cookies=response.headers.getSetCookie();if(cookies.length)out['set-cookie']=cookies;
   await new Promise<void>((resolve,reject)=>{
    const fail=()=>{reject(Error());};res.once('error',fail);res.once('close',fail);
    res.writeHead(response!.status,out);res.end(Buffer.concat(chunks),()=>{finished=true;res.removeListener('error',fail);res.removeListener('close',fail);resolve();});
   });
  }catch{controller.abort();await discard().catch(()=>{});if(!res.headersSent&&!res.destroyed){res.writeHead(400,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify({status:'unavailable'}));}else if(!res.destroyed)res.destroy();}
  finally{pending--;clearTimeout(timer);req.removeListener('aborted',stop);res.removeListener('close',stop);}
 };
}
