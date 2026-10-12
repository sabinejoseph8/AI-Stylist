import {RecoveryPanel} from './recovery-panel.tsx';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createAccountFlow,type AccountProvider,type AccountRequest} from './account-flow.ts';
/** Explicitly simulated; no network, storage, account creation or styling authorization. */
export const sampleAccountProvider:AccountProvider={
 async submit(request,signal){
  if(signal.aborted)throw Error();
  if(request.method==='social')return {status:'redirecting'};
  if(request.method==='signUp')return {status:'confirmationRequired'};
  return {status:'signedIn',userId:'11111111-1111-4111-8111-111111111111'};
 },
 async signOut(signal){if(signal.aborted)throw Error();},
};
export function AccountPanel({provider=sampleAccountProvider}:{provider?:AccountProvider}){
 const flow=useMemo(()=>createAccountFlow(provider),[provider]);
 const [state,setState]=useState(flow.snapshot),[mode,setMode]=useState<'signIn'|'signUp'|'recover'>('signIn');
 const [resetPreview,setResetPreview]=useState(false);
 const [email,setEmail]=useState(''),[password,setPassword]=useState('');
 const statusRef=useRef<HTMLParagraphElement>(null),previous=useRef(state);
 useEffect(()=>{if(previous.current!==state&&state.status!=='pending')statusRef.current?.focus();previous.current=state;},[state]);
 useEffect(()=>()=>flow.cancel(),[flow]);
 async function submit(request:AccountRequest){const work=flow.submit(request);setPassword('');setState(flow.snapshot());await work;setState(flow.snapshot());}
 function change(next:typeof mode){setResetPreview(false);flow.cancel();setState(flow.snapshot());setPassword('');setMode(next);}
 const pending=state.status==='pending';
 return <section className="card account-panel" aria-labelledby="account-heading">
  <span className="badge">Simulated account preview</span><h2 id="account-heading">{mode==='signUp'?'Create your account':mode==='recover'?'Recover access':'Welcome to your style journal'}</h2>
  <p id="account-preview-note">Use made-up details only. This preview creates no account, sends no email and opens no provider. Simulated sign-in does not unlock the stylist.</p>
  <div className="account-modes" aria-label="Account options">{(['signIn','signUp','recover'] as const).map(value=><button key={value} type="button" aria-pressed={mode===value} onClick={()=>change(value)}>{value==='signIn'?'Sign in':value==='signUp'?'Create account':'Recover access'}</button>)}</div>
  {resetPreview?<RecoveryPanel onClose={()=>{setResetPreview(false);change('signIn');}}/>:state.status==='signedIn'?<><p>Sample account connected on this page only. Your stylist remains unavailable.</p><button type="button" onClick={async()=>{const work=flow.signOut();setEmail('');setPassword('');setState(flow.snapshot());await work;setState(flow.snapshot());}}>Sign out of sample account</button></>:<>
   <form aria-describedby="account-preview-note" onSubmit={event=>{event.preventDefault();void submit(mode==='recover'?{method:'recover',email}:{method:mode,email,password});}}>
    <label htmlFor="account-email">Email address (made-up)</label><input id="account-email" type="email" autoComplete="off" maxLength={254} required value={email} onChange={event=>setEmail(event.target.value)} disabled={pending}/>
    {mode!=='recover'&&<><label htmlFor="account-password">Password (made-up)</label><input id="account-password" type="password" autoComplete="off" maxLength={4096} required value={password} onChange={event=>setPassword(event.target.value)} disabled={pending}/></>}
    <button className="account-primary" disabled={pending} type="submit">{mode==='recover'?'Preview recovery':mode==='signUp'?'Preview account creation':'Preview sign-in'}</button>
   </form>
   {mode==='signIn'&&<div className="account-social"><button type="button" disabled={pending} onClick={()=>void submit({method:'social',provider:'google'})}>Preview Google sign-in</button><button type="button" disabled={pending} onClick={()=>void submit({method:'social',provider:'apple'})}>Preview Apple sign-in</button></div>}
  </>}
  {mode==='recover'&&state.status==='recoveryRequested'&&!resetPreview&&<button type="button" onClick={()=>setResetPreview(true)}>Preview reset step (simulated)</button>}
  <p ref={statusRef} tabIndex={-1} className="account-status" role={state.status==='error'?'alert':'status'} aria-live={state.status==='error'?'assertive':'polite'}>{state.status==='signedIn'?'Simulated sign-in complete. No real account is connected.':state.status==='confirmationRequired'?'Confirmation screen preview. No email was sent.':state.status==='recoveryRequested'?'Recovery screen preview. No email was sent.':state.status==='redirecting'?'Provider handoff preview. No external page was opened.':state.message}</p>
  {(pending||state.status==='redirecting')&&<button type="button" onClick={()=>{flow.cancel();setState(flow.snapshot());}}>Cancel preview</button>}
 </section>;
}
