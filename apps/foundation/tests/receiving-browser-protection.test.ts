import {afterEach,expect,it,vi} from 'vitest';
import {runInNewContext} from 'node:vm';
import {createHash} from 'node:crypto';
import {createRecoveryConfirmation} from '../src/server/recovery-confirmation.ts';
import {createRecoveryConfirmationHttp} from '../src/server/recovery-confirmation-http.ts';
import {createRecoveryBrowser} from '../src/server/recovery-browser.ts';
import {createRecoveryHttp} from '../src/server/recovery-http.ts';
import {createTokenRecoveryOwner} from '../src/server/account-recovery.ts';
import {createRecoveryFlow} from '../src/web/recovery-flow.ts';
import {bindSensitivePageLifecycle,clearSensitiveFieldValues} from '../src/web/sensitive-page-lifecycle.ts';
const origin='https://stylist.example',signal=()=>new AbortController().signal;
const cookie=(set:string)=>set.split(';')[0]!;
const input={password:'made-up-only',confirmation:'made-up-only'};
const grant=()=>({status:'resetRequired' as const,expiresAt:Date.now()+300000,reset:vi.fn(async()=>({status:'resetComplete' as const})),discard:vi.fn(async()=>true)});
function post(value:string,headers:Record<string,string>={},url=origin+'/api/account/recovery-confirm'){
 return new Request(url,{method:'POST',headers:{origin,cookie:value,'content-type':'application/json',...headers}});
}
function fixture(){
 const g=grant(),confirm=vi.fn(async(_proof:string,_scope:AbortSignal)=>g),binding=createRecoveryConfirmation(origin,{confirm}),browser=createRecoveryBrowser(origin),http=createRecoveryConfirmationHttp(origin,binding,browser);
 const land=(proof='synthetic-email-proof',value='')=>binding.begin(new Request(origin+'/account/recovery?token_hash='+proof,{headers:value?{cookie:value}:{}}))!;
 return {g,confirm,binding,browser,http,land};
}
afterEach(()=>vi.useRealTimers());
it('lets a receiving browser confirm without the requesting browser PKCE or account cookies',async()=>{
 const f=fixture(),a=f.land(),response=await f.http.confirm(new Request(origin+'/api/account/recovery-confirm',{method:'POST',headers:{origin,cookie:cookie(a.setCookie),'content-type':'application/json'},body:JSON.stringify({confirmation:a.confirmation})}),signal());
 expect(response.status).toBe(200);expect(f.confirm).toHaveBeenCalledOnce();
 expect(response.headers.getSetCookie().every(x=>!x.startsWith('__Host-stylist_access='))).toBe(true);
 const resetCookie=cookie(response.headers.getSetCookie().find(x=>x.startsWith('__Host-stylist_reset='))!);
 const reset=createRecoveryHttp(origin,f.browser),reply=await reset(new Request(origin+'/api/account/reset',{method:'POST',headers:{origin,cookie:resetCookie,'content-type':'application/json'},body:JSON.stringify(input)}),signal());
 expect(await reply.json()).toEqual({status:'resetComplete'});expect(reply.headers.get('set-cookie')).toContain('Max-Age=0');
 expect(await f.browser.readiness(post(resetCookie,{},origin+'/api/account/reset-ready'),signal())).toEqual({status:'unavailable'});
 expect((await f.browser.submit(post(resetCookie,{},origin+'/api/account/reset'),input,signal())).status).toBe('unavailable');
});
it('rejects a copied nonce or cookie paired with a different receiving binding',async()=>{
 const f=fixture(),a=f.land(),b=f.land();
 for(const [value,confirmation] of [[cookie(a.setCookie),b.confirmation],[cookie(b.setCookie),a.confirmation],['',a.confirmation]])expect(await f.binding.confirm(post(value),{confirmation},signal())).toEqual({status:'unavailable'});
 expect(f.confirm).not.toHaveBeenCalled();await f.binding.confirm(post(cookie(a.setCookie)),{confirmation:a.confirmation},signal());expect(f.confirm).toHaveBeenCalledOnce();
});
it.each([{origin:'null'},{origin:'https://other.test'},{host:'other.test'},{'sec-fetch-site':'cross-site'},{authorization:'Bearer synthetic'}] as Record<string,string>[])('refuses forged confirmation headers %j without consuming the valid binding',async headers=>{
 const f=fixture(),a=f.land();expect(await f.binding.confirm(post(cookie(a.setCookie),headers),{confirmation:a.confirmation},signal())).toEqual({status:'unavailable'});expect(f.confirm).not.toHaveBeenCalled();
 await f.binding.confirm(post(cookie(a.setCookie)),{confirmation:a.confirmation},signal());expect(f.confirm).toHaveBeenCalledOnce();
});
it('rotating the receiving binding invalidates the old cookie and nonce',async()=>{
 const f=fixture(),a=f.land(),b=f.land('replacement-proof',cookie(a.setCookie));
 expect(await f.binding.confirm(post(cookie(a.setCookie)),{confirmation:a.confirmation},signal())).toEqual({status:'unavailable'});
 await f.binding.confirm(post(cookie(b.setCookie)),{confirmation:b.confirmation},signal());expect(f.confirm).toHaveBeenCalledExactlyOnceWith('replacement-proof',expect.any(AbortSignal));
});
it.each(['close','rotate','expire','abort'] as const)('discards a late grant after %s',async action=>{
 const f=fixture(),a=f.land(),stop=new AbortController();let release!:(g:ReturnType<typeof grant>)=>void;
 f.confirm.mockImplementationOnce(()=>new Promise(r=>release=r));
 const work=f.binding.confirm(post(cookie(a.setCookie)),{confirmation:a.confirmation},stop.signal);
 if(action==='close')f.binding.close();if(action==='rotate')f.land('new-proof',cookie(a.setCookie));if(action==='abort')stop.abort();
 if(action==='expire'){vi.useFakeTimers();vi.setSystemTime(Date.now()+300001);}
 release(f.g);expect(await work).toEqual({status:'unavailable'});expect(f.g.discard).toHaveBeenCalledOnce();expect(f.g.reset).not.toHaveBeenCalled();
});
it('retains the real recovery owner cleanup hold when a late discarded result cannot prove cleanup',async()=>{
 let release!:(value:{ownerId:string;expiresAt:number;resetPassword:()=>Promise<boolean>;discard:()=>Promise<boolean>})=>void;
 const owner=createTokenRecoveryOwner({verifyToken:()=>new Promise(r=>release=r)}),binding=createRecoveryConfirmation(origin,owner);
 const a=binding.begin(new Request(origin+'/account/recovery?token_hash=proof'))!,work=binding.confirm(post(cookie(a.setCookie)),{confirmation:a.confirmation},signal());
 await Promise.resolve();binding.close();release({ownerId:'00000000-0000-4000-8000-000000000001',expiresAt:Date.now()+60000,resetPassword:async()=>true,discard:async()=>false});
 expect(await work).toEqual({status:'unavailable'});await vi.waitFor(()=>expect(owner.cleanupHeld()).toBe(true));
});
it('a refreshed stripped landing cannot silently recreate permission or verify proof',async()=>{
 const f=fixture(),response=f.http.landing(new Request(origin+'/account/recovery'),signal());expect(response.status).toBe(400);expect(response.headers.get('set-cookie')).toBeNull();expect(f.confirm).not.toHaveBeenCalled();
});
it('expired confirmation and a fresh server instance refuse old browser material',async()=>{
 const f=fixture(),a=f.land(),fresh=fixture();expect(await fresh.binding.confirm(post(cookie(a.setCookie)),{confirmation:a.confirmation},signal())).toEqual({status:'unavailable'});expect(fresh.confirm).not.toHaveBeenCalled();
 vi.useFakeTimers();vi.setSystemTime(Date.now()+300001);expect(await f.binding.confirm(post(cookie(a.setCookie)),{confirmation:a.confirmation},signal())).toEqual({status:'unavailable'});expect(f.confirm).not.toHaveBeenCalled();
});
async function scriptFixture(){
 const f=fixture(),response=f.http.landing(new Request(origin+'/account/recovery?token_hash=synthetic-proof-not-for-html'),signal()),html=await response.text(),script=html.match(/<script>([\s\S]*?)<\/script>/)![1]!;
 const handlers=new Map<string,(event?:{persisted:boolean})=>unknown>();let click!:()=>Promise<void>;
 const button={disabled:false,addEventListener:(_name:string,handle:()=>Promise<void>)=>click=handle},status={textContent:''};
 let resolve!:(value:Response)=>void;const fetcher=vi.fn((_url:string,_init:RequestInit)=>new Promise<Response>(r=>resolve=r));
 const replace=vi.fn(),history=vi.fn();
 runInNewContext(script,{document:{querySelector:(selector:string)=>selector==='button'?button:status},history:{replaceState:history},location:{replace},fetch:fetcher,AbortController,setTimeout,clearTimeout,addEventListener:(name:string,handle:(event?:{persisted:boolean})=>unknown)=>handlers.set(name,handle)});
 return {response,html,script,button,status,fetcher,replace,history,handlers,click:()=>click(),resolve:(value=Response.json({status:'resetRequired'}))=>resolve(value)};
}
it('executes the protected landing script with a matching CSP hash and a fixed referrer without proof',async()=>{
 const f=await scriptFixture();expect(f.html).not.toContain('synthetic-proof-not-for-html');expect(f.response.headers.get('content-security-policy')).toContain("'sha256-"+createHash('sha256').update(f.script).digest('base64')+"'");
 expect(f.history).toHaveBeenCalledExactlyOnceWith(null,'','/account/recovery');const pending=f.click();const [url,init]=f.fetcher.mock.calls[0];
 expect(url).toBe('/api/account/recovery-confirm');expect(init).toMatchObject({method:'POST',mode:'same-origin',credentials:'same-origin',redirect:'error',cache:'no-store',referrer:origin+'/',referrerPolicy:'same-origin'});
 f.resolve();await pending;expect(f.replace).toHaveBeenCalledExactlyOnceWith('/account/reset');
});
it.each(['pagehide','pageshow'] as const)('ignores late confirmation responses after %s',async event=>{
 const f=await scriptFixture(),pending=f.click();f.handlers.get(event)!({persisted:true});expect(f.fetcher.mock.calls[0][1].signal?.aborted).toBe(true);f.resolve();await pending;
 expect(f.replace).not.toHaveBeenCalled();expect(f.button.disabled).toBe(true);expect(f.status.textContent).toContain('unavailable');
});
it('times out without automatic retry and ignores an eventual successful response',async()=>{
 vi.useFakeTimers();const f=await scriptFixture(),pending=f.click();await vi.advanceTimersByTimeAsync(10001);expect(f.button.disabled).toBe(true);expect(f.fetcher.mock.calls[0][1].signal?.aborted).toBe(true);
 f.resolve();await pending;await f.click();expect(f.fetcher).toHaveBeenCalledOnce();expect(f.replace).not.toHaveBeenCalled();
});
it.each([Response.json({status:'resetRequired',extra:true}),new Response('{"status":"resetRequired"}',{headers:{'content-type':'text/plain'}}),Response.json({status:'unavailable'},{status:400})])('refuses malformed or failed landing responses',async response=>{
 const f=await scriptFixture(),pending=f.click();f.resolve(response);await pending;expect(f.replace).not.toHaveBeenCalled();expect(f.status.textContent).toContain('unavailable');
});

