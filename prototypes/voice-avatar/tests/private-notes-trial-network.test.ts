import {afterEach,it,expect,vi} from 'vitest';
import {createServer} from 'node:http';
import {isDeepStrictEqual} from 'node:util';
import {WebSocket} from 'ws';
import {attachPrivateNotesTrialNetwork} from '../src/private-notes-trial-network.ts';
import {createPrivateNotesTrialExecution} from '../src/note-execution.ts';
import {PrivateNotesTrialLedgerOwner} from '../src/private-notes-trial-ledger.ts';
import {PreparedBrowserNoteSession} from '../src/note-browser-session.ts';
import {bindSimulatedNoteLifecycle} from '../src/note-browser-lifecycle.ts';
import {TRANSCRIPTION_MODEL} from '../src/live-transcription.ts';
import {NOTE_EXTRACTION_MODEL} from '../src/openai-note-extractor.ts';
const cleanups:Array<()=>Promise<void>>=[];afterEach(async()=>{for(const close of cleanups.splice(0))await close();});
const preview={origin:'https://fixture.onrender.com',password:'synthetic_preview_password_1234567890'};
it('rejects missing trusted activation before attaching',()=>{const server=createServer();expect(()=>attachPrivateNotesTrialNetwork(server,{simulation:true} as never)).toThrow('disabled');expect(server.listenerCount('upgrade')).toBe(0);});
it('carries private-mode two completed budget turns, touch confirmation and retained shutdown through loopback',async()=>{
 let saved:any={version:1,purpose:'notes-only-private-trial',approval:{id:'synthetic_not_approval',cents:200,maxSeconds:85,maxTurns:2,maxExtractions:64,maxInputTokens:1000000,maxOutputTokens:2048},reservation:null};
 const persistence={read:async()=>structuredClone(saved),compareAndSwap:async(before:unknown,after:unknown)=>{if(!isDeepStrictEqual(before,saved))return false;saved=structuredClone(after);return true;}};
 const socket=Object.assign(new EventTarget(),{readyState:1,bufferedAmount:0,send:vi.fn(),close:vi.fn()});
 socket.send.mockImplementation(text=>{if(JSON.parse(text).type==='session.update')queueMicrotask(()=>message({type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:TRANSCRIPTION_MODEL},turn_detection:null}}}}));});
 const message=(value:unknown)=>socket.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(value)}));
 const fetch=vi.fn(async(_url:string,init:RequestInit)=>{const input=JSON.parse(JSON.parse(init.body as string).input[0].content[0].text);return Response.json({model:NOTE_EXTRACTION_MODEL,status:'completed',output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:JSON.stringify({version:1,turnId:input.turnId,patches:[{field:'budget',value:input.currentFragment,evidence:input.currentFragment}]})}]}]});});
 const countFetch=vi.fn(async()=>Response.json({object:'response.input_tokens',input_tokens:100})),dispose=vi.fn();
 const server=createServer((_req,res)=>res.end());const bridge=attachPrivateNotesTrialNetwork(server,{activation:{approvalId:'synthetic_not_approval',financialApproved:true,securityApproved:true,authorize:async()=>createPrivateNotesTrialExecution({financialApproved:true,securityApproved:true,ledger:await persistence.read()})},preview,allowance:new PrivateNotesTrialLedgerOwner(persistence),createTransports:(_id,_execution,capture)=>({capture,fetch,countFetch,dispose,open:async(_signal,initial)=>{initial({type:'session.created',session:{id:'synthetic'}});return{socket,detachInitialEvents:()=>{}};}})});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const address=server.address();if(!address||typeof address==='string')throw Error('address');
 const ws=new WebSocket(`ws://127.0.0.1:${address.port}/api/private-notes-trial`,{headers:{Host:'fixture.onrender.com',Origin:preview.origin,Authorization:'Basic '+Buffer.from('stylist:'+preview.password).toString('base64')}});
 const events=new EventTarget(),page=new EventTarget(),visibility=Object.assign(new EventTarget(),{hidden:false});let pcm!:(value:ArrayBuffer)=>boolean;
 const capture={start:vi.fn(async(accept:(v:ArrayBuffer)=>boolean)=>{pcm=accept;return true;}),stop:vi.fn()};
 const session=new PreparedBrowserNoteSession({privateTrial:true,capture,socket:{send:value=>ws.send(value),close:()=>ws.close(),get bufferedAmount(){return ws.bufferedAmount;}},changed:vi.fn()});
 const binding=bindSimulatedNoteLifecycle({privateTrial:true,session,socket:events,page,visibility,status:vi.fn()});
 ws.on('open',()=>ws.send(JSON.stringify({version:1,type:'consent',noticeVersion:'notes-private-trial-v1',accepted:true})));
 ws.on('message',data=>events.dispatchEvent(new MessageEvent('message',{data:data.toString()})));ws.on('close',()=>events.dispatchEvent(new Event('close')));ws.on('error',()=>events.dispatchEvent(new Event('error')));
 cleanups.push(async()=>{binding.dispose();ws.terminate();bridge.dispose();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));});
 await vi.waitFor(()=>expect(session.status().state).toBe('ready'));
 expect(session.snapshot().liveEnabled).toBe(true);expect(bridge.snapshot().liveEnabled).toBe(true);
 for(const [index,value] of [[1,'USD 500 maximum (items only)'],[2,'USD 350 maximum (items only)']] as const){
  expect(await session.startTurn('t'+index)).toBe(true);await vi.waitFor(()=>expect(session.snapshot().connection.audioActive).toBe(true));for(let i=0;i<5;i++)expect(pcm(new ArrayBuffer(960))).toBe(true);
  await vi.waitFor(()=>expect(socket.send.mock.calls.filter(([text])=>JSON.parse(text).type==='input_audio_buffer.append')).toHaveLength(index*5));
  message({type:'conversation.item.input_audio_transcription.delta',event_id:'delta'+index,item_id:'item'+index,content_index:0,delta:value});
  await vi.waitFor(()=>expect(session.snapshot().connection.notes?.notes.budget.value).toBe(value));
  expect(session.rendered(session.snapshot().connection.notes!.sequence)).toBe(true);await vi.waitFor(()=>expect(session.snapshot().connection.pending).toBe(false));
  expect(session.commit()).toBe(true);await vi.waitFor(()=>expect(session.snapshot().connection.pending).toBe(false));
  message({type:'input_audio_buffer.committed',event_id:'commit'+index,item_id:'item'+index});message({type:'conversation.item.input_audio_transcription.completed',event_id:'final'+index,item_id:'item'+index,content_index:0,transcript:value});
  await vi.waitFor(()=>expect(session.status().state).toBe('ready'));
 }
 expect(session.confirm('budget')).toBe(true);await vi.waitFor(()=>expect(session.snapshot().connection.notes?.notes.budget).toMatchObject({value:'USD 350 maximum (items only)',status:'confirmed',source:'touch'}));
 expect(countFetch.mock.calls.length).toBe(fetch.mock.calls.length);session.stop();await vi.waitFor(()=>expect(bridge.snapshot().held).toBe(true));expect(saved.reservation.state).toBe('held');expect(dispose).toHaveBeenCalledOnce();expect(socket.close).toHaveBeenCalledOnce();expect(session.snapshot().connection.notes).toBeNull();expect(session.snapshot().capturing).toBe(false);
 await expect(new PrivateNotesTrialLedgerOwner(persistence).reserve()).rejects.toThrow('requires review');
});

