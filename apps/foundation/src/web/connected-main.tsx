import React from 'react';
import {createRoot} from 'react-dom/client';
import {ConnectedAccountPage} from './connected-account-page.tsx';
import './tokens.css';import './style.css';
const root=createRoot(document.getElementById('root')!);
// Only a trusted static host supplies this public project origin. Never put a key in HTML.
const projectUrl=document.querySelector<HTMLMetaElement>('meta[name="stylist-project-origin"]')?.content;
try{
 if(!projectUrl)throw Error('Account configuration unavailable');
 const origin=window.location.origin,send=window.fetch.bind(window),navigate=(url:string)=>window.location.assign(url);
 root.render(<ConnectedAccountPage origin={origin} href={window.location.href} projectUrl={projectUrl} send={send} navigate={navigate}/>);
}catch{root.render(<main><h1>Account access unavailable</h1><p>Please try again later.</p></main>);}
