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
 return Object.freeze({async call(name:string,payload:Record<string,unknown>):Promise<unknown>{
  if(typeof name!=='string'||!/^stylist_[a-z0-9_]{1,70}$/.test(name)||!payload||typeof payload!=='object'||Array.isArray(payload))
   throw Error('Supabase operation unavailable');
  let body:string;
  try{const serialized=JSON.stringify(payload);if(typeof serialized!=='string'||Buffer.byteLength(serialized,'utf8')>MAX_REQUEST)throw Error();body=serialized;}
  catch{throw Error('Supabase operation unavailable');}
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;let response:SupabaseFetchResponse|undefined;
  let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;let completed=false;
  const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('deadline'));},deadlineMs);});
  try{
   const request=fetcher(new URL(`/rest/v1/rpc/${name}`,target).toString(),{
    method:'POST',redirect:'error',signal:controller.signal,
    headers:{apikey:serviceKey,authorization:`Bearer ${serviceKey}`,'content-type':'application/json',accept:'application/json'},body,
   }).then(response=>{
    if(controller.signal.aborted){try{void response.body?.cancel().catch(()=>{});}catch{}throw Error('deadline');}
    return response;
   });
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
   clearTimeout(timer!);
   if(!completed){controller.abort();try{if(reader)void reader.cancel().catch(()=>{});else if(response?.body)void response.body.cancel().catch(()=>{});}catch{}}
   try{reader?.releaseLock();}catch{}
  }
 }});
}
