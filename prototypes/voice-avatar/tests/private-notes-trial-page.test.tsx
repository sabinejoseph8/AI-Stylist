import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {it,expect} from 'vitest';
import {PrivateNotesTrialPage} from '../src/private-notes-trial-page.tsx';
import {NotebookConnectionEditor} from '../src/notebook-connection-editor.tsx';
import {NotebookState} from '../src/notebook-state.ts';
import {encodeNoteUpdate} from '../src/note-update-wire.ts';
import type {PreparedBrowserNoteSession} from '../src/note-browser-session.ts';
it('shows complete advance instructions and privacy notice with all start controls disabled',()=>{
 const html=renderToStaticMarkup(<PrivateNotesTrialPage/>);expect(html).toContain('Provider retention terms apply');expect(html).toContain('Complete test instructions');expect(html.match(/<li>/g)).toHaveLength(7);expect(html).toContain('85 seconds including setup');expect(html).toContain('three hundred fifty US dollars');expect(html).toContain('Do not retry');expect(html).toContain('disabled="">Start private notes test');expect(html).toContain('disabled="">Start turn');expect(html).toContain('disabled="">Send turn');expect(html).not.toContain('checked=""');
});
it('uses private-session touch labels while retaining all seven fields',()=>{
 const html=renderToStaticMarkup(<NotebookConnectionEditor privateTrial notes={encodeNoteUpdate('fixture',1,new NotebookState().snapshot(),null)} ready={false} session={{} as PreparedBrowserNoteSession}/>);expect(html.match(/aria-label="Edit /g)).toHaveLength(7);expect(html).toContain('Edit budget');expect(html).not.toContain('rehearsal');expect(html).toContain('Save note');
});
