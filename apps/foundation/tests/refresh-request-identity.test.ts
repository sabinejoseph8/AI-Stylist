import {expect,it,vi} from 'vitest';
import {createRefreshRequestIdentity} from '../src/server/request-identity.ts';
const origin='https://stylist.test';
it('limits refresh-only identity to the exact same-origin POST refresh endpoint',async()=>{
 const verify=vi.fn(async()=>({ownerId:'owner',sessionId:'session',isCurrent:async()=>true}));
 const authorize=createRefreshRequestIdentity(origin,{verify}),signal=new AbortController().signal;
 const headers={origin,cookie:'__Host-stylist_access=aaa.bbb.ccc'};
 for(const [method,path] of [['GET','/api/account/refresh'],['POST','/api/wardrobe'],['POST','/api/account/refresh?scope=other'],['POST','/api/account/refresh#other']])expect(await authorize(new Request(origin+path,{method,headers}),signal)).toBeNull();
 expect(verify).not.toHaveBeenCalled();
 expect((await authorize(new Request(origin+'/api/account/refresh',{method:'POST',headers}),signal))?.ownerId).toBe('owner');
 expect(verify).toHaveBeenCalledTimes(1);
 expect(await authorize(new Request(origin+'/api/account/refresh',{method:'POST',headers:{...headers,origin:'https://foreign.test'}}),signal)).toBeNull();
 expect(verify).toHaveBeenCalledTimes(1);
});
