import type {AccountProvider,AccountRequest,AccountReply} from './account-flow.ts';
/** Injected transport only. Not selected by the preview and never authorizes a server operation. */
export function createAccountStatusTransport(origin:string,send:typeof fetch,deadlineMs=15000){
 const base=new URL(origin);if(base.protocol!=='https:'||base.origin!==origin||typeof send!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>15000)throw Error('Account unavailable');
 let pending=0;
 async function call(path:string,input:unknown,external:AbortSignal):Promise<{status:string;http:number}>{
  if(!['/api/account/password','/api/account/recover','/api/account/sign-out','/api/account/reset'].includes(path)||external.aborted||pending>=4)throw Error('Account unavailable');pending++;
  const controller=new AbortController();let body:ReadableStream<Uint8Array>|undefined,reader:ReadableStreamDefaultReader<Uint8Array>|undefined,timer:ReturnType<typeof setTimeout>|undefined;let abort!:()=>void;
  const canceled=new Promise<never>((_,reject)=>{abort=()=>{controller.abort();if(reader)void reader.cancel().catch(()=>{});reject(Error('Account unavailable'));};external.addEventListener('abort',abort,{once:true});timer=setTimeout(abort,deadlineMs);});
  const work=(async()=>{
   try{
    if(controller.signal.aborted)throw Error();
    const url=origin+path,response=await send(url,{method:'POST',mode:'same-origin',credentials:'same-origin',redirect:'error',cache:'no-store',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:controller.signal});
    body=response.body??undefined;
    if(controller.signal.aborted){void body?.cancel().catch(()=>{});throw Error();}
    if(response.redirected||(response.url&&response.url!==url)||!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(response.headers.get('content-type')??'')||!response.body)throw Error();
    const length=response.headers.get('content-length');if(length!==null&&(!/^\d+$/.test(length)||Number(length)>1024))throw Error();
    reader=response.body.getReader();const decoder=new TextDecoder('utf-8',{fatal:true});let size=0,text='';
    while(true){const chunk=await reader.read();if(controller.signal.aborted)throw Error();if(chunk.done)break;size+=chunk.value.byteLength;if(size>1024){void reader.cancel().catch(()=>{});throw Error();}text+=decoder.decode(chunk.value,{stream:true});}
    text+=decoder.decode();const result:unknown=JSON.parse(text);if(!result||typeof result!=='object'||Array.isArray(result)||Object.keys(result).join(',')!=='status'||typeof (result as {status?:unknown}).status!=='string')throw Error();
    return {status:(result as {status:string}).status,http:response.status};
   }catch{throw Error('Account unavailable');}finally{pending--;if(reader)void reader.cancel().catch(()=>{});else if(body)void body.cancel().catch(()=>{});try{reader?.releaseLock();}catch{}}
  })();
  try{const result=await Promise.race([work,canceled]);if(controller.signal.aborted)throw Error('Account unavailable');return result;}finally{if(timer)clearTimeout(timer);external.removeEventListener('abort',abort);}
 }
 return call;
}
/** Explicit browser provider, not selected by the preview. */
export function createAccountHttp(origin:string,send:typeof fetch,deadlineMs=15000,social?:(provider:'google'|'apple',signal:AbortSignal)=>Promise<AccountReply>):AccountProvider{
 const call=createAccountStatusTransport(origin,send,deadlineMs);
 return Object.freeze({
  async submit(input:AccountRequest,signal:AbortSignal):Promise<AccountReply>{
   if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Account unavailable');
   if(input.method==='social'){if(Object.keys(input).sort().join(',')!=='method,provider'||!['google','apple'].includes(input.provider)||typeof social!=='function')throw Error('Account unavailable');return social(input.provider,signal);}
   const keys=Object.keys(input).sort().join(',');
   if(!['signIn','signUp','recover'].includes(input.method)||typeof input.email!=='string')throw Error('Account unavailable');
   const email=input.email.trim();if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Account unavailable');
   if(input.method==='recover'){
    if(keys!=='email,method')throw Error('Account unavailable');const result=await call('/api/account/recover',{email},signal);
    if(result.http!==202||result.status!=='recoveryRequested')throw Error('Account unavailable');return {status:'recoveryRequested'};
   }
   if(keys!=='email,method,password'||typeof input.password!=='string'||input.password.length<1||input.password.length>4096)throw Error('Account unavailable');
   const result=await call('/api/account/password',{method:input.method,email,password:input.password},signal);
   if(result.http===200&&result.status==='signedIn')return {status:'signedIn'};
   if(input.method==='signUp'&&result.http===200&&result.status==='confirmationRequired')return {status:'confirmationRequired'};
   throw Error('Account unavailable');
  },
  async signOut(signal:AbortSignal){const result=await call('/api/account/sign-out',{},signal);if(result.http!==200||result.status!=='signedOut')throw Error('Account unavailable');},
 });
}
