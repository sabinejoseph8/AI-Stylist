import type {Server,IncomingMessage} from 'node:http';
import type {Duplex} from 'node:stream';
import {WebSocketServer,WebSocket} from 'ws';
import {PreviewGate,validatePreview} from './preview-gate.ts';
import {preparePrivateNotesTrialOwner,validatePrivateNotesTrialActivation} from './private-notes-trial-owner.ts';
import {NoteConnectionScope} from './note-connection-scope.ts';
import type {NoteConnectionProbe} from './note-connection-scope.ts';
import {PreparedRemoteNoteCapture} from './note-remote-capture.ts';
import {encodeNoteUpdate} from './note-update-wire.ts';
import type {NotebookState} from './notebook-state.ts';
import type {NoteUpdate} from './note-update-wire.ts';
import {NoteTiming} from './note-timing.ts';
type OwnerOptions=Parameters<typeof preparePrivateNotesTrialOwner>[0];
type Active=Extract<Awaited<ReturnType<ReturnType<typeof preparePrivateNotesTrialOwner>['start']>>,{status:200}>;
/** Explicit attachment only, never imported by normal startup. Trusted activation
 * configuration must reflect human approval. Client consent cannot supply it.
 * Credentials/transports stay injected and are constructed only after reservation.
 * No initializer, retry, replacement, refund or remote-finalization claim. */
