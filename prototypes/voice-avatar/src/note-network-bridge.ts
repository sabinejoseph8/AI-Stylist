import type {Server,IncomingMessage} from 'node:http';
import {WebSocketServer,WebSocket} from 'ws';
import {PreviewGate,validatePreview} from './preview-gate.ts';
import type {PreviewConfig} from './preview-gate.ts';
import {NoteConnectionScope} from './note-connection-scope.ts';
import {encodeNoteUpdate} from './note-update-wire.ts';
import {PreparedRemoteNoteCapture} from './note-remote-capture.ts';
import type {NoteUpdate} from './note-update-wire.ts';
import type {NotebookState} from './notebook-state.ts';
import type {NoteConnectionProbe} from './note-connection-scope.ts';
/** Explicit test harness attachment only. Not called by the application server or
 * CLI. Factory must construct simulated providers. No provider socket or key. */
export function attachSimulatedNoteBridge(server:Server,options:{simulation?:boolean;preview:PreviewConfig;create:(publish:(snapshot:ReturnType<NotebookState['snapshot']>,receipt:number|null)=>void,capture:PreparedRemoteNoteCapture,turnReady:(turnId:string)=>void)=>NoteConnectionProbe}){
 if(options.simulation!==true)throw Error('Live notebook bridge is disabled.');
 const address=validatePreview(options.preview),gate=new PreviewGate(options.preview);
 let publisher:((snapshot:ReturnType<NotebookState['snapshot']>,receipt:number|null)=>void)|null=null;
 let readiness:((turnId:string)=>void)|null=null;
 const scope=new NoteConnectionScope({simulation:true,create:()=>{const bound=publisher,boundReady=readiness;return options.create((snapshot,receipt)=>bound?.(snapshot,receipt),new PreparedRemoteNoteCapture({simulation:true}),turnId=>boundReady?.(turnId));}});
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
   const owner={};let id:string|null=null,ended=false,inflight=0,count=0,updateSequence=0,ready=false;
   let pending:NoteUpdate|null=null;
   const finish=()=>{if(ended)return;ended=true;clearTimeout(deadline);pending=null;scope.disconnect(owner,id??'');ws.terminate();};
   const deadline=setTimeout(finish,85000);
   ws.on('close',finish);ws.on('error',finish);
   const send=(message:unknown)=>{
     if(ended||ws.readyState!==WebSocket.OPEN||ws.bufferedAmount>65536){finish();return false;}
     try{ws.send(JSON.stringify(message),error=>{if(error)finish();});return true;}catch{finish();return false;}
   };
   const publish=(snapshot:ReturnType<NotebookState['snapshot']>,receipt:number|null)=>{
     if(ended)return;
     if(updateSequence>=512){finish();return;}
     try{const encoded=encodeNoteUpdate(id??'pending',updateSequence+1,snapshot,receipt);if(!ready){pending=encoded;return;}updateSequence++;send(encoded);}catch{finish();}
   };
   let readyCount=0;
   readiness=turnId=>{if(ended)return;if(!id||typeof turnId!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(turnId)||++readyCount>16){finish();return;}send({version:1,type:'turn-ready',sessionId:id,turnId});};
   publisher=publish;id=scope.open(owner);publisher=null;readiness=null;
   if(ended){scope.disconnect(owner,id??'');return;}
   if(!id){finish();return;}
   if(!send({version:1,type:'ready',sessionId:id,simulation:true,liveEnabled:false}))return;
   ready=true;
   if(pending){const initial=pending as NoteUpdate;pending=null;updateSequence++;send({...initial,sessionId:id,sequence:updateSequence});}

   ws.on('message',(data,binary)=>{
     if(ended)return;
     if(binary){
       const bytes=Array.isArray(data)?Buffer.concat(data):Buffer.isBuffer(data)?data:Buffer.from(data);
       const frame=new ArrayBuffer(bytes.byteLength);new Uint8Array(frame).set(bytes);
       if(!scope.audio(owner,id!,frame))finish();return;
     }
     if(++count>257){finish();return;}
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
