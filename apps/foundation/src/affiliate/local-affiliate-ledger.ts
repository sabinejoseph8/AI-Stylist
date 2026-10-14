export type SyntheticTransactionStatus='pending'|'confirmed'|'reversed';
export type SyntheticTransactionEvent=Readonly<{simulation:true;eventId:string;programId:string;transactionId:string;revision:number;status:SyntheticTransactionStatus;commissionCents:number;currency:'USD'}>;
export type SyntheticClick=Readonly<{simulation:true;id:string}>;
export type SyntheticResult='applied'|'duplicate'|'conflict'|'stale'|'invalid'|'invalid-transition'|'limit'|'unavailable';
const id=(value:unknown):value is string=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(value);
const exact=(value:unknown,keys:readonly string[]):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
type Row=Readonly<{transactionId:string;revision:number;status:SyntheticTransactionStatus;commissionCents:number}>;
/** Generic simulated accounting harness, not a provider webhook implementation.
 * No signatures, customer IDs, order payloads, URL, rates, network or persistence.
 * Revision/transition rules here require actual provider mapping before use. */
export class LocalAffiliateLedger {
 private readonly programId:string;
 private clicks=new Set<string>();
 private events=new Map<string,string>();
 private transactions=new Map<string,Row>();
 private closed=false;
 private incomplete=false;
 private hold(result: 'conflict'|'limit'|'invalid-transition'):SyntheticResult{this.incomplete=true;return result;}
 constructor(options:{simulation:true;programId:string}){if(options?.simulation!==true||!id(options.programId))throw Error('Only simulated attribution is enabled.');this.programId=options.programId;}
 recordSyntheticClick(value:SyntheticClick):SyntheticResult{
  if(this.closed)return 'unavailable';
  if(!exact(value,['simulation','id'])||value.simulation!==true||!id(value.id))return 'invalid';
  if(this.clicks.has(value.id))return 'duplicate';if(this.clicks.size>=128)return this.hold('limit');this.clicks.add(value.id);return 'applied';
 }
 applySyntheticEvent(value:SyntheticTransactionEvent):SyntheticResult{
  if(this.closed)return 'unavailable';
  if(!exact(value,['simulation','eventId','programId','transactionId','revision','status','commissionCents','currency'])||value.simulation!==true||value.programId!==this.programId||!id(value.eventId)||!id(value.transactionId)||typeof value.revision!=='number'||!Number.isSafeInteger(value.revision)||value.revision<0||!['pending','confirmed','reversed'].includes(value.status as string)||typeof value.commissionCents!=='number'||!Number.isSafeInteger(value.commissionCents)||value.commissionCents<0||value.commissionCents>1_000_000||value.currency!=='USD')return 'invalid';
  // Canonical fixed-field fingerprint, independent of property insertion order.
  const fingerprint=JSON.stringify([value.programId,value.transactionId,value.revision,value.status,value.commissionCents,value.currency]);
  const seen=this.events.get(value.eventId);if(seen!==undefined)return seen===fingerprint?'duplicate':this.hold('conflict');
  const current=this.transactions.get(value.transactionId);
  if(current){
   if(value.revision<current.revision)return 'stale';
   if(value.revision===current.revision)return value.status===current.status&&value.commissionCents===current.commissionCents?'duplicate':this.hold('conflict');
   if(current.status==='reversed'||current.status==='confirmed'&&value.status==='pending')return this.hold('invalid-transition');
  }
  if(this.events.size>=256||!current&&this.transactions.size>=128)return this.hold('limit');
  this.events.set(value.eventId,fingerprint);
  this.transactions.set(value.transactionId,Object.freeze({transactionId:value.transactionId,revision:value.revision,status:value.status as SyntheticTransactionStatus,commissionCents:value.commissionCents}));return 'applied';
 }
 snapshot(){
  let simulatedPendingCents=0,simulatedConfirmedCents=0,simulatedReversedCents=0;
  for(const row of this.transactions.values())if(row.status==='pending')simulatedPendingCents+=row.commissionCents;else if(row.status==='confirmed')simulatedConfirmedCents+=row.commissionCents;else simulatedReversedCents+=row.commissionCents;
  return Object.freeze({simulation:true as const,providerVerified:false as const,actualEarningsReported:false as const,closed:this.closed,incomplete:this.incomplete,clicks:this.clicks.size,simulatedPendingCents:this.incomplete?null:simulatedPendingCents,simulatedConfirmedCents:this.incomplete?null:simulatedConfirmedCents,simulatedReversedCents:this.incomplete?null:simulatedReversedCents,transactions:Object.freeze([...this.transactions.values()].map(row=>Object.freeze({...row,status:`simulated-${row.status}` as const})))});
 }
 /** Retire this local fixture owner. Late events cannot recreate cleared state. */
 clear(){this.closed=true;this.incomplete=false;this.clicks.clear();this.events.clear();this.transactions.clear();}
}
