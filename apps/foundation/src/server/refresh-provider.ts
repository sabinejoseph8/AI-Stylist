import type {RefreshRotationProvider} from './refresh-rotation.ts';
/** Narrow injected operations; concrete transport must not retry, persist sessions or normalize errors. */
export interface RefreshProviderOperations {
 refresh(input:Readonly<{refresh_token:string}>,signal:AbortSignal):Promise<unknown>;
 revoke(jwt:string,scope:'local',signal:AbortSignal):Promise<Readonly<{status:'accepted'|'unconfirmed'}>>;
}
/** Disabled provider bridge. Explicit expiry policy is application-owned, not provider token lifetime. */
export function createRefreshProvider(operations:RefreshProviderOperations,expiryPolicy:(accessToken:string)=>number,deadlineMs=8000):RefreshRotationProvider{
 if(typeof operations?.refresh!=='function'||typeof operations?.revoke!=='function'||typeof expiryPolicy!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Account refresh unavailable');
 let pending=0;
 const text=(x:unknown,max:number):x is string=>typeof x==='string'&&x.length>0&&Buffer.byteLength(x,'utf8')<=max&&!/[\s\u0000-\u001f\u007f]/.test(x);
 async function bounded<T>(work:(signal:AbortSignal)=>Promise<T>,external:AbortSignal):Promise<T>{
  if(external.aborted||pending>=4)throw Error('Account refresh unavailable');pending++;
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;let stop!:()=>void;
  const canceled=new Promise<never>((_,reject)=>{stop=()=>{controller.abort();reject(Error('Account refresh unavailable'));};external.addEventListener('abort',stop,{once:true});timer=setTimeout(stop,deadlineMs);});
  const running=Promise.resolve().then(()=>{if(controller.signal.aborted)throw Error();return work(controller.signal);}).finally(()=>pending--);
  try{return await Promise.race([running,canceled]);}catch{throw Error('Account refresh unavailable');}finally{if(timer)clearTimeout(timer);external.removeEventListener('abort',stop);}
 }
 return Object.freeze({async rotate(secret:string,signal:AbortSignal){
  if(!text(secret,8192))throw Error('Account refresh unavailable');
  const result=await bounded(s=>operations.refresh(Object.freeze({refresh_token:secret}),s),signal);
  if(!result||typeof result!=='object'||Array.isArray(result))throw Error('Account refresh unavailable');
  const value=result as Record<string,unknown>;
  if(!text(value.access_token,3800)||!text(value.refresh_token,8192)||value.token_type!=='bearer')throw Error('Account refresh unavailable');
  const accessToken=value.access_token,refreshSecret=value.refresh_token;
  let expiresAt:number;try{expiresAt=expiryPolicy(accessToken);}catch{throw Error('Account refresh unavailable');}
  if(!Number.isSafeInteger(expiresAt)||expiresAt<=Date.now())throw Error('Account refresh unavailable');
  // Ambiguous or malformed remote results stay unresolved; never infer revocation from local clearing.
  let cleanup:Promise<boolean>|undefined;
  return Object.freeze({accessToken,refreshSecret,expiresAt,revoke(cleanupSignal:AbortSignal){
   if(!cleanup)cleanup=bounded(s=>operations.revoke(accessToken,'local',s),cleanupSignal).then(reply=>reply?.status==='accepted').catch(()=>false);
   return cleanup;
  }});
 }});
}
