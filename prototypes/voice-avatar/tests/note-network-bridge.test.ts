import {bindSimulatedNoteLifecycle} from '../src/note-browser-lifecycle.ts';
import {PreparedBrowserNoteSession} from '../src/note-browser-session.ts';
import {encodeNoteAudio} from '../src/note-audio-frame.ts';
import type {PreparedRemoteNoteCapture} from '../src/note-remote-capture.ts';
import {NoteBrowserController} from '../src/note-browser-controller.ts';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {createServer} from 'node:http';
import {WebSocket} from 'ws';
import {NoteSessionProbe} from '../src/note-session-probe.ts';
import {NoteUpdateClient} from '../src/note-update-wire.ts';
import {NotebookState} from '../src/notebook-state.ts';
import {attachSimulatedNoteBridge} from '../src/note-network-bridge.ts';
const preview={origin:'https://fixture.onrender.com',password:'fixture_password_only_for_tests_123456'};
const headers={Host:'fixture.onrender.com',Origin:preview.origin,Authorization:'Basic '+Buffer.from('stylist:'+preview.password).toString('base64')};
const cleanups:(()=>Promise<void>)[]=[];
afterEach(async()=>{for(const cleanup of cleanups.splice(0))await cleanup();vi.useRealTimers();vi.restoreAllMocks();});
async function setup(customCreate?:(...args:Parameters<Parameters<typeof attachSimulatedNoteBridge>[1]['create']>)=>any){let ended=false;const probe={audio:vi.fn(()=>false),beginTurn:vi.fn(async()=>true),commit:vi.fn(()=>true),acknowledgeRendered:vi.fn(()=>true),receive:vi.fn(()=>true),end:vi.fn(()=>{ended=true;}),disconnected:vi.fn(()=>{ended=true;}),snapshot:()=>({ended,reason:'ended',transcription:null})};const create=vi.fn(customCreate??(()=>probe as any)),server=createServer((_req,res)=>res.end()),bridge=attachSimulatedNoteBridge(server,{simulation:true,preview,create});await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const addr=server.address();if(!addr||typeof addr==='string')throw Error();const url=`ws://127.0.0.1:${addr.port}/api/notebook-simulation`;cleanups.push(async()=>{bridge.dispose();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));});return{url,bridge,probe,create};}
function connect(url:string,custom=headers){return new Promise<{ws:WebSocket;ready:any}>((resolve,reject)=>{const ws=new WebSocket(url,{headers:custom});ws.on('error',()=>{});ws.once('error',reject);ws.once('message',data=>resolve({ws,ready:JSON.parse(data.toString())}));});}
function refused(url:string,custom:Record<string,string>=headers){return new Promise<number>((resolve,reject)=>{const ws=new WebSocket(url,{headers:custom});ws.on('error',()=>{});ws.once('unexpected-response',(_req,res)=>{res.resume();resolve(res.statusCode!);ws.terminate();});ws.once('open',()=>{ws.terminate();reject(Error('Unexpected upgrade'));});});}
const closed=(ws:WebSocket)=>new Promise<void>(r=>ws.once('close',()=>r()));
const message=(ws:WebSocket)=>new Promise<any>(r=>ws.once('message',data=>r(JSON.parse(data.toString()))));
const begin=(id:string,sequence=1)=>({version:1,type:'begin',sessionId:id,sequence,turnId:'turn1'});
describe('disabled simulated note network bridge',()=>{
 it('requires explicit simulation before attaching network listeners',()=>{const server=createServer(),create=vi.fn();expect(()=>attachSimulatedNoteBridge(server,{preview,create})).toThrow('disabled');expect(server.listenerCount('upgrade')).toBe(0);expect(create).not.toHaveBeenCalled();});
 it.each(['missingAuth','wrongAuth','origin','missingOrigin','host','query','path','protocol'])('rejects %s before constructing any session',async kind=>{const s=await setup(),h:Record<string,string>={...headers};let url=s.url;if(kind==='missingAuth')delete h.Authorization;if(kind==='wrongAuth')h.Authorization='Basic bad';if(kind==='origin')h.Origin='https://evil.example';if(kind==='missingOrigin')delete h.Origin;if(kind==='host')h.Host='evil.example';if(kind==='query')url+='?token=private';if(kind==='path')url=url.replace('notebook-simulation','other');if(kind==='protocol')h['Sec-WebSocket-Protocol']='private';expect(await refused(url,h)).toBe(kind.includes('Auth')?401:403);expect(s.create).not.toHaveBeenCalled();});
 it('upgrades with existing private credentials and accepts a bound command',async()=>{const s=await setup(),{ws,ready}=await connect(s.url);expect(ready).toMatchObject({version:1,type:'ready',simulation:true,liveEnabled:false});const reply=message(ws);ws.send(JSON.stringify(begin(ready.sessionId)));expect(await reply).toMatchObject({type:'accepted',sequence:1,sessionId:ready.sessionId});expect(s.probe.beginTurn).toHaveBeenCalledWith('turn1');});
 it('rejects a second actual socket connection while one owns the session',async()=>{const s=await setup();await connect(s.url);expect(await refused(s.url)).toBe(409);expect(s.create).toHaveBeenCalledTimes(1);});
 it.each(['invalidJson','binary','oversized','wrongSession','duplicate','extra'])('ends and cleans up on %s input',async kind=>{const s=await setup(),{ws,ready}=await connect(s.url);if(kind==='duplicate'){const reply=message(ws);ws.send(JSON.stringify(begin(ready.sessionId)));await reply;}const done=closed(ws);if(kind==='invalidJson')ws.send('{bad');else if(kind==='binary')ws.send(Buffer.alloc(20));else if(kind==='oversized')ws.send('x'.repeat(1025));else if(kind==='extra')ws.send(JSON.stringify({...begin(ready.sessionId),owner:'fake'}));else ws.send(JSON.stringify(begin(kind==='wrongSession'?'old':ready.sessionId)));await done;expect(s.probe.disconnected).toHaveBeenCalledTimes(1);expect(s.bridge.snapshot().active).toBe(false);});
 it('cleans up once when the client disconnects',async()=>{const s=await setup(),{ws}=await connect(s.url),done=closed(ws);ws.close();await done;await vi.waitFor(()=>expect(s.probe.disconnected).toHaveBeenCalledTimes(1));});
 it('cancels a delayed start when an end arrives without reviving the session',async()=>{const s=await setup(),{ws,ready}=await connect(s.url);let release!:(v:boolean)=>void,started!:(v?:unknown)=>void;const pending=new Promise(r=>{started=r;});s.probe.beginTurn.mockImplementation(()=>{started();return new Promise(r=>{release=r;});});ws.send(JSON.stringify(begin(ready.sessionId)));await pending;const done=closed(ws);ws.send(JSON.stringify({version:1,type:'end',sessionId:ready.sessionId,sequence:2}));await done;release(true);await Promise.resolve();expect(s.probe.end).toHaveBeenCalledTimes(1);expect(s.bridge.snapshot().active).toBe(false);});
 it('bounds commands arriving while a start is pending',async()=>{const s=await setup(),{ws,ready}=await connect(s.url);s.probe.beginTurn.mockImplementation(()=>new Promise(()=>{}));const done=closed(ws);ws.send(JSON.stringify(begin(ready.sessionId)));ws.send(JSON.stringify(begin(ready.sessionId,2)));await done;expect(s.probe.beginTurn).toHaveBeenCalledTimes(1);expect(s.probe.disconnected).toHaveBeenCalledTimes(1);});
 it('clears an actual simulated notebook owner after network disconnection',async()=>{const notebook=new NotebookState(),wireClose=vi.fn();let probe!:NoteSessionProbe;const s=await setup(publish=>{probe=new NoteSessionProbe({simulation:true,notebook,capture:{start:async()=>true,stop:vi.fn()},wire:{bufferedAmount:0,send:()=>true,close:wireClose},extract:async()=>[{field:'color',value:'green',evidence:'green',confirmed:false}],changed:receipt=>publish(notebook.snapshot(),receipt),invalidated:()=>publish(notebook.snapshot(),null)});return probe;});const {ws,ready}=await connect(s.url);probe.receive({type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:'gpt-live-transcribe'},turn_detection:null}}}});const reply=message(ws);ws.send(JSON.stringify(begin(ready.sessionId)));await reply;const update=message(ws);probe.receive({type:'conversation.item.input_audio_transcription.delta',event_id:'ev1',item_id:'item1',content_index:0,delta:'green'});expect((await update).notes.color).toMatchObject({value:'green',status:'tentative'});await vi.waitFor(()=>expect(notebook.snapshot().notes.color.value).toBe('green'));const done=closed(ws);ws.close();await done;await vi.waitFor(()=>expect(notebook.snapshot().notes.color.status).toBe('missing'));expect(probe.snapshot().ended).toBe(true);expect(wireClose).toHaveBeenCalledTimes(1);});
 it('delivers bounded notebook snapshots to the client state and a render receipt back',async()=>{let publish!:(snapshot:ReturnType<NotebookState['snapshot']>,receipt:number|null)=>void;let ended=false;const ack=vi.fn(()=>true),notebook=new NotebookState(),s=await setup(p=>{publish=p;return{beginTurn:async()=>true,commit:()=>true,acknowledgeRendered:ack,receive:()=>true,end:()=>{ended=true;},disconnected:()=>{ended=true;},snapshot:()=>({ended,reason:'ended',transcription:null})};}),{ws,ready}=await connect(s.url),client=new NoteUpdateClient();client.ready(ready);notebook.capture({session:1,field:'color',baseRevision:0,sequence:1,value:'not green',confirmed:false});const update=message(ws);publish(notebook.snapshot(),9);expect(client.accept(await update)).toBe(true);expect(client.snapshot()!.notes.color.value).toBe('not green');const reply=message(ws);ws.send(JSON.stringify(client.rendered(1,1)));expect((await reply).type).toBe('accepted');expect(ack).toHaveBeenCalledWith(9);const done=closed(ws);ws.close();await done;client.disconnect();expect(client.snapshot()).toBeNull();});
 it('holds malformed notebook snapshots and closes the owned socket',async()=>{let publish!:(snapshot:any,receipt:number|null)=>void;const stub={beginTurn:async()=>true,commit:()=>true,acknowledgeRendered:()=>true,receive:()=>true,end:()=>{},disconnected:vi.fn(),snapshot:()=>({ended:false,reason:null,transcription:null})},s=await setup(p=>{publish=p;return stub;}),{ws}=await connect(s.url),done=closed(ws);const bad=new NotebookState().snapshot();bad.notes.color.value='x'.repeat(161);publish(bad,null);await done;expect(stub.disconnected).toHaveBeenCalledTimes(1);});
 it('binds old publishers to their original socket after a new owner connects',async()=>{const publishers:((snapshot:ReturnType<NotebookState['snapshot']>,receipt:number|null)=>void)[]=[];const s=await setup(p=>{publishers.push(p);let ended=false;return{beginTurn:async()=>true,commit:()=>true,acknowledgeRendered:()=>true,receive:()=>true,end:()=>{ended=true;},disconnected:()=>{ended=true;},snapshot:()=>({ended,reason:'ended',transcription:null})};});const first=await connect(s.url),done=closed(first.ws);first.ws.close();await done;await vi.waitFor(()=>expect(s.bridge.snapshot().active).toBe(false));const fresh=await connect(s.url);const received:any[]=[];fresh.ws.on('message',data=>received.push(JSON.parse(data.toString())));const notebook=new NotebookState();notebook.edit('color','private old sentinel');publishers[0]!(notebook.snapshot(),1);const valid=message(fresh.ws);notebook.edit('color','blue');publishers[1]!(notebook.snapshot(),2);expect((await valid).notes.color.value).toBe('blue');expect(JSON.stringify(received)).not.toContain('sentinel');});
 it('sends readiness before an initial snapshot emitted during construction',async()=>{const s=await setup(publish=>{let ended=false;publish(new NotebookState().snapshot(),null);return{beginTurn:async()=>true,commit:()=>true,acknowledgeRendered:()=>true,receive:()=>true,end:()=>{ended=true;},disconnected:()=>{ended=true;},snapshot:()=>({ended,reason:'ended',transcription:null})};});const events:any[]=[];await new Promise<void>((resolve,reject)=>{const ws=new WebSocket(s.url,{headers});ws.on('error',reject);ws.on('message',data=>{events.push(JSON.parse(data.toString()));if(events.length===2)resolve();});});expect(events.map(e=>e.type)).toEqual(['ready','notes']);expect(events[1].sessionId).toBe(events[0].sessionId);});
 it('cleans up an initial invalid snapshot without leaving an owned session',async()=>{let ended=false;const disconnected=vi.fn(()=>{ended=true;}),s=await setup(publish=>{const bad=new NotebookState().snapshot();bad.notes.color.value='invalid missing value';publish(bad,null);return{beginTurn:async()=>true,commit:()=>true,acknowledgeRendered:()=>true,receive:()=>true,end:()=>{ended=true;},disconnected,snapshot:()=>({ended,reason:'ended',transcription:null})};});const ws=new WebSocket(s.url,{headers});ws.on('error',()=>{});await closed(ws);expect(disconnected).toHaveBeenCalledTimes(1);expect(s.bridge.snapshot().active).toBe(false);});
 it('ends an idle connection at the existing 85-second deadline',async()=>{const s=await setup();vi.useFakeTimers();const {ws}=await connect(s.url),done=closed(ws);await vi.advanceTimersByTimeAsync(85000);await done;expect(s.probe.disconnected).toHaveBeenCalledTimes(1);expect(s.bridge.snapshot().active).toBe(false);vi.useRealTimers();});
 it('disposes the attachment and existing session without exposing credentials',async()=>{const s=await setup(),{ws}=await connect(s.url),done=closed(ws);s.bridge.dispose();await done;expect(s.bridge.snapshot()).toMatchObject({networkAttached:false,closed:true,active:false});expect(s.probe.end).toHaveBeenCalledTimes(1);expect(JSON.stringify(s.bridge.snapshot())).not.toContain(preview.password);});
});

