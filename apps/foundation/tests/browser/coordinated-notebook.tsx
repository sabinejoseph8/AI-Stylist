import {LocalConsultationCandidate} from '../../src/session/local-consultation-candidate.ts';
import {LocalConsultationReference} from '../../src/media/local-consultation-reference.ts';
import {normalizeBrowserImage} from '../../src/media/browser-image.ts';
/** Test-only Vite entry, excluded from production build inputs. */
import React from 'react';
import {createRoot} from 'react-dom/client';
import {LocalConsultationView} from '../../src/session/local-consultation-view.ts';
import type {ConsultationViewPort} from '../../src/session/local-consultation-view.ts';
import {App} from '../../src/web/app.tsx';
import '../../src/web/tokens.css';import '../../src/web/style.css';
const call=async(action:string,signal:AbortSignal,command?:unknown)=>{
 const response=await fetch('/__consultation_fixture',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,...(command===undefined?{}:{command})}),signal,redirect:'error',credentials:'omit'});
 if(!response.ok)throw Error('Local rehearsal unavailable');return response.json();
};
const port:ConsultationViewPort={snapshot:s=>call('snapshot',s),edit:(c,s)=>call('edit',s,c),clear:s=>call('clear',s),end:s=>call('end',s),onReset:()=>()=>{}};
const model=new LocalConsultationView(port);
document.addEventListener('fixture-shared-refresh',()=>void model.refresh());
const reference=new LocalConsultationReference(model,{normalize:normalizeBrowserImage,createURL:blob=>URL.createObjectURL(blob),revokeURL:url=>URL.revokeObjectURL(url)});
const candidate=location.search==='?candidate'?new LocalConsultationCandidate(model,{snapshot:s=>call('candidateSnapshot',s),prepare:(c,s)=>call('candidatePrepare',s,c),feedback:(c,s)=>call('candidateFeedback',s,c)},reference):undefined;
window.addEventListener('pagehide',()=>{candidate?.dispose();reference.dispose();model.dispose();},{once:true});
createRoot(document.getElementById('root')!).render(<App consultation={model} consultationReference={reference} consultationCandidate={candidate}/>);
