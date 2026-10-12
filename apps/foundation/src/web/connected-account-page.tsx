import React,{useMemo} from 'react';
import {resolveAccountPage} from './account-page.ts';
import {AccountPanel} from './account-panel.tsx';
import {createAccountHttp} from './account-http.ts';
import {createOAuthHandoff} from './oauth-handoff.ts';
import {RecoveryPage} from './recovery-page.tsx';
import {createRecoveryConfiguration} from './recovery-configuration.ts';
export interface ConnectedAccountPageProps {origin:string;href:string;projectUrl:string;send:typeof fetch;navigate:(url:string)=>void}
/** Separate connected entry. URL routing supplies presentation only, never account/reset authority. */
export function ConnectedAccountPage({origin,href,projectUrl,send,navigate}:ConnectedAccountPageProps){
 const page=resolveAccountPage(origin,href);
 const provider=useMemo(()=>createAccountHttp(origin,send,15000,createOAuthHandoff(origin,projectUrl,send,navigate)),[origin,projectUrl,send,navigate]);
 const load=useMemo(()=>createRecoveryConfiguration(origin,send),[origin,send]);
 return <><a className="skip" href="#main">Skip to content</a><header><a className="wordmark" href="/account">AI Stylist<span>Your personal fashion journal</span></a></header><main id="main" tabIndex={-1}>
 <h1>{page.page==='reset'?'Reset your password':'Your account'}</h1>
 {page.page==='reset'?<RecoveryPage origin={origin} href={href} load={load} onClose={()=>navigate(origin+'/account')}/>:page.page==='account'?<>
 {page.notice!=='none'&&<p role="status">{page.notice==='canceled'?'Sign-in was canceled.':page.notice==='busy'?'Account access is busy. Please try again.':'Account access is unavailable. Please try again.'}</p>}
 <AccountPanel provider={provider} connected/>
 </>:<section className="card"><p role="alert">This account page is unavailable.</p><a href="/account">Return to account options</a></section>}
 </main></>;
}