describe('browser controller with real loopback socket and simulated providers',()=>{
 it('carries customer edits, confirmations and disconnect cleanup through the owner',async()=>{
   const notebook=new NotebookState();notebook.capture({session:1,field:'color',baseRevision:0,sequence:1,value:'green',confirmed:false});
   let probe!:NoteSessionProbe;
   const s=await setup(publish=>{probe=new NoteSessionProbe({simulation:true,notebook,capture:{start:async()=>true,stop:vi.fn()},wire:{bufferedAmount:0,send:()=>true,close:vi.fn()},extract:async()=>[],changed:receipt=>publish(notebook.snapshot(),receipt),invalidated:()=>publish(notebook.snapshot(),null)});publish(notebook.snapshot(),null);return probe;});
   const ws=new WebSocket(s.url,{headers}),changed=vi.fn(),controller=new NoteBrowserController({simulation:true,socket:{send:value=>ws.send(value),close:()=>ws.close(),get bufferedAmount(){return ws.bufferedAmount;}},changed});
   ws.on('message',data=>controller.receive(JSON.parse(data.toString())));ws.on('close',()=>controller.disconnected());ws.on('error',()=>controller.disconnected());
   await vi.waitFor(()=>expect(controller.snapshot().notes?.notes.color.status).toBe('tentative'));
   expect(controller.confirm('color')).toBe(true);
   await vi.waitFor(()=>{expect(controller.snapshot().pending).toBe(false);expect(controller.snapshot().notes?.notes.color.status).toBe('confirmed');});
   expect(controller.edit('color','Blue')).toBe(true);
   await vi.waitFor(()=>{expect(controller.snapshot().pending).toBe(false);expect(controller.snapshot().notes?.notes.color.value).toBe('Blue');});
   expect(notebook.snapshot().notes.color).toMatchObject({value:'Blue',revision:3,source:'touch'});
   controller.stop();await vi.waitFor(()=>expect(probe.snapshot().ended).toBe(true));expect(notebook.snapshot().notes.color.status).toBe('missing');expect(controller.snapshot().notes).toBeNull();
 });
 it('ends a stale customer command instead of overwriting a newer server value',async()=>{
   const notebook=new NotebookState();let probe!:NoteSessionProbe;
   const s=await setup(publish=>{probe=new NoteSessionProbe({simulation:true,notebook,capture:{start:async()=>true,stop:vi.fn()},wire:{bufferedAmount:0,send:()=>true,close:vi.fn()},extract:async()=>[],changed:receipt=>publish(notebook.snapshot(),receipt),invalidated:()=>publish(notebook.snapshot(),null)});return probe;});
   const {ws,ready}=await connect(s.url);notebook.edit('color','Newer');const done=closed(ws);ws.send(JSON.stringify({version:1,sessionId:ready.sessionId,sequence:1,type:'edit',field:'color',value:'Stale',expectedRevision:0}));await done;await vi.waitFor(()=>expect(probe.snapshot().ended).toBe(true));expect(notebook.snapshot().notes.color.value).toBe('');
 });
});

