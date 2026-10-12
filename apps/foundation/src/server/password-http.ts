import type {createPasswordAccounts} from './password-account.ts';
import {createAccountJsonBoundary,accountJsonResponse} from './account-json.ts';
/** Disconnected server-only response ownership. Real caller must adopt adapter-held refresh state and discard on failed delivery. */
export function createPasswordHttp(origin:string,accounts:Pick<ReturnType<typeof createPasswordAccounts>,'submit'>,deadlineMs=10000){
 if(typeof accounts?.submit!=='function')throw Error('Account unavailable');
 const cleanup=new WeakMap<Response,()=>Promise<boolean>>();
 async function discardResponse(response:Response){return cleanup.get(response)?.()??true;}
 const handle=createAccountJsonBoundary(origin,'/api/account/password',async(input,_request,signal)=>{
  const result=await accounts.submit(input,signal);
  if(result.status!=='ready')return accountJsonResponse(result.status==='confirmationRequired'?200:result.status==='busy'?429:400,result.status);
  try{
   if(signal.aborted){await result.discard();return accountJsonResponse(409,'unconfirmed');}
   const response=accountJsonResponse(200,'signedIn',result.setCookies);cleanup.set(response,result.discard);return response;
  }catch{await result.discard();return accountJsonResponse(409,'unconfirmed');}
 },deadlineMs,discardResponse);
 return Object.freeze({handle,discardResponse});
}
