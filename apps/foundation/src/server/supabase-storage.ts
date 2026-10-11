import {createHash} from 'node:crypto';

const BUCKET='stylist-wardrobe';
const MAX_OBJECT=10*1024*1024;
const MAX_DEADLINE=8000;
export interface StorageResponse {
 status:number;
 headers:{get(name:string):string|null};
 body:ReadableStream<Uint8Array>|null;
}
export type StorageFetch=(url:string,init:RequestInit)=>Promise<StorageResponse>;

function project(url:string){
 try{
  const parsed=new URL(url);
  if(parsed.protocol!=='https:'||!/^([a-z0-9-]+)\.supabase\.co$/.test(parsed.hostname)||parsed.username||parsed.password||parsed.port||parsed.pathname!=='/'||parsed.search||parsed.hash)throw Error();
  return parsed;
 }catch{throw Error('Storage configuration unavailable');}
}
function validKey(key:string){
 if(typeof key!=='string'||key.length>120)return false;
 const pieces=key.split('/');
 return pieces.length===2&&/^[a-f0-9-]{36}$/i.test(pieces[0]!)&&/^(?:[a-f0-9-]{36}\.webp|[a-zA-Z0-9_-]{1,64}\.(?:png|jpe?g))$/i.test(pieces[1]!);
}
function storageUrl(base:URL,action:'object'|'authenticated',key:string){
 return new URL(`/storage/v1/${action==='object'?'object':'object/authenticated'}/${BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`,base).toString();
}

/** Server-only, injected Supabase Storage boundary. It is not enabled by any route. */
export function createSupabaseStorage(projectUrl:string,serviceKey:string,fetcher:StorageFetch,deadlineMs=MAX_DEADLINE){
 const base=project(projectUrl);
 if(typeof serviceKey!=='string'||serviceKey.length<20||serviceKey.length>8192||/[\r\n\s]/.test(serviceKey)||
  typeof fetcher!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>MAX_DEADLINE)
  throw Error('Storage configuration unavailable');

 async function request(method:'GET'|'POST'|'DELETE',url:string,body?:Uint8Array|undefined){
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;
  let response:StorageResponse|undefined;let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;let complete=false;
  const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('deadline'));},deadlineMs);});
  try{
   const headers:Record<string,string>={apikey:serviceKey,authorization:`Bearer ${serviceKey}`};
   if(method==='POST'){headers['content-type']='image/webp';headers['cache-control']='0';headers['x-upsert']='false';}
   if(method==='DELETE')headers['content-type']='application/json';
   const requestPromise=fetcher(url,{method,redirect:'error',signal:controller.signal,headers,...(body?{body:Uint8Array.from(body).buffer}: {})}).then(value=>{
    if(controller.signal.aborted){void value.body?.cancel();throw Error('deadline');}
    return value;
   });
   response=await Promise.race([requestPromise,timeout]);
   complete=true;
   return response;
  }catch{throw Error('Storage operation unavailable');}
  finally{
   clearTimeout(timer!);
   if(!complete){controller.abort();if(reader)void reader.cancel();else if(response?.body)void response.body.cancel();}
   try{reader?.releaseLock();}catch{}
  }
 }
 async function drain(response:StorageResponse){
  try{await response.body?.cancel();}catch{}
 }
 return Object.freeze({
  async putIfAbsent(key:string,bytes:Uint8Array){
   if(!validKey(key)||!(bytes instanceof Uint8Array)||bytes.byteLength<1||bytes.byteLength>MAX_OBJECT)throw Error('Storage operation unavailable');
   const response=await request('POST',storageUrl(base,'object',key),bytes);
   await drain(response);
   if(response.status<200||response.status>=300)throw Error('Storage operation unavailable');
  },
  async inspect(key:string):Promise<Readonly<{state:'absent'|'unknown'}|{state:'present';checksum:string}>>{
   if(!validKey(key))return {state:'unknown'};
   let response:StorageResponse;
   try{response=await request('GET',storageUrl(base,'authenticated',key));}catch{return {state:'unknown'};}
   if(response.status===404){await drain(response);return {state:'absent'};}
   if(response.status<200||response.status>=300||!/^image\/(?:webp|jpeg|png)$/i.test(response.headers.get('content-type')??'')){
    await drain(response);return {state:'unknown'};
   }
   if(!response.body)return {state:'unknown'};
   const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
   const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('deadline'));},deadlineMs);});
   let finished=false;
   try{
    reader=response.body.getReader();const hash=createHash('sha256');let total=0;
    while(true){
     const item=await Promise.race([reader.read(),timeout]);if(item.done)break;
     total+=item.value.byteLength;if(total>MAX_OBJECT){void reader.cancel();return {state:'unknown'};}
     hash.update(item.value);
    }
    if(total===0)return {state:'unknown'};
    finished=true;
    return {state:'present',checksum:hash.digest('hex')} as const;
   }catch{return {state:'unknown'};}
   finally{clearTimeout(timer!);if(reader){if(!finished)void reader.cancel();try{reader.releaseLock();}catch{}} }
  },
  async remove(key:string){
   if(!validKey(key))throw Error('Storage operation unavailable');
   const body=new TextEncoder().encode(JSON.stringify({prefixes:[key]}));
   const response=await request('DELETE',new URL(`/storage/v1/object/${BUCKET}`,base).toString(),body);
   await drain(response);
   if(response.status<200||response.status>=300)throw Error('Storage operation unavailable');
  },
 });
}
