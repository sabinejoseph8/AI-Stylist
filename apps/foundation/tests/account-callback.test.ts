import {describe,it,expect,vi,afterEach} from 'vitest';
import {createHash} from 'node:crypto';
import {createAccountCallbacks} from '../src/server/account-callback.ts';
const origin='https://stylist.example';
const binding=(cookie:string)=>cookie.split(';')[0]!.split('=')[1]!;
describe('prepared account callback transactions',()=>{
 afterEach(()=>vi.useRealTimers());
 it('generates unique browser-bound one-time PKCE material',()=>{
  const flows=createAccountCallbacks(origin),first=flows.begin('google','/wardrobe'),second=flows.begin('google');
  expect(first.state).not.toBe(second.state);expect(first.challenge).not.toBe(second.challenge);
  expect(first.cookie).toContain('Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=300');
  expect(first.callbackUrl).toBe(origin+'/auth/callback/google?flow='+first.state);
  const result=flows.consume(first.state,binding(first.cookie),'google');
  expect(result?.returnPath).toBe('/wardrobe');expect(result?.verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(createHash('sha256').update(result!.verifier).digest('base64url')).toBe(first.challenge);
  expect(flows.consume(first.state,binding(first.cookie),'google')).toBeNull();
 });
 it('denies mismatched browsers or purposes without consuming the valid flow',()=>{
  const flows=createAccountCallbacks(origin),a=flows.begin('apple'),b=flows.begin('apple');
  expect(flows.consume(a.state,binding(b.cookie),'apple')).toBeNull();
  expect(flows.consume(a.state,binding(a.cookie),'recovery')).toBeNull();
  expect(flows.consume(a.state,binding(a.cookie),'apple')).not.toBeNull();
 });
 it('expires records and refuses them after process replacement',()=>{
  vi.useFakeTimers();const flows=createAccountCallbacks(origin),a=flows.begin('google');
  expect(createAccountCallbacks(origin).consume(a.state,binding(a.cookie),'google')).toBeNull();
  vi.advanceTimersByTime(300000);expect(flows.consume(a.state,binding(a.cookie),'google')).toBeNull();
 });
 it('bounds admission and releases expired records',()=>{
  vi.useFakeTimers();const flows=createAccountCallbacks(origin);for(let i=0;i<128;i++)flows.begin('google');
  expect(()=>flows.begin('google')).toThrow();vi.advanceTimersByTime(300000);expect(()=>flows.begin('google')).not.toThrow();
 });
 it('forces recovery to password reset and rejects unsafe return paths',()=>{
  const flows=createAccountCallbacks(origin);
  for(const path of ['https://attacker.test','//attacker.test','/\\attacker','/%2f%2fattacker','/profile?next=bad','/profile#bad','/unknown'])expect(()=>flows.begin('google',path)).toThrow();
  const a=flows.begin('recovery','/profile');expect(flows.consume(a.state,binding(a.cookie),'recovery')?.returnPath).toBe('/account/reset');
  expect(flows.clear()).toContain('SameSite=Lax; Max-Age=0');
  expect(()=>createAccountCallbacks('http://stylist.example')).toThrow();
 });
 it('allows only one concurrent callback winner',async()=>{
  const flows=createAccountCallbacks(origin),a=flows.begin('google');
  const values=await Promise.all(Array.from({length:8},async()=>flows.consume(a.state,binding(a.cookie),'google')));
  expect(values.filter(Boolean)).toHaveLength(1);
 });
 it('accepts a bound top-level callback once and keeps recovery scoped',()=>{
  const flows=createAccountCallbacks(origin),a=flows.begin('recovery');
  const request=new Request(a.callbackUrl+'&code=opaque-code',{headers:{cookie:a.cookie.split(';')[0]!,'sec-fetch-site':'cross-site','sec-fetch-mode':'navigate','sec-fetch-dest':'document'}});
  expect(flows.fromRequest(request,'recovery')).toMatchObject({code:'opaque-code',purpose:'recovery',returnPath:'/account/reset'});
  expect(flows.fromRequest(request,'recovery')).toBeNull();
 });
 it('rejects duplicate query fields, foreign origins, injected code and ambiguous cookies without consuming state',()=>{
  const flows=createAccountCallbacks(origin),a=flows.begin('google'),cookie=a.cookie.split(';')[0]!;
  for(const suffix of ['&code=a&code=b','&code=a&next=https://bad.test','&code=%0d%0aInjected','&code=a#bad'])expect(flows.fromRequest(new Request(a.callbackUrl+suffix,{headers:{cookie}}),'google')).toBeNull();
  expect(flows.fromRequest(new Request(a.callbackUrl.replace(origin,'https://bad.test')+'&code=a',{headers:{cookie}}),'google')).toBeNull();
  expect(flows.fromRequest(new Request(a.callbackUrl+'&code=a',{headers:{cookie:cookie+'; '+cookie}}),'google')).toBeNull();
  expect(flows.fromRequest(new Request(a.callbackUrl+'&code=a',{headers:{cookie,'sec-fetch-mode':'cors'}}),'google')).toBeNull();
  expect(flows.fromRequest(new Request(a.callbackUrl+'&code=a',{headers:{cookie}}),'google')).not.toBeNull();
 });

});
