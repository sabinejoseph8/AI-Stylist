import {FIELDS} from '../../../../packages/style-contracts/src/index.ts';
import type {Field} from '../../../../packages/style-contracts/src/index.ts';
import type {StylingSession} from './styling-session.ts';

export type Proposal=Readonly<{field:Field;value:string}>;
export type ProposalTurn=Readonly<{itemId:string;epoch:number;signal:AbortSignal}>;
type PendingTurn={handle:ProposalTurn;inputRevision:number;closed:boolean;expected:Record<Field,number>};
export type ProposalResult=Readonly<{status:'accepted'|'stale'|'invalid'|'limit';applied:readonly Field[];skipped:readonly Field[]}>;
const result=(status:ProposalResult['status'],applied:Field[]=[],skipped:Field[]=[]):ProposalResult=>Object.freeze({status,applied:Object.freeze(applied),skipped:Object.freeze(skipped)});

/** Internal local rehearsal contract for already-structured proposals. This
 * does not parse transcripts, call an extractor or implement provider events.
 * A field's baseline is captured when input starts, before extraction can wait.
 * Only revisions produced by this turn may advance that baseline. */
export class NotebookProposalStream {
 private turns=new Map<string,PendingTurn>();
 private epoch=0;
 private operation=0;
 private current:ProposalTurn|null=null;
 private processing=false;
 private admitting=false;
 private readonly session:StylingSession;
 private readonly owner:string;
 constructor(session:StylingSession,owner:string){this.session=session;this.owner=owner;}
 begin(itemId:string):ProposalTurn|null{
  if(this.admitting)return null;
  this.admitting=true;
  try {
  const ticket=this.session.ticket(this.owner),snapshot=this.session.snapshot(this.owner);
  if(!ticket||!snapshot)return null;
  if(ticket.epoch!==this.epoch){this.turns.clear();this.epoch=ticket.epoch;}
  if(typeof itemId!=='string'||! /^[A-Za-z0-9_-]{1,80}$/.test(itemId)||this.turns.has(itemId)||this.turns.size>=64)return null;
  // A newer input item supersedes older unfinished extraction work.
  for(const turn of this.turns.values())turn.closed=true;
  this.current=null;
  if(!this.session.customerInput(this.owner)||ticket.signal.aborted)return null;
  const handle=Object.freeze({itemId,epoch:ticket.epoch,signal:ticket.signal});
  this.current=handle;
  this.turns.set(itemId,{handle,inputRevision:-1,closed:false,expected:Object.fromEntries(FIELDS.map(([field])=>[field,snapshot.notes[field].revision])) as Record<Field,number>});
  return handle;
  } finally {this.admitting=false;}
 }
 accept(handle:ProposalTurn,inputRevision:number,proposals:readonly Proposal[],final=false):ProposalResult{
  const snapshot=this.session.snapshot(this.owner);
  const turn=handle&&this.turns.get(handle.itemId);
  if(!snapshot||snapshot.state!=='active'||!turn||turn.handle!==handle||handle.signal.aborted||snapshot.epoch!==handle.epoch||turn.closed||this.current!==handle||this.processing)return result('stale');
  if(!Number.isSafeInteger(inputRevision)||inputRevision<0||!Array.isArray(proposals)||proposals.length>FIELDS.length||typeof final!=='boolean')return result('invalid');
  const entries=proposals as readonly Proposal[];
  const seen=new Set<Field>();
  for(const proposal of entries){
   if(!proposal||!FIELDS.some(([field])=>field===proposal.field)||seen.has(proposal.field)||typeof proposal.value!=='string'||!proposal.value.trim()||proposal.value.length>160)return result('invalid');
   seen.add(proposal.field);
  }
  if(inputRevision<=turn.inputRevision)return result('stale');
  turn.inputRevision=inputRevision;turn.closed=final;
  const applied:Field[]=[],skipped:Field[]=[];
  this.processing=true;
  try {
  for(const proposal of entries){
   const current=this.session.snapshot(this.owner);
   if(!current||current.state!=='active'||handle.signal.aborted||current.epoch!==handle.epoch||this.current!==handle){skipped.push(proposal.field);continue;}
   const note=current.notes[proposal.field];
   if(note.revision!==turn.expected[proposal.field]){skipped.push(proposal.field);continue;}
   const outcome=this.session.update(this.owner,{id:'proposal_'+(++this.operation),epoch:handle.epoch,field:proposal.field,baseRevision:note.revision,sequence:note.sequence+1,value:proposal.value,status:'tentative',origin:'text',activity:'derived'});
   if(outcome==='applied'){turn.expected[proposal.field]=note.revision+1;applied.push(proposal.field);}
   else if(outcome==='limit')return result('limit',applied,[...skipped,proposal.field]);
   else skipped.push(proposal.field);
  }
  return result('accepted',applied,skipped);
  } finally {this.processing=false;}
 }
}
