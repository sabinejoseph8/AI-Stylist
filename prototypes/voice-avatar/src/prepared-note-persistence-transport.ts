import {validatePreparedNoteLedger,validatePreparedNoteTransition} from './prepared-note-allowance.ts';
import type {PreparedNotePersistence,PreparedNoteLedger} from './prepared-note-allowance.ts';
type SimulatedFetch=(url:string,init:RequestInit)=>Promise<Response>;
const MAX_BYTES=16384;
/** Disabled server preparation. Only injected simulations; no credentials,
 * default fetch, environment loading, initialization, retry or legacy fallback. */
export function createPreparedNotePersistenceTransport(options:{simulation?:boolean;url:string;fetch:SimulatedFetch}):PreparedNotePersistence{
 if(options.simulation!==true)throw Error('Live notebook persistence is disabled.');
 let origin:string;
 try{
  const target=new URL(options.url);
  if(target.protocol!=='https:'||!/^[a-z0-9-]+\.supabase\.co$/.test(target.hostname)||target.port||target.pathname!=='/'||target.search||target.hash||target.username||target.password)throw Error();
  origin=target.origin;
 }catch{throw Error('Notebook persistence configuration requires review.');}
 async function rpc(name:'stylist_notebook_allowance_read'|'stylist_notebook_allowance_change',body:object):Promise<unknown>{
  const unavailable=()=>Error('Notebook persistence unavailable.');
  const controller=new AbortController();
  let reader:ReadableStreamDefaultReader<Uint8Array>|null=null,rejectAbort:((error:Error)=>void)|null=null;
  const aborted=new Promise<never>((_resolve,reject)=>{rejectAbort=reject;});void aborted.catch(()=>{});
  const abort=()=>{rejectAbort?.(unavailable());if(reader)void reader.cancel().catch(()=>{});};
  controller.signal.addEventListener('abort',abort,{once:true});const timer=setTimeout(()=>controller.abort(),8000);
  try{
   const encoded=JSON.stringify(body);if(new TextEncoder().encode(encoded).byteLength>MAX_BYTES)throw unavailable();
   const endpoint=origin+'/rest/v1/rpc/'+name;
   const pending=options.fetch(endpoint,{method:'POST',body:encoded,headers:{'Content-Type':'application/json',Accept:'application/json'},signal:controller.signal,redirect:'error',credentials:'omit',cache:'no-store'});
   void pending.then(response=>{if(controller.signal.aborted)void response.body?.cancel().catch(()=>{});},()=>{});
   const response=await Promise.race([pending,aborted]);
   if(controller.signal.aborted||response.status!==200||response.redirected||response.url&&response.url!==endpoint||!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type')??'')||!response.body){void response.body?.cancel().catch(()=>{});throw unavailable();}
   const length=response.headers.get('content-length');if(length!==null&&(!/^\d+$/.test(length)||Number(length)>MAX_BYTES)){void response.body.cancel().catch(()=>{});throw unavailable();}
   reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;
   while(true){const {done,value}=await Promise.race([reader.read(),aborted]);if(controller.signal.aborted)throw unavailable();if(done)break;size+=value.byteLength;if(size>MAX_BYTES)throw unavailable();chunks.push(value.slice());}
   const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
   return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  }catch{throw unavailable();}
  finally{clearTimeout(timer);controller.signal.removeEventListener('abort',abort);rejectAbort=null;if(reader){void reader.cancel().catch(()=>{});try{reader.releaseLock();}catch{/* Never retain content from an unfinished simulated read. */}}}
 }
 return{
  read:async()=>{try{return validatePreparedNoteLedger(await rpc('stylist_notebook_allowance_read',{}));}catch{throw Error('Notebook persistence unavailable.');}},
  compareAndSwap:async(expected:PreparedNoteLedger,replacement:PreparedNoteLedger)=>{
   try{
    const previous=validatePreparedNoteLedger(expected),next=validatePreparedNoteTransition(previous,replacement);
    const result=await rpc('stylist_notebook_allowance_change',{expected:previous,replacement:next});
    if(typeof result!=='boolean')throw Error();return result;
   }catch{throw Error('Notebook persistence unavailable.');}
  },
 };
}