describe('bounded binary audio over owned loopback connection',()=>{
 it('carries synthetic PCM through transcription preparation and returns tentative notebook notes',async()=>{
   const notebook=new NotebookState(),wireSend=vi.fn((_event:object)=>true);let probe!:NoteSessionProbe;
   const s=await setup((publish,capture)=>{probe=new NoteSessionProbe({simulation:true,notebook,capture,wire:{bufferedAmount:0,send:wireSend,close:vi.fn()},extract:async()=>[{field:'color',value:'green',evidence:'green',confirmed:false}],changed:r=>publish(notebook.snapshot(),r),invalidated:()=>publish(notebook.snapshot(),null)});publish(notebook.snapshot(),null);return probe;});
   const ws=new WebSocket(s.url,{headers}),controller=new NoteBrowserController({simulation:true,socket:{send:v=>ws.send(v),close:()=>ws.close(),get bufferedAmount(){return ws.bufferedAmount;}},changed:vi.fn()});
   ws.on('message',data=>controller.receive(JSON.parse(data.toString())));ws.on('close',()=>controller.disconnected());ws.on('error',()=>controller.disconnected());
   await vi.waitFor(()=>expect(controller.snapshot().notes).not.toBeNull());
   probe.receive({type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:'gpt-live-transcribe'},turn_detection:null}}}});
   expect(controller.begin('t1')).toBe(true);await vi.waitFor(()=>expect(controller.snapshot().pending).toBe(false));
   for(let i=0;i<5;i++)expect(controller.audio(new ArrayBuffer(960))).toBe(true);
   expect(controller.commit()).toBe(true);await vi.waitFor(()=>expect(controller.snapshot().pending).toBe(false));
   expect(probe.snapshot().transcription?.audioBytes).toBe(4800);expect(wireSend.mock.calls.filter(([e])=>(e as any).type==='input_audio_buffer.append')).toHaveLength(5);
   probe.receive({type:'input_audio_buffer.committed',event_id:'c1',item_id:'i1'});
   probe.receive({type:'conversation.item.input_audio_transcription.delta',event_id:'d1',item_id:'i1',content_index:0,delta:'green'});
   await vi.waitFor(()=>expect(controller.snapshot().notes?.notes.color).toMatchObject({value:'green',status:'tentative'}));
   controller.stop();await vi.waitFor(()=>expect(probe.snapshot().ended).toBe(true));expect(notebook.snapshot().notes.color.status).toBe('missing');
 });
});

