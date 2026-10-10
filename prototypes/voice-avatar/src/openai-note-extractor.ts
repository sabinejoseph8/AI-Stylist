import {prepareNoteExtraction,decodeNoteExtraction} from './note-extraction-contract.ts';
import type {ExtractionInput,NotePatch} from './partial-note-coordinator.ts';
export const NOTE_EXTRACTION_MODEL='gpt-4.1-mini-2025-04-14';
export const LIVE_NOTE_EXTRACTION_ENABLED=false;
/** Server request preparation only. No credentials, HTTP client or live route. */
export function buildOpenAINoteRequest(input:ExtractionInput){
 const prepared=prepareNoteExtraction(input);
 // Use enum for the fixed protocol version in the provider schema.
 const {const:version,...versionType}=prepared.schema.properties.version;
 const schema={...prepared.schema,properties:{...prepared.schema.properties,version:{...versionType,enum:[version]}}};
 return {model:NOTE_EXTRACTION_MODEL,store:false,stream:false,max_output_tokens:2048,
 instructions:prepared.instructions,input:[{role:'user',content:[{type:'input_text',text:prepared.input}]}],
 text:{format:{type:'json_schema',name:'styling_notes_v1',strict:true,schema}},tools:[],tool_choice:'none'} as const;
}
const object=(v:unknown):v is Record<string,unknown>=>Boolean(v)&&typeof v==='object'&&!Array.isArray(v);
/** Parse the wire response, not an SDK's concatenated output_text convenience field.
 * Refusals, incomplete results and ambiguous/multiple outputs are held atomically. */
export function decodeOpenAINoteResponse(result:unknown,input:ExtractionInput):NotePatch[]{
 if(!object(result)||result.status!=='completed'||result.model!==NOTE_EXTRACTION_MODEL
   ||result.error!=null||result.incomplete_details!=null||!Array.isArray(result.output)||result.output.length!==1)throw Error('Extraction response held.');
 const message=result.output[0];
 if(!object(message)||message.type!=='message'||message.role!=='assistant'||message.status!=='completed'
   ||!Array.isArray(message.content)||message.content.length!==1)throw Error('Extraction response held.');
 const content=message.content[0];
 if(!object(content)||content.type!=='output_text'||typeof content.text!=='string')throw Error('Extraction response held.');
 return decodeNoteExtraction(content.text,input);
}
/** Simulation is mandatory. The injected request must be a simulated transport.
 * The coordinator owns the 1.5 second deadline; no retries or model fallback. */
export function createPreparedOpenAINoteExtractor(options:{simulation?:boolean;request:(body:ReturnType<typeof buildOpenAINoteRequest>,signal:AbortSignal)=>Promise<unknown>}){
 if(options.simulation!==true)throw Error('Live extraction is disabled.');
 return async(input:ExtractionInput,signal:AbortSignal):Promise<NotePatch[]>=>{
   if(signal.aborted)throw Error('Extraction canceled.');
   const body=buildOpenAINoteRequest(input);
   try{const response=await options.request(body,signal);if(signal.aborted)throw Error('Canceled');return decodeOpenAINoteResponse(response,input);}
   catch{throw Error('Extraction unavailable or invalid.');}
 };
}
