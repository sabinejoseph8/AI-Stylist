import {FIELDS} from './notebook-state.ts';
import type {Field,CheckTicket,NotebookState} from './notebook-state.ts';
export type ClarificationReason='confirm-note'|'saved-uncertain'|'request-conflict'|'saved-conflict'|'unsupported-rule';
export type ClarificationIssue=Readonly<{field:Field;reason:ClarificationReason}>;
export type PreferenceClarification=Readonly<{version:1;profileRevision:number;notebookSession:number;notebookRevision:number;checkId:number;issues:readonly ClarificationIssue[]}>;
const reasons=['confirm-note','saved-uncertain','request-conflict','saved-conflict','unsupported-rule'];
/** Safe server-side explanation only. No profile values, rule identities,
 * proposed look text, save command, exception or authorization capability. */
export function preparePreferenceClarification(options:{simulation?:boolean;profileRevision:number;notebook:ReturnType<NotebookState['snapshot']>;ticket:CheckTicket;issues:readonly ClarificationIssue[]}):PreferenceClarification{
 if(options.simulation!==true)throw Error('Live preference clarification is disabled.');
 const {profileRevision,notebook,ticket}=options;
 if(!Number.isSafeInteger(profileRevision)||profileRevision<1||!Number.isSafeInteger(ticket.id)||ticket.id<1||ticket.session!==notebook.session||ticket.revision!==notebook.revision||notebook.gate?.ticket.id!==ticket.id||notebook.gate.state!=='held'||!Array.isArray(options.issues)||!options.issues.length||options.issues.length>64)throw Error('Preference clarification held.');
 const issues:ClarificationIssue[]=[],seen=new Set<string>();
 for(const issue of options.issues){
  if(!issue||typeof issue!=='object'||Object.keys(issue).length!==2||!Object.hasOwn(issue,'field')||!Object.hasOwn(issue,'reason')||!FIELDS.some(([field])=>field===issue.field)||!reasons.includes(issue.reason))throw Error('Preference clarification held.');
  const key=issue.field+':'+issue.reason;if(seen.has(key))continue;seen.add(key);issues.push(Object.freeze({field:issue.field,reason:issue.reason}));
 }
 return Object.freeze({version:1,profileRevision,notebookSession:notebook.session,notebookRevision:notebook.revision,checkId:ticket.id,issues:Object.freeze(issues)});
}
