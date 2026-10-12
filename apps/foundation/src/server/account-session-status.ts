import type {VerifiedMediaAccess} from './media-read.ts';
import {createAccountJsonBoundary,accountJsonResponse} from './account-json.ts';
/** Metadata only. Every protected resource must independently authorize its request. */
export function createAccountSessionStatus(origin:string,authorize:(request:Request,signal:AbortSignal)=>Promise<VerifiedMediaAccess|null>){
 if(typeof authorize!=='function')throw Error('Account status unavailable');
 return createAccountJsonBoundary(origin,'/api/account/session',async(input,request,signal)=>{
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)return accountJsonResponse(400,'unavailable');
  const identity=await authorize(request,signal);
  if(!identity||!await identity.isCurrent(signal)||signal.aborted)return accountJsonResponse(401,'signedOut');
  return accountJsonResponse(200,'signedIn');
 });
}
