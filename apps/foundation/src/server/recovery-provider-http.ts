import {decodeJwt} from 'jose';
import type {SupabaseFetch,SupabaseFetchResponse} from './supabase-rpc.ts';
import type {RecoveryRequestPort} from './recovery-request.ts';
/** Prepared recovery transport. Explicit injected configuration; no route or environment activation. */
export function createRecoveryProviderHttp(projectUrl:string,appOrigin:string,serviceKey:string,fetcher:SupabaseFetch,deadlineMs=8000){
 const target=new URL(projectUrl),app=new URL(appOrigin);
 if(target.protocol!=='https:'||target.origin!==projectUrl||target.port||!/^[-a-z0-9]+\.supabase\.co$/.test(target.hostname)||target.username||target.password||app.protocol!=='https:'||app.origin!==appOrigin||app.username||app.password||typeof serviceKey!=='string'||serviceKey.length<20||serviceKey.length>8192||/[\s]/.test(serviceKey)||typeof fetcher!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Supabase configuration unavailable');
 let pending=0;
 async function request(path:string,method:'POST'|'PUT',bodyValue:unknown,jwt:string|undefined,external:AbortSignal):Promise<unknown>{
  if(external?.aborted||pending>=4)throw Error('Supabase operation unavailable');
  const body=JSON.stringify(bodyValue);
  if(Buffer.byteLength(body)>16384)throw Error('Supabase operation unavailable');
  pending++;let fetchSettled=false,finished=false,cleanupSettled=true,released=false;
  const release=()=>{if(finished&&fetchSettled&&cleanupSettled&&!released){released=true;pending--;}};
  const cancel=(resource:{cancel():Promise<unknown>}|null|undefined)=>{if(!resource)return;cleanupSettled=false;try{void resource.cancel().then(()=>{cleanupSettled=true;release();},()=>{});}catch{}};
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;let response:SupabaseFetchResponse|undefined;
  let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;let completed=false;
  let stop!:()=>void;
  const timeout=new Promise<never>((_,reject)=>{stop=()=>{controller.abort();reject(Error('deadline'));};timer=setTimeout(stop,deadlineMs);external?.addEventListener('abort',stop,{once:true});});
  try{
   const request=Promise.resolve().then(()=>{if(controller.signal.aborted)throw Error();return fetcher(new URL(path,target).toString(),{
    method,redirect:'error',credentials:'omit',signal:controller.signal,
    headers:{apikey:serviceKey,authorization:`Bearer ${jwt??serviceKey}`,'content-type':'application/json',accept:'application/json'},body,
   });}).then(response=>{
    if(controller.signal.aborted){cancel(response.body);throw Error('deadline');}
    return response;
   }).finally(()=>{fetchSettled=true;release();});
   response=await Promise.race([request,timeout]);
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
   return parsed;
  }catch{throw Error('Supabase operation unavailable');}finally{
   clearTimeout(timer!);external?.removeEventListener('abort',stop);
   if(!completed){controller.abort();cancel(reader??response?.body);}
   try{reader?.releaseLock();}catch{}
   finished=true;release();
  }
 }
 const token=(jwt:string)=>typeof jwt==='string'&&jwt.length>0&&Buffer.byteLength(jwt)<=3800&&!/[\s\u0000-\u001f\u007f]/.test(jwt);
 return Object.freeze({
  async request(input:Parameters<RecoveryRequestPort['request']>[0],signal:AbortSignal):Promise<void>{
   const redirect=new URL(input.redirectTo);
   if(typeof input.email!=='string'||input.email.length>254||!/^\S+@\S+\.\S+$/.test(input.email)||redirect.origin!==appOrigin||redirect.pathname!=='/auth/callback/recovery'||redirect.hash||redirect.username||redirect.password||[...redirect.searchParams.keys()].join(',')!=='flow'||!/^[-_A-Za-z0-9]{43}$/.test(redirect.searchParams.get('flow')??'')||input.challengeMethod!=='S256'||!/^[-_A-Za-z0-9]{43}$/.test(input.challenge))throw Error('Supabase operation unavailable');
   await request('/auth/v1/recover?redirect_to='+encodeURIComponent(redirect.href),'POST',{email:input.email,code_challenge:input.challenge,code_challenge_method:'S256'},undefined,signal);
  },
  // Cross-device recovery consumes the email bearer proof only after explicit confirmation.
  // Returned tokens still require independent signed recovery-purpose verification.
  verifyRecoveryToken(tokenHash:string,signal:AbortSignal){
   if(typeof tokenHash!=='string'||!/^[-_A-Za-z0-9]{1,256}$/.test(tokenHash))return Promise.reject(Error('Supabase operation unavailable'));
   return request('/auth/v1/verify','POST',{token_hash:tokenHash,type:'recovery'},undefined,signal);
  },
  /** Local investigation seam only. Not mounted or selected by the account composition.
   * A six-digit recovery code is bearer proof; never place it in a URL or return provider tokens. */
  verifyRecoveryCode(input:Readonly<{email:string;code:string}>,signal:AbortSignal){
   if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).sort().join(',')!=='code,email'||typeof input.email!=='string'||input.email.length>254||!/^\S+@\S+\.\S+$/.test(input.email)||/[\u0000-\u001f\u007f]/.test(input.email)||typeof input.code!=='string'||!/^\d{6}$/.test(input.code))return Promise.reject(Error('Supabase operation unavailable'));
   return request('/auth/v1/verify','POST',{email:input.email,token:input.code,type:'recovery'},undefined,signal);
  },
  exchange(input:Readonly<{code:string;verifier:string}>,signal:AbortSignal){
   if(!input||typeof input.code!=='string'||!/^[-._~A-Za-z0-9]{1,2048}$/.test(input.code)||typeof input.verifier!=='string'||!/^[-_A-Za-z0-9]{43}$/.test(input.verifier))return Promise.reject(Error('Supabase operation unavailable'));
   return request('/auth/v1/token?grant_type=pkce','POST',{auth_code:input.code,code_verifier:input.verifier},undefined,signal);
  },
  async updatePassword(jwt:string,password:string,signal:AbortSignal):Promise<boolean>{
   if(!token(jwt)||typeof password!=='string'||password.length<1||password.length>4096)return false;
   try{
    // Decoding correlates the response only. The recovery adapter verifies the signature and purpose.
    const owner=decodeJwt(jwt).sub;if(typeof owner!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(owner))return false;
    const reply=await request('/auth/v1/user','PUT',{password},jwt,signal);
    return !signal.aborted&&!!reply&&typeof reply==='object'&&!Array.isArray(reply)&&(reply as Record<string,unknown>).id===owner&&!('error' in reply);
   }catch{return false;}
  },
 });
}
