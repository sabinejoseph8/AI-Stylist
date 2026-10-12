import type {SupabaseFetch,SupabaseFetchResponse} from './supabase-rpc.ts';
/** Disabled transport boundary. No key is read from the environment and no route calls this by default. */
export function createRefreshProviderHttp(projectUrl:string,serviceKey:string,fetcher:SupabaseFetch,deadlineMs=8000){
 let target:URL;
 try{
  target=new URL(projectUrl);
  if(target.protocol!=='https:'||!/^([a-z0-9-]+)\.supabase\.co$/.test(target.hostname)||
   target.username||target.password||target.port||target.pathname!=='/'||target.search||target.hash)throw Error();
 }catch{throw Error('Supabase destination unavailable');}
 if(typeof serviceKey!=='string'||serviceKey.length<20||serviceKey.length>8192||/[\r\n\s]/.test(serviceKey)||
  typeof fetcher!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)
  throw Error('Supabase configuration unavailable');
 let pending=0;
 async function request(operation:'refresh'|'revoke',credential:string,external:AbortSignal):Promise<unknown>{
  if(external?.aborted||pending>=4)throw Error('Supabase operation unavailable');
  if(typeof credential!=='string'||credential.length<1||Buffer.byteLength(credential,'utf8')>8192||/[\s\u0000-\u001f\u007f]/.test(credential))throw Error('Supabase operation unavailable');
  const body=operation==='refresh'?JSON.stringify({refresh_token:credential}):undefined;
  pending++;let fetchSettled=false,finished=false,cleanupSettled=true,released=false;
  const release=()=>{if(finished&&fetchSettled&&cleanupSettled&&!released){released=true;pending--;}};
  const cancel=(resource:{cancel():Promise<unknown>}|null|undefined)=>{if(!resource)return;cleanupSettled=false;try{void resource.cancel().then(()=>{cleanupSettled=true;release();},()=>{});}catch{}};
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;let response:SupabaseFetchResponse|undefined;
  let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;let completed=false;
  let stop!:()=>void;
  const timeout=new Promise<never>((_,reject)=>{stop=()=>{controller.abort();reject(Error('deadline'));};timer=setTimeout(stop,deadlineMs);external?.addEventListener('abort',stop,{once:true});});
  try{
   const request=Promise.resolve().then(()=>{if(controller.signal.aborted)throw Error();return fetcher(new URL(operation==='refresh'?'/auth/v1/token?grant_type=refresh_token':'/auth/v1/logout?scope=local',target).toString(),{
    method:'POST',redirect:'error',credentials:'omit',signal:controller.signal,
    headers:{apikey:serviceKey,authorization:`Bearer ${operation==='refresh'?serviceKey:credential}`,'content-type':'application/json',accept:'application/json'},body,
   });}).then(response=>{
    if(controller.signal.aborted){cancel(response.body);throw Error('deadline');}
    return response;
   }).finally(()=>{fetchSettled=true;release();});
   response=await Promise.race([request,timeout]);
   if(operation==='revoke'){if(response.status!==204||response.body!==null)throw Error('unconfirmed');completed=true;return {status:'accepted'};}
   if(response.status!==200||!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type')??''))
    throw Error('status');
   if(!response.body)throw Error('body unavailable');
   reader=response.body.getReader();const parts:Uint8Array[]=[];let length=0;
   while(true){
    const item=await Promise.race([reader.read(),timeout]);if(item.done)break;
    length+=item.value.byteLength;
    if(length>65536)throw Error('response limit');
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
 }
 return Object.freeze({
  refresh(input:Readonly<{refresh_token:string}>,signal:AbortSignal){return request('refresh',input?.refresh_token,signal);},
  async revoke(jwt:string,scope:'local',signal:AbortSignal):Promise<Readonly<{status:'accepted'|'unconfirmed'}>>{
   if(scope!=='local')return {status:'unconfirmed'};
   try{return await request('revoke',jwt,signal) as {status:'accepted'};}catch{return {status:'unconfirmed'};}
  },
 });
}
