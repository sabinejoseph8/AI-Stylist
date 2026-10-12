import type {createAccountSignOut} from './account-signout.ts';
import {createAccountJsonBoundary,accountJsonResponse} from './account-json.ts';
/** Disconnected handler: caller must deliver all cookie-clearing headers even when revocation is unconfirmed. */
export function createSignOutHttp(origin:string,accounts:Pick<ReturnType<typeof createAccountSignOut>,'submit'>,deadlineMs=10000){
 if(typeof accounts?.submit!=='function')throw Error('Sign-out unavailable');
 return createAccountJsonBoundary(origin,'/api/account/sign-out',async(input,request,signal)=>{
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length!==0)return accountJsonResponse(400,'unavailable');
  const result=await accounts.submit(request,signal);
  return accountJsonResponse(result.status==='signedOut'?200:result.status==='remoteUnconfirmed'?409:400,result.status,result.setCookies);
 },deadlineMs);
}
