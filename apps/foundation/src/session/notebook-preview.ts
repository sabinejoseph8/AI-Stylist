import {NotebookProposalStream} from './proposal-stream.ts';
import {StylingSession} from './styling-session.ts';
import type {SessionTicket} from './styling-session.ts';
import type {Field} from '../../../../packages/style-contracts/src/index.ts';
export const PREVIEW_OWNER='local_sample_owner';
export const PREVIEW_POLICY=Object.freeze({idleMs:30*60*1000,disconnectMs:5*60*1000,warningMs:60*1000});
export type EditDraft=Readonly<{field:Field;epoch:number;baseRevision:number;value:string}>;
/** Explicit local rehearsal values, not a production retention decision. */
export function createNotebookPreview(clock:()=>number=Date.now,saved?:Partial<Record<Field,string>>){return new StylingSession({simulation:true,owner:PREVIEW_OWNER,clock,policy:PREVIEW_POLICY,saved});}
export function previewValue(field:Field,value:string){
 const trimmed=value.trim();
 // An amount alone never establishes currency, maximum/target/range or scope.
 const clearBudget=/^USD \d+(?:\.\d{1,2})? (maximum|target) \(items only\)$/.test(trimmed);
 return {value:trimmed,status:field==='budget'&&!clearBudget?'tentative' as const:'confirmed' as const};
}
export class NotebookPreviewController {
 private operation=0;
 readonly session:StylingSession;
 readonly proposals:NotebookProposalStream;
 constructor(session:StylingSession){this.session=session;this.proposals=new NotebookProposalStream(session,PREVIEW_OWNER);}
 beginEdit(field:Field):EditDraft|null{const snap=this.session.snapshot(PREVIEW_OWNER);return snap?.state==='active'?Object.freeze({field,epoch:snap.epoch,baseRevision:snap.notes[field].revision,value:snap.notes[field].value}):null;}
 save(draft:EditDraft,value:string){
  const normalized=previewValue(draft.field,value);
  return this.session.update(PREVIEW_OWNER,{id:'touch_'+(++this.operation),epoch:draft.epoch,field:draft.field,baseRevision:draft.baseRevision,sequence:(this.session.snapshot(PREVIEW_OWNER)?.notes[draft.field].sequence??-1)+1,...normalized,origin:'touch'});
 }
 propose(ticket:SessionTicket,field:Field,value:string,confirmed=false,origin:'text'|'speech'='text'){
  if(!this.session.isCurrent(PREVIEW_OWNER,ticket))return 'stale';
  const snap=this.session.snapshot(PREVIEW_OWNER)!;
  return this.session.update(PREVIEW_OWNER,{id:'sample_'+(++this.operation),epoch:ticket.epoch,field,baseRevision:snap.notes[field].revision,sequence:snap.notes[field].sequence+1,value,status:confirmed?previewValue(field,value).status:'tentative',origin});
 }
 confirm(field:Field){const draft=this.beginEdit(field);return draft?this.save(draft,draft.value):'unavailable';}
 clear(){return this.session.clear(PREVIEW_OWNER);}
 end(){return this.session.end(PREVIEW_OWNER);}
}
