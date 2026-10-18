import {randomUUID} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
export const CONNECTION_PROBE_APPROVAL='cvi-connection-only-replacement-20261018' as const;
export const CONNECTION_PROBE_REPAIRED_APPROVAL='cvi-connection-only-repaired-20261018' as const;
export type ConnectionProbeApproval=typeof CONNECTION_PROBE_APPROVAL|typeof CONNECTION_PROBE_REPAIRED_APPROVAL;
export const CONNECTION_PROBE_REPLY='This is a connection test. I can hear you. No styling advice or notes are being created.';
export type ConnectionProbeRecord={version:1;purpose:'cvi-connection-only';approvalId:ConnectionProbeApproval;additionalCents:0;maxRooms:1;maxSeconds:300;reservation:null|{id:string;state:'reserved'|'held'|'ended';roomId:string|null}};
const fail=()=>Error('Connection probe admission requires review.');
const object=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const exact=(x:Record<string,unknown>,keys:string[])=>Object.keys(x).sort().join(',')===[...keys].sort().join(',');
const id=(x:unknown):x is string=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(x);
export function validateConnectionProbeRecord(x:unknown,approval:ConnectionProbeApproval=CONNECTION_PROBE_APPROVAL):ConnectionProbeRecord{
 if(!object(x)||!exact(x,['version','purpose','approvalId','additionalCents','maxRooms','maxSeconds','reservation'])||x.version!==1||x.purpose!=='cvi-connection-only'||x.approvalId!==approval||![CONNECTION_PROBE_APPROVAL,CONNECTION_PROBE_REPAIRED_APPROVAL].includes(approval)||x.additionalCents!==0||x.maxRooms!==1||x.maxSeconds!==300)throw fail();
 const r=x.reservation;
 if(r!==null&&(!object(r)||!exact(r,['id','state','roomId'])||!id(r.id)||!['reserved','held','ended'].includes(String(r.state))||!(r.roomId===null||id(r.roomId))||(r.state==='ended'&&r.roomId===null)))throw fail();
 return structuredClone(x) as ConnectionProbeRecord;
}
export function validateConnectionProbeTransition(before:unknown,after:unknown,approval:ConnectionProbeApproval=CONNECTION_PROBE_APPROVAL){
 const a=validateConnectionProbeRecord(before,approval),b=validateConnectionProbeRecord(after,approval);
 if(!isDeepStrictEqual({...a,reservation:null},{...b,reservation:null}))throw fail();
 const r=a.reservation,s=b.reservation;
 if(!s)throw fail();
 if(!r){if(s.state!=='reserved'||s.roomId!==null)throw fail();}
 else{
  if(r.id!==s.id||r.state!=='reserved')throw fail();
  if(r.roomId!==null&&r.roomId!==s.roomId)throw fail();
  if(s.state==='reserved'&&(r.roomId!==null||s.roomId===null))throw fail();
  if(s.state==='ended'&&(r.roomId===null||s.roomId!==r.roomId))throw fail();
 }
 return b;
}
export type ConnectionProbePersistence={read:()=>Promise<unknown>;compareAndSwap:(before:ConnectionProbeRecord,after:ConnectionProbeRecord)=>Promise<boolean>};
/** No seed/reset/refund. The durable acknowledgment precedes room creation. */
export class ConnectionProbeAdmission{
 private held=false;
 private readonly store:ConnectionProbePersistence;
 private readonly approval:ConnectionProbeApproval;
 constructor(store:ConnectionProbePersistence,approval:ConnectionProbeApproval=CONNECTION_PROBE_APPROVAL){this.store=store;this.approval=approval;}
 private async change(update:(r:ConnectionProbeRecord)=>void){
  if(this.held)throw fail();
  try{const before=validateConnectionProbeRecord(await this.store.read(),this.approval),after=structuredClone(before);update(after);validateConnectionProbeTransition(before,after,this.approval);if(await this.store.compareAndSwap(before,after)!==true)throw fail();}
  catch{this.held=true;throw fail();}
 }
 async reserve(){const reservationId=randomUUID();await this.change(r=>{if(r.reservation!==null)throw fail();r.reservation={id:reservationId,state:'reserved',roomId:null};});return reservationId;}
 async attachRoom(reservationId:string,roomId:string){await this.change(r=>{if(!r.reservation||r.reservation.id!==reservationId)throw fail();r.reservation.roomId=roomId;});}
 async finish(reservationId:string,outcome:'held'|'ended'){await this.change(r=>{if(!r.reservation||r.reservation.id!==reservationId)throw fail();r.reservation.state=outcome;});}
}
/** Authenticated HTTP adapter must bound/decode input before invoking this. */
export function connectionProbeSse(){
 const chunk=(delta:unknown,finish_reason:null|'stop')=>'data: '+JSON.stringify({id:'connection-probe',object:'chat.completion.chunk',created:0,model:'connection-probe-fixed-v1',choices:[{index:0,delta,finish_reason}]})+'\n\n';
 return chunk({role:'assistant'},null)+chunk({content:CONNECTION_PROBE_REPLY},null)+chunk({},'stop')+'data: [DONE]\n\n';
}
