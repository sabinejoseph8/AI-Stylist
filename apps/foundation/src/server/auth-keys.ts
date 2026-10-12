import {createLocalJWKSet,type JWTVerifyGetKey} from 'jose';
/** Fixed-project public key transport. Disconnected until a caller explicitly injects fetch. */
export function createAuthKeys(projectUrl:string,fetcher:typeof fetch,deadlineMs=5000):JWTVerifyGetKey{
 const url=new URL(projectUrl);
 if(url.protocol!=='https:'||!/^([a-z0-9-]+)\.supabase\.co$/.test(url.hostname)||url.port||url.username||url.password||url.pathname!=='/'||url.search||url.hash||typeof fetcher!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>5000)throw Error('Key configuration unavailable');
 const endpoint=url.origin+'/auth/v1/.well-known/jwks.json';
 let cached:JWTVerifyGetKey|undefined,loaded=0,lastAttempt=0,pending:Promise<void>|undefined;
 async function load(){
  if(pending)return pending;
  if(lastAttempt&&Date.now()-lastAttempt<30000)throw Error('Keys unavailable');
  lastAttempt=Date.now();
  pending=(async()=>{
   const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),deadlineMs);
   let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
   try{
    const response=await fetcher(endpoint,{method:'GET',redirect:'error',credentials:'omit',signal:controller.signal,headers:{Accept:'application/json'}});
    if(controller.signal.aborted||response.status!==200||!response.body)throw Error();
    reader=response.body.getReader();let size=0;const chunks:Uint8Array[]=[];
    while(true){const part=await reader.read();if(controller.signal.aborted)throw Error();if(part.done)break;size+=part.value.length;if(size>65536)throw Error();chunks.push(part.value);}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    const parsed=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    if(!parsed||!Array.isArray(parsed.keys)||parsed.keys.length<1||parsed.keys.length>32||parsed.keys.some((key:Record<string,unknown>)=>!key||!['EC','RSA'].includes(String(key.kty))||typeof key.kid!=='string'||key.kid.length<1||key.kid.length>128||['d','k','p','q','dp','dq','qi','oth'].some(field=>field in key)))throw Error();
    cached=createLocalJWKSet(parsed);loaded=Date.now();
   }catch{throw Error('Keys unavailable');}finally{clearTimeout(timer);if(reader)void reader.cancel().catch(()=>{});}
  })().finally(()=>{pending=undefined;});
  return pending;
 }
 async function refresh(){
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{await Promise.race([load(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('Keys unavailable')),deadlineMs);})]);}
  finally{if(timer)clearTimeout(timer);}
 }
 return async(header,token)=>{
  if(!['ES256','RS256'].includes(String(header.alg))||typeof header.kid!=='string'||header.kid.length<1||header.kid.length>128)throw Error('Keys unavailable');
  if(!cached||Date.now()-loaded>=600000)await refresh();
  try{return await cached!(header,token);}catch(error){
   if((error as {code?:string}).code!=='ERR_JWKS_NO_MATCHING_KEY')throw error;
   await refresh();return cached!(header,token);
  }
 };
}
