import {it,expect,vi} from 'vitest';
import {createAccountFlow,type AccountProvider,type AccountReply} from '../src/web/account-flow.ts';
const user='00000000-0000-0000-0000-000000000001';
const request={method:'signIn' as const,email:'sample@example.test',password:'private-fixture'};
const provider=(reply:AccountReply):AccountProvider=>({submit:async()=>reply,signOut:async()=>{}});
it('starts signed out, validates identity and retains no password/email/token in snapshots',async()=>{
 const flow=createAccountFlow(provider({status:'signedIn',userId:user}));expect(flow.snapshot().status).toBe('signedOut');
 await flow.submit(request);expect(flow.snapshot().userId).toBe(user);expect(Object.isFrozen(flow.snapshot())).toBe(true);
 expect(JSON.stringify(flow.snapshot())).not.toMatch(/private-fixture|example.test|token/);
 await flow.signOut();expect(flow.snapshot().userId).toBeNull();
});
it('registration confirmation is not authentication',async()=>{
 const flow=createAccountFlow(provider({status:'confirmationRequired'}));await flow.submit({...request,method:'signUp'});
 expect(flow.snapshot().status).toBe('confirmationRequired');expect(flow.snapshot().userId).toBeNull();
 await flow.submit(request);expect(flow.snapshot().status).toBe('error');
});
it('recovery acknowledgment never implies account existence or signs in',async()=>{
 const flow=createAccountFlow(provider({status:'signedIn',userId:user}));await flow.submit({method:'recover',email:request.email});
 expect(flow.snapshot().status).toBe('recoveryRequested');expect(flow.snapshot().userId).toBeNull();
});
it('supports Google and Apple cancellation or redirect without guest access',async()=>{
 for(const name of ['google','apple'] as const){
  const flow=createAccountFlow(provider({status:'redirecting'}));await flow.submit({method:'social',provider:name});
  expect(flow.snapshot().status).toBe('redirecting');expect(flow.snapshot().userId).toBeNull();flow.cancel();expect(flow.snapshot().status).toBe('signedOut');
  const canceled=createAccountFlow(provider({status:'canceled'}));await canceled.submit({method:'social',provider:name});expect(canceled.snapshot().userId).toBeNull();
 }
});
it('drops old replies after a newer attempt, cancellation or sign-out',async()=>{
 for(const action of ['new','cancel','out']){
  let resolve!:(x:AccountReply)=>void;let signal!:AbortSignal;
  const flow=createAccountFlow({submit:(_,s)=>{signal=s;return new Promise(r=>{resolve=r;});},signOut:async()=>{}});
  const first=flow.submit(request);await Promise.resolve();
  if(action==='cancel')flow.cancel();else if(action==='out')await flow.signOut();else await flow.submit({...request,email:'invalid'});
  resolve({status:'signedIn',userId:user});await first;expect(signal.aborted).toBe(true);expect(flow.snapshot().userId).toBeNull();
 }
});
it('bounds stalled operations, hides raw errors and marks failed remote sign-out unconfirmed',async()=>{
 const flow=createAccountFlow({submit:async()=>{throw Error('secret');},signOut:async()=>{throw Error('secret');}});
 await flow.submit(request);expect(flow.snapshot().message).not.toContain('secret');await flow.signOut();expect(flow.snapshot().message).toBe('Local access is closed. Server sign-out could not be confirmed.');expect(flow.snapshot().userId).toBeNull();
 const stalled=createAccountFlow({submit:()=>new Promise(()=>{}),signOut:async()=>{}},5);await stalled.submit(request);expect(stalled.snapshot().status).toBe('error');
});
it('rejects malformed input and provider results',async()=>{
 const call=vi.fn(async()=>({status:'signedIn' as const,userId:user}));const flow=createAccountFlow({submit:call,signOut:async()=>{}});
 await flow.submit({...request,password:''});expect(call).not.toHaveBeenCalled();
 await flow.submit({...request,email:'invalid'});expect(call).not.toHaveBeenCalled();
 for(const reply of [{status:'signedIn',userId:'bad'},{status:'signedIn',userId:user,token:'private'},{status:'redirecting'}]){
  const bad=createAccountFlow(provider(reply as AccountReply));await bad.submit(request);expect(bad.snapshot().status).toBe('error');
 }
});
it('cancellation before dispatch makes no provider request',async()=>{
 const submit=vi.fn(async()=>({status:'signedIn' as const,userId:user}));
 const flow=createAccountFlow({submit,signOut:async()=>{}});const attempt=flow.submit(request);flow.cancel();await attempt;
 expect(submit).not.toHaveBeenCalled();expect(flow.snapshot().status).toBe('signedOut');
});

it('retains admission for canceled non-cooperative calls and resumes when they settle',async()=>{
 const releases:Array<(reply:AccountReply)=>void>=[];const submit=vi.fn(()=>new Promise<AccountReply>(resolve=>releases.push(resolve)));
 const flow=createAccountFlow({submit,signOut:async()=>{}},1000);
 for(let i=0;i<4;i++){const attempt=flow.submit(request);await Promise.resolve();flow.cancel();await attempt;}
 await flow.submit(request);expect(submit).toHaveBeenCalledTimes(4);expect(flow.snapshot().status).toBe('error');
 releases[0]!({status:'signedIn',userId:user});await Promise.resolve();await Promise.resolve();
 const fresh=flow.submit(request);await Promise.resolve();expect(submit).toHaveBeenCalledTimes(5);
 releases[4]!({status:'signedIn',userId:user});await fresh;expect(flow.snapshot().userId).toBe(user);
 for(const release of releases.slice(1,4))release({status:'signedIn',userId:'00000000-0000-0000-0000-000000000002'});
 await Promise.resolve();expect(flow.snapshot().userId).toBe(user);
});

it('accepts status-only HTTP presentation without inventing a client account identity',async()=>{
 const flow=createAccountFlow(provider({status:'signedIn'}));await flow.submit(request);expect(flow.snapshot().status).toBe('signedIn');expect(flow.snapshot().userId).toBeNull();expect(JSON.stringify(flow.snapshot())).not.toContain('private-fixture');
});

it('restores status without customer details and refuses unexpected restoration replies',async()=>{
 const flow=createAccountFlow({...provider({status:'signedIn'}),restore:async()=> 'signedIn'});
 await flow.restore();expect(flow.snapshot()).toEqual({status:'signedIn',message:'You are signed in.',userId:null});
 const failed=createAccountFlow({...provider({status:'signedIn'}),restore:async()=>{throw Error('secret');}});
 await failed.restore();expect(failed.snapshot().status).toBe('signedOut');expect(failed.snapshot().message).not.toContain('secret');
});
it('cancellation, newer sign-in and sign-out supersede a delayed restoration',async()=>{
 for(const action of ['cancel','submit','signOut']){
  let release!:(value:'signedIn')=>void;let observed!:AbortSignal;
  const flow=createAccountFlow({...provider({status:'confirmationRequired'}),restore:signal=>{observed=signal;return new Promise(resolve=>{release=resolve;});}});
  const work=flow.restore();await Promise.resolve();
  if(action==='cancel')flow.cancel();else if(action==='signOut')await flow.signOut();else await flow.submit({...request,method:'signUp'});
  release('signedIn');await work;expect(observed.aborted).toBe(true);expect(flow.snapshot().status).toBe(action==='submit'?'confirmationRequired':'signedOut');
 }
});
it('preview providers without restoration make no restoration request',async()=>{
 const flow=createAccountFlow(provider({status:'signedIn'}));await flow.restore();expect(flow.snapshot().status).toBe('signedOut');
});
