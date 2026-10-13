import {afterEach,it,expect,vi} from 'vitest';
import {EventEmitter} from 'node:events';
import {request as httpRequest} from 'node:http';
import {isDeepStrictEqual} from 'node:util';
import {WebSocket} from 'ws';
import {preparePrivateNotesTrialRuntime} from '../src/private-notes-trial-runtime.ts';
import {preparePrivateNotesTrialBrowser} from '../src/private-notes-trial-browser.ts';
import {NOTE_EXTRACTION_MODEL} from '../src/openai-note-extractor.ts';
import {TRANSCRIPTION_MODEL} from '../src/live-transcription.ts';
const preview={origin:'https://fixture.onrender.com',password:'synthetic_preview_password_1234567890'},supabaseUrl='https://fixture.supabase.co';
const cleanups:Array<()=>Promise<void>>=[];afterEach(async()=>{for(const close of cleanups.splice(0))await close();});
class Raw extends EventEmitter{readyState=0;bufferedAmount=0;terminate=vi.fn();close=vi.fn();send=vi.fn((encoded:string)=>{if(JSON.parse(encoded).type==='session.update')queueMicrotask(()=>this.message({type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:TRANSCRIPTION_MODEL},turn_detection:null}}}}));});message(event:unknown){this.emit('message',Buffer.from(JSON.stringify(event)),false);}}
function fixture(loseAck=false){
 let ledger:any={version:1,purpose:'notes-only-private-trial',approval:{id:'fixture_approval',cents:200,maxSeconds:85,maxTurns:2,maxExtractions:64,maxInputTokens:1000000,maxOutputTokens:2048},reservation:null};
 const raw=new Raw(),loadSecrets=vi.fn(()=>({supabaseKey:'sb_secret_fixture_only_not_a_real_key_12345678',openAIKey:'fixture_openai_key_not_real_1234'}));
 const request=vi.fn(async(url:string,init:RequestInit)=>{
  if(url.startsWith(supabaseUrl)){if(url.endsWith('_read'))return Response.json(structuredClone(ledger));const body=JSON.parse(init.body as string);if(!isDeepStrictEqual(body.expected,ledger))return Response.json(false);ledger=structuredClone(body.replacement);if(loseAck&&ledger.reservation.state==='reserved')throw Error('private lost acknowledgment');return Response.json(true);}
  if(url.endsWith('/input_tokens'))return Response.json({object:'response.input_tokens',input_tokens:100});
  const input=JSON.parse(JSON.parse(init.body as string).input[0].content[0].text);return Response.json({model:NOTE_EXTRACTION_MODEL,status:'completed',output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:JSON.stringify({version:1,turnId:input.turnId,patches:[{field:'color',value:input.currentFragment,evidence:input.currentFragment}]})}]}]});
 });
 const connect=vi.fn(()=>{queueMicrotask(()=>{raw.readyState=1;raw.emit('open');raw.message({type:'session.created',session:{id:'fixture_provider'}});});return raw as never;});
 const options={activation:{approvalId:'fixture_approval',financialApproved:true,securityApproved:true},preview,supabaseUrl,loadSecrets,request,connect,getAsset:async()=>new TextEncoder().encode('<html>Private test</html>')};
 return{options,request,loadSecrets,connect,raw,ledger:()=>ledger,setLedger:(value:unknown)=>{ledger=value;}};
}
async function start(f:ReturnType<typeof fixture>){const runtime=preparePrivateNotesTrialRuntime(f.options);await new Promise<void>(r=>runtime.server.listen(0,'127.0.0.1',r));const addr=runtime.server.address();if(!addr||typeof addr==='string')throw Error('address');cleanups.push(async()=>{runtime.dispose();runtime.server.closeAllConnections();await new Promise<void>(r=>runtime.server.close(()=>r()));});return{runtime,port:addr.port};}
const headers={Host:'fixture.onrender.com',Origin:preview.origin,Authorization:'Basic '+Buffer.from('stylist:'+preview.password).toString('base64')};
function availability(port:number){return new Promise<string>((resolve,reject)=>{const req=httpRequest({host:'127.0.0.1',port,path:'/api/private-notes-trial-availability',headers},res=>{let body='';res.on('data',data=>body+=data);res.on('end',()=>resolve(body));});req.on('error',reject);req.end();});}
it('rejects missing authorization and invalid configuration before secrets load',()=>{const f=fixture();for(const overrides of [{activation:{...f.options.activation,financialApproved:false}},{supabaseUrl:'https://evil.example'},{preview:{...preview,origin:'http://fixture.onrender.com'}}])expect(()=>preparePrivateNotesTrialRuntime({...f.options,...overrides})).toThrow();expect(f.loadSecrets).not.toHaveBeenCalled();expect(f.request).not.toHaveBeenCalled();expect(f.connect).not.toHaveBeenCalled();});
it('constructs inertly and exposes only availability metadata with separate database headers',async()=>{const f=fixture(),s=await start(f);expect(f.loadSecrets).toHaveBeenCalledOnce();expect(f.request).not.toHaveBeenCalled();expect(f.connect).not.toHaveBeenCalled();const body=await availability(s.port);expect(JSON.parse(body)).toEqual({version:1,enabled:true,noticeVersion:'notes-private-trial-v1'});expect(body).not.toContain('fixture_approval');expect(body).not.toContain('sb_secret');expect(f.request.mock.calls[0]?.[1].headers).toEqual({'Content-Type':'application/json',Accept:'application/json',apikey:'sb_secret_fixture_only_not_a_real_key_12345678'});expect(f.ledger().reservation).toBeNull();});
it('composes reservation, capability, counted provider work, browser capture and held shutdown',async()=>{
 const f=fixture(),s=await start(f);let pcm!:(frame:ArrayBuffer)=>boolean;const capture={start:vi.fn(async(accept:(frame:ArrayBuffer)=>boolean)=>{pcm=accept;return true;}),stop:vi.fn()};let ws:WebSocket|undefined;
 const browser=preparePrivateNotesTrialBrowser({activationEnabled:true,consent:true,origin:preview.origin,capture,page:new EventTarget(),visibility:Object.assign(new EventTarget(),{hidden:false}),changed:()=>{},status:()=>{},connect:url=>{
  expect(url).toBe('wss://fixture.onrender.com/api/private-notes-trial');ws=new WebSocket(`ws://127.0.0.1:${s.port}/api/private-notes-trial`,{headers});const socket=Object.assign(new EventTarget(),{send:(value:string|ArrayBuffer)=>ws!.send(value),close:()=>ws!.close()});Object.defineProperties(socket,{readyState:{get:()=>ws!.readyState},bufferedAmount:{get:()=>ws!.bufferedAmount}});ws.on('open',()=>socket.dispatchEvent(new Event('open')));ws.on('message',data=>socket.dispatchEvent(new MessageEvent('message',{data:data.toString()})));ws.on('close',()=>socket.dispatchEvent(new Event('close')));ws.on('error',()=>socket.dispatchEvent(new Event('error')));return socket as never;
 }});
 try{
  await vi.waitFor(()=>expect(browser.session.status().state).toBe('ready'));expect(f.ledger().reservation.state).toBe('reserved');expect(f.connect).toHaveBeenCalledOnce();expect(capture.start).not.toHaveBeenCalled();
  expect(await browser.session.startTurn('t1')).toBe(true);await vi.waitFor(()=>expect(browser.session.snapshot().connection.audioActive).toBe(true));for(let i=0;i<5;i++)expect(pcm(new ArrayBuffer(960))).toBe(true);
  f.raw.message({type:'conversation.item.input_audio_transcription.delta',event_id:'delta1',item_id:'item1',content_index:0,delta:'green'});await vi.waitFor(()=>expect(browser.session.snapshot().connection.notes?.notes.color.value).toBe('green'));
  const provider=f.request.mock.calls.filter(([url])=>url.startsWith('https://api.openai.com'));expect(provider).toHaveLength(2);expect(provider[0]![1].body).toBe(provider[1]![1].body);for(const [,init]of provider){expect(init.headers).toEqual({'Content-Type':'application/json',Authorization:'Bearer fixture_openai_key_not_real_1234'});expect(JSON.stringify(init.headers)).not.toContain('sb_secret');}
  browser.dispose();await vi.waitFor(()=>expect(f.ledger().reservation.state).toBe('held'));await vi.waitFor(()=>expect(browser.snapshot().transportClosed).toBe(true));expect(f.raw.terminate).toHaveBeenCalledOnce();expect(s.runtime.snapshot().activeTransportBundles).toBe(0);expect(browser.session.snapshot().connection.notes).toBeNull();expect(JSON.parse(await availability(s.port)).enabled).toBe(false);
 }finally{browser.dispose();ws?.terminate();}
});
it('preserves a committed reservation with lost acknowledgment and constructs no providers on restart',async()=>{
 const f=fixture(true),s=await start(f);const ws=new WebSocket(`ws://127.0.0.1:${s.port}/api/private-notes-trial`,{headers});ws.on('error',()=>{});const closed=new Promise<void>(r=>ws.on('close',()=>r()));ws.on('open',()=>ws.send(JSON.stringify({version:1,type:'consent',noticeVersion:'notes-private-trial-v1',accepted:true})));await closed;expect(f.ledger().reservation.state).toBe('reserved');expect(f.connect).not.toHaveBeenCalled();const restarted=await start(f);expect(JSON.parse(await availability(restarted.port)).enabled).toBe(false);const attempted=new WebSocket(`ws://127.0.0.1:${restarted.port}/api/private-notes-trial`,{headers});attempted.on('error',()=>{});const refused=new Promise<void>(r=>attempted.on('close',()=>r()));attempted.on('open',()=>attempted.send(JSON.stringify({version:1,type:'consent',noticeVersion:'notes-private-trial-v1',accepted:true})));await refused;expect(f.request.mock.calls.filter(([url])=>url.endsWith('_change'))).toHaveLength(1);expect(f.connect).not.toHaveBeenCalled();
});
it('does not reserve against the wrong approval record',async()=>{const f=fixture();f.setLedger({...f.ledger(),approval:{...f.ledger().approval,id:'other'}});const s=await start(f);expect(JSON.parse(await availability(s.port)).enabled).toBe(false);expect(f.request.mock.calls.filter(([url])=>url.endsWith('_change'))).toHaveLength(0);expect(f.connect).not.toHaveBeenCalled();});

