import type {createAccountExchange} from './account-exchange.ts';
import type {createAccountCallbacks} from './account-callback.ts';
/** Prepared callback delivery only. No server route is installed. Discard undelivered responses. */
export function createOAuthCallbackHttp(origin:string,exchange:Pick<ReturnType<typeof createAccountExchange>,'complete'>,callbacks:Pick<ReturnType<typeof createAccountCallbacks>,'clear'>){
 const base=new URL(origin);
 if(base.protocol!=='https:'||base.origin!==origin||typeof exchange?.complete!=='function'||typeof callbacks?.clear!=='function')throw Error('Account callback unavailable');
 const cleanup=new WeakMap<Response,()=>Promise<boolean>>();
 const discardResponse=(response:Response)=>cleanup.get(response)?.()??Promise.resolve(true);
 const redirect=(location:string,cookies:readonly string[]=[])=>{
  const headers=new Headers({location,'cache-control':'no-store','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; frame-ancestors 'none'",'x-content-type-options':'nosniff'});
  for(const cookie of cookies)headers.append('set-cookie',cookie);
  return new Response(null,{status:303,headers});
 };
 return Object.freeze({discardResponse,async handle(request:Request,purpose:'google'|'apple',signal:AbortSignal){
  const url=new URL(request.url);
  if(!['google','apple'].includes(purpose)||url.origin!==origin||url.pathname!=='/auth/callback/'+purpose||request.method!=='GET'||(request.headers.has('host')&&request.headers.get('host')!==base.host))return new Response(null,{status:404,headers:{'cache-control':'no-store'}});
  let result;try{result=await exchange.complete(request,purpose,signal);}catch{return redirect('/account?status=unavailable',[callbacks.clear()]);}
  if(result.status!=='ready')return redirect('/account?status='+(['canceled','busy'].includes(result.status)?result.status:'unavailable'),[callbacks.clear()]);
  if(signal.aborted||request.signal.aborted||!['/','/wardrobe','/saved-looks','/profile'].includes(result.returnPath)){
   await result.discard();return redirect('/account?status=unavailable',[callbacks.clear()]);
  }
  try{const response=redirect(result.returnPath,result.setCookies);cleanup.set(response,result.discard);return response;}
  catch{await result.discard();return redirect('/account?status=unavailable',[callbacks.clear()]);}
 }});
}