async function protectedFixture(){
 const server=createServer(),authorize=vi.fn(async()=>{throw Error('authorization must not run');}),reserve=vi.fn(async()=> 'fixture_run'),createTransports=vi.fn(()=>{throw Error('providers must not run');});
 const bridge=attachPrivateNotesTrialNetwork(server,{activation:{approvalId:'fixture_approval',financialApproved:true,securityApproved:true,authorize},preview,allowance:{reserve,recordOutcome:vi.fn(async()=>{})},createTransports});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const addr=server.address();if(!addr||typeof addr==='string')throw Error('address');
 const headers={Host:'fixture.onrender.com',Origin:preview.origin,Authorization:'Basic '+Buffer.from('stylist:'+preview.password).toString('base64')};
 const clients:WebSocket[]=[];const open=(path='/api/private-notes-trial',extra:Record<string,string>={})=>{const ws=new WebSocket(`ws://127.0.0.1:${addr.port}${path}`,{headers:{...headers,...extra}});ws.on('error',()=>{});clients.push(ws);return ws;};
 cleanups.push(async()=>{for(const ws of clients)ws.terminate();bridge.dispose();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));});return{open,bridge,authorize,reserve,createTransports};
}
for(const [path,headers,status] of [['/api/notebook-simulation',{},403],['/api/private-notes-trial?retry=1',{},403],['/api/private-notes-trial',{Origin:'https://other.example'},403],['/api/private-notes-trial',{Authorization:'Basic invalid'},401]] as const)it('rejects unauthorized private upgrade before any reservation',async()=>{
 const f=await protectedFixture(),ws=f.open(path,headers);const result=await new Promise<number>(r=>ws.on('unexpected-response',(_req,response)=>{response.resume();r(response.statusCode!);}));expect(result).toBe(status);expect(f.reserve).not.toHaveBeenCalled();expect(f.authorize).not.toHaveBeenCalled();expect(f.createTransports).not.toHaveBeenCalled();
});
for(const binary of [false,true])it('rejects declined consent or early audio before reservation',async()=>{
 const f=await protectedFixture(),ws=f.open();await new Promise<void>(r=>ws.on('open',()=>r()));expect(f.bridge.snapshot().sessionsCreated).toBe(0);const closed=new Promise<void>(r=>ws.on('close',()=>r()));ws.send(binary?Buffer.alloc(960):JSON.stringify({version:1,type:'consent',noticeVersion:'notes-private-trial-v1',accepted:false}));await closed;expect(f.reserve).not.toHaveBeenCalled();expect(f.authorize).not.toHaveBeenCalled();expect(f.createTransports).not.toHaveBeenCalled();
});
it('refuses a concurrent private socket while consent is pending',async()=>{
 const f=await protectedFixture(),first=f.open();await new Promise<void>(r=>first.on('open',()=>r()));const second=f.open();const status=await new Promise<number>(r=>second.on('unexpected-response',(_req,response)=>{response.resume();r(response.statusCode!);}));expect(status).toBe(409);expect(f.reserve).not.toHaveBeenCalled();expect(f.authorize).not.toHaveBeenCalled();
});
