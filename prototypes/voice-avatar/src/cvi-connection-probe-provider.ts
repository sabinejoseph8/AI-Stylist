import {isDeepStrictEqual} from 'node:util';
import {validateConnectionProbeRecord,validateConnectionProbeTransition} from './cvi-connection-probe-contract.ts';
import type {ConnectionProbePersistence} from './cvi-connection-probe-contract.ts';
import type {ConnectionProbeProvider} from './cvi-connection-probe-session.ts';
export const PROBE_FACE='r78c9b897fbc';
export const PROBE_VOICE='db6b0ed5-d5d3-463d-ae85-518a07d3c2b4';
export const PROBE_TTS_MODEL='sonic-3.5';
type Fetch=(url:string,init:RequestInit)=>Promise<Response>;
const fail=()=>Error('Connection probe provider unavailable.');
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
// Tavus Get PAL returns this literal in place of a saved custom LLM secret.
// It is never a valid callback credential; callback authentication remains exact.
const redactedCredential=(v:unknown)=>v==='<redacted>';
const id=(v:unknown):v is string=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(v);
/** Absolute request+body bound, no redirects/retries/default fetch or raw errors. */
export async function probeJson(fetch:Fetch,url:string,init:RequestInit,emptySuccess=false){
 const abort=new AbortController();let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
 let rejectAbort!:(e:Error)=>void;
 const aborted=new Promise<never>((_,reject)=>{rejectAbort=reject;});void aborted.catch(()=>{});
 const timer=setTimeout(()=>{abort.abort();rejectAbort(fail());void reader?.cancel().catch(()=>{});},8000);
 try{
  const pending=fetch(url,{...init,redirect:'error',credentials:'omit',cache:'no-store',signal:abort.signal});
  void pending.then(response=>{if(abort.signal.aborted)void response.body?.cancel().catch(()=>{});},()=>{});
  const response=await Promise.race([pending,aborted]);
  if(response.status!==200||response.redirected||response.url&&response.url!==url){void response.body?.cancel().catch(()=>{});throw fail();}
  if(emptySuccess){void response.body?.cancel().catch(()=>{});return null;}
  if(!response.body||!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type')??'')){void response.body?.cancel().catch(()=>{});throw fail();}
  reader=response.body.getReader();let size=0;const chunks:Uint8Array[]=[];
  while(true){const {value,done}=await Promise.race([reader.read(),aborted]);if(done)break;size+=value.byteLength;if(size>65536)throw fail();chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength;}
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)) as unknown;
 }catch{throw fail();}finally{clearTimeout(timer);abort.abort();void reader?.cancel().catch(()=>{});}
}
function origin(raw:string,suffix:'onrender.com'|'supabase.co'){
 try{const u=new URL(raw);if(u.protocol!=='https:'||!new RegExp('^[a-z0-9-]+\\.'+suffix.replace('.','\\.')+'$').test(u.hostname)||u.port||u.pathname!=='/'||u.search||u.hash||u.username||u.password)throw fail();return u.origin;}catch{throw fail();}
}
export function probePalConfiguration(previewOrigin:string,callbackCredential:string){
 const base=origin(previewOrigin,'onrender.com');if(!/^[A-Za-z0-9_-]{43,128}$/.test(callbackCredential))throw fail();
 return{pal_name:'AI Stylist private connection probe',pipeline_mode:'full',default_face_id:PROBE_FACE,system_prompt:'Connection test only. The external endpoint supplies fixed neutral replies. Do not provide styling advice, use tools or retain memories.',greeting:'',dynamic_greeting:false,languages:['en'],document_ids:[],document_tags:[],layers:{llm:{model:'connection-probe-fixed-v1',base_url:base+'/api/connection-probe/v1',api_key:callbackCredential,speculative_inference:false},tts:{tts_engine:'cartesia',tts_model_name:PROBE_TTS_MODEL,external_voice_id:PROBE_VOICE},perception:{perception_model:'off'}}};
}
/** Fixed boolean diagnostics only. Never emit provider values, IDs, messages or keys. */
export function probePalReadbackSummary(value:unknown,expected:ReturnType<typeof probePalConfiguration>,palId:string){
 const v=object(value)?value:{},layers=object(v.layers)?v.layers:{},llm=object(layers.llm)?layers.llm:{},tts=object(layers.tts)?layers.tts:{},perception=object(layers.perception)?layers.perception:{};
 return Object.freeze({identityMatch:v.pal_id===palId,legacyIdentityPresent:typeof v.persona_id==='string',pipelineFull:v.pipeline_mode==='full',faceMatches:v.default_face_id===PROBE_FACE,legacyFacePresent:typeof v.default_replica_id==='string',emptyGreeting:v.greeting==='',greetingAbsent:v.greeting===undefined||v.greeting===null,dynamicGreetingOff:v.dynamic_greeting===false,dynamicGreetingAbsent:v.dynamic_greeting===undefined||v.dynamic_greeting===null,englishOnly:isDeepStrictEqual(v.languages,['en']),languagesAbsent:v.languages===undefined||v.languages===null,languagesEmpty:isDeepStrictEqual(v.languages,[]),credentialAbsent:llm.api_key===undefined||llm.api_key===null||llm.api_key==='',credentialRedacted:typeof llm.api_key==='string'&&/^(?:<redacted>|\*+|\[redacted\])$/i.test(llm.api_key),credentialMatches:llm.api_key===expected.layers.llm.api_key,customModelMatches:llm.model===expected.layers.llm.model,endpointMatches:llm.base_url===expected.layers.llm.base_url,speculationOff:llm.speculative_inference===false,cartesiaExplicit:tts.tts_engine==='cartesia',ttsModelMatches:tts.tts_model_name===PROBE_TTS_MODEL,voiceMatches:tts.external_voice_id===PROBE_VOICE,perceptionOff:perception.perception_model==='off'});
}
/** Observed Get PAL returns an empty language list and a literal redacted key.
 * Operator setup writes the same generated key into both approved services.
 * Redaction is presence evidence only, not equality evidence. The first native
 * callback must authenticate the exact shared key; no alternate/bypass exists.
 * English remains pinned by our constant reply and conversation override. */
