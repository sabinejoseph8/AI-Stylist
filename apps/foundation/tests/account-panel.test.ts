import {describe,it,expect} from 'vitest';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AccountPanel,sampleAccountProvider} from '../src/web/account-panel.tsx';
import {createAccountFlow} from '../src/web/account-flow.ts';
describe('local simulated account screens',()=>{
 it('renders explicit simulation notice, labeled inputs and all approved sign-in choices',()=>{
  const html=renderToStaticMarkup(React.createElement(AccountPanel));
  for(const text of ['Simulated account preview','Use made-up details only','creates no account','Create account','Recover access','Preview Google sign-in','Preview Apple sign-in','role="status"','tabindex="-1"','for="account-email"','for="account-password"','type="password"','autoComplete="off"'])expect(html).toContain(text);
  expect(html).not.toContain('action=');expect(html).not.toContain('11111111');
 });
 it('keeps the sample registration and recovery outcomes distinct from signed-in identity',async()=>{
  const flow=createAccountFlow(sampleAccountProvider);
  await flow.submit({method:'signUp',email:'sample@example.test',password:'made-up'});expect(flow.snapshot().status).toBe('confirmationRequired');expect(flow.snapshot().userId).toBeNull();
  await flow.submit({method:'recover',email:'sample@example.test'});expect(flow.snapshot().status).toBe('recoveryRequested');expect(flow.snapshot().userId).toBeNull();
 });
 it('simulates social handoff without granting identity, then allows cancel',async()=>{
  const flow=createAccountFlow(sampleAccountProvider);
  for(const provider of ['google','apple'] as const){await flow.submit({method:'social',provider});expect(flow.snapshot().status).toBe('redirecting');expect(flow.snapshot().userId).toBeNull();flow.cancel();expect(flow.snapshot().status).toBe('signedOut');}
 });
 it('simulates sign-in/sign-out only in memory and refuses canceled sample calls',async()=>{
  const flow=createAccountFlow(sampleAccountProvider);
  await flow.submit({method:'signIn',email:'sample@example.test',password:'made-up'});expect(flow.snapshot().status).toBe('signedIn');await flow.signOut();expect(flow.snapshot().userId).toBeNull();
  const controller=new AbortController();controller.abort();await expect(sampleAccountProvider.submit({method:'social',provider:'google'},controller.signal)).rejects.toThrow();
 });
});

it('requires an explicit non-sample provider for connected wording and never requests data on render',()=>{
 const calls={count:0};const provider={submit:async()=>{calls.count++;return {status:'signedIn' as const};},signOut:async()=>{calls.count++;}};
 expect(()=>renderToStaticMarkup(React.createElement(AccountPanel,{connected:true}))).toThrow();
 const html=renderToStaticMarkup(React.createElement(AccountPanel,{connected:true,provider}));
 for(const text of ['Account access','Continue with Google','Continue with Apple','autoComplete="email"','autoComplete="current-password"'])expect(html).toContain(text);
 expect(html).not.toContain('made-up');expect(html).not.toContain('Preview sign-in');expect(calls.count).toBe(0);
});
