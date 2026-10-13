import {randomUUID} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {validatePrivateNotesTrialLedger} from './private-notes-trial-contract.ts';
import type {PrivateNotesTrialLedger} from './private-notes-trial-contract.ts';
export {validatePrivateNotesTrialLedger} from './private-notes-trial-contract.ts';
export type {PrivateNotesTrialLedger} from './private-notes-trial-contract.ts';
export type PrivateNotesTrialPersistence={read:()=>Promise<unknown>;compareAndSwap:(before:PrivateNotesTrialLedger,after:PrivateNotesTrialLedger)=>Promise<boolean>};
const unavailable=()=>Error('Private notebook allowance requires review.');
export function validatePrivateNotesTrialTransition(before:unknown,after:unknown){
 const a=validatePrivateNotesTrialLedger(before),b=validatePrivateNotesTrialLedger(after);
 if(!isDeepStrictEqual(a.approval,b.approval))throw unavailable();
 if(a.reservation===null){if(!b.reservation||b.reservation.state!=='reserved')throw unavailable();}
 else if(!b.reservation||a.reservation.id!==b.reservation.id||a.reservation.state!=='reserved'||!['held','transport-closed'].includes(b.reservation.state))throw unavailable();
 return b;
}
/** Dormant local preparation. The activation owner must separately establish
 * human financial/security approval and supply a reviewed durable store.
 * Every reservation consumes the one start forever, even after transport close.
 * No closeVerified/refund/retry method exists. */
export class PrivateNotesTrialLedgerOwner{
 private held=false;
 private readonly persistence:PrivateNotesTrialPersistence;
 constructor(persistence:PrivateNotesTrialPersistence){this.persistence=persistence;}
 private async change(update:(value:PrivateNotesTrialLedger)=>void){
  if(this.held)throw unavailable();
  try{const before=validatePrivateNotesTrialLedger(await this.persistence.read()),after=structuredClone(before);update(after);validatePrivateNotesTrialTransition(before,after);if(await this.persistence.compareAndSwap(before,after)!==true)throw unavailable();}
  catch{this.held=true;throw unavailable();}
 }
 async reserve():Promise<string>{const reservationId=randomUUID();await this.change(v=>{if(v.reservation!==null)throw unavailable();v.reservation={id:reservationId,state:'reserved'};});return reservationId;}
 async recordOutcome(reservationId:string,state:'transport-closed'|'held'){await this.change(v=>{if(!v.reservation||v.reservation.id!==reservationId)throw unavailable();v.reservation.state=state;});}
 status(){return Object.freeze({held:this.held,activationEnabled:false as const,remoteCleanupVerified:false as const});}
}
