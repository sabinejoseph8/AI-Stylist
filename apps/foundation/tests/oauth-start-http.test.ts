import {it,expect,vi} from 'vitest';
import {createOAuthStartHttp} from '../src/server/oauth-start-http.ts';
const origin='https://stylist.example';
it.each(['google','apple','other'])('refuses %s initiation before cookies or provider work',async(provider)=>{
 const begin=vi.fn(),http=createOAuthStartHttp(origin,{begin});
 const response=await http.handle(new Request(origin+'/api/account/oauth',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({provider,returnPath:'/'})}),new AbortController().signal);
 expect(response.status).toBe(400);expect(response.headers.get('set-cookie')).toBeNull();expect(begin).not.toHaveBeenCalled();
 expect(await http.discardResponse(response)).toBe(true);expect(await http.discardResponse(response)).toBe(true);
});
