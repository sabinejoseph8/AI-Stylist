import type {createRecoveryBrowser} from './recovery-browser.ts';
type Delivery=Pick<ReturnType<typeof createRecoveryBrowser>,'submit'>;
/** Prepared only: not registered with any server. Real deployment also needs durable abuse/rate controls. */
export function createRecoveryHttp(origin:string,delivery:Delivery,deadlineMs=10000){
 const base=new URL(origin);if(base.protocol!=='https:'||base.origin!==origin||typeof delivery?.submit!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>10000)throw Error('Recovery unavailable');
 let admitted=0;
 function response(status:number,result:string,cookie?:string|null){
  const headers=new Headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'});
  if(cookie)headers.set('Set-Cookie',cookie);
  return new Response(JSON.stringify({status:result}),{status,headers});
 }
 return async(request:Request,external:AbortSignal):Promise<Response>=>{
  const url=new URL(request.url),site=request.headers.get('sec-fetch-site'),length=request.headers.get('content-length');
  if(external.aborted||request.signal.aborted||request.method!=='POST'||url.origin!==origin||url.pathname!=='/api/account/reset'||url.search||url.hash||request.headers.get('origin')!==origin||request.headers.has('authorization')||(request.headers.has('host')&&request.headers.get('host')!==base.host)||(site!==null&&site!=='same-origin'&&site!=='none')||!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type')??'')||request.headers.has('content-encoding')||(length!==null&&(!/^\d+$/.test(length)||Number(length)>16384))||!request.body)return response(400,'unavailable');
  if(admitted>=4)return response(429,'unavailable');
  admitted++;
  const controller=new AbortController();let reader:ReadableStreamDefaultReader<Uint8Array>|undefined,timer:ReturnType<typeof setTimeout>|undefined;let stop!:()=>void;
  const abort=new Promise<Response>(resolve=>{stop=()=>{controller.abort();if(reader)void reader.cancel().catch(()=>{});resolve(response(409,'unconfirmed'));};external.addEventListener('abort',stop,{once:true});request.signal.addEventListener('abort',stop,{once:true});timer=setTimeout(stop,deadlineMs);});
  const work=(async()=>{
   try{
    if(controller.signal.aborted)return response(409,'unconfirmed');
    reader=request.body!.getReader();const decoder=new TextDecoder('utf-8',{fatal:true});let text='',size=0;
    while(true){const chunk=await reader.read();if(controller.signal.aborted)return response(409,'unconfirmed');if(chunk.done)break;size+=chunk.value.byteLength;if(size>16384){void reader.cancel().catch(()=>{});return response(400,'unavailable');}text+=decoder.decode(chunk.value,{stream:true});}
    text+=decoder.decode();
    const input:unknown=JSON.parse(text);
    if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).sort().join(',')!=='confirmation,password')return response(400,'unavailable');
    const x=input as Record<string,unknown>;if(typeof x.password!=='string'||x.password.length<1||x.password.length>4096||x.password!==x.confirmation)return response(400,'unavailable');
    if(controller.signal.aborted)return response(409,'unconfirmed');
    const result=await delivery.submit(request,input,controller.signal);
    if(controller.signal.aborted)return response(409,'unconfirmed');
    return response(result.status==='resetComplete'?200:result.status==='unconfirmed'?409:400,result.status,result.setCookie);
   }catch{return response(controller.signal.aborted?409:400,controller.signal.aborted?'unconfirmed':'unavailable');}
   finally{admitted--;try{reader?.releaseLock();}catch{}}
  })();
  try{return await Promise.race([work,abort]);}finally{if(timer)clearTimeout(timer);external.removeEventListener('abort',stop);request.signal.removeEventListener('abort',stop);}
 };
}
