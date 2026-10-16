import type {createLocalCviNotebookContext} from './local-cvi-notebook-context.ts';
import type {SessionSnapshot} from '../session/styling-session.ts';
import type {ConsultationViewPort} from '../session/local-consultation-view.ts';
import {FIELDS} from '../../../../packages/style-contracts/src/index.ts';
import type {Field} from '../../../../packages/style-contracts/src/index.ts';
import type {CviField} from './local-cvi-styling.ts';
/** An observed context version, never a credential or release permission. */
export type LocalConsultationVersion=Readonly<{epoch:number;revision:number;nativeRevision:number;inputRevision:number}>;
export type LocalConsultationEnvelope=Readonly<{notes:SessionSnapshot;version:LocalConsultationVersion}>;
export type LocalCviViewPort=ConsultationViewPort&Readonly<{contextSnapshot(signal:AbortSignal):Promise<LocalConsultationVersion|null>;consultationSnapshot(signal:AbortSignal):Promise<LocalConsultationEnvelope|null>}>;
const mapping:Readonly<Record<Field,CviField>>=Object.freeze({occasion:'occasion',season:'timing',color:'color',style:'coverage',budget:'budget',lookType:'lookType',wardrobe:'wardrobe'});
/** Explicit local rehearsal composition. Identity is captured by the host,
 * never supplied through a browser edit or snapshot command. No listener. */
export function createLocalCviViewPort(context:ReturnType<typeof createLocalCviNotebookContext>,applicationRequest:Request):LocalCviViewPort{
 const request=new Request(applicationRequest),read=(signal:AbortSignal)=>context.snapshot(new Request(request),signal);
 const coherent=async(signal:AbortSignal):Promise<LocalConsultationEnvelope|null>=>{
   if(signal.aborted)return null;
   try{
    const notes=await read(signal);if(signal.aborted||!notes||notes.state!=='active')return null;
    // No await between the authoritative flow read, comparison and projection.
    // A field edit or epoch reset in between the admissions cannot pair old
    // notes with a new candidate version. Input/native changes are retained
    // even if the seven note values and their revision did not change.
    const current=context.flow.snapshot(),version=current.context;
    if(!version||Object.keys(version).sort().join(',')!=='epoch,inputRevision,nativeRevision'||[version.epoch,version.nativeRevision,version.inputRevision,current.revision].some(v=>!Number.isSafeInteger(v)||v<0)||version.epoch<1||version.epoch!==notes.epoch||current.revision!==notes.revision||FIELDS.some(([field])=>current.notes[mapping[field]].text!==notes.notes[field].value||current.notes[mapping[field]].confirmed!==(notes.notes[field].status==='confirmed')))return null;
    return Object.freeze({notes,version:Object.freeze({epoch:version.epoch,revision:current.revision,nativeRevision:version.nativeRevision,inputRevision:version.inputRevision})});
   }catch{return null;}
 };
 return Object.freeze({snapshot:read,edit:(command:unknown,signal:AbortSignal)=>context.edit(new Request(request),command,signal),clear:(signal:AbortSignal)=>context.clear(new Request(request),signal),end:(signal:AbortSignal)=>context.end(new Request(request),signal),onReset:(listener:()=>void)=>context.onReset(listener),consultationSnapshot:coherent,contextSnapshot:async(signal:AbortSignal)=>(await coherent(signal))?.version??null});
}
