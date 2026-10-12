import {it,expect,vi,afterEach} from 'vitest';
import {createAccountHttp} from '../src/web/account-http.ts';
const origin='https://stylist.example',signal=()=>new AbortController().signal;
const input={method:'signIn' as const,email:' sample@example.test ',password:'made-up'};
const reply=(status:string,http=200)=>new Response(JSON.stringify({status}),{status:http,headers:{'content-type':'application/json'}});
afterEach(()=>vi.useRealTimers());
it('uses fixed same-origin cookie transport and accepts only status presentation',async()=>{
 const send=vi.fn(async(_url:RequestInfo|URL,_init?:RequestInit)=>reply('signedIn')),provider=createAccountHttp(origin,send);expect(await provider.submit(input,signal())).toEqual({status:'signedIn'});
 expect(send.mock.calls[0]?.[0]).toBe(origin+'/api/account/password');expect(send.mock.calls[0]?.[1]).toMatchObject({credentials:'same-origin',mode:'same-origin',redirect:'error',cache:'no-store',referrer:origin+'/',referrerPolicy:'same-origin'});expect(send.mock.calls[0]?.[1]?.headers).toEqual({'Content-Type':'application/json'});expect(JSON.parse(String(send.mock.calls[0]?.[1]?.body))).toEqual({...input,email:'sample@example.test'});
});
it('separates registration confirmation and generic recovery acknowledgment',async()=>{
 const provider=createAccountHttp(origin,async url=>String(url).endsWith('/recover')?reply('recoveryRequested',202):reply('confirmationRequired'));
 expect(await provider.submit({...input,method:'signUp'},signal())).toEqual({status:'confirmationRequired'});await expect(provider.submit(input,signal())).rejects.toThrow('Account unavailable');expect(await provider.submit({method:'recover',email:input.email},signal())).toEqual({status:'recoveryRequested'});
});
it('does not dispatch invalid input, social handoff or pre-canceled work',async()=>{
 const send=vi.fn(),provider=createAccountHttp(origin,send),controller=new AbortController();controller.abort();for(const value of [{...input,password:''},{...input,email:'broken'},{method:'social' as const,provider:'google' as const}])await expect(provider.submit(value,signal())).rejects.toThrow();await expect(provider.submit(input,controller.signal)).rejects.toThrow();expect(send).not.toHaveBeenCalled();
});
it('rejects oversized, unexpected or failing replies without exposing provider details',async()=>{
 for(const response of [new Response(JSON.stringify({status:'signedIn',token:'private'}),{headers:{'content-type':'application/json'}}),new Response('x'.repeat(1025),{headers:{'content-type':'application/json'}}),reply('signedIn',403),new Response('private-error',{headers:{'content-type':'text/plain'}})])await expect(createAccountHttp(origin,async()=>response).submit(input,signal())).rejects.toThrow('Account unavailable');
});
it('requires remote sign-out confirmation',async()=>{
 await expect(createAccountHttp(origin,async()=>reply('signedOut')).signOut(signal())).resolves.toBeUndefined();await expect(createAccountHttp(origin,async()=>reply('remoteUnconfirmed',409)).signOut(signal())).rejects.toThrow();
});
it('bounds ignored cancellation and retains admission until underlying fetch settles',async()=>{
 vi.useFakeTimers();const releases:Array<(v:Response)=>void>=[],send=vi.fn(()=>new Promise<Response>(r=>releases.push(r))),provider=createAccountHttp(origin,send,20);const work=Array.from({length:4},()=>provider.submit(input,signal()).catch(()=>null));await vi.advanceTimersByTimeAsync(21);expect(await Promise.all(work)).toEqual([null,null,null,null]);await expect(provider.submit(input,signal())).rejects.toThrow();expect(send).toHaveBeenCalledTimes(4);releases.forEach(r=>r(reply('signedIn')));await vi.advanceTimersByTimeAsync(0);
});

it('cancels a stalled response body at the deadline',async()=>{
 vi.useFakeTimers();const cancel=vi.fn(),body=new ReadableStream<Uint8Array>({cancel}),provider=createAccountHttp(origin,async()=>new Response(body,{headers:{'content-type':'application/json'}}),20),work=provider.submit(input,signal()).catch(()=>null);await vi.advanceTimersByTimeAsync(21);expect(await work).toBeNull();expect(cancel).toHaveBeenCalledTimes(1);
});
it('rejects redirected and foreign response destinations',async()=>{
 for(const property of ['redirected','url']){const response=reply('signedIn');Object.defineProperty(response,property,{value:property==='redirected'?true:'https://other.example/api/account/password'});await expect(createAccountHttp(origin,async()=>response).submit(input,signal())).rejects.toThrow('Account unavailable');}
});
