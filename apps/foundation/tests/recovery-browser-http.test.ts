import {it,expect,vi} from 'vitest';
import {createRecoveryHttp} from '../src/web/recovery-http.ts';
const origin='https://stylist.example',signal=()=>new AbortController().signal;
it('posts a reset once with same-origin cookie credentials and accepts no account identity',async()=>{
 const send=vi.fn(async(url:unknown,input?:RequestInit)=>{expect(url).toBe(origin+'/api/account/reset');expect(input?.credentials).toBe('same-origin');expect(input?.redirect).toBe('error');expect(JSON.parse(input?.body as string)).toEqual({password:'synthetic',confirmation:'synthetic'});return Response.json({status:'resetComplete'});}) as unknown as typeof fetch;
 const reset=createRecoveryHttp(origin,send);expect(await reset.reset('synthetic',signal())).toEqual({status:'resetComplete'});await expect(reset.reset('synthetic',signal())).rejects.toThrow();expect(send).toHaveBeenCalledTimes(1);
});
it('preserves unconfirmed reset and rejects identity-bearing responses',async()=>{
 expect(await createRecoveryHttp(origin,async()=>Response.json({status:'unconfirmed'},{status:409})).reset('synthetic',signal())).toEqual({status:'unconfirmed'});
 await expect(createRecoveryHttp(origin,async()=>Response.json({status:'resetComplete',accessToken:'refused'})).reset('synthetic',signal())).rejects.toThrow();
});

for(const cleaned of [true,false])it(`composes browser reset with server grant ownership when cleanup is ${cleaned}`,async()=>{
 const {createRecoveryBrowser}=await import('../src/server/recovery-browser.ts');
 const {createRecoveryHttp:serverHttp}=await import('../src/server/recovery-http.ts');
 const browser=createRecoveryBrowser(origin),reset=vi.fn(async()=>({status:'resetComplete' as const})),discard=vi.fn(async()=>cleaned);
 const delivery=browser.install({status:'resetRequired',expiresAt:Date.now()+60000,reset,discard});
 const cookie=delivery.setCookie.split(';')[0]!,handle=serverHttp(origin,browser);let cleared='';
 const send:typeof fetch=async(url,input)=>{
  const headers=new Headers(input?.headers);headers.set('origin',origin);headers.set('cookie',cookie);
  const response=await handle(new Request(String(url),{...input,headers}),input?.signal??signal());
  cleared=response.headers.get('set-cookie')??'';return response;
 };
 const client=createRecoveryHttp(origin,send);
 try{
  expect(await client.reset('synthetic',signal())).toEqual({status:cleaned?'resetComplete':'unconfirmed'});
  expect(reset).toHaveBeenCalledOnce();expect(discard).toHaveBeenCalledOnce();expect(cleared).toContain('Max-Age=0');expect(cleared).not.toContain('__Host-stylist_access');
  await expect(client.reset('synthetic',signal())).rejects.toThrow();
  const repeated=await handle(new Request(origin+'/api/account/reset',{method:'POST',headers:{origin,cookie,'content-type':'application/json'},body:JSON.stringify({password:'synthetic',confirmation:'synthetic'})}),signal());
  expect(repeated.status).toBe(400);expect(reset).toHaveBeenCalledOnce();
 }finally{expect(await browser.close()).toBe(cleaned);}
});
