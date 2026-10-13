const PURPOSE='notes-only-private-trial' as const;
type Reservation={id:string;state:'reserved'|'transport-closed'|'held'};
export type PrivateNotesTrialLedger={version:1;purpose:typeof PURPOSE;approval:{id:string;cents:200;maxSeconds:85;maxTurns:2;maxExtractions:64;maxInputTokens:1000000;maxOutputTokens:2048};reservation:Reservation|null};
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