export function attachPrivateNotesTrialNetwork(server:Server,options:{activation:NonNullable<OwnerOptions['activation']>;preview:OwnerOptions['preview'];allowance:OwnerOptions['allowance'];createTransports:(reservationId:string,execution:Parameters<OwnerOptions['createTransports']>[1],capture:PreparedRemoteNoteCapture)=>ReturnType<OwnerOptions['createTransports']>}){
 const activation=validatePrivateNotesTrialActivation(options.activation),target=validatePreview(options.preview),gate=new PreviewGate(options.preview);
 const sockets=new WebSocketServer({noServer:true,maxPayload:1024,perMessageDeflate:false});
 let closed=false,createProbe:(()=>NoteConnectionProbe)|null=null;
 const scope=new NoteConnectionScope({privateTrialAdmission:true,create:()=>{if(!createProbe)throw Error('Notebook admission unavailable.');return createProbe();}});
 const reject=(socket:Duplex,status:number)=>socket.end(`HTTP/1.1 ${status} Rejected\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
 const upgrade=(req:IncomingMessage,socket:Duplex,head:Buffer)=>{
  socket.on('error',()=>socket.destroy());
  if(closed){reject(socket,503);return;}
  if(req.method!=='GET'||req.url!=='/api/private-notes-trial'||req.headers.host!==target.host||req.headers.origin!==target.origin||req.headers['sec-websocket-protocol']){reject(socket,403);return;}
  const access=gate.check(req.headers.authorization);if(access!==200){reject(socket,access);return;}
  if(sockets.clients.size||scope.snapshot().active||scope.snapshot().held){reject(socket,409);return;}
  sockets.handleUpgrade(req,socket,head,ws=>sockets.emit('connection',ws,req));
 };
 sockets.on('connection',(ws,req)=>{
  const connection={};const abort=new AbortController();let id:string|null=null,active:Active|undefined,ended=false,ready=false,consented=false,finished=false,count=0,inflight=0,sequence=0;
  let pending:NoteUpdate|null=null;
  const finish=()=>{if(ended)return;ended=true;clearTimeout(deadline);clearTimeout(consentDeadline);abort.abort();pending=null;if(id)scope.disconnect(connection,id);if(active)void active.end();ws.terminate();};
  const deadline=setTimeout(finish,85000),consentDeadline=setTimeout(finish,5000);
  ws.on('close',finish);ws.on('error',finish);
  const send=(value:unknown)=>{if(ended||ws.readyState!==WebSocket.OPEN||ws.bufferedAmount>65536){finish();return false;}try{ws.send(JSON.stringify(value),error=>{if(error)finish();});return true;}catch{finish();return false;}};
  const publish=(snapshot:ReturnType<NotebookState['snapshot']>,receipt:number|null)=>{
   if(ended)return;if(sequence>=512){finish();return;}
   try{const update=encodeNoteUpdate(id??'pending',sequence+1,snapshot,receipt);if(!ready){pending=update;return;}sequence++;send(update);}catch{finish();}
  };
  const initialize=()=>{
   createProbe=()=>{
    const stop=()=>{abort.abort();if(active)void active.end();};
    const owner=preparePrivateNotesTrialOwner({activation,preview:options.preview,allowance:options.allowance,createTransports:(reservationId,execution)=>{
     const capture=new PreparedRemoteNoteCapture(execution);return{...options.createTransports(reservationId,execution,capture),capture};
    },publish,turnReady:turnId=>send({version:1,type:'turn-ready',sessionId:id,turnId}),stopped:()=>{finished=true;finish();}});
    void owner.start({method:req.method??'',path:'/api/private-notes-trial-preparation',host:req.headers.host??'',origin:req.headers.origin??'',authorization:req.headers.authorization,consent:true,signal:abort.signal}).then(async result=>{
     if(result.status!==200){finished=true;finish();return;}active=result;if(ended){await active.end();return;}
     publish(active.snapshot(),null);if(!send({version:1,type:'ready',sessionId:id,simulation:false,liveEnabled:true}))return;
     ready=true;if(pending){const update=pending as NoteUpdate;pending=null;sequence++;send({...update,sessionId:id,sequence});}
    },()=>{finished=true;finish();});
    const initial={ended:false,reason:null,capturing:false,acquiring:true,transcription:null,notes:{accepted:0,rejected:0,applied:0,failures:0,extracting:false,queued:false,timing:new NoteTiming().report()},liveEnabled:true};
    return{audio:frame=>!ended&&Boolean(active?.audio(frame)),edit:(...args)=>!ended&&Boolean(active?.edit(...args)),confirm:(...args)=>!ended&&Boolean(active?.confirm(...args)),beginTurn:async turn=>!ended&&Boolean(await active?.beginTurn(turn)),commit:()=>!ended&&Boolean(active?.commitTurn()),acknowledgeRendered:receipt=>!ended&&Boolean(active?.acknowledgeRendered(receipt)),receive:()=>false,end:stop,disconnected:stop,snapshot:()=>({...active?.probeSnapshot()??initial,ended:finished,reason:finished?'cleanup-unverified':active?.probeSnapshot().reason??null})};
   };
   try{id=scope.open(connection);}finally{createProbe=null;}
   if(!id)finish();
  };
  ws.on('message',(data,binary)=>{
   if(ended)return;
   if(!consented){
    if(binary){finish();return;}
    try{const value=JSON.parse(data.toString());if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==4||!['version','type','noticeVersion','accepted'].every(k=>Object.hasOwn(value,k))||value.version!==1||value.type!=='consent'||value.noticeVersion!=='notes-private-trial-v1'||value.accepted!==true)throw Error();consented=true;clearTimeout(consentDeadline);initialize();}catch{finish();}return;
   }
   if(!ready||!id){finish();return;}
   if(binary){const bytes=Array.isArray(data)?Buffer.concat(data):Buffer.isBuffer(data)?data:Buffer.from(data);const frame=new ArrayBuffer(bytes.byteLength);new Uint8Array(frame).set(bytes);if(!scope.audio(connection,id,frame))finish();return;}
   if(++count>257){finish();return;}let value:unknown;try{value=JSON.parse(data.toString());}catch{finish();return;}
   const ending=!!value&&typeof value==='object'&&(value as {type?:unknown}).type==='end';if(inflight&&!ending||inflight>=2){finish();return;}inflight++;
   void scope.command(connection,value).then(accepted=>{inflight--;if(ended)return;if(!accepted){finish();return;}send({version:1,type:'accepted',sessionId:id,sequence:(value as {sequence:number}).sequence});if(ending)finish();},()=>{inflight--;finish();});
  });
 });
 server.on('upgrade',upgrade);
 const dispose=()=>{if(closed)return;closed=true;server.off('upgrade',upgrade);scope.close();for(const socket of sockets.clients)socket.terminate();sockets.close();};
 server.once('close',dispose);
 return{dispose,snapshot:()=>({...scope.snapshot(),connections:sockets.clients.size,networkAttached:!closed})};
}
