import type {Server,RequestListener} from 'node:http';
import type {Server as HttpsServer} from 'node:https';
import type {Socket} from 'node:net';
import type {prepareAccountApplication} from './account-application.ts';
type Application=Pick<Awaited<ReturnType<typeof prepareAccountApplication>>,'handle'|'start'|'close'>;
/** Explicit network lifecycle. The factory supplies HTTPS or an explicitly trusted deployment proxy.
 * No environment lookup, process handlers, socket or provider work on construction. */
export function createAccountNetwork(app:Application,factory:(listener:RequestListener)=>Server|HttpsServer,deadlineMs=8000){
 if(typeof app?.handle!=='function'||typeof app?.start!=='function'||typeof app?.close!=='function'||typeof factory!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Account network unavailable');
 let state:'inactive'|'starting'|'listening'|'failed'|'closed'='inactive',server:Server|HttpsServer|undefined;
 let startup:Promise<boolean>|undefined,closure:Promise<boolean>|undefined,starting=false;
 const sockets=new Set<Socket>();
 let socketClosed=()=>{};
 const isClosed=()=>state==='closed';
 const canOpen=()=>state==='starting';
 let terminate=()=>Promise.resolve(false);
 const listener:RequestListener=(request,response)=>{
  if(state!=='listening'){response.writeHead(503,{'cache-control':'no-store'});response.end();return;}
  void Promise.resolve().then(()=>app.handle(request,response)).catch(()=>{if(response.headersSent)response.destroy();else{response.writeHead(503,{'cache-control':'no-store'});response.end();}});
 };
 const api=Object.freeze({
  health:()=>Object.freeze({status:state,port:state==='listening'&&server?.address()&&typeof server.address()==='object'?(server.address() as {port:number}).port:null}),
  start(port:number,bindHost:string){
   if(!Number.isSafeInteger(port)||port<0||port>65535||typeof bindHost!=='string'||!['127.0.0.1','::1','0.0.0.0'].includes(bindHost))return Promise.resolve(false);
   if(state==='closed'||state==='failed')return Promise.resolve(false);if(startup)return startup;
   state='starting';starting=true;
   let timer:ReturnType<typeof setTimeout>|undefined;
   const work=(async()=>{
    try{
     if(!await app.start()||!canOpen()){if(!isClosed())state='failed';await app.close();return false;}
     server=factory(listener);
     server.on('connection',socket=>{sockets.add(socket);socket.once('close',()=>{sockets.delete(socket);socketClosed();});});
     const opened=await new Promise<boolean>(resolve=>{
      const failed=()=>{server?.removeListener('listening',opened);resolve(false);};
      const opened=()=>{server?.removeListener('error',failed);resolve(true);};
      server!.once('error',failed);server!.once('listening',opened);
      try{server!.listen(port,bindHost);}catch{failed();}
     });
     if(!opened||!canOpen()){if(!isClosed())state='failed';server.close();await app.close();return false;}
     state='listening';server.on('error',()=>{if(!isClosed()){state='failed';void terminate();}});return true;
    }catch{if(!isClosed())state='failed';try{server?.close();}catch{}await app.close().catch(()=>false);return false;}finally{starting=false;}
   })();
   startup=Promise.race([work,new Promise<false>(resolve=>{timer=setTimeout(()=>{if(!isClosed())state='failed';try{server?.close();}catch{}for(const socket of sockets)socket.destroy();void app.close().catch(()=>false);resolve(false);},deadlineMs);})]).finally(()=>{if(timer)clearTimeout(timer);});return startup;
  },
  close(){
   if(closure)return closure;state='closed';
   closure=(async()=>{
    let timer:ReturnType<typeof setTimeout>|undefined,forced=false;
    const network=new Promise<boolean>(resolve=>{if(!server){resolve(true);return;}let listenerClosed=false;socketClosed=()=>{if(listenerClosed&&sockets.size===0)resolve(!forced);};try{server.close(error=>{if(error){resolve(false);return;}listenerClosed=true;socketClosed();});server.closeIdleConnections();}catch{resolve(false);}});
    const cleanup=Promise.resolve().then(()=>app.close()).catch(()=>false);
    try{return await Promise.race([Promise.all([network,cleanup]).then(([net,app])=>net&&app&&!starting&&sockets.size===0),new Promise<false>(resolve=>{timer=setTimeout(()=>{forced=true;for(const socket of sockets)socket.destroy();resolve(false);},deadlineMs);})]);}finally{if(timer)clearTimeout(timer);}
   })();return closure;
  },
 });
 terminate=api.close;return api;
}
