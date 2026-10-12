const MAX_REQUEST=64*1024;
const MAX_RESPONSE=64*1024;
const DEADLINE_MS=8000;
export interface SupabaseFetchResponse {
 status:number;
 headers:{get(name:string):string|null};
 body:ReadableStream<Uint8Array>|null;
}
export type SupabaseFetch=(url:string,init:RequestInit)=>Promise<SupabaseFetchResponse>;

/** Disabled transport boundary. No key is read from the environment and no route calls this by default. */
export function createSupabaseRpc(projectUrl:string,serviceKey:string,fetcher:SupabaseFetch,deadlineMs=DEADLINE_MS){
 let target:URL;
 try{
  target=new URL(projectUrl);
  if(target.protocol!=='https:'||!/^([a-z0-9-]+)\.supabase\.co$/.test(target.hostname)||
   target.username||target.password||target.port||target.pathname!=='/'||target.search||target.hash)throw Error();
 }catch{throw Error('Supabase destination unavailable');}
 if(typeof serviceKey!=='string'||serviceKey.length<20||serviceKey.length>8192||/[\r\n\s]/.test(serviceKey)||
  typeof fetcher!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>DEADLINE_MS)
  throw Error('Supabase configuration unavailable');
 let pending=0;
 return Object.freeze({async call(name:string,payload:Record<string,unknown>,external?:AbortSignal):Promise<unknown>{
  if(external?.aborted||pending>=4)throw Error('Supabase operation unavailable');
  if(typeof name!=='string'||!/^stylist_[a-z0-9_]{1,70}$/.test(name)||!payload||typeof payload!=='object'||Array.isArray(payload))
   throw Error('Supabase operation unavailable');
  let body:string;
  try{const serialized=JSON.stringify(payload);if(typeof serialized!=='string'||Buffer.byteLength(serialized,'utf8')>MAX_REQUEST)throw Error();body=serialized;}
  catch{throw Error('Supabase operation unavailable');}
  pending++;let fetchSettled=false,finished=false,cleanupSettled=true,released=false;
  const release=()=>{if(finished&&fetchSettled&&cleanupSettled&&!released){released=true;pending--;}};
  const cancel=(resource:{cancel():Promise<unknown>}|null|undefined)=>{if(!resource)return;cleanupSettled=false;try{void resource.cancel().then(()=>{cleanupSettled=true;release();},()=>{});}catch{}};
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;let response:SupabaseFetchResponse|undefined;
  let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;let completed=false;
  let stop!:()=>void;
  const timeout=new Promise<never>((_,reject)=>{stop=()=>{controller.abort();reject(Error('deadline'));};timer=setTimeout(stop,deadlineMs);external?.addEventListener('abort',stop,{once:true});});
  try{
   const request=Promise.resolve().then(()=>{if(controller.signal.aborted)throw Error();return fetcher(new URL(`/rest/v1/rpc/${name}`,target).toString(),{
    method:'POST',redirect:'error',signal:controller.signal,
    headers:{apikey:serviceKey,authorization:`Bearer ${serviceKey}`,'content-type':'application/json',accept:'application/json'},body,
   });}).then(response=>{
    if(controller.signal.aborted){cancel(response.body);throw Error('deadline');}
    return response;
   }).finally(()=>{fetchSettled=true;release();});
   response=await Promise.race([request,timeout]);
   if(response.status<200||response.status>=300||!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type')??''))
    throw Error('status');
   if(!response.body)throw Error('body unavailable');
   reader=response.body.getReader();const parts:Uint8Array[]=[];let length=0;
   while(true){
    const item=await Promise.race([reader.read(),timeout]);if(item.done)break;
    length+=item.value.byteLength;
    if(length>MAX_RESPONSE)throw Error('response limit');
    parts.push(item.value);
   }
   const bytes=new Uint8Array(length);let offset=0;
   for(const part of parts){bytes.set(part,offset);offset+=part.length;}
   const parsed=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
   completed=true;return parsed;
  }catch{throw Error('Supabase operation unavailable');}finally{
   clearTimeout(timer!);external?.removeEventListener('abort',stop);
   if(!completed){controller.abort();cancel(reader??response?.body);}
   try{reader?.releaseLock();}catch{}
   finished=true;release();
  }
 }});
}
