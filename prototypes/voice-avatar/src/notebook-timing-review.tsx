import React from 'react';
import type {NoteTiming} from './note-timing.ts';
type Report=ReturnType<NoteTiming['report']>;
/** Local metadata only. Never infer live latency acceptance from a rehearsal. */
export function NotebookTimingReview({report}:{report:Report|null}){
 return <details><summary>Local timing diagnostics</summary>
 <p>These measurements use scripted events on this computer. They do not verify real speech, phone performance or the two-second live target. Only updates acknowledged after display count as rendered. Failures, cancellations and unfinished updates stay visible.</p>
 {report?<dl><dt>Total samples</dt><dd>{report.total}</dd><dt>Rendered</dt><dd>{report.rendered}</dd><dt>Failed</dt><dd>{report.failed}</dd><dt>Canceled</dt><dd>{report.canceled}</dd><dt>Pending</dt><dd>{report.pending}</dd><dt>Overflow</dt><dd>{report.overflow}</dd><dt>Local input-to-render p95</dt><dd>{report.p95Ms===null?'Not measured':`${Math.round(report.p95Ms)} ms`}</dd></dl>:<p>No local samples yet.</p>}
 <p>Live timing acceptance: not verified. These temporary measurements clear when the rehearsal ends.</p>
 </details>;
}