describe('owned audio frame failure cleanup',()=>{
 it.each(['replay','gap','version'])('stops media and clears notes on %s',async kind=>{
   const notebook=new NotebookState();notebook.edit('color','green');let probe!:NoteSessionProbe;const close=vi.fn();
   const s=await setup((_publish,capture)=>{probe=new NoteSessionProbe({simulation:true,notebook,capture,wire:{bufferedAmount:0,send:()=>true,close},extract:async()=>[],changed:vi.fn()});return probe;});const {ws,ready}=await connect(s.url);
   probe.receive({type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:'gpt-live-transcribe'},turn_detection:null}}}});
   const accepted=message(ws);ws.send(JSON.stringify(begin(ready.sessionId)));await accepted;
   ws.send(encodeNoteAudio(new ArrayBuffer(960),0));await vi.waitFor(()=>expect(probe.snapshot().transcription?.audioBytes).toBe(960));
   const bad=encodeNoteAudio(new ArrayBuffer(960),kind==='replay'?0:kind==='gap'?2:1);if(kind==='version')new DataView(bad).setUint32(0,2);
   const done=closed(ws);ws.send(bad);await done;await vi.waitFor(()=>expect(probe.snapshot().ended).toBe(true));expect(notebook.snapshot().notes.color.status).toBe('missing');expect(close).toHaveBeenCalledTimes(1);expect(probe.snapshot().transcription?.audioBytes).toBe(960);
 });
});

