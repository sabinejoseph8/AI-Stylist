import {isMvpSocialProvider} from '../account-policy.ts';
import type {createOAuthStart} from './oauth-start.ts';
import {createAccountJsonBoundary,accountJsonResponse} from './account-json.ts';
/** Disabled same-origin initiation. Only the public authorize URL and flow cookie are delivered. */
export function createOAuthStartHttp(origin:string,start:Pick<ReturnType<typeof createOAuthStart>,'begin'>){
 if(typeof start?.begin!=='function')throw Error('Account initiation unavailable');
 const cleanup=new WeakMap<Response,()=>Promise<boolean>>();
 const discardResponse=(response:Response)=>cleanup.get(response)?.()??Promise.resolve(true);
 const handle=createAccountJsonBoundary(origin,'/api/account/oauth',async input=>{
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).sort().join(',')!=='provider,returnPath')return accountJsonResponse(400,'unavailable');
  const x=input as Record<string,unknown>;
  if(!isMvpSocialProvider(x.provider)||typeof x.returnPath!=='string')return accountJsonResponse(400,'unavailable');
  const flow=start.begin(x.provider,x.returnPath);
  try{
   const headers=new Headers({'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff','cross-origin-resource-policy':'same-origin'});
   for(const cookie of flow.setCookies)headers.append('set-cookie',cookie);
   const response=new Response(JSON.stringify({status:'handoff',url:flow.url}),{status:200,headers});cleanup.set(response,flow.discard);return response;
  }catch{await flow.discard();return accountJsonResponse(409,'unconfirmed');}
 },10000,discardResponse);
 return Object.freeze({handle,discardResponse});
}
