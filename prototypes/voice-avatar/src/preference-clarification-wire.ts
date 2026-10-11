import {FIELDS} from './notebook-state.ts';
import type {ClarificationIssue,PreferenceClarification} from './preference-clarification.ts';
import {decodeNoteUpdate} from './note-update-wire.ts';
import type {NoteUpdate} from './note-update-wire.ts';
const object=(v:unknown):v is Record<string,unknown>=>Boolean(v)&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(key=>Object.hasOwn(v,key));
const positive=(v:unknown):v is number=>Number.isSafeInteger(v)&&(v as number)>0;
const identity=(v:unknown):v is string=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(v);
const reasons=['confirm-note','saved-uncertain','request-conflict','saved-conflict','unsupported-rule'];
export type ClarificationMessage=Readonly<{version:1;type:'clarification';sessionId:string;sequence:number;record:PreferenceClarification|null}>;
/** Strict synthetic wire preparation only. A clarification never grants action authority. */
export function decodeClarificationMessage(value:unknown):ClarificationMessage{
 const fail=()=>{throw Error('Clarification update held.');};
 if(!object(value)||!exact(value,['version','type','sessionId','sequence','record'])||value.version!==1||value.type!=='clarification'||!identity(value.sessionId)||!positive(value.sequence))return fail();
 let record:PreferenceClarification|null=null;
 if(value.record!==null){
  const v=value.record;
  if(!object(v)||!exact(v,['version','profileRevision','notebookSession','notebookRevision','checkId','issues'])||v.version!==1||!positive(v.profileRevision)||!positive(v.notebookSession)||!Number.isSafeInteger(v.notebookRevision)||(v.notebookRevision as number)<0||!positive(v.checkId)||!Array.isArray(v.issues)||!v.issues.length||v.issues.length>35)return fail();
  const issues:ClarificationIssue[]=[],seen=new Set<string>();
  for(const issue of v.issues){
   if(!object(issue)||!exact(issue,['field','reason'])||!FIELDS.some(([field])=>field===issue.field)||!reasons.includes(issue.reason as string))return fail();
   const key=String(issue.field)+':'+String(issue.reason);if(seen.has(key))return fail();seen.add(key);issues.push(Object.freeze({field:issue.field,reason:issue.reason}) as ClarificationIssue);
  }
  record=Object.freeze({version:1,profileRevision:v.profileRevision,notebookSession:v.notebookSession,notebookRevision:v.notebookRevision as number,checkId:v.checkId,issues:Object.freeze(issues)});
 }
 return Object.freeze({version:1,type:'clarification',sessionId:value.sessionId,sequence:value.sequence,record});
}
export class SimulatedClarificationClient{
 private current:NoteUpdate|null=null;
 private record:PreferenceClarification|null=null;
 private sequence=0;
 private profileRevision=0;
 private checkId=0;
 private ended=false;
 private blocked=false;
 constructor(options:{simulation?:boolean}){if(options.simulation!==true)throw Error('Live clarification client is disabled.');}
 notes(value:unknown):boolean{
  if(this.ended)return false;
  let next:NoteUpdate;try{next=decodeNoteUpdate(value);}catch{this.record=null;return false;}
  if(this.current&&(next.sessionId!==this.current.sessionId||next.notebookSession!==this.current.notebookSession||next.sequence<=this.current.sequence||next.revision<this.current.revision)){this.record=null;return false;}
  if(!this.current||next.revision!==this.current.revision){this.record=null;this.blocked=false;}
  this.current=next;return true;
 }
 accept(value:unknown):boolean{
  if(this.ended||!this.current)return false;
  let message:ClarificationMessage;try{message=decodeClarificationMessage(value);}catch{this.record=null;return false;}
  if(message.sessionId!==this.current.sessionId||message.sequence<=this.sequence){this.record=null;return false;}
  const record=message.record;
  if(this.blocked&&record)return false;
  if(record&&(record.notebookSession!==this.current.notebookSession||record.notebookRevision!==this.current.revision||record.profileRevision<this.profileRevision||record.checkId<this.checkId)){this.record=null;return false;}
  this.sequence=message.sequence;this.record=record;
  if(record){this.profileRevision=record.profileRevision;this.checkId=record.checkId;}
  return true;
 }
 clear(){this.record=null;this.blocked=true;}
 stop(){this.ended=true;this.current=null;this.record=null;}
 snapshot(){return this.record;}
}
