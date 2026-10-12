import {expect,it,vi} from 'vitest';
import {createAccountSessionStatus} from '../src/server/account-session-status.ts';
const origin='https://stylist.test';
const request=(body:unknown={},headers:Record<string,string>={})=>new Request(origin+'/api/account/session',{method:'POST',headers:{origin,'content-type':'application/json',...headers},body:JSON.stringify(body)});
const signal=()=>new AbortController().signal;
it('returns status only for a current resource identity without leaking customer data',async()=>{
 const authorize=vi.fn(async()=>({ownerId:'private-owner',sessionId:'private-session',isCurrent:async()=>true}));
 const response=await createAccountSessionStatus(origin,authorize)(request(),signal());
 expect(response.status).toBe(200);expect(await response.json()).toEqual({status:'signedIn'});
 expect(response.headers.get('cache-control')).toBe('no-store');expect(response.headers.has('set-cookie')).toBe(false);
});
it('refuses absent and revoked resource identities',async()=>{
 for(const identity of [null,{ownerId:'owner',isCurrent:async()=>false}]){
 const response=await createAccountSessionStatus(origin,async()=>identity)(request(),signal());
 expect(response.status).toBe(401);expect(await response.json()).toEqual({status:'signedOut'});
 }
});
it('rejects extra input and foreign origins before authorization',async()=>{
 const authorize=vi.fn(async()=>null),handle=createAccountSessionStatus(origin,authorize);
 for(const req of [request({token:'secret'}),request({}, {origin:'https://other.test'}),request({}, {authorization:'Bearer secret'})])expect((await handle(req,signal())).status).toBe(400);
 expect(authorize).not.toHaveBeenCalled();
});
it('does not report signed in when cancelled or authorization fails',async()=>{
 const controller=new AbortController();controller.abort();
 expect((await createAccountSessionStatus(origin,async()=>null)(request(),controller.signal)).status).toBe(400);
 const response=await createAccountSessionStatus(origin,async()=>{throw Error('private detail');})(request(),signal());
 expect(await response.json()).toEqual({status:'unavailable'});
});
