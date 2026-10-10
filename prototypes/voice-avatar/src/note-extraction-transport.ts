import type {buildOpenAINoteRequest} from './openai-note-extractor.ts';
export const NOTE_EXTRACTION_ENDPOINT='https://api.openai.com/v1/responses';
const MAX_BYTES=32768;
export type SimulatedExtractionFetch=(url:string,init:RequestInit)=>Promise<Response>;
/** Disabled server transport preparation. There is no default fetch, credential
 * loader, auth header, retry, live flag, route or environment access. */
export function createPreparedNoteExtractionTransport(options:{simulation?:boolean;fetch:SimulatedExtractionFetch}){
 if(options.simulation!==true)throw Error('Live extraction transport is disabled.');
 return async(body:ReturnType<typeof buildOpenAINoteRequest>,signal:AbortSignal):Promise<unknown>=>{
   let reader:ReadableStreamDefaultReader<Uint8Array>|null=null;
   let rejectAbort:((reason:Error)=>void)|null=null;
   const unavailable=()=>Error('Extraction transport unavailable.');
   const aborted=new Promise<never>((_resolve,reject)=>{rejectAbort=reject;});
   // Avoid an unhandled rejection when abort races serialization or cleanup.
   void aborted.catch(()=>{});
   const abort=()=>{rejectAbort?.(unavailable());if(reader)void reader.cancel().catch(()=>{});};
   if(signal.aborted)throw unavailable();signal.addEventListener('abort',abort,{once:true});
   try{
     const encoded=JSON.stringify(body);
     if(new TextEncoder().encode(encoded).byteLength>MAX_BYTES)throw unavailable();
     const pending=options.fetch(NOTE_EXTRACTION_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:encoded,signal,redirect:'error',cache:'no-store'});
     // An injected request may ignore AbortSignal and deliver a body later.
     void pending.then(response=>{if(signal.aborted)void response.body?.cancel().catch(()=>{});},()=>{});
     const response=await Promise.race([pending,aborted]);
     if(signal.aborted||response.status!==200||response.redirected||response.url&&response.url!==NOTE_EXTRACTION_ENDPOINT||!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type')??'')||!response.body){void response.body?.cancel().catch(()=>{});throw unavailable();}
     const length=response.headers.get('content-length');
     if(length!==null&&(!/^\d+$/.test(length)||Number(length)>MAX_BYTES)){void response.body.cancel().catch(()=>{});throw unavailable();}
     reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;
     while(true){const {done,value}=await Promise.race([reader.read(),aborted]);if(signal.aborted)throw unavailable();if(done)break;size+=value.byteLength;if(size>MAX_BYTES)throw unavailable();chunks.push(value.slice());}
     const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
     const decoded=new TextDecoder('utf-8',{fatal:true}).decode(bytes);return JSON.parse(decoded);
   }catch{throw unavailable();}
   finally{signal.removeEventListener('abort',abort);rejectAbort=null;if(reader){void reader.cancel().catch(()=>{});try{reader.releaseLock();}catch{/* A pending simulated read may still own its lock; never retain its content. */}}}
 };
}
