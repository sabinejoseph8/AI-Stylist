import {createHash} from 'node:crypto';
import type {createRecoveryConfirmation} from './recovery-confirmation.ts';
import type {createRecoveryBrowser} from './recovery-browser.ts';
import {createAccountJsonBoundary,accountJsonResponse} from './account-json.ts';
/** Explicit host preparation. No routes are mounted and no provider is selected here. */
export function createRecoveryConfirmationHttp(origin:string,binding:ReturnType<typeof createRecoveryConfirmation>,browser:Pick<ReturnType<typeof createRecoveryBrowser>,'install'>){
 const base=new URL(origin);
 if(base.protocol!=='https:'||base.origin!==origin||typeof binding?.begin!=='function'||typeof binding?.confirm!=='function'||typeof browser?.install!=='function')throw Error('Recovery unavailable');
 const cleanup=new WeakMap<Response,()=>Promise<boolean>>();
 const discardResponse=(response:Response)=>cleanup.get(response)?.()??Promise.resolve(true);
 const confirm=createAccountJsonBoundary(origin,'/api/account/recovery-confirm',async(input,request,signal)=>{
  const failed=()=>accountJsonResponse(400,'unavailable',[binding.clear()]);
  const grant=await binding.confirm(request,input,signal);
  if(grant.status!=='resetRequired')return failed();
  let delivery:ReturnType<typeof browser.install>|undefined;
  try{
   if(signal.aborted||request.signal.aborted){await grant.discard();return failed();}
   delivery=browser.install(grant);
   if(signal.aborted||request.signal.aborted){await delivery.discard();return failed();}
   const response=accountJsonResponse(200,'resetRequired',[delivery.setCookie,binding.clear()]);cleanup.set(response,delivery.discard);return response;
  }catch{try{await (delivery?delivery.discard():grant.discard());}catch{}return failed();}
 },10000,discardResponse);
 return Object.freeze({discardResponse,confirm,landing(request:Request,signal:AbortSignal){
  const url=new URL(request.url);
  if(signal.aborted||request.signal.aborted||request.method!=='GET'||url.origin!==origin||url.pathname!=='/account/recovery'||(request.headers.has('host')&&request.headers.get('host')!==base.host))return new Response(null,{status:404,headers:{'cache-control':'no-store'}});
  const entry=binding.begin(request);
  const script=entry?`history.replaceState(null,'','/account/recovery');
const button=document.querySelector('button'),status=document.querySelector('[role=status]'),controller=new AbortController();
let live=true,confirmation='${entry.confirmation}';
const stop=()=>{live=false;confirmation='';controller.abort();button.disabled=true;status.textContent='This reset link is unavailable. Request a new email.';};
addEventListener('pagehide',stop);addEventListener('pageshow',event=>{if(event.persisted)stop();});
button.addEventListener('click',async()=>{
 if(!live||button.disabled)return;button.disabled=true;status.textContent='Checking your reset link…';
 const timer=setTimeout(stop,10000);
 try{
  const response=await fetch('/api/account/recovery-confirm',{method:'POST',mode:'same-origin',credentials:'same-origin',redirect:'error',cache:'no-store',referrer:${JSON.stringify(origin+'/')},referrerPolicy:'same-origin',signal:controller.signal,headers:{'content-type':'application/json'},body:JSON.stringify({confirmation})});
  confirmation='';if(!live||controller.signal.aborted)return;
  if(response.redirected||!/^application\\/json(?:\\s*;|$)/i.test(response.headers.get('content-type')||''))throw Error();
  const result=await response.json();if(!live||controller.signal.aborted)return;
  if(response.ok&&result&&typeof result==='object'&&!Array.isArray(result)&&Object.keys(result).join(',')==='status'&&result.status==='resetRequired'){live=false;location.replace('/account/reset');return;}
 }catch{}finally{clearTimeout(timer);}
 stop();
});`:'';
  const digest=createHash('sha256').update(script).digest('base64');
  const headers=new Headers({'content-type':'text/html; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff','cross-origin-resource-policy':'same-origin','content-security-policy':`default-src 'none'; script-src 'sha256-${digest}'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`});
  if(entry)headers.append('set-cookie',entry.setCookie);
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reset your password | AI Stylist</title><main><h1>Reset your password</h1><p role="status">${entry?'Confirm this email link to choose a new password. You will remain signed out.':'This reset link is unavailable. Request a new email.'}</p>${entry?'<button type="button">Continue to password reset</button><noscript>Enable JavaScript to confirm this reset link.</noscript>':''}<p><a href="/account">Return to account options</a></p></main>${script?`<script>${script}</script>`:''}</html>`,{status:entry?200:400,headers});
 }});
}
