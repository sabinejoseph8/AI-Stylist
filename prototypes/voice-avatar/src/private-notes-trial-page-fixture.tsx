import React from 'react';
import {createRoot} from 'react-dom/client';
import {PrivateNotesTrialPage} from './private-notes-trial-page.tsx';
import {createPrivateNotesPageRehearsal} from './private-notes-trial-page-rehearsal.ts';
import './notebook.css';
// Development-only HTML entry, excluded from Vite build inputs and HTTP allowlist.
const rehearsal=createPrivateNotesPageRehearsal({simulation:true,page:window,visibility:document});
createRoot(document.getElementById('root')!).render(<PrivateNotesTrialPage rehearsal={rehearsal}/>);
