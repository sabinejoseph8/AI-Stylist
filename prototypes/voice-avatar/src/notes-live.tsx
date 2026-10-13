import React from 'react';
import {createRoot} from 'react-dom/client';
import {PrivateNotesTrialPage} from './private-notes-trial-page.tsx';
import './notebook.css';
createRoot(document.getElementById('root')!).render(<PrivateNotesTrialPage/>);
