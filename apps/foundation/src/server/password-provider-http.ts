import type {PasswordAccountRequest} from './password-account.ts';
import type {AccountExchangePort} from './account-exchange.ts';
import type {SupabaseFetch,SupabaseFetchResponse} from './supabase-rpc.ts';
/** Disabled transport boundary. No key is read from the environment and no route calls this by default. */
export function createPasswordProviderHttp(projectUrl:string,serviceKey:string,fetcher:SupabaseFetch,deadlineMs=8000){
 let target:URL;
 try{
  target=new URL(projectUrl);
  if(target.protocol!=='https:'||!/^([a-z0-9-]+)\.supabase\.co$/.test(target.hostname)||
   target.username||target.password||target.port||target.pathname!=='/'||target.search||target.hash)throw Error();
 }catch{throw Error('Supabase destination unavailable');}
 if(typeof serviceKey!=='string'||serviceKey.length<20||serviceKey.length>8192||/[\r\n\s]/.test(serviceKey)||
  typeof fetcher!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)
  throw Error('Supabase configuration unavailable');
 type ExchangeInput=Parameters<AccountExchangePort['exchange']>[0];
 let pending=0;
 async function request(operation:'signIn'|'signUp'|'revoke'|'exchange',credential:string|PasswordAccountRequest|ExchangeInput,external:AbortSignal):Promise<unknown>{
  if(external?.aborted||pending>=4)throw Error('Supabase operation unavailable');
  if(operation==='revoke'){
   if(typeof credential!=='string'||credential.length<1||Buffer.byteLength(credential,'utf8')>8192||/[\s\u0000-\u001f\u007f]/.test(credential))throw Error('Supabase operation unavailable');
  }else if(operation==='exchange'){
   const value=credential as ExchangeInput;
   if(!value||!['google','apple'].includes(value.purpose)||typeof value.code!=='string'||!/^[-._~A-Za-z0-9]{1,2048}$/.test(value.code)||typeof value.verifier!=='string'||!/^[-_A-Za-z0-9]{43}$/.test(value.verifier))throw Error('Supabase operation unavailable');
  }else{
   if(!credential||typeof credential!=='object'||!('method' in credential)||credential.method!==operation||typeof credential.email!=='string'||credential.email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credential.email)||typeof credential.password!=='string'||credential.password.length<1||credential.password.length>4096)throw Error('Supabase operation unavailable');
  }
  const body=typeof credential==='object'?(operation==='exchange'?JSON.stringify({auth_code:(credential as ExchangeInput).code,code_verifier:(credential as ExchangeInput).verifier}):JSON.stringify({email:(credential as PasswordAccountRequest).email,password:(credential as PasswordAccountRequest).password})):undefined;
  pending++;let fetchSettled=false,finished=false,cleanupSettled=true,released=false;
  const release=()=>{if(finished&&fetchSettled&&cleanupSettled&&!released){released=true;pending--;}};
  const cancel=(resource:{cancel():Promise<unknown>}|null|undefined)=>{if(!resource)return;cleanupSettled=false;try{void resource.cancel().then(()=>{cleanupSettled=true;release();},()=>{});}catch{}};
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;let response:SupabaseFetchResponse|undefined;
  let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;let completed=false;
  let stop!:()=>void;
  const timeout=new Promise<never>((_,reject)=>{stop=()=>{controller.abort();reject(Error('deadline'));};timer=setTimeout(stop,deadlineMs);external?.addEventListener('abort',stop,{once:true});});
  try{
   const request=Promise.resolve().then(()=>{if(controller.signal.aborted)throw Error();return fetcher(new URL(operation==='signIn'?'/auth/v1/token?grant_type=password':operation==='signUp'?'/auth/v1/signup':operation==='exchange'?'/auth/v1/token?grant_type=pkce':'/auth/v1/logout?scope=local',target).toString(),{
    method:'POST',redirect:'error',credentials:'omit',signal:controller.signal,
    headers:{apikey:serviceKey,authorization:`Bearer ${operation==='revoke'?credential:serviceKey}`,'content-type':'application/json',accept:'application/json'},body,
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
   completed=true;
   if(operation==='signUp'&&parsed&&typeof parsed==='object'&&!Array.isArray(parsed)&&!('access_token' in parsed)&&!('refresh_token' in parsed)&&!('error' in parsed)&&!('session' in parsed)&&typeof parsed.id==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(parsed.id))return Object.freeze({status:'confirmationRequired'});
   return parsed;
  }catch{throw Error('Supabase operation unavailable');}finally{
   clearTimeout(timer!);external?.removeEventListener('abort',stop);
   if(!completed){controller.abort();cancel(reader??response?.body);}
   try{reader?.releaseLock();}catch{}
   finished=true;release();
  }
 }
 return Object.freeze({
  exchange(input:ExchangeInput,signal:AbortSignal){return request('exchange',input,signal);},
  password(input:PasswordAccountRequest,signal:AbortSignal){
   if(!input||!['signIn','signUp'].includes(input.method))return Promise.reject(Error('Supabase operation unavailable'));
   return request(input.method,input,signal);
  },
  async revoke(jwt:string,scope:'local',signal:AbortSignal):Promise<boolean>{
   if(scope!=='local')return false;
   try{const reply=await request('revoke',jwt,signal) as {status:string};return reply.status==='accepted';}catch{return false;}
  },
 });
}
