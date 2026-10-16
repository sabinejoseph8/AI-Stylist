import type {createLocalCviNotebookContext} from './local-cvi-notebook-context.ts';
import type {ConsultationViewPort} from '../session/local-consultation-view.ts';
/** Explicit local rehearsal composition. Identity is captured by the host,
 * never supplied through a browser edit or snapshot command. No listener. */
export function createLocalCviViewPort(context:ReturnType<typeof createLocalCviNotebookContext>,applicationRequest:Request):ConsultationViewPort{
 const request=new Request(applicationRequest);
 return Object.freeze({snapshot:(signal:AbortSignal)=>context.snapshot(new Request(request),signal),edit:(command:unknown,signal:AbortSignal)=>context.edit(new Request(request),command,signal),clear:(signal:AbortSignal)=>context.clear(new Request(request),signal),end:(signal:AbortSignal)=>context.end(new Request(request),signal),onReset:(listener:()=>void)=>context.onReset(listener)});
}