describe('browser capture orchestration over actual loopback transport',()=>{
 it('discards pre-ack frames, commits delivered audio, returns notes and stops on page exit',async()=>{
   const notebook=new NotebookState();let probe!:NoteSessionProbe;const s=await setup((publish,capture)=>{probe=new NoteSessionProbe({simulation:true,notebook,capture,wire:{bufferedAmount:0,send:()=>true,close:vi.fn()},extract:async()=>[{field:'color',value:'green',evidence:'green',confirmed:false}],changed:r=>publish(notebook.snapshot(),r)});publish(notebook.snapshot(),null);return probe;});
   let accept!:(pcm:ArrayBuffer)=>boolean,stopped!:(reason:string)=>void;const capture={start:vi.fn(async(a:(pcm:ArrayBuffer)=>boolean,e:(reason:string)=>void)=>{accept=a;stopped=e;expect(accept(new ArrayBuffer(960))).toBe(true);return true;}),stop:vi.fn(()=>stopped?.('requested'))};
   const ws=new WebSocket(s.url,{headers}),session=new PreparedBrowserNoteSession({simulation:true,capture,socket:{send:v=>ws.send(v),close:()=>ws.close(),get bufferedAmount(){return ws.bufferedAmount;}},changed:vi.fn()});
   ws.on('message',data=>session.receive(JSON.parse(data.toString())));ws.on('close',()=>session.disconnected());ws.on('error',()=>session.disconnected());
   await vi.waitFor(()=>expect(session.snapshot().connection.notes).not.toBeNull());probe.receive({type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:'gpt-live-transcribe'},turn_detection:null}}}});
   expect(await session.startTurn('t1')).toBe(true);await vi.waitFor(()=>expect(session.snapshot().connection.pending).toBe(false));expect(probe.snapshot().transcription?.audioBytes).toBe(0);
   for(let i=0;i<5;i++)expect(accept(new ArrayBuffer(960))).toBe(true);expect(session.commit()).toBe(true);await vi.waitFor(()=>expect(session.snapshot().connection.pending).toBe(false));expect(probe.snapshot().transcription?.audioBytes).toBe(4800);expect(accept(new ArrayBuffer(960))).toBe(false);
   probe.receive({type:'input_audio_buffer.committed',event_id:'c1',item_id:'i1'});probe.receive({type:'conversation.item.input_audio_transcription.delta',event_id:'d1',item_id:'i1',content_index:0,delta:'green'});await vi.waitFor(()=>expect(session.snapshot().connection.notes?.notes.color.value).toBe('green'));
   session.hidden();await vi.waitFor(()=>expect(probe.snapshot().ended).toBe(true));expect(capture.stop).toHaveBeenCalled();expect(session.snapshot().connection.notes).toBeNull();expect(notebook.snapshot().notes.color.status).toBe('missing');
 });
});

