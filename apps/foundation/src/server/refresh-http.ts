import type {createAccountRefresh} from './account-refresh.ts';
import {createAccountJsonBoundary,accountJsonResponse} from './account-json.ts';
/** Disconnected refresh delivery. The caller owns refresh-state adoption and failed-delivery cleanup. */
export function createRefreshHttp(origin:string,accounts:Pick<ReturnType<typeof createAccountRefresh>,'submit'>,deadlineMs=10000){
 if(typeof accounts?.submit!=='function')throw Error('Account refresh unavailable');
 const cleanup=new WeakMap<Response,()=>Promise<boolean>>();
 async function discardResponse(response:Response){return cleanup.get(response)?.()??true;}
 const handle=createAccountJsonBoundary(origin,'/api/account/refresh',async(input,request,signal)=>{
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length!==0)return accountJsonResponse(400,'unavailable');
  const result=await accounts.submit(request,signal);
  if(result.status!=='ready')return accountJsonResponse(result.status==='busy'?429:400,'unavailable');
  try{
   if(signal.aborted){await result.discard();return accountJsonResponse(409,'unconfirmed');}
   const response=accountJsonResponse(200,'signedIn',result.setCookies);cleanup.set(response,result.discard);return response;
  }catch{await result.discard();return accountJsonResponse(409,'unconfirmed');}
 },deadlineMs,discardResponse);
 return Object.freeze({handle,discardResponse});
}