export function verifyProbePal(value:unknown,expected:ReturnType<typeof probePalConfiguration>,palId:string){
 if(!object(value)||value.pal_id!==palId||value.pipeline_mode!=='full'||value.default_face_id!==PROBE_FACE||value.greeting!==''||value.dynamic_greeting!==false||(value.languages!==undefined&&value.languages!==null&&!isDeepStrictEqual(value.languages,[])&&!isDeepStrictEqual(value.languages,['en']))||!object(value.layers))throw fail();
 const layers=value.layers,llm=layers.llm,tts=layers.tts,perception=layers.perception;
 if(!object(llm)||(llm.api_key!==expected.layers.llm.api_key&&!redactedCredential(llm.api_key))||llm.model!==expected.layers.llm.model||llm.base_url!==expected.layers.llm.base_url||llm.speculative_inference!==false||!object(tts)||tts.tts_engine!=='cartesia'||tts.tts_model_name!==PROBE_TTS_MODEL||tts.external_voice_id!==PROBE_VOICE||tts.voice_id||tts.api_key||!object(perception)||perception.perception_model!=='off')throw fail();
 for(const field of ['tools','skills','document_ids','document_tags','guardrail_ids','guardrail_tags'])if(value[field]!==undefined&&!isDeepStrictEqual(value[field],[]))throw fail();
 for(const field of ['tools','headers','extra_body','default_query'])if(llm[field]!==undefined&&!isDeepStrictEqual(llm[field],{})&&!isDeepStrictEqual(llm[field],[]))throw fail();
 if(layers.conferencing||value.objectives_id||value.objectives||value.memory_stores)throw fail();
 return true;
}
export function prepareProbePersistence(options:{url:string;fetch:Fetch;headers:Record<string,string>}):ConnectionProbePersistence{
 const base=origin(options.url,'supabase.co')+'/rest/v1/rpc/';
 const rpc=(name:string,body:object)=>probeJson(options.fetch,base+name,{method:'POST',headers:{...options.headers,'Content-Type':'application/json'},body:JSON.stringify(body)});
 return{read:async()=>validateConnectionProbeRecord(await rpc('stylist_connection_probe_read',{})),compareAndSwap:async(expected,replacement)=>{validateConnectionProbeTransition(expected,replacement);const result=await rpc('stylist_connection_probe_change',{expected,replacement});if(typeof result!=='boolean')throw fail();return result;}};
}
/** Dormant adapter: constructing it makes no requests or rooms. Configure and
 * independently read back the new PAL before supplying this to an active owner. */
export function prepareProbeProvider(options:{fetch:Fetch;apiKey:string;palId:string;configuration:ReturnType<typeof probePalConfiguration>;diagnostic?:(report:ReturnType<typeof probePalReadbackSummary>)=>void}):ConnectionProbeProvider & {verifyConfiguration:()=>Promise<void>}{
 if(!id(options.palId)||typeof options.apiKey!=='string'||options.apiKey.length<16||/[\r\n]/.test(options.apiKey))throw fail();
 const request=(path:string,body?:object)=>probeJson(options.fetch,'https://tavusapi.com'+path,{method:body?'POST':'GET',headers:{'x-api-key':options.apiKey,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})},path.endsWith('/end'));
 const end=async(roomId:string)=>{if(!id(roomId))throw fail();await request('/v2/conversations/'+roomId+'/end',{});};
 const verifyConfiguration=async()=>{const value=await request('/v2/pals/'+options.palId);options.diagnostic?.(probePalReadbackSummary(value,options.configuration,options.palId));verifyProbePal(value,options.configuration,options.palId);};
 return{
  verifyConfiguration,
  create:async()=>{
   await verifyConfiguration();
   const response=await request('/v2/conversations',{pal_id:options.palId,face_id:PROBE_FACE,require_auth:true,max_participants:2,dynamic_greeting:false,participant_tags:[],conversation_name:'Private connection-only probe',properties:{max_call_duration:300,participant_absent_timeout:10,participant_left_timeout:5,enable_recording:false,auto_start_recording:false,enable_closed_captions:false,languages:['en']}});
   if(!object(response)||!id(response.conversation_id))throw fail();
   try{
    const u=new URL(String(response.conversation_url));
    if(u.protocol!=='https:'||u.hostname!=='tavus.daily.co'||u.port||u.search||u.hash||u.username||u.password||!/^\/[A-Za-z0-9_-]+$/.test(u.pathname)||typeof response.meeting_token!=='string'||response.meeting_token.length<16||response.meeting_token.length>8192||/\s/.test(response.meeting_token))throw fail();
    return{id:response.conversation_id,url:u.href,token:response.meeting_token};
   }catch{try{await end(response.conversation_id);}catch{/* uncertain closure remains held */}throw fail();}
  },end,
  isEnded:async roomId=>{if(!id(roomId))throw fail();const result=await request('/v2/conversations/'+roomId);return object(result)&&result.conversation_id===roomId&&result.status==='ended';},
 };
}
