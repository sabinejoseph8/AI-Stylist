import type {createRecoveryBrowser} from './recovery-browser.ts';
import {createAccountJsonBoundary,accountJsonResponse} from './account-json.ts';
type Delivery=Pick<ReturnType<typeof createRecoveryBrowser>,'submit'>;
/** Prepared only: not registered with a server or deployed. */
export function createRecoveryHttp(origin:string,delivery:Delivery,deadlineMs=10000){
 if(typeof delivery?.submit!=='function')throw Error('Recovery unavailable');
 return createAccountJsonBoundary(origin,'/api/account/reset',async(input,request,signal)=>{
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).sort().join(',')!=='confirmation,password')return accountJsonResponse(400,'unavailable');
  const x=input as Record<string,unknown>;if(typeof x.password!=='string'||x.password.length<1||x.password.length>4096||x.password!==x.confirmation)return accountJsonResponse(400,'unavailable');
  const result=await delivery.submit(request,input,signal);
  return accountJsonResponse(result.status==='resetComplete'?200:result.status==='unconfirmed'?409:400,result.status,result.setCookie?[result.setCookie]:[]);
 },deadlineMs);
}
