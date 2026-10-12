import {it,expect,vi} from 'vitest';
import {createRecoveryBrowser} from '../src/server/recovery-browser.ts';
import {createRecoveryReadinessHttp} from '../src/server/recovery-readiness-http.ts';
const origin='https://stylist.example';
it('returns bounded metadata only for the matching server-owned cookie without consuming it',async()=>{
 const browser=createRecoveryBrowser(origin),discard=vi.fn(async()=>true),reset=vi.fn(async()=>({status:'resetComplete' as const}));
 const expiresAt=Date.now()+60000,d=browser.install({status:'resetRequired',expiresAt,discard,reset}),handle=createRecoveryReadinessHttp(origin,browser);
 const request=(cookie=d.setCookie.split(';')[0]!,body='{}')=>new Request(origin+'/api/account/reset-ready',{method:'POST',headers:{origin,cookie,'content-type':'application/json'},body});
 try{
  for(let i=0;i<2;i++){const result=await handle(request(),new AbortController().signal);expect(result.status).toBe(200);expect(await result.json()).toEqual({status:'resetReady',expiresAt});expect(result.headers.get('set-cookie')).toBeNull();expect(result.headers.get('cache-control')).toBe('no-store');}
  expect((await handle(request(''),new AbortController().signal)).status).toBe(400);expect((await handle(request(undefined,'{"token":"refused"}'),new AbortController().signal)).status).toBe(400);expect(reset).not.toHaveBeenCalled();
 }finally{await browser.close();}
});

it('prepares browser reset configuration only after server cookie readiness',async()=>{
 const {createRecoveryConfiguration}=await import('../src/web/recovery-configuration.ts');
 const browser=createRecoveryBrowser(origin),expiresAt=Date.now()+60000;
 const d=browser.install({status:'resetRequired',expiresAt,discard:async()=>true,reset:async()=>({status:'resetComplete'})}),handle=createRecoveryReadinessHttp(origin,browser);
 const send:typeof fetch=async(url,input)=>{const headers=new Headers(input?.headers);headers.set('origin',origin);headers.set('cookie',d.setCookie.split(';')[0]!);return handle(new Request(String(url),{...input,headers}),input?.signal??new AbortController().signal);};
 try{const config=await createRecoveryConfiguration(origin,send)(new AbortController().signal);expect(config.expiresAt).toBe(expiresAt);expect(typeof config.provider.reset).toBe('function');}
 finally{await browser.close();}
 await expect(createRecoveryConfiguration(origin,send)(new AbortController().signal)).rejects.toThrow();
});
