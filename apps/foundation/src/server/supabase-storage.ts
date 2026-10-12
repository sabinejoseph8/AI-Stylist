import {createHash} from 'node:crypto';

const BUCKET='stylist-wardrobe';
const MAX_OBJECT=10*1024*1024;
const MAX_DEADLINE=8000;
const UUID='[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}';
const readableKey=new RegExp(`^${UUID}/[A-Za-z0-9_-]{1,128}\\.(?:webp|png|jpe?g)$`,'i');
const uploadKey=new RegExp(`^${UUID}/${UUID}\\.webp$`,'i');
const uuid=new RegExp(`^${UUID}$`,'i');
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
function storageUrl(base:URL,action:'object'|'authenticated',key:string){
 return new URL(`/storage/v1/${action==='object'?'object':'object/authenticated'}/${BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`,base).toString();
}
function cancel(body:ReadableStream<Uint8Array>|null|undefined){
 try{void body?.cancel().catch(()=>{});}catch{}
}

/** Server-only, injected Supabase Storage boundary. It is not enabled by any route. */
export function createSupabaseStorage(projectUrl:string,serviceKey:string,fetcher:StorageFetch,deadlineMs=MAX_DEADLINE){
 const base=project(projectUrl);
 if(typeof serviceKey!=='string'||serviceKey.length<20||serviceKey.length>8192||/[\r\n\s]/.test(serviceKey)||
  typeof fetcher!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>MAX_DEADLINE)
  throw Error('Storage configuration unavailable');

 async function request<T>(method:'GET'|'POST'|'DELETE',url:string,read:(response:StorageResponse,wait:<R>(work:Promise<R>)=>Promise<R>,setReader:(value:ReadableStreamDefaultReader<Uint8Array>)=>void)=>Promise<T>,body?:Uint8Array,externalSignal?:AbortSignal){
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;
  let response:StorageResponse|undefined;let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
  let abortExternal=()=>{};
  const timeout=new Promise<never>((_,reject)=>{
   abortExternal=()=>{controller.abort();reject(Error('aborted'));};
   timer=setTimeout(()=>{controller.abort();reject(Error('deadline'));},deadlineMs);
   externalSignal?.addEventListener('abort',abortExternal,{once:true});
  });
  const wait=<R>(work:Promise<R>)=>Promise.race([work,timeout]);
  try{
   if(externalSignal?.aborted)throw Error('aborted');
   const headers:Record<string,string>={apikey:serviceKey,authorization:`Bearer ${serviceKey}`};
   if(method==='POST'){headers['content-type']='image/webp';headers['cache-control']='max-age=0';headers['x-upsert']='false';}
   if(method==='DELETE')headers['content-type']='application/json';
   const pending=fetcher(url,{method,redirect:'error',signal:controller.signal,headers,...(body?{body:Uint8Array.from(body).buffer}:{})}).then(value=>{
    if(controller.signal.aborted){cancel(value.body);throw Error('deadline');}
    return value;
   });
   response=await wait(pending);
   return await wait(read(response,wait,value=>{reader=value;}));
  }catch{throw Error('Storage operation unavailable');}
  finally{
   clearTimeout(timer!);externalSignal?.removeEventListener('abort',abortExternal);controller.abort();
   // A broken stream may never settle cancellation. Do not let it hold the deadline.
   if(reader){try{void reader.cancel().catch(()=>{});}catch{}try{reader.releaseLock();}catch{}}
   else cancel(response?.body);
  }
 }
 async function json(response:StorageResponse,wait:<R>(work:Promise<R>)=>Promise<R>,setReader:(value:ReadableStreamDefaultReader<Uint8Array>)=>void,readError=false):Promise<unknown>{
  if((!readError&&(response.status<200||response.status>=300))||!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type')??'')||!response.body)throw Error('response');
  const reader=response.body.getReader();setReader(reader);const parts:Uint8Array[]=[];let length=0;
  while(true){const item=await wait(reader.read());if(item.done)break;length+=item.value.byteLength;if(length>65536)throw Error('size');parts.push(item.value);}
  const bytes=new Uint8Array(length);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 }
 return Object.freeze({
  async putIfAbsent(key:string,bytes:Uint8Array){
   if(typeof key!=='string'||!uploadKey.test(key)||!(bytes instanceof Uint8Array)||bytes.byteLength<1||bytes.byteLength>MAX_OBJECT)throw Error('Storage operation unavailable');
   await request('POST',storageUrl(base,'object',key),async(response,wait,setReader)=>{
    const result=await json(response,wait,setReader);
    if(!result||typeof result!=='object'||Array.isArray(result))throw Error('acknowledgment');
    const row=result as Record<string,unknown>;
    if(row.Key!==`${BUCKET}/${key}`||typeof row.Id!=='string'||!uuid.test(row.Id))throw Error('acknowledgment');
   },bytes);
  },
  async inspect(key:string):Promise<Readonly<{state:'absent'|'unknown'}|{state:'present';checksum:string}>>{
   if(typeof key!=='string'||!readableKey.test(key))return {state:'unknown'};
   try{
    return await request('GET',storageUrl(base,'authenticated',key),async(response,wait,setReader)=>{
     if(response.status===400||response.status===404){
      // Storage may wrap NoSuchKey in HTTP 400. A bare status or missing bucket
      // cannot prove this specific object is absent.
      const error=await json(response,wait,setReader,true);
      if(error&&typeof error==='object'&&!Array.isArray(error)){
       const row=error as Record<string,unknown>;
       if(row.code==='NoSuchKey'&&(row.statusCode==='404'||row.statusCode===404)&&row.error==='not_found')return {state:'absent'} as const;
      }
      throw Error('unverified absence');
     }
     // Partial content cannot establish a full object's checksum.
     if(response.status!==200||response.headers.get('content-range')||!/^image\/(?:webp|jpeg|png)(?:\s*;|$)/i.test(response.headers.get('content-type')??'')||!response.body)throw Error('response');
     const reader=response.body.getReader();setReader(reader);
     const hash=createHash('sha256');let total=0;
     while(true){
      const item=await wait(reader.read());if(item.done)break;
      total+=item.value.byteLength;if(total>MAX_OBJECT)throw Error('size');
      hash.update(item.value);
     }
     if(total===0)throw Error('empty');
     return {state:'present',checksum:hash.digest('hex')} as const;
    });
   }catch{return {state:'unknown'};}
  },
  async download(key:string,signal?:AbortSignal):Promise<Readonly<{bytes:Uint8Array;contentType:'image/webp'|'image/jpeg'|'image/png';checksum:string}>>{
   if(typeof key!=='string'||!readableKey.test(key))throw Error('Storage operation unavailable');
   return await request('GET',storageUrl(base,'authenticated',key),async(response,wait,setReader)=>{
    const type=(response.headers.get('content-type')??'').split(';')[0].trim().toLowerCase();
    if(response.status!==200||response.headers.get('content-range')||!['image/webp','image/jpeg','image/png'].includes(type)||!response.body)throw Error('response');
    const reader=response.body.getReader();setReader(reader);const parts:Uint8Array[]=[];let size=0;
    while(true){const item=await wait(reader.read());if(item.done)break;size+=item.value.byteLength;if(size>MAX_OBJECT)throw Error('size');parts.push(item.value);}
    if(size===0)throw Error('empty');
    const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}
    return Object.freeze({bytes,contentType:type as 'image/webp'|'image/jpeg'|'image/png',checksum:createHash('sha256').update(bytes).digest('hex')});
   },undefined,signal);
  },
  async remove(key:string){
   if(typeof key!=='string'||!readableKey.test(key))throw Error('Storage operation unavailable');
   await request('DELETE',new URL(`/storage/v1/object/${BUCKET}`,base).toString(),async(response,wait,setReader)=>{
    const result=await json(response,wait,setReader);
    if(!Array.isArray(result)||result.length!==1||!result[0]||typeof result[0]!=='object'||result[0].name!==key||result[0].bucket_id!==BUCKET)throw Error('acknowledgment');
   },new TextEncoder().encode(JSON.stringify({prefixes:[key]})));
  },
 });
}
