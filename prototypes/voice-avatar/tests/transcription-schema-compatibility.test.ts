import {afterEach,describe,expect,it,vi} from 'vitest';
import {PreparedLiveTranscription,TRANSCRIPTION_MODEL} from '../src/live-transcription.ts';

// Synthetic values shaped from official Realtime schemas, not captured customer data.
// Sources and unresolved startup/configuration differences are recorded in
// docs/notebook-provider-contract-review.md. These fixtures do not prove live access.
const configuration=()=>({type:'session.updated',event_id:'evt_config',session:{
 id:'sess_synthetic',object:'realtime.transcription_session',type:'transcription',
 audio:{input:{format:{type:'audio/pcm',rate:24000},noise_reduction:null,
 transcription:{model:TRANSCRIPTION_MODEL,languages:['en'],delay:'low'},turn_detection:null}},include:[],
}});
function setup(){
 const emit=vi.fn(),stopped=vi.fn(),wire={bufferedAmount:0,send:vi.fn(()=>true),close:vi.fn()};
 const stream=new PreparedLiveTranscription({simulation:true,wire,signal:new AbortController().signal,emit,stopped});
 stream.receive(configuration());stream.beginTurn('turn1');
 return{stream,emit,stopped,wire};
}
const partial=()=>({type:'conversation.item.input_audio_transcription.delta',event_id:'evt_delta',item_id:'item_synthetic',content_index:0,delta:'emerald green',logprobs:[]});
const complete=(usage:object)=>({type:'conversation.item.input_audio_transcription.completed',event_id:'evt_final',item_id:'item_synthetic',content_index:0,transcript:'blue',usage,languages:[{code:'en'}],logprobs:[]});
afterEach(()=>vi.restoreAllMocks());
describe('official-schema-shaped transcription fixtures',()=>{
 it('accepts a configuration envelope with server metadata without exposing that metadata',()=>{
  const s=setup();try{expect(s.stream.snapshot().ready).toBe(true);expect(s.stream.snapshot()).not.toHaveProperty('session');expect(s.emit).not.toHaveBeenCalled();}finally{s.stream.end();}
 });
 it.each([{type:'tokens',input_tokens:12,output_tokens:2,total_tokens:14,input_token_details:{audio_tokens:10,text_tokens:2}},{type:'duration',seconds:1.2}])('accepts final transcript with $type usage without turning usage into notes',usage=>{
  const s=setup();try{expect(s.stream.receive(partial())).toBe(true);expect(s.stream.receive(complete(usage))).toBe(true);
   expect(s.emit.mock.calls.map(([event])=>({text:event.text,final:event.final}))).toEqual([{text:'emerald green',final:false},{text:'blue',final:true}]);
   expect(s.emit.mock.calls[1]![0]).not.toHaveProperty('usage');expect(s.emit.mock.calls[1]![0]).not.toHaveProperty('languages');expect(s.emit.mock.calls[1]![0]).not.toHaveProperty('confidence');
  }finally{s.stream.end();}
 });
 it.each(['content_index','delta'])('holds a schema-optional delta missing %s rather than inventing text or an index',field=>{
  const s=setup();try{const event:Record<string,unknown>=partial();delete event[field];expect(s.stream.receive(event)).toBe(false);expect(s.emit).not.toHaveBeenCalled();expect(s.stream.snapshot().ended).toBe(true);expect(s.wire.close).toHaveBeenCalledTimes(1);}finally{s.stream.end();}
 });
 it.each(['event_id','item_id'])('holds an event missing required %s',field=>{
  const s=setup();try{const event:Record<string,unknown>=partial();delete event[field];expect(s.stream.receive(event)).toBe(false);expect(s.stopped).toHaveBeenCalledWith('invalid-event');expect(s.emit).not.toHaveBeenCalled();}finally{s.stream.end();}
 });
 it('ignores final usage metadata after cancellation without restoring transcript text',()=>{
  const s=setup();s.stream.receive(partial());s.stream.end();expect(s.stream.receive(complete({type:'duration',seconds:1}))).toBe(false);expect(s.emit).toHaveBeenCalledTimes(1);expect(s.wire.close).toHaveBeenCalledTimes(1);expect(s.stream.snapshot().remoteCleanupVerified).toBe(false);
 });
});
