import type {Server,IncomingMessage} from 'node:http';
import {WebSocketServer,WebSocket} from 'ws';
import {PreviewGate,validatePreview} from './preview-gate.ts';
import type {PreviewConfig} from './preview-gate.ts';
import {NoteConnectionScope} from './note-connection-scope.ts';
import type {NoteConnectionProbe} from './note-connection-scope.ts';
/** Explicit test harness attachment only. Not called by the application server or
 * CLI. Factory must construct simulated providers. No provider socket or key. */
export function attachSimulatedNoteBridge(server:Server,options:{simulation?:boolean;preview:PreviewConfig;create:()=>NoteConnectionProbe}){
 if(options.simulation!==true)throw Error('Live notebook bridge is disabled.');
 const address=validatePreview(options.preview),gate=new PreviewGate(options.preview);
 const scope=new NoteConnectionScope({simulation:true,create:options.create});
 const sockets=new WebSocketServer({noServer:true,maxPayload:1024,perMessageDeflate:false});
 let closed=false;
 const reject=(socket:import('node:stream').Duplex,status:number)=>{socket.end(`HTTP/1.1 ${status} Rejected\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);};
 const upgrade=(req:IncomingMessage,socket:import('node:stream').Duplex,head:Buffer)=>{
   socket.on('error',()=>socket.destroy());
   if(closed){reject(socket,503);return;}
   if(req.method!=='GET'||req.url!=='/api/notebook-simulation'||req.headers.host!==address.host||req.headers.origin!==address.origin||req.headers['sec-websocket-protocol']){reject(socket,403);return;}
   const access=gate.check(req.headers.authorization);if(access!==200){reject(socket,access);return;}
   if(sockets.clients.size||scope.snapshot().active||scope.snapshot().held){reject(socket,409);return;}
   sockets.handleUpgrade(req,socket,head,ws=>sockets.emit('connection',ws,req));
 };
 sockets.on('connection',ws=>{
   const owner={},id=scope.open(owner);let ended=false,inflight=0,count=0;
   const finish=()=>{if(ended)return;ended=true;clearTimeout(deadline);scope.disconnect(owner,id??'');ws.terminate();};
   const deadline=setTimeout(finish,85000);
   ws.on('close',finish);ws.on('error',finish);
   const send=(message:unknown)=>{
     if(ended||ws.readyState!==WebSocket.OPEN||ws.bufferedAmount>65536){finish();return false;}
     try{ws.send(JSON.stringify(message),error=>{if(error)finish();});return true;}catch{finish();return false;}
   };
   if(!id){finish();return;}
   send({version:1,type:'ready',sessionId:id,simulation:true,liveEnabled:false});
   ws.on('message',(data,binary)=>{
     if(ended)return;
     if(binary||++count>257){finish();return;}
     let value:unknown;
     try{value=JSON.parse(data.toString());}catch{finish();return;}
     const ending=Boolean(value&&typeof value==='object'&&!Array.isArray(value)&&(value as {type?:unknown}).type==='end');
     if(inflight&&!ending){finish();return;}
     if(inflight>=2){finish();return;}
     inflight++;
     void scope.command(owner,value).then(accepted=>{
       inflight--;if(ended)return;
       if(!accepted){finish();return;}
       send({version:1,type:'accepted',sessionId:id,sequence:(value as {sequence:number}).sequence});
       if(ending)finish();
     },()=>{inflight--;finish();});
   });
 });
 server.on('upgrade',upgrade);
 const dispose=()=>{if(closed)return;closed=true;server.off('upgrade',upgrade);scope.close();for(const ws of sockets.clients)ws.terminate();sockets.close();};
 server.once('close',dispose);
 return {dispose,snapshot:()=>({...scope.snapshot(),connections:sockets.clients.size,networkAttached:!closed})};
}
