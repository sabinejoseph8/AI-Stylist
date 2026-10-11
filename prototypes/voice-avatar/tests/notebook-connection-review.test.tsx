import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {NotebookConnectionReview} from '../src/notebook-connection-review.tsx';
describe('connection review instructions',()=>{
 it('shows the complete seven-step script before starting and disables inactive controls',()=>{const html=renderToStaticMarkup(<NotebookConnectionReview/>);expect(html.match(/<li>/g)).toHaveLength(7);expect(html).toContain('Show connection preference explanation');expect(html).toContain('The explanation should disappear');expect(html).toContain('no saved preference is changed');expect(html).toContain('No microphone, camera, network connection or paid service is started');expect(html.match(/disabled=""/g)).toHaveLength(4);expect(html).not.toContain('aria-label="Preference clarification"');});
});
