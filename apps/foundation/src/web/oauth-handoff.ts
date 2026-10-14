import {isMvpSocialProvider} from '../account-policy.ts';
/** Dormant browser handoff. Caller supplies both fetch and navigation; preview never selects it. */
export function createOAuthHandoff(origin:string,projectUrl:string,send:typeof fetch,navigate:(url:string)=>void,deadlineMs=10000){
 const app=new URL(origin),project=new URL(projectUrl);
 if(app.protocol!=='https:'||app.origin!==origin||project.protocol!=='https:'||project.origin!==projectUrl||project.port||!/^[a-z0-9-]+\.supabase\.co$/.test(project.hostname)||typeof send!=='function'||typeof navigate!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>10000)throw Error('Account unavailable');
 let pending=false;
 return async(provider:'google'|'apple',external:AbortSignal)=>{
  if(!isMvpSocialProvider(provider)||external.aborted||pending)throw Error('Account unavailable');pending=true;
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined,reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
  let stop!:()=>void;
  const canceled=new Promise<never>((_,reject)=>{stop=()=>{controller.abort();void reader?.cancel().catch(()=>{});reject(Error('Account unavailable'));};external.addEventListener('abort',stop,{once:true});timer=setTimeout(stop,deadlineMs);});
  const work=(async()=>{
   let body:ReadableStream<Uint8Array>|null=null;
   try{
    const endpoint=origin+'/api/account/oauth',response=await send(endpoint,{method:'POST',mode:'same-origin',credentials:'same-origin',redirect:'error',cache:'no-store',referrerPolicy:'no-referrer',headers:{'content-type':'application/json'},body:JSON.stringify({provider,returnPath:'/'}),signal:controller.signal});body=response.body;
    if(controller.signal.aborted||response.status!==200||response.redirected||(response.url&&response.url!==endpoint)||!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(response.headers.get('content-type')??'')||!body)throw Error();
    reader=body.getReader();let text='',size=0;const decoder=new TextDecoder('utf-8',{fatal:true});
    while(true){const chunk=await reader.read();if(controller.signal.aborted)throw Error();if(chunk.done)break;size+=chunk.value.byteLength;if(size>4096)throw Error();text+=decoder.decode(chunk.value,{stream:true});}text+=decoder.decode();
    const value=JSON.parse(text);if(!value||Array.isArray(value)||Object.keys(value).sort().join(',')!=='status,url'||value.status!=='handoff'||typeof value.url!=='string')throw Error();
    const url=new URL(value.url);if(url.origin!==projectUrl||url.pathname!=='/auth/v1/authorize'||url.hash||url.username||url.password||Array.from(url.searchParams.keys()).sort().join(',')!=='code_challenge,code_challenge_method,provider,redirect_to'||url.searchParams.get('provider')!==provider||url.searchParams.get('code_challenge_method')!=='S256'||! /^[A-Za-z0-9_-]{43}$/.test(url.searchParams.get('code_challenge')??''))throw Error();
    const callback=new URL(url.searchParams.get('redirect_to')??'');if(callback.origin!==origin||callback.pathname!=='/auth/callback/'+provider||callback.hash||callback.username||callback.password||Array.from(callback.searchParams.keys()).join(',')!=='flow'||! /^[A-Za-z0-9_-]{43}$/.test(callback.searchParams.get('flow')??''))throw Error();
    if(controller.signal.aborted)throw Error();navigate(url.href);return {status:'redirecting' as const};
   }catch{throw Error('Account unavailable');}
   finally{try{if(reader)await reader.cancel();else await body?.cancel();}catch{}try{reader?.releaseLock();}catch{}pending=false;}
  })();
  try{return await Promise.race([work,canceled]);}finally{if(timer)clearTimeout(timer);external.removeEventListener('abort',stop);}
 };
}
