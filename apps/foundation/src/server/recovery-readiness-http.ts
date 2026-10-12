import type {createRecoveryBrowser} from './recovery-browser.ts';
import {createAccountJsonBoundary,accountJsonResponse} from './account-json.ts';
/** Prepared metadata-only endpoint. Reset submission must still independently authorize the cookie. */
export function createRecoveryReadinessHttp(origin:string,browser:Pick<ReturnType<typeof createRecoveryBrowser>,'readiness'>){
 if(typeof browser?.readiness!=='function')throw Error('Recovery unavailable');
 return createAccountJsonBoundary(origin,'/api/account/reset-ready',async(input,request,signal)=>{
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length!==0)return accountJsonResponse(400,'unavailable');
  const result=await browser.readiness(request,signal);
  if(result.status!=='resetReady'||!Number.isSafeInteger(result.expiresAt)||result.expiresAt<=Date.now())return accountJsonResponse(400,'unavailable');
  return new Response(JSON.stringify({status:'resetReady',expiresAt:result.expiresAt}),{status:200,headers:accountJsonResponse(200,'resetReady').headers});
 });
}
