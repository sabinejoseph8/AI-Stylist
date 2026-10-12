import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRecoveryFlow} from './recovery-flow.ts';
/** Simulated reset step only. Never contacts a provider or grants account access. */
export function RecoveryPanel({onClose}:{onClose:()=>void}){
 const flow=useMemo(()=>createRecoveryFlow({reset:async()=>({status:'resetComplete'})},Date.now()+300000),[]);
 const [state,setState]=useState(flow.snapshot),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const status=useRef<HTMLParagraphElement>(null),previous=useRef(state);
 useEffect(()=>()=>flow.cancel(),[flow]);
 useEffect(()=>{if(previous.current!==state&&state.status!=='pending')status.current?.focus();previous.current=state;},[state]);
 const pending=state.status==='pending',terminal=['complete','expired','canceled','unconfirmed'].includes(state.status);
 return <section aria-labelledby="reset-heading"><h3 id="reset-heading">Password reset preview</h3><p>No recovery link was verified. Use a made-up password. This simulation changes no password and cannot sign you in.</p>
 <form onSubmit={event=>{event.preventDefault();const work=flow.submit(password,confirm);setPassword('');setConfirm('');setState(flow.snapshot());void work.then(()=>setState(flow.snapshot()));}}>
 <label htmlFor="reset-password">New password (made-up)</label><input id="reset-password" type="password" autoComplete="off" maxLength={4096} required disabled={pending||terminal} value={password} onChange={event=>setPassword(event.target.value)}/>
 <label htmlFor="reset-confirm">Confirm new password</label><input id="reset-confirm" type="password" autoComplete="off" maxLength={4096} required disabled={pending||terminal} value={confirm} onChange={event=>setConfirm(event.target.value)}/>
 <button type="submit" disabled={pending||terminal}>Preview password reset</button></form>
 <p ref={status} tabIndex={-1} role={['error','unconfirmed'].includes(state.status)?'alert':'status'}>{state.status==='complete'?'Reset completion preview. No password was changed. You are still signed out.':state.message}</p>
 <button type="button" onClick={()=>{flow.cancel();setPassword('');setConfirm('');onClose();}}>Return to account options</button></section>;
}
