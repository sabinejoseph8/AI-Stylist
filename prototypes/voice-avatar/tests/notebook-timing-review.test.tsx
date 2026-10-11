import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {NotebookTimingReview} from '../src/notebook-timing-review.tsx';
import {NoteTiming} from '../src/note-timing.ts';
describe('local timing review',()=>{
 it('makes the simulated boundary clear before samples exist',()=>{const html=renderToStaticMarkup(<NotebookTimingReview report={null}/>);expect(html).toContain('No local samples yet');expect(html).toContain('Live timing acceptance: not verified');expect(html).toContain('They do not verify real speech, phone performance or the two-second live target');});
 it('shows all outcomes without treating fast samples as live acceptance',()=>{let time=10;const timing=new NoteTiming(()=>time);const rendered=timing.begin(0)!;timing.extracted(rendered);time=20;timing.rendered(rendered);const failed=timing.begin(0)!;timing.finish(failed,'failed');const canceled=timing.begin(0)!;timing.finish(canceled,'canceled');timing.begin(0);const html=renderToStaticMarkup(<NotebookTimingReview report={timing.report()}/>);expect(html).toContain('<dt>Total samples</dt><dd>4</dd>');for(const label of ['Rendered','Failed','Canceled','Pending'])expect(html).toContain(`<dt>${label}</dt><dd>1</dd>`);expect(html).toContain('20 ms');expect(html).toContain('not verified');expect(html).not.toContain('transcript');});
 it('reports unmeasured p95 and bounded overflow without inventing latency',()=>{const timing=new NoteTiming();for(let i=0;i<257;i++)timing.begin(0);const html=renderToStaticMarkup(<NotebookTimingReview report={timing.report()}/>);expect(html).toContain('<dt>Overflow</dt><dd>1</dd>');expect(html).toContain('Not measured');expect(html).not.toContain('0 ms');});
});
