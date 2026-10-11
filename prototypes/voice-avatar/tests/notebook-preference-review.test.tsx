import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {NotebookPreferenceReview,PreferenceClarificationPanel} from '../src/notebook-preference-review.tsx';
import type {PreferenceClarification,ClarificationReason} from '../src/preference-clarification.ts';
const record=(reason:ClarificationReason):PreferenceClarification=>({version:1,profileRevision:1,notebookSession:1,notebookRevision:1,checkId:1,issues:[{field:'color',reason}]});
describe('notebook preference explanation presentation',()=>{
 it('renders no stale panel for a cleared record',()=>expect(renderToStaticMarkup(<PreferenceClarificationPanel record={null}/>)).toBe(''));
 it.each(['confirm-note','saved-uncertain','request-conflict','saved-conflict','unsupported-rule'] as const)('renders accessible safe wording for %s',reason=>{const html=renderToStaticMarkup(<PreferenceClarificationPanel record={record(reason)}/>);expect(html).toContain('role="status"');expect(html).toContain('aria-live="polite"');expect(html).toContain('Color:');expect(html).toContain('suggestion stays on hold');expect(html).not.toContain('profileRevision');expect(html).not.toContain('checkId');});
 it('provides the complete local review instructions and disabled inactive controls',()=>{const html=renderToStaticMarkup(<NotebookPreferenceReview/>);expect(html).toContain('Review preference explanations');expect(html).toContain('Show simulated preference conflict');expect(html).toContain('Simulate a note edit');expect(html).toContain('End preference review');expect(html).toContain('does not connect to a server');expect(html.match(/disabled=""/g)).toHaveLength(2);expect(html).not.toContain('aria-label="Preference clarification"');});
});
