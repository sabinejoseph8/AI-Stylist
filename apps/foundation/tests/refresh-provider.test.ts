import {it,expect,vi} from 'vitest';
import {createRefreshProvider} from '../src/server/refresh-provider.ts';
const signal=()=>new AbortController().signal;
function fixture(){const refresh=vi.fn(async(_input:unknown,_signal:AbortSignal):Promise<unknown>=>({access_token:'access-fixture',refresh_token:'next-fixture',token_type:'bearer'})),revoke=vi.fn(async(_jwt:string,_scope:'local',_signal:AbortSignal)=>({status:'accepted' as 'accepted'|'unconfirmed'}));return {refresh,revoke};}
it('uses explicit refresh input and exact current-session cleanup once',async()=>{
 const f=fixture(),p=createRefreshProvider(f,()=>Date.now()+60000),r=await p.rotate('old-fixture',signal());
 expect(f.refresh.mock.calls[0]?.[0]).toEqual({refresh_token:'old-fixture'});expect(r.refreshSecret).toBe('next-fixture');expect(await r.revoke(signal())).toBe(true);expect(await r.revoke(signal())).toBe(true);expect(f.revoke).toHaveBeenCalledTimes(1);expect(f.revoke.mock.calls[0]?.slice(0,2)).toEqual(['access-fixture','local']);
});
it('rejects malformed provider replies and invalid application expiry',async()=>{
 for(const reply of [null,{}, {access_token:'a',refresh_token:'b',token_type:'other'}]){const f=fixture();f.refresh.mockResolvedValue(reply);await expect(createRefreshProvider(f,()=>Date.now()+60000).rotate('fixture',signal())).rejects.toThrow('Account refresh unavailable');}
 await expect(createRefreshProvider(fixture(),()=>Date.now()-1).rotate('fixture',signal())).rejects.toThrow();
});
it('does not normalize failed or uncertain revocation into success',async()=>{
 for(const throws of [false,true]){const f=fixture();if(throws)f.revoke.mockRejectedValue(Error('private'));else f.revoke.mockResolvedValue({status:'unconfirmed'});const r=await createRefreshProvider(f,()=>Date.now()+60000).rotate('fixture',signal());expect(await r.revoke(signal())).toBe(false);}
});
it('retains capacity for ignored cancellation and never retries ambiguous rotation',async()=>{
 vi.useFakeTimers();try{const f=fixture(),release:Array<(x:unknown)=>void>=[];f.refresh.mockImplementation(()=>new Promise(r=>release.push(r)));const p=createRefreshProvider(f,()=>Date.now()+60000,20);
 const calls=Array.from({length:4},()=>p.rotate('fixture',signal()).catch(()=>null));await vi.advanceTimersByTimeAsync(21);expect(await Promise.all(calls)).toEqual([null,null,null,null]);await expect(p.rotate('fixture',signal())).rejects.toThrow();expect(f.refresh).toHaveBeenCalledTimes(4);release.forEach(r=>r(null));await vi.advanceTimersByTimeAsync(0);
 }finally{vi.useRealTimers();}
});
