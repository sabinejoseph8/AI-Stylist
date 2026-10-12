import {describe,it,expect,vi} from 'vitest';
import {createAccountCookies} from '../src/server/account-cookie.ts';
const signal=()=>new AbortController().signal;
describe('prepared verified account cookies',()=>{
 it('issues a host-only secure HttpOnly strict session cookie after verification',async()=>{
  const isCurrent=vi.fn(async()=>true),verify=vi.fn(async()=>({ownerId:'owner',isCurrent}));
  const cookies=createAccountCookies({verify});
  expect(await cookies.issue('aaa.bbb.ccc',signal())).toBe('__Host-stylist_access=aaa.bbb.ccc; Path=/; Secure; HttpOnly; SameSite=Strict');
  expect(verify).toHaveBeenCalledTimes(1);expect(isCurrent).toHaveBeenCalledTimes(1);
  expect(cookies.clear()).toBe('__Host-stylist_access=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0');
 });
 it('refuses invalid or oversized tokens without checking identity',async()=>{
  const verify=vi.fn();const cookies=createAccountCookies({verify});
  for(const token of ['','a.b.c\r\nInjected: yes','a;b.c.d','a'.repeat(3801)+'.b.c'])expect(await cookies.issue(token,signal())).toBeNull();
  expect(verify).not.toHaveBeenCalled();
 });
 it('does not issue a cookie for rejected or revoked identity and hides failures',async()=>{
  for(const verify of [async()=>null,async()=>({ownerId:'owner',isCurrent:async()=>false}),async()=>{throw Error('private');}])expect(await createAccountCookies({verify}).issue('aaa.bbb.ccc',signal())).toBeNull();
 });
 it('discards canceled identity acknowledgments',async()=>{
  const c=new AbortController();const cookies=createAccountCookies({verify:async()=>{c.abort();return {ownerId:'owner',isCurrent:async()=>true};}});
  expect(await cookies.issue('aaa.bbb.ccc',c.signal)).toBeNull();
 });
});
