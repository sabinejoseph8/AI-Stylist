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
