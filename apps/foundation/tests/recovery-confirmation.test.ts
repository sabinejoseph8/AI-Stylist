import {describe,it,expect,vi,afterEach} from 'vitest';
import {createRecoveryConfirmation} from '../src/server/recovery-confirmation.ts';
const origin='https://stylist.example',signal=()=>new AbortController().signal;
function fixture(){const confirm=vi.fn(async()=>({status:'unavailable' as const}));const binding=createRecoveryConfirmation(origin,{confirm});const landing=()=>binding.begin(new Request(origin+'/account/recovery?token_hash=email-proof'));return {binding,confirm,landing};}
function post(cookie:string,from=origin){return new Request(origin+'/api/account/recovery-confirm',{method:'POST',headers:{origin:from,cookie}});}
describe('receiving-browser confirmation',()=>{
 afterEach(()=>vi.useRealTimers());
 it('does not consume email proof on landing and binds explicit confirmation to the receiving browser',async()=>{
  const f=fixture(),a=f.landing()!;expect(f.confirm).not.toHaveBeenCalled();expect(a.setCookie).toContain('Secure; HttpOnly; SameSite=Strict');
  expect(JSON.stringify(a)).not.toContain('email-proof');
  await f.binding.confirm(post(a.setCookie.split(';')[0]!),{confirmation:a.confirmation},signal());
  expect(f.confirm).toHaveBeenCalledWith('email-proof',expect.any(AbortSignal));
  await f.binding.confirm(post(a.setCookie.split(';')[0]!),{confirmation:a.confirmation},signal());expect(f.confirm).toHaveBeenCalledTimes(1);
 });
 it('rejects another browser, foreign origin and duplicate cookies without consuming the rightful binding',async()=>{
  const f=fixture(),a=f.landing()!,b=f.landing()!,input={confirmation:a.confirmation},cookie=a.setCookie.split(';')[0]!;
  await f.binding.confirm(post(b.setCookie.split(';')[0]!),input,signal());await f.binding.confirm(post(cookie,'https://foreign.example'),input,signal());await f.binding.confirm(post(cookie+'; '+cookie),input,signal());expect(f.confirm).not.toHaveBeenCalled();
  await f.binding.confirm(post(cookie),input,signal());expect(f.confirm).toHaveBeenCalledTimes(1);
 });
 it('refuses expired, closed and malformed landings',async()=>{
  const f=fixture();expect(f.binding.begin(new Request(origin+'/account/recovery?token_hash=x&token_hash=y'))).toBeNull();const a=f.landing()!;
  vi.useFakeTimers();vi.setSystemTime(Date.now()+300001);await f.binding.confirm(post(a.setCookie.split(';')[0]!),{confirmation:a.confirmation},signal());expect(f.confirm).not.toHaveBeenCalled();f.binding.close();expect(f.landing()).toBeNull();
 });
 it('aborts verification when the binding service closes',async()=>{
  let scope!:AbortSignal;const confirm=vi.fn(async(_proof:string,signal:AbortSignal)=>{scope=signal;return {status:'unavailable' as const};});const binding=createRecoveryConfirmation(origin,{confirm}),a=binding.begin(new Request(origin+'/account/recovery?token_hash=proof'))!;
  const work=binding.confirm(post(a.setCookie.split(';')[0]!),{confirmation:a.confirmation},signal());binding.close();expect(scope.aborted).toBe(true);await work;
 });
 it('claims the confirmation before asynchronous verification so concurrent submissions cannot replay it',async()=>{
  let release!:(value:{status:'unavailable'})=>void;const confirm=vi.fn(()=>new Promise<{status:'unavailable'}>(r=>release=r)),binding=createRecoveryConfirmation(origin,{confirm});const a=binding.begin(new Request(origin+'/account/recovery?token_hash=proof'))!,request=()=>post(a.setCookie.split(';')[0]!);
  const first=binding.confirm(request(),{confirmation:a.confirmation},signal());expect(await binding.confirm(request(),{confirmation:a.confirmation},signal())).toEqual({status:'unavailable'});expect(confirm).toHaveBeenCalledTimes(1);release({status:'unavailable'});await first;
 });
});
