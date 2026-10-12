export function accountJsonResponse(status:number,result:string,cookies:readonly string[]=[]){
 const headers=new Headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'});
 for(const cookie of cookies)headers.append('Set-Cookie',cookie);
 return new Response(JSON.stringify({status:result}),{status,headers});
}
/** Prepared only: not registered with any server. Real deployment also needs durable abuse/rate controls. */
export function createAccountJsonBoundary(origin:string,path:string,operation:(input:unknown,request:Request,signal:AbortSignal)=>Promise<Response>,deadlineMs=10000,discardResponse?:(response:Response)=>Promise<unknown>){
 const base=new URL(origin);if(base.protocol!=='https:'||base.origin!==origin||typeof operation!=='function'||!/^\/api\/account\/[a-z-]+$/.test(path)||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>10000)throw Error('Recovery unavailable');
 let admitted=0;
 return async(request:Request,external:AbortSignal):Promise<Response>=>{
  const url=new URL(request.url),site=request.headers.get('sec-fetch-site'),length=request.headers.get('content-length');
  if(external.aborted||request.signal.aborted||request.method!=='POST'||url.origin!==origin||url.pathname!==path||url.search||url.hash||request.headers.get('origin')!==origin||request.headers.has('authorization')||(request.headers.has('host')&&request.headers.get('host')!==base.host)||(site!==null&&site!=='same-origin'&&site!=='none')||!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type')??'')||request.headers.has('content-encoding')||(length!==null&&(!/^\d+$/.test(length)||Number(length)>16384))||!request.body)return accountJsonResponse(400,'unavailable');
  if(admitted>=4)return accountJsonResponse(429,'unavailable');
  admitted++;
  const controller=new AbortController();let reader:ReadableStreamDefaultReader<Uint8Array>|undefined,timer:ReturnType<typeof setTimeout>|undefined;let stop!:()=>void;
  const abort=new Promise<Response>(resolve=>{stop=()=>{controller.abort();if(reader)void reader.cancel().catch(()=>{});resolve(accountJsonResponse(409,'unconfirmed'));};external.addEventListener('abort',stop,{once:true});request.signal.addEventListener('abort',stop,{once:true});timer=setTimeout(stop,deadlineMs);});
  const work=(async()=>{
   try{
    if(controller.signal.aborted)return accountJsonResponse(409,'unconfirmed');
    reader=request.body!.getReader();const decoder=new TextDecoder('utf-8',{fatal:true});let text='',size=0;
    while(true){const chunk=await reader.read();if(controller.signal.aborted)return accountJsonResponse(409,'unconfirmed');if(chunk.done)break;size+=chunk.value.byteLength;if(size>16384){void reader.cancel().catch(()=>{});return accountJsonResponse(400,'unavailable');}text+=decoder.decode(chunk.value,{stream:true});}
    text+=decoder.decode();
    const input:unknown=JSON.parse(text);
    if(controller.signal.aborted)return accountJsonResponse(409,'unconfirmed');
    const result=await operation(input,request,controller.signal);
    if(controller.signal.aborted){await discardResponse?.(result);return accountJsonResponse(409,'unconfirmed');}
    return result;
   }catch{return accountJsonResponse(controller.signal.aborted?409:400,controller.signal.aborted?'unconfirmed':'unavailable');}
   finally{admitted--;try{reader?.releaseLock();}catch{}}
  })();
  try{const result=await Promise.race([work,abort]);if(controller.signal.aborted)await discardResponse?.(result);return result;}finally{if(timer)clearTimeout(timer);external.removeEventListener('abort',stop);request.signal.removeEventListener('abort',stop);}
 };
}