it('clears pending password drafts synchronously on exit and cached return without accepting late completion',async()=>{
 const fields=[{value:'made-up-password'},{value:'made-up-password'}],target=new EventTarget();
 let release!:(value:{status:'resetComplete'})=>void;const reset=vi.fn(()=>new Promise<{status:'resetComplete'}>(r=>release=r));
 const flow=createRecoveryFlow({reset},Date.now()+60000);
 const dispose=bindSensitivePageLifecycle(target,()=>{clearSensitiveFieldValues(fields);flow.cancel();});
 const pending=flow.submit(fields[0].value,fields[1].value);await Promise.resolve();target.dispatchEvent(new Event('pagehide'));
 expect(fields.every(x=>x.value==='')).toBe(true);release({status:'resetComplete'});await pending;expect(flow.snapshot().status).toBe('canceled');
 fields[0].value='restored-draft';const event=new Event('pageshow');Object.defineProperty(event,'persisted',{value:true});target.dispatchEvent(event);
 expect(fields.every(x=>x.value==='')).toBe(true);await flow.submit('retry','retry');expect(reset).toHaveBeenCalledOnce();dispose();
});
it('documents the bearer-binding limit: a complete valid cookie/nonce copy is indistinguishable, but single-use',async()=>{
 const f=fixture(),a=f.land();const cloned=post(cookie(a.setCookie));
 await f.binding.confirm(cloned,{confirmation:a.confirmation},signal());
 expect(await f.binding.confirm(post(cookie(a.setCookie)),{confirmation:a.confirmation},signal())).toEqual({status:'unavailable'});
 expect(f.confirm).toHaveBeenCalledOnce();
});
