import {validatePrivateNotesTrialLedger} from './private-notes-trial-contract.ts';
declare const trialBrand:unique symbol;
export type PrivateNotesTrialExecution=Readonly<{approvalId:string;reservationId:string;[trialBrand]:true}>;
export type NoteExecutionOptions={simulation?:boolean;privateTrial?:PrivateNotesTrialExecution};
const permits=new WeakSet<object>();
/** Trusted server activation configuration only. These affirmative inputs must
 * represent separately recorded human approvals, never client JSON or ledger
 * contents alone. No route calls this function. Minting starts no network work.
 * The opaque capability binds internal protocol execution to one reserved trial;
 * it is not evidence that any real provider call or human approval occurred. */
export function createPrivateNotesTrialExecution(options:{financialApproved?:boolean;securityApproved?:boolean;ledger:unknown}):PrivateNotesTrialExecution{
 if(options.financialApproved!==true||options.securityApproved!==true)throw Error('Private notebook activation requires authorization.');
 const ledger=validatePrivateNotesTrialLedger(options.ledger);
 if(ledger.reservation?.state!=='reserved')throw Error('Private notebook activation requires a reservation.');
 const permit=Object.freeze({approvalId:ledger.approval.id,reservationId:ledger.reservation.id}) as PrivateNotesTrialExecution;
 permits.add(permit);return permit;
}
export function isPrivateNotesTrialExecution(value:unknown):value is PrivateNotesTrialExecution{return !!value&&typeof value==='object'&&permits.has(value);}
export function validNoteExecution(options:NoteExecutionOptions){return options.simulation===true?options.privateTrial===undefined:(options.simulation===undefined||options.simulation===false)&&isPrivateNotesTrialExecution(options.privateTrial);}
export function noteExecutionOptions(options:NoteExecutionOptions):NoteExecutionOptions{
 if(!validNoteExecution(options))throw Error('Notebook execution is disabled.');
 return Object.freeze(options.simulation===true?{simulation:true}:{privateTrial:options.privateTrial});
}
