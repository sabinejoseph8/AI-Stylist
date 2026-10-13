import {NOTE_EXTRACTION_ENDPOINT} from './note-extraction-transport.ts';
import {NOTE_TOKEN_COUNT_ENDPOINT} from './note-token-count-transport.ts';
import type {SimulatedExtractionFetch} from './note-extraction-transport.ts';
/** Dormant server-only boundary. No environment, default fetch, retry or route.
 * Activation owner must authorize spending before supplying a credential.
 * Counted dispatch owns deadlines and response/schema validation. */
export function prepareServerNoteHttpAdapter(options:{apiKey:string;request:SimulatedExtractionFetch}){
 const unavailable=()=>Error('Notebook provider request unavailable.');
 if(typeof options.apiKey!=='string'||! /^[A-Za-z0-9_-]{16,512}$/.test(options.apiKey)||typeof options.request!=='function')throw unavailable();
 let key:string|null=options.apiKey;const request=options.request;
 const controllers=new Set<AbortController>();
 const send:SimulatedExtractionFetch=async(url,init)=>{
  if(key===null||![NOTE_EXTRACTION_ENDPOINT,NOTE_TOKEN_COUNT_ENDPOINT].includes(url)||init.method!=='POST'||typeof init.body!=='string'||!init.signal||init.signal.aborted||new TextEncoder().encode(init.body).byteLength>32768)throw unavailable();
  const controller=new AbortController();controllers.add(controller);
  const abort=()=>controller.abort();init.signal.addEventListener('abort',abort,{once:true});
  try{
   const response=await request(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:init.body,signal:controller.signal,redirect:'error',credentials:'omit',cache:'no-store'});
   if(key===null||controller.signal.aborted||response.redirected||response.url&&response.url!==url){void response.body?.cancel().catch(()=>{});throw unavailable();}
   return response;
  }catch{throw unavailable();}
  finally{init.signal.removeEventListener('abort',abort);controllers.delete(controller);}
 };
 return Object.freeze({fetch:send,countFetch:send,end:()=>{key=null;for(const c of controllers)c.abort();controllers.clear();}});
}
