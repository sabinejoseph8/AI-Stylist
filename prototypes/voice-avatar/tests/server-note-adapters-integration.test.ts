import {EventEmitter} from 'node:events';
import {afterEach,it,expect,vi} from 'vitest';
import {prepareServerNoteSocketOpener} from '../src/server-note-socket-opener.ts';
import {prepareServerNoteHttpAdapter} from '../src/server-note-http-adapter.ts';
import {prepareNoteStartup} from '../src/prepared-note-startup.ts';
import {NotebookState} from '../src/notebook-state.ts';
import {NOTE_EXTRACTION_MODEL} from '../src/openai-note-extractor.ts';
import {TRANSCRIPTION_MODEL} from '../src/live-transcription.ts';
import {NOTE_TOKEN_COUNT_ENDPOINT} from '../src/note-token-count-transport.ts';
class Socket extends EventEmitter{readyState=0;bufferedAmount=0;send=vi.fn();close=vi.fn();terminate=vi.fn();message(event:unknown){this.emit('message',Buffer.from(JSON.stringify(event)),false);}}
const ack={type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:TRANSCRIPTION_MODEL},turn_detection:null}}}};
function setup(pendingCount=false){
 const raw=new Socket(),abort=new AbortController(),notebook=new NotebookState();let countSignal:AbortSignal|undefined,release!:(r:Response)=>void;
 const request=vi.fn(async(url:string,init:RequestInit)=>{
  if(url===NOTE_TOKEN_COUNT_ENDPOINT){countSignal=init.signal!;if(pendingCount)return new Promise<Response>(r=>release=r);return Response.json({object:'response.input_tokens',input_tokens:50});}
  return Response.json({model:NOTE_EXTRACTION_MODEL,status:'completed',output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:JSON.stringify({version:1,turnId:'t1',patches:[{field:'color',value:'green',evidence:'green'}]})}]}]});
 });
 const http=prepareServerNoteHttpAdapter({apiKey:'synthetic_key_never_real',request});
 const opener=prepareServerNoteSocketOpener({apiKey:'synthetic_key_never_real',connect:(()=>raw) as never});
 let audio!:(pcm:ArrayBuffer)=>boolean;
 const capture={start:vi.fn(async(callback:(pcm:ArrayBuffer)=>boolean)=>{audio=callback;return true;}),stop:vi.fn(),end:vi.fn()};
 const startup=prepareNoteStartup({simulation:true,signal:abort.signal,open:opener.open,session:{notebook,capture,fetch:http.fetch,countFetch:http.countFetch,changed:vi.fn()},stopped:()=>{http.end();opener.end();}});
 return{raw,abort,notebook,request,http,opener,capture,startup,audio:()=>audio(new ArrayBuffer(960)),countSignal:()=>countSignal,release:()=>release(Response.json({object:'response.input_tokens',input_tokens:50}))};
}
async function ready(s:ReturnType<typeof setup>){s.raw.readyState=1;s.raw.emit('open');s.raw.message({type:'session.created',session:{id:'synthetic'}});await s.startup.openingSettled;expect(s.startup.status().state).toBe('configuring');s.raw.message(ack);expect(s.startup.status().state).toBe('ready');}
afterEach(()=>vi.useRealTimers());
it('composes first-packet startup, authenticated exact-request counting, partial notes and cancellation',async()=>{
 vi.useFakeTimers();const s=setup();expect(s.request).not.toHaveBeenCalled();expect(s.capture.start).not.toHaveBeenCalled();await ready(s);
 const active=s.startup.active()!;expect(await active.probe.beginTurn('t1')).toBe(true);for(let i=0;i<5;i++)expect(s.audio()).toBe(true);
 s.raw.message({type:'conversation.item.input_audio_transcription.delta',event_id:'e1',item_id:'i1',content_index:0,delta:'green'});await vi.advanceTimersByTimeAsync(100);
 expect(s.request).toHaveBeenCalledTimes(2);const [count,generation]=s.request.mock.calls;
 expect(count![1].body).toBe(generation![1].body);expect(count![1].headers).toEqual(generation![1].headers);
 expect(s.notebook.snapshot().notes.color).toMatchObject({value:'green',status:'tentative'});
 s.abort.abort();await vi.advanceTimersByTimeAsync(0);expect(s.raw.terminate).toHaveBeenCalledOnce();expect(s.capture.end).toHaveBeenCalledOnce();expect(s.notebook.snapshot().notes.color.status).toBe('missing');expect(s.startup.status().remoteCleanupVerified).toBe(false);expect(vi.getTimerCount()).toBe(0);
});
it('cancels pending counting on owner exit and ignores its late completion',async()=>{
 vi.useFakeTimers();const s=setup(true);await ready(s);await s.startup.active()!.probe.beginTurn('t1');
 s.raw.message({type:'conversation.item.input_audio_transcription.delta',event_id:'e1',item_id:'i1',content_index:0,delta:'green'});await vi.advanceTimersByTimeAsync(100);expect(s.countSignal()?.aborted).toBe(false);
 s.startup.end();expect(s.countSignal()?.aborted).toBe(true);s.release();await vi.advanceTimersByTimeAsync(0);expect(s.request).toHaveBeenCalledOnce();expect(s.notebook.snapshot().notes.color.status).toBe('missing');expect(s.startup.active()).toBeNull();expect(vi.getTimerCount()).toBe(0);
});
it('surfaces failed socket termination through the combined cleanup owner',async()=>{
 const s=setup();await ready(s);s.raw.terminate.mockImplementation(()=>{throw Error('private');});s.startup.end();await Promise.resolve();expect(s.startup.status()).toMatchObject({state:'ended',cleanupFailed:true,remoteCleanupVerified:false});expect(JSON.stringify(s.startup.status())).not.toContain('private');
});
