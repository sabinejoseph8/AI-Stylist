import {describe,it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {createAccountCallbacks} from '../src/server/account-callback.ts';
import {createOAuthStart} from '../src/server/oauth-start.ts';

describe('prepared OAuth initiation',()=>{
 for(const provider of ['google','apple'] as const)it(`binds ${provider} authorization to one browser and a one-use verifier`,()=>{
  const callbacks=createAccountCallbacks('https://stylist.example');
  const result=createOAuthStart('https://project.supabase.co',callbacks).begin(provider,'/profile');
  const url=new URL(result.url),callback=new URL(url.searchParams.get('redirect_to')!);
  expect(url.origin+url.pathname).toBe('https://project.supabase.co/auth/v1/authorize');
  expect([...url.searchParams.keys()].sort()).toEqual(['code_challenge','code_challenge_method','provider','redirect_to']);
  expect(url.searchParams.get('provider')).toBe(provider);
  expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  expect(callback.origin+callback.pathname).toBe('https://stylist.example/auth/callback/'+provider);
  callback.searchParams.set('code','synthetic-code');
  expect(callbacks.fromRequest(new Request(callback),provider)).toBeNull();
  const request=new Request(callback,{headers:{cookie:result.setCookies[0].split(';')[0]}});
  const consumed=callbacks.fromRequest(request,provider);
  expect(consumed?.status).toBe('exchangeRequired');
  if(!consumed||consumed.status!=='exchangeRequired')throw Error('Missing synthetic transaction');
  expect(createHash('sha256').update(consumed.verifier).digest('base64url')).toBe(url.searchParams.get('code_challenge'));
  expect(consumed.returnPath).toBe('/profile');
  expect(callbacks.fromRequest(request,provider)).toBeNull();
  expect(Object.keys(result).sort()).toEqual(['discard','setCookies','url']);
  expect(result.setCookies[0]).toContain('Secure; HttpOnly; SameSite=Lax');
 });
 it('rejects destinations and return paths outside the fixed allowlists',()=>{
  const callbacks=createAccountCallbacks('https://stylist.example');
  for(const project of ['http://project.supabase.co','https://project.supabase.co/','https://project.supabase.co.evil.test','https://user@project.supabase.co'])expect(()=>createOAuthStart(project,callbacks)).toThrow();
  const start=createOAuthStart('https://project.supabase.co',callbacks);
  expect(()=>start.begin('google','https://evil.test')).toThrow();
  expect(()=>start.begin('recovery' as 'google')).toThrow();
 });
});
