import {expect,it,vi} from 'vitest';
import type {IncomingMessage,ServerResponse,RequestListener} from 'node:http';
import {createAccountTransport} from '../src/server/account-transport.ts';
const origin='https://stylist.test';
function request(encrypted=false,headers:Record<string,string>={host:'stylist.test'},raw?:string[]){return {headers,rawHeaders:raw??Object.entries(headers).flat(),socket:{encrypted}} as unknown as IncomingMessage;}
function response(){return {headersSent:false,destroyed:false,writeHead:vi.fn(),end:vi.fn(),destroy:vi.fn()} as unknown as ServerResponse;}
it('admits exact-host TLS without trusting forwarded claims',()=>{
 const next=vi.fn<RequestListener>(),handle=createAccountTransport(origin,next),req=request(true),res=response();handle(req,res);expect(next).toHaveBeenCalledExactlyOnceWith(req,res);
});
it('refuses plaintext even with forged HTTPS headers unless the immediate proxy is independently trusted',()=>{
 const next=vi.fn<RequestListener>(),req=request(false,{host:'stylist.test','x-forwarded-proto':'https'});createAccountTransport(origin,next)(req,response());expect(next).not.toHaveBeenCalled();
 const trust=vi.fn(()=>true);createAccountTransport(origin,next,trust)(req,response());expect(trust).toHaveBeenCalledExactlyOnceWith(req);expect(next).toHaveBeenCalledOnce();
});
it('rejects ambiguous schemes, foreign hosts, competing forwarded chains and duplicate security headers',()=>{
 const next=vi.fn<RequestListener>(),handle=createAccountTransport(origin,next,()=>true);
 for(const headers of [{host:'other.test','x-forwarded-proto':'https'},{host:'stylist.test','x-forwarded-proto':'http'},{host:'stylist.test','x-forwarded-proto':'https, http'},{host:'stylist.test','x-forwarded-proto':'https','x-forwarded-host':'other.test'},{host:'stylist.test','x-forwarded-proto':'https',forwarded:'proto=https'}] as Record<string,string>[])handle(request(false,headers),response());
 handle(request(true,{host:'stylist.test'},['Host','stylist.test','host','stylist.test']),response());expect(next).not.toHaveBeenCalled();
});
it('contains trust failures without returning request data or starting the application',()=>{
 const next=vi.fn<RequestListener>(),res=response();createAccountTransport(origin,next,()=>{throw Error('secret');})(request(false),res);expect(next).not.toHaveBeenCalled();expect(res.end).toHaveBeenCalledExactlyOnceWith('{"status":"unavailable"}');
});
