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
export function AccountPanel({provider=sampleAccountProvider,connected=false}:{provider?:AccountProvider;connected?:boolean}){
 if(connected&&provider===sampleAccountProvider)throw Error("Connected account configuration unavailable");
 const preview=!connected;
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
  <span className="badge">{preview?"Simulated account preview":"Account access"}</span><h2 id="account-heading">{mode==='signUp'?'Create your account':mode==='recover'?'Recover access':'Welcome to your style journal'}</h2>
  <p id="account-preview-note">{preview?"Use made-up details only. This preview creates no account, sends no email and opens no provider. Simulated sign-in does not unlock the stylist.":"Sign in to your account. Account status on this screen does not replace server access checks."}</p>
  <div className="account-modes" aria-label="Account options">{(['signIn','signUp','recover'] as const).map(value=><button key={value} type="button" aria-pressed={mode===value} onClick={()=>change(value)}>{value==='signIn'?'Sign in':value==='signUp'?'Create account':'Recover access'}</button>)}</div>
  {resetPreview?<RecoveryPanel onClose={()=>{setResetPreview(false);change('signIn');}}/>:state.status==='signedIn'?<><p>{preview?"Sample account connected on this page only. Your stylist remains unavailable.":"Sign-in completed. Protected features verify your session on the server."}</p><button type="button" onClick={async()=>{const work=flow.signOut();setEmail('');setPassword('');setState(flow.snapshot());await work;setState(flow.snapshot());}}>{preview?"Sign out of sample account":"Sign out"}</button></>:<>
   <form aria-describedby="account-preview-note" onSubmit={event=>{event.preventDefault();void submit(mode==='recover'?{method:'recover',email}:{method:mode,email,password});}}>
    <label htmlFor="account-email">{preview?"Email address (made-up)":"Email address"}</label><input id="account-email" type="email" autoComplete={preview?"off":"email"} maxLength={254} required value={email} onChange={event=>setEmail(event.target.value)} disabled={pending}/>
    {mode!=='recover'&&<><label htmlFor="account-password">{preview?"Password (made-up)":"Password"}</label><input id="account-password" type="password" autoComplete={preview?"off":mode==="signUp"?"new-password":"current-password"} maxLength={4096} required value={password} onChange={event=>setPassword(event.target.value)} disabled={pending}/></>}
    <button className="account-primary" disabled={pending} type="submit">{preview?(mode==='recover'?'Preview recovery':mode==='signUp'?'Preview account creation':'Preview sign-in'):(mode==='recover'?'Request recovery':mode==='signUp'?'Create account':'Sign in')}</button>
   </form>
   {mode==='signIn'&&<div className="account-social"><button type="button" disabled={pending} onClick={()=>void submit({method:'social',provider:'google'})}>{preview?"Preview Google sign-in":"Continue with Google"}</button><button type="button" disabled={pending} onClick={()=>void submit({method:'social',provider:'apple'})}>{preview?"Preview Apple sign-in":"Continue with Apple"}</button></div>}
  </>}
  {preview&&mode==='recover'&&state.status==='recoveryRequested'&&!resetPreview&&<button type="button" onClick={()=>setResetPreview(true)}>Preview reset step (simulated)</button>}
  <p ref={statusRef} tabIndex={-1} className="account-status" role={state.status==='error'?'alert':'status'} aria-live={state.status==='error'?'assertive':'polite'}>{!preview?state.message:state.status==='signedIn'?'Simulated sign-in complete. No real account is connected.':state.status==='confirmationRequired'?'Confirmation screen preview. No email was sent.':state.status==='recoveryRequested'?'Recovery screen preview. No email was sent.':state.status==='redirecting'?'Provider handoff preview. No external page was opened.':state.message}</p>
  {(pending||state.status==='redirecting')&&<button type="button" onClick={()=>{flow.cancel();setState(flow.snapshot());}}>{preview?"Cancel preview":"Cancel"}</button>}
 </section>;
}
