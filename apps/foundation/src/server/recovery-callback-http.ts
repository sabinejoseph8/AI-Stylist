import type {createAccountRecovery} from './account-recovery.ts';
import type {createRecoveryBrowser} from './recovery-browser.ts';
import type {createAccountCallbacks} from './account-callback.ts';
/** Disconnected reset-only callback delivery. Never delivers account access or provider tokens. */
export function createRecoveryCallbackHttp(origin:string,recovery:Pick<ReturnType<typeof createAccountRecovery>,'complete'>,browser:Pick<ReturnType<typeof createRecoveryBrowser>,'install'>,callbacks:Pick<ReturnType<typeof createAccountCallbacks>,'clear'>){
 const base=new URL(origin);
 if(base.protocol!=='https:'||base.origin!==origin||typeof recovery?.complete!=='function'||typeof browser?.install!=='function'||typeof callbacks?.clear!=='function')throw Error('Recovery callback unavailable');
 const cleanup=new WeakMap<Response,()=>Promise<boolean>>();
 const redirect=(location:string,cookies:readonly string[])=>{
  const headers=new Headers({location,'cache-control':'no-store','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; frame-ancestors 'none'",'x-content-type-options':'nosniff'});
  for(const cookie of cookies)headers.append('set-cookie',cookie);
  return new Response(null,{status:303,headers});
 };
 return Object.freeze({discardResponse:(response:Response)=>cleanup.get(response)?.()??Promise.resolve(true),async handle(request:Request,signal:AbortSignal){
  const url=new URL(request.url);
  if(url.origin!==origin||url.pathname!=='/auth/callback/recovery'||request.method!=='GET'||(request.headers.has('host')&&request.headers.get('host')!==base.host))return new Response(null,{status:404,headers:{'cache-control':'no-store'}});
  const failed=()=>redirect('/account?status=unavailable',[callbacks.clear()]);
  let grant;try{grant=await recovery.complete(request,signal);}catch{return failed();}
  if(grant.status!=='resetRequired')return redirect('/account?status='+(['canceled','busy'].includes(grant.status)?grant.status:'unavailable'),[callbacks.clear()]);
  let delivery:ReturnType<typeof browser.install>|undefined;
  try{
   if(signal.aborted||request.signal.aborted){await grant.discard();return failed();}
   delivery=browser.install(grant);
   if(signal.aborted||request.signal.aborted){await delivery.discard();return failed();}
   const response=redirect('/account/reset',[delivery.setCookie,callbacks.clear()]);cleanup.set(response,delivery.discard);return response;
  }catch{
   try{await (delivery?delivery.discard():grant.discard());}catch{}
   return failed();
  }
 }});
}