it('admits a cookie-authenticated browser socket without Basic only after protected HTML and explicit consent',async()=>{
 const f=fixture(),s=await start(f);
 const cookie=await new Promise<string>((resolve,reject)=>{
  const req=httpRequest({host:'127.0.0.1',port:s.port,path:'/notes-live.html',headers},res=>{res.resume();res.on('end',()=>{expect(res.statusCode).toBe(200);resolve(res.headers['set-cookie']![0]!.split(';')[0]!);});});req.on('error',reject);req.end();
 });
 expect(f.ledger().reservation).toBeNull();expect(f.connect).not.toHaveBeenCalled();
 const ws=new WebSocket(`ws://127.0.0.1:${s.port}/api/private-notes-trial`,{headers:{Host:'fixture.onrender.com',Origin:preview.origin,Cookie:cookie}});ws.on('error',()=>{});
 const received:string[]=[];ws.on('message',data=>received.push(data.toString()));
 try{
  await new Promise<void>((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
  expect(f.ledger().reservation).toBeNull();expect(f.connect).not.toHaveBeenCalled();
  ws.send(JSON.stringify({version:1,type:'consent',noticeVersion:'notes-private-trial-v1',accepted:true}));
  await vi.waitFor(()=>expect(received.some(v=>JSON.parse(v).type==='ready')).toBe(true));
  expect(f.ledger().reservation.state).toBe('reserved');expect(f.connect).toHaveBeenCalledOnce();
 }finally{ws.terminate();}
 await vi.waitFor(()=>expect(f.ledger().reservation.state).toBe('held'));
});