describe('provider-confirmed repeated turns over loopback',()=>{
 it('holds another acquisition until provider commit then applies the next spoken correction',async()=>{
   const notebook=new NotebookState();let probe!:NoteSessionProbe;
   const s=await setup((publish,capture,turnReady)=>{probe=new NoteSessionProbe({simulation:true,notebook,capture,turnReady,wire:{bufferedAmount:0,send:()=>true,close:vi.fn()},extract:async input=>[{field:'color',value:input.text,evidence:input.text,confirmed:false}],changed:r=>publish(notebook.snapshot(),r)});publish(notebook.snapshot(),null);return probe;});
   let frame!:(pcm:ArrayBuffer)=>boolean;const capture={start:vi.fn(async(a:(pcm:ArrayBuffer)=>boolean)=>{frame=a;return true;}),stop:vi.fn()},ws=new WebSocket(s.url,{headers}),session=new PreparedBrowserNoteSession({simulation:true,capture,socket:{send:v=>ws.send(v),close:()=>ws.close(),get bufferedAmount(){return ws.bufferedAmount;}},changed:vi.fn()});
   ws.on('message',d=>session.receive(JSON.parse(d.toString())));ws.on('close',()=>session.disconnected());ws.on('error',()=>session.disconnected());
   await vi.waitFor(()=>expect(session.snapshot().connection.notes).not.toBeNull());probe.receive({type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:'gpt-live-transcribe'},turn_detection:null}}}});
   expect(await session.startTurn('t1')).toBe(true);await vi.waitFor(()=>expect(session.snapshot().connection.pending).toBe(false));for(let i=0;i<5;i++)frame(new ArrayBuffer(960));expect(session.commit()).toBe(true);await vi.waitFor(()=>expect(session.snapshot().connection.pending).toBe(false));
   expect(await session.startTurn('t2')).toBe(false);expect(capture.start).toHaveBeenCalledTimes(1);
   probe.receive({type:'input_audio_buffer.committed',event_id:'c1',item_id:'i1'});probe.receive({type:'conversation.item.input_audio_transcription.completed',event_id:'d1',item_id:'i1',content_index:0,transcript:'green'});await vi.waitFor(()=>expect(session.snapshot().connection.notes?.notes.color.value).toBe('green'));
   await vi.waitFor(()=>expect(session.snapshot().connection.awaitingProvider).toBe(false));expect(await session.startTurn('t2')).toBe(true);await vi.waitFor(()=>expect(session.snapshot().connection.pending).toBe(false));for(let i=0;i<5;i++)frame(new ArrayBuffer(960));expect(session.commit()).toBe(true);await vi.waitFor(()=>expect(session.snapshot().connection.pending).toBe(false));
   probe.receive({type:'input_audio_buffer.committed',event_id:'c2',item_id:'i2'});probe.receive({type:'conversation.item.input_audio_transcription.completed',event_id:'d2',item_id:'i2',content_index:0,transcript:'blue'});await vi.waitFor(()=>expect(session.snapshot().connection.notes?.notes.color).toMatchObject({value:'blue',status:'tentative'}));expect(probe.snapshot().transcription?.audioBytes).toBe(9600);expect(capture.start).toHaveBeenCalledTimes(2);session.stop();await vi.waitFor(()=>expect(probe.snapshot().ended).toBe(true));
 });
});

