import {randomUUID} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
const PURPOSE='notes-only-private-trial' as const;
type Reservation={id:string;state:'reserved'|'transport-closed'|'held'};
export type PrivateNotesTrialLedger={version:1;purpose:typeof PURPOSE;approval:{id:string;cents:200;maxSeconds:85;maxTurns:2;maxExtractions:64;maxInputTokens:1000000;maxOutputTokens:2048};reservation:Reservation|null};
export type PrivateNotesTrialPersistence={read:()=>Promise<unknown>;compareAndSwap:(before:PrivateNotesTrialLedger,after:PrivateNotesTrialLedger)=>Promise<boolean>};
const unavailable=()=>Error('Private notebook allowance requires review.');
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).sort().join(',')===keys.sort().join(',');
const id=(v:unknown)=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(v);
/** Contract only: a matching record does not establish human approval.
 * No initializer, hosted storage, approval amendment or media content. */
export function validatePrivateNotesTrialLedger(value:unknown):PrivateNotesTrialLedger{
 try{
  if(!object(value)||!exact(value,['version','purpose','approval','reservation'])||value.version!==1||value.purpose!==PURPOSE)throw unavailable();
  const a=value.approval,r=value.reservation;
  if(!object(a)||!exact(a,['id','cents','maxSeconds','maxTurns','maxExtractions','maxInputTokens','maxOutputTokens'])||!id(a.id)||a.cents!==200||a.maxSeconds!==85||a.maxTurns!==2||a.maxExtractions!==64||a.maxInputTokens!==1000000||a.maxOutputTokens!==2048)throw unavailable();
  if(r!==null&&(!object(r)||!exact(r,['id','state'])||!id(r.id)||typeof r.state!=='string'||!['reserved','transport-closed','held'].includes(r.state)))throw unavailable();
  return structuredClone(value) as PrivateNotesTrialLedger;
 }catch{throw unavailable();}
}
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
 async reserve(){const reservationId=randomUUID();await this.change(v=>{if(v.reservation!==null)throw unavailable();v.reservation={id:reservationId,state:'reserved'};});return reservationId;}
 async recordOutcome(reservationId:string,state:'transport-closed'|'held'){await this.change(v=>{if(!v.reservation||v.reservation.id!==reservationId)throw unavailable();v.reservation.state=state;});}
 status(){return Object.freeze({held:this.held,activationEnabled:false as const,remoteCleanupVerified:false as const});}
}
