import {expect,it,vi} from 'vitest';
import {createAccountRestore} from '../src/web/account-restore.ts';
const origin='https://stylist.test',signal=()=>new AbortController().signal;
const response=(http:number,status:string)=>new Response(JSON.stringify({status}),{status:http,headers:{'content-type':'application/json'}});
it('restores a current session without refreshing and keeps credentials in same-origin cookies',async()=>{
 const send=vi.fn<typeof fetch>(async()=>response(200,'signedIn'));
 expect(await createAccountRestore(origin,send)(signal())).toBe('signedIn');expect(send).toHaveBeenCalledTimes(1);
 expect(send.mock.calls[0]?.[0]).toBe(origin+'/api/account/session');
 const options=(send.mock.calls as unknown as [string,RequestInit][])[0][1];
 expect(options.credentials).toBe('same-origin');expect(options.body).toBe('{}');
});
it('refreshes at most once then independently confirms the new session',async()=>{
 const send=vi.fn<typeof fetch>().mockResolvedValueOnce(response(401,'signedOut')).mockResolvedValueOnce(response(200,'signedIn')).mockResolvedValueOnce(response(200,'signedIn'));
 expect(await createAccountRestore(origin,send)(signal())).toBe('signedIn');
 expect(send.mock.calls.map(call=>call[0])).toEqual(['/session','/refresh','/session'].map(path=>origin+'/api/account'+path));
});
it('never retries an ambiguous refresh or trusts a failed final confirmation',async()=>{
 const send=vi.fn<typeof fetch>().mockResolvedValueOnce(response(401,'signedOut')).mockResolvedValueOnce(response(409,'unconfirmed'));
 await expect(createAccountRestore(origin,send)(signal())).rejects.toThrow('Account unavailable');expect(send).toHaveBeenCalledTimes(2);
 const retry=vi.fn<typeof fetch>().mockResolvedValueOnce(response(401,'signedOut')).mockResolvedValueOnce(response(200,'signedIn')).mockResolvedValueOnce(response(401,'signedOut'));
 expect(await createAccountRestore(origin,retry)(signal())).toBe('signedOut');
});
it('does not send requests after cancellation or unexpected status',async()=>{
 const send=vi.fn<typeof fetch>(),controller=new AbortController();controller.abort();
 await expect(createAccountRestore(origin,send)(controller.signal)).rejects.toThrow();expect(send).not.toHaveBeenCalled();
 send.mockResolvedValueOnce(response(503,'unavailable'));
 await expect(createAccountRestore(origin,send)(signal())).rejects.toThrow();expect(send).toHaveBeenCalledTimes(1);
});