describe('retired readiness callback isolation',()=>{
 it('keeps old turn-ready callbacks bound to their original connection',async()=>{const callbacks:((turnId:string)=>void)[]=[];const s=await setup((_publish,_capture,turnReady)=>{callbacks.push(turnReady);let ended=false;return{beginTurn:async()=>true,commit:()=>true,audio:()=>false,edit:()=>true,confirm:()=>true,receive:()=>true,acknowledgeRendered:()=>true,end:()=>{ended=true;},disconnected:()=>{ended=true;},snapshot:()=>({ended,reason:'ended',transcription:null})};});const first=await connect(s.url),done=closed(first.ws);first.ws.close();await done;await vi.waitFor(()=>expect(s.bridge.snapshot().active).toBe(false));const fresh=await connect(s.url),received:any[]=[];fresh.ws.on('message',d=>received.push(JSON.parse(d.toString())));callbacks[0]!('private_old_sentinel');const next=message(fresh.ws);callbacks[1]!('new_turn');expect(await next).toMatchObject({type:'turn-ready',sessionId:fresh.ready.sessionId,turnId:'new_turn'});expect(JSON.stringify(received)).not.toContain('sentinel');});
});

describe('complete simulated lifecycle over loopback transport',()=>{
 async function lifecycle(){
   const notebook=new NotebookState();let probe!:NoteSessionProbe;
   const s=await setup((publish,capture,turnReady)=>{probe=new NoteSessionProbe({simulation:true,notebook,capture,turnReady,wire:{bufferedAmount:0,send:()=>true,close:vi.fn()},extract:async input=>[{field:'color',value:input.text,evidence:input.text,confirmed:false}],changed:r=>publish(notebook.snapshot(),r)});publish(notebook.snapshot(),null);return probe;});
   let frame!:(pcm:ArrayBuffer)=>boolean;
   const capture={start:vi.fn(async(a:(pcm:ArrayBuffer)=>boolean)=>{frame=a;return true;}),stop:vi.fn()};
   const ws=new WebSocket(s.url,{headers}),events=new EventTarget(),page=new EventTarget(),visibility=Object.assign(new EventTarget(),{hidden:false}),status=vi.fn();
   const session=new PreparedBrowserNoteSession({simulation:true,capture,socket:{send:v=>ws.send(v),close:()=>ws.close(),get bufferedAmount(){return ws.bufferedAmount;}},changed:vi.fn()});
   const binding=bindSimulatedNoteLifecycle({simulation:true,session,socket:events,page,visibility,status});
   ws.on('message',d=>events.dispatchEvent(new MessageEvent('message',{data:d.toString()})));ws.on('close',()=>events.dispatchEvent(new Event('close')));ws.on('error',()=>events.dispatchEvent(new Event('error')));
   cleanups.push(async()=>{binding.dispose();if(ws.readyState===WebSocket.OPEN)ws.terminate();});
   await vi.waitFor(()=>expect(session.snapshot().connection.notes).not.toBeNull());
   probe.receive({type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:'gpt-live-transcribe'},turn_detection:null}}}});
   return{...s,probe,notebook,ws,events,page,visibility,status,capture,session,binding,frame:()=>frame(new ArrayBuffer(960))};
 }
 it('updates two spoken turns and closes both owners through pagehide',async()=>{
   const s=await lifecycle();
   for(const [index,color] of ['green','blue'].entries()){
     expect(await s.session.startTurn(`turn${index}`)).toBe(true);await vi.waitFor(()=>expect(s.session.snapshot().connection.pending).toBe(false));
     for(let n=0;n<5;n++)expect(s.frame()).toBe(true);
     expect(s.session.commit()).toBe(true);s.binding.refresh();expect(s.status.mock.lastCall![0].state).toBe('processing');
     await vi.waitFor(()=>expect(s.session.snapshot().connection.pending).toBe(false));expect(await s.session.startTurn('premature')).toBe(false);
     s.probe.receive({type:'input_audio_buffer.committed',event_id:`c${index}`,item_id:`i${index}`});
     s.probe.receive({type:'conversation.item.input_audio_transcription.completed',event_id:`f${index}`,item_id:`i${index}`,content_index:0,transcript:color});
     await vi.waitFor(()=>{expect(s.session.snapshot().connection.awaitingProvider).toBe(false);expect(s.session.snapshot().connection.notes?.notes.color.value).toBe(color);expect(s.status.mock.lastCall![0].state).toBe('ready');});
   }
   expect(s.capture.start).toHaveBeenCalledTimes(2);expect(s.probe.snapshot().transcription?.audioBytes).toBe(9600);
   s.page.dispatchEvent(new Event('pagehide'));await vi.waitFor(()=>expect(s.probe.snapshot().ended).toBe(true));
   expect(s.session.snapshot().connection.notes).toBeNull();expect(s.notebook.snapshot().notes.color.status).toBe('missing');expect(s.frame()).toBe(false);expect(s.status.mock.lastCall![0].message).toContain('page was hidden');
 });
 it('stops active capture when the actual transport closes',async()=>{
   const s=await lifecycle();expect(await s.session.startTurn('t1')).toBe(true);await vi.waitFor(()=>expect(s.session.snapshot().connection.pending).toBe(false));expect(s.frame()).toBe(true);
   s.ws.terminate();await vi.waitFor(()=>{expect(s.probe.snapshot().ended).toBe(true);expect(s.session.snapshot().ended).toBe(true);});
   expect(s.capture.stop).toHaveBeenCalled();expect(s.frame()).toBe(false);expect(s.session.snapshot().connection.notes).toBeNull();expect(s.status.mock.lastCall![0].message).toContain('connection ended');
 });
 it('releases permission granted after page exit without sending any audio',async()=>{
   const s=await lifecycle();let resolve!:(value:boolean)=>void;s.capture.start.mockImplementation(()=>new Promise(r=>{resolve=r;}));
   const pending=s.session.startTurn('late');s.binding.refresh();expect(s.status.mock.lastCall![0].state).toBe('requesting-device');s.page.dispatchEvent(new Event('pagehide'));resolve(true);expect(await pending).toBe(false);
   await vi.waitFor(()=>expect(s.probe.snapshot().ended).toBe(true));expect(s.capture.stop).toHaveBeenCalledTimes(2);expect(s.probe.snapshot().transcription?.audioBytes).toBe(0);expect(await s.session.startTurn('new')).toBe(false);
 });
});


