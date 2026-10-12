import {it,expect,vi} from 'vitest';
import {createPasswordProvider} from '../src/server/password-provider.ts';
const input={method:'signIn' as const,email:'sample@example.test',password:'made-up'};
const signal=()=>new AbortController().signal;
it('preserves staged server lifecycle without exposing refresh material',async()=>{
 const result={accessToken:'fixture-access',adopt:async()=>true,discard:async()=>true};const stage=vi.fn(async()=>result);
 const port=createPasswordProvider({password:async()=>({access_token:'fixture-access',refresh_token:'fixture-refresh',token_type:'bearer'}),revoke:vi.fn()},{stage});
 expect(await port.password(input,signal())).toBe(result);expect(stage).toHaveBeenCalledWith({accessToken:'fixture-access',refreshSecret:'fixture-refresh'},expect.any(AbortSignal));
});
it('accepts exact confirmation only for registration',async()=>{
 const stage=vi.fn();const port=createPasswordProvider({password:async()=>({status:'confirmationRequired'}),revoke:vi.fn()},{stage});
 expect(await port.password({...input,method:'signUp'},signal())).toEqual({status:'confirmationRequired'});await expect(port.password(input,signal())).rejects.toThrow('Account provider unavailable');expect(stage).not.toHaveBeenCalled();
});
it('retains exact-session cleanup for malformed replies and failed staging',async()=>{
 for(const response of [{access_token:'fixture-access'},{access_token:'fixture-access',refresh_token:'fixture-refresh',token_type:'bearer'}]){
  const revoke=vi.fn(async()=>true);const port=createPasswordProvider({password:async()=>response,revoke},{stage:async()=>{throw Error('private');}});
  const result=await port.password(input,signal());if(!('discard' in result))throw Error('Cleanup missing');expect(await result.adopt?.(signal())).toBe(false);expect(await result.discard(signal())).toBe(!('refresh_token' in response));expect(await result.discard(signal())).toBe(!('refresh_token' in response));expect(revoke).toHaveBeenCalledTimes(1);expect(revoke).toHaveBeenCalledWith('fixture-access','local',expect.any(AbortSignal));
 }
});
it('retains late cleanup capability after cancellation',async()=>{
 const stop=new AbortController();const port=createPasswordProvider({password:async()=>{stop.abort();return {access_token:'fixture-access'};},revoke:async()=>false},{stage:vi.fn()});
 const result=await port.password(input,stop.signal);if(!('discard' in result))throw Error('Cleanup missing');expect(await result.discard(signal())).toBe(false);
});
