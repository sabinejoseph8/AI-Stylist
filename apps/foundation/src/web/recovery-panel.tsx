import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRecoveryFlow,type ResetProvider} from './recovery-flow.ts';
const sampleReset:ResetProvider={reset:async()=>({status:'resetComplete'})};
export interface RecoveryConfiguration {provider:ResetProvider;expiresAt:number}
/** Defaults to simulation. Server permission is independently required for every real reset. */
export function RecoveryPanel({onClose,configuration}:{onClose:()=>void;configuration?:RecoveryConfiguration}){
 const preview=configuration===undefined;
 const provider=configuration?.provider??sampleReset,expiresAt=configuration?.expiresAt;
 const flow=useMemo(()=>createRecoveryFlow(provider,expiresAt??Date.now()+300000),[provider,expiresAt]);
 const [state,setState]=useState(flow.snapshot),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const status=useRef<HTMLParagraphElement>(null),previous=useRef(state);
 useEffect(()=>{setState(flow.snapshot());setPassword('');setConfirm('');return()=>flow.cancel();},[flow]);
 useEffect(()=>{if(previous.current!==state&&state.status!=='pending')status.current?.focus();previous.current=state;},[state]);
 const pending=state.status==='pending',terminal=['complete','expired','canceled','unconfirmed'].includes(state.status);
 return <section aria-labelledby="reset-heading"><h3 id="reset-heading">{preview?'Password reset preview':'Choose a new password'}</h3><p>{preview?'No recovery link was verified. Use a made-up password. This simulation changes no password and cannot sign you in.':'Your server-verified recovery permission is required. Updating your password does not sign you in.'}</p>
 <form onSubmit={event=>{event.preventDefault();const work=flow.submit(password,confirm);setPassword('');setConfirm('');setState(flow.snapshot());void work.then(()=>setState(flow.snapshot()));}}>
 <label htmlFor="reset-password">{preview?'New password (made-up)':'New password'}</label><input id="reset-password" type="password" autoComplete={preview?'off':'new-password'} maxLength={4096} required disabled={pending||terminal} value={password} onChange={event=>setPassword(event.target.value)}/>
 <label htmlFor="reset-confirm">Confirm new password</label><input id="reset-confirm" type="password" autoComplete={preview?'off':'new-password'} maxLength={4096} required disabled={pending||terminal} value={confirm} onChange={event=>setConfirm(event.target.value)}/>
 <button type="submit" disabled={pending||terminal}>{preview?'Preview password reset':'Update password'}</button></form>
 <p ref={status} tabIndex={-1} role={['error','unconfirmed'].includes(state.status)?'alert':'status'}>{preview&&state.status==='complete'?'Reset completion preview. No password was changed. You are still signed out.':state.message}</p>
 <button type="button" onClick={()=>{flow.cancel();setPassword('');setConfirm('');onClose();}}>Return to account options</button></section>;
}