describe('bounded safe clarification network messages',()=>{
 const record={version:1 as const,profileRevision:1,notebookSession:1,notebookRevision:0,checkId:1,issues:[{field:'color' as const,reason:'request-conflict' as const}]};
 function stub(){let ended=false;return{audio:()=>false,beginTurn:async()=>true,commit:()=>true,acknowledgeRendered:()=>true,receive:()=>true,end:()=>{ended=true;},disconnected:()=>{ended=true;},snapshot:()=>({ended,reason:'ended',transcription:null})} as any;}
 it('orders initial ready, notes and clarification emitted during construction',async()=>{const s=await setup((publish,_capture,_turn,_end,_ready,_req,clarify)=>{clarify(record);publish(new NotebookState().snapshot(),null);return stub();});const events:any[]=[];const ws=new WebSocket(s.url,{headers});ws.on('error',()=>{});ws.on('message',data=>events.push(JSON.parse(data.toString())));await vi.waitFor(()=>expect(events).toHaveLength(3));expect(events.map(e=>e.type)).toEqual(['ready','notes','clarification']);expect(events[2]).toMatchObject({sessionId:events[0].sessionId,sequence:1,record});ws.terminate();});
 it.each(['private','revision','duplicate-issue'])('closes on unsafe server publication %s',async kind=>{let clarify!:(value:any)=>void;const s=await setup((publish,_capture,_turn,_end,_ready,_req,c)=>{clarify=c;publish(new NotebookState().snapshot(),null);return stub();});const {ws}=await connect(s.url),done=closed(ws);const invalid:any={...record};if(kind==='private')invalid.savedValue='private';if(kind==='revision')invalid.notebookRevision=1;if(kind==='duplicate-issue')invalid.issues=[...record.issues,...record.issues];clarify(invalid);await done;expect(s.bridge.snapshot().active).toBe(false);});
 it('bounds clarification publication independently of note updates',async()=>{let clarify!:(value:any)=>void;const s=await setup((publish,_capture,_turn,_end,_ready,_req,c)=>{clarify=c;publish(new NotebookState().snapshot(),null);return stub();});const {ws}=await connect(s.url),done=closed(ws);for(let i=0;i<513;i++)clarify(null);await done;expect(s.bridge.snapshot().active).toBe(false);});
 it('keeps old clarification publishers bound to their closed socket',async()=>{const publishers:((record:any)=>void)[]=[];const s=await setup((publish,_capture,_turn,_end,_ready,_req,clarify)=>{publishers.push(clarify);publish(new NotebookState().snapshot(),null);return stub();});const first=await connect(s.url),done=closed(first.ws);first.ws.close();await done;await vi.waitFor(()=>expect(s.bridge.snapshot().active).toBe(false));const second=await connect(s.url),events:any[]=[];second.ws.on('message',data=>events.push(JSON.parse(data.toString())));publishers[0]!(record);publishers[1]!(record);await vi.waitFor(()=>expect(events.filter(x=>x.type==='clarification')).toHaveLength(1));expect(events.find(x=>x.type==='clarification')).toMatchObject({sessionId:second.ready.sessionId,sequence:1});second.ws.terminate();});
});
