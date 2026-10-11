import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {NotebookConnectionReview} from '../src/notebook-connection-review.tsx';
describe('connection review instructions',()=>{
 it('shows the complete seven-step script before starting and disables inactive controls',()=>{const html=renderToStaticMarkup(<NotebookConnectionReview/>);expect(html.match(/<li>/g)).toHaveLength(7);expect(html).toContain('Show connection preference explanation');expect(html).toContain('Show multiple preference issues');expect(html).toContain('Touch editing checks');expect(html).toContain('Escape cancels editing and restores focus');expect(html).toContain('Simulate changed saved requirements');expect(html).toContain('Budget should remain Not specified');expect(html).toContain('The explanation should disappear');expect(html).toContain('no saved preference is changed');expect(html).toContain('No microphone, camera, network connection or paid service is started');expect(html.match(/disabled=""/g)).toHaveLength(6);expect(html).not.toContain('aria-label="Preference clarification"');});
});
