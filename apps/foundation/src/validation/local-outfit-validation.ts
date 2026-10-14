import type {DraftOutfit} from '../outfits/local-draft-outfit.ts';
/** Synthetic independent-check rehearsal. Not customer authority or a release port.
 * The caller supplies current normalized fixtures, including every relevant revision.
 * No candidate assertion, model score or cached result can bypass the hard checks. */
export type ValidationFact = Readonly<{value:string|null;checkedAt:number}>;
export type ValidationPiece = Readonly<{id:string;owned:boolean;sourceId:string|null;productId:string|null;variantId:string|null;priceCents:number|null;checkedAt:number;facts:Readonly<Record<string,ValidationFact>>}>;
export type Requirement = Readonly<{id:string;scope:'saved'|'session';confirmed:boolean;pieceId:string|null;attribute:string;operator:'is'|'is-not';value:string}>;
export type SessionException = Readonly<{requirementId:string;sessionId:string;confirmed:boolean;visible:boolean}>;
export type ValidationFixture = Readonly<{
 synthetic:true;sessionId:string;active:boolean;revision:number;profileRevision:number;referenceRevision:number;feedbackRevision:number;
 candidateId:string;candidateRevision:number;pieces:readonly ValidationPiece[];requirements:readonly Requirement[];exceptions:readonly SessionException[];
 requiredPieceIds:readonly string[];budget:Readonly<{cents:number;currency:'USD';basis:'items'|'total'}>|null;
 shippingCents:number|null;taxCents:number|null;
}>;
export type HardReason='invalid-fixture'|'missing-piece'|'requirement-conflict'|'requirement-unknown'|'fact-stale'|'price-unknown'|'product-unverified'|'product-unavailable'|'budget-unknown'|'over-budget';
export type HardCheck=Readonly<{status:'pass'|'unknown'|'blocked';reasons:readonly HardReason[];knownSubtotalCents:number|null}>;
export type SemanticOutcome='pass'|'unknown'|'blocked'|'refused'|'timeout';
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join('|')===[...keys].sort().join('|');
const id=(v:unknown):v is string=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(v);
const value=(v:unknown):v is string=>typeof v==='string'&&v.trim()===v&&v.length>0&&v.length<=120;
const integer=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const money=(v:unknown)=>integer(v)&&Number(v)<=100_000_000;
function valid(f:ValidationFixture):boolean {
 if(!exact(f,['synthetic','sessionId','active','revision','profileRevision','referenceRevision','feedbackRevision','candidateId','candidateRevision','pieces','requirements','exceptions','requiredPieceIds','budget','shippingCents','taxCents'])||f.synthetic!==true||!id(f.sessionId)||f.active!==true||!id(f.candidateId))return false;
 if(![f.revision,f.profileRevision,f.referenceRevision,f.feedbackRevision,f.candidateRevision].every(integer))return false;
 if(!Array.isArray(f.pieces)||!f.pieces.length||f.pieces.length>20||new Set(f.pieces.map(p=>p?.id)).size!==f.pieces.length)return false;
 for(const p of f.pieces){
  if(!exact(p,['id','owned','sourceId','productId','variantId','priceCents','checkedAt','facts'])||!id(p.id)||typeof p.owned!=='boolean'||!integer(p.checkedAt)||!(p.priceCents===null||money(p.priceCents))||!p.facts||typeof p.facts!=='object'||Array.isArray(p.facts)||Object.keys(p.facts).length>30)return false;
  if(![p.sourceId,p.productId,p.variantId].every(v=>p.owned?v===null:id(v)))return false;
  for(const [key,fact] of Object.entries(p.facts))if(!id(key)||!exact(fact,['value','checkedAt'])||!(fact.value===null||value(fact.value))||!integer(fact.checkedAt))return false;
 }
 if(!Array.isArray(f.requirements)||f.requirements.length>100||new Set(f.requirements.map(r=>r?.id)).size!==f.requirements.length)return false;
 for(const r of f.requirements)if(!exact(r,['id','scope','confirmed','pieceId','attribute','operator','value'])||!id(r.id)||!['saved','session'].includes(String(r.scope))||typeof r.confirmed!=='boolean'||!(r.pieceId===null||id(r.pieceId))||!id(r.attribute)||!['is','is-not'].includes(String(r.operator))||!value(r.value))return false;
 if(!Array.isArray(f.exceptions)||f.exceptions.length>100||new Set(f.exceptions.map(e=>e?.requirementId)).size!==f.exceptions.length)return false;
 for(const e of f.exceptions)if(!exact(e,['requirementId','sessionId','confirmed','visible'])||!id(e.requirementId)||!id(e.sessionId)||typeof e.confirmed!=='boolean'||typeof e.visible!=='boolean'||!f.requirements.some(r=>r.id===e.requirementId&&r.scope==='saved'&&r.confirmed))return false;
 if(!Array.isArray(f.requiredPieceIds)||f.requiredPieceIds.length>20||!f.requiredPieceIds.every(id)||new Set(f.requiredPieceIds).size!==f.requiredPieceIds.length)return false;
 if(f.budget!==null&&(!exact(f.budget,['cents','currency','basis'])||!money(f.budget.cents)||f.budget.currency!=='USD'||!['items','total'].includes(String(f.budget.basis))))return false;
 return [f.shippingCents,f.taxCents].every(v=>v===null||money(v));
}
const held=():HardCheck=>Object.freeze({status:'blocked',reasons:Object.freeze(['invalid-fixture'] as HardReason[]),knownSubtotalCents:null});
/** Literal normalized facts only. No inferred compatibility, season, fit or ownership. */
export function checkLocalOutfit(f:ValidationFixture,now:number,maxAgeMs:number):HardCheck {
 try{
  if(!valid(f)||!integer(now)||!integer(maxAgeMs)||maxAgeMs===0)return held();
  const blocked=new Set<HardReason>(),unknown=new Set<HardReason>();let subtotal=0,pricesComplete=true;
  for(const required of f.requiredPieceIds)if(!f.pieces.some(p=>p.id===required))blocked.add('missing-piece');
  for(const p of f.pieces)if(!p.owned){
   const stale=p.checkedAt>now||now-p.checkedAt>=maxAgeMs;
   if(stale){unknown.add('fact-stale');pricesComplete=false;}
   for(const key of ['availability','size','delivery']){const fact=Object.hasOwn(p.facts,key)?p.facts[key]:undefined;if(key==='availability'&&fact?.value==='unavailable'&&fact.checkedAt<=now&&now-fact.checkedAt<maxAgeMs)blocked.add('product-unavailable');
    else if(!fact||fact.value!==(key==='availability'?'available':'verified'))unknown.add('product-unverified');else if(fact.checkedAt>now||now-fact.checkedAt>=maxAgeMs)unknown.add('fact-stale');}
   if(p.priceCents===null){pricesComplete=false;unknown.add('price-unknown');}else if(!stale)subtotal+=p.priceCents;}
  if(!Number.isSafeInteger(subtotal))return held();
  for(const r of f.requirements){
   if(!r.confirmed)continue;
   if(r.scope==='saved'&&f.exceptions.some(e=>e.requirementId===r.id&&e.sessionId===f.sessionId&&e.confirmed&&e.visible))continue;
   const pieces=r.pieceId===null?f.pieces:f.pieces.filter(p=>p.id===r.pieceId);
   if(!pieces.length){blocked.add('missing-piece');continue;}
   for(const p of pieces){const fact=Object.hasOwn(p.facts,r.attribute)?p.facts[r.attribute]:undefined;
    if(!fact||fact.value===null){unknown.add('requirement-unknown');continue;}
    if(fact.checkedAt>now||now-fact.checkedAt>=maxAgeMs){unknown.add('fact-stale');continue;}
    if((r.operator==='is'&&fact.value!==r.value)||(r.operator==='is-not'&&fact.value===r.value))blocked.add('requirement-conflict');
   }
  }
  if(f.budget){const extras=f.budget.basis==='total'?(f.shippingCents===null||f.taxCents===null?null:f.shippingCents+f.taxCents):0;
   // A known partial subtotal can already prove a maximum is exceeded.
   if(subtotal+(extras??0)>f.budget.cents)blocked.add('over-budget');
   if(!pricesComplete||extras===null)unknown.add('budget-unknown');
  }else unknown.add('budget-unknown');
  return Object.freeze({status:blocked.size?'blocked':unknown.size?'unknown':'pass',reasons:Object.freeze([...blocked,...unknown]),knownSubtotalCents:subtotal});
 }catch{return held();}
}
export type ValidationTicket=Readonly<{simulation:true;serial:number}>;
export type ValidationSnapshot=Readonly<{hard:HardCheck;semantic:SemanticOutcome|'pending';simulationEligible:boolean;releaseEnabled:false;audioEnabled:false}>;
/** Current-reader is local fixture authority only, not an authenticated profile.
 * Identity-issued tickets bind the exact candidate and all requirement revisions.
 * Real card/audio ports intentionally do not exist. */
export class LocalOutfitValidation {
 private read:()=>ValidationFixture;private clock:()=>number;private maxAge:number;
 private serial=0;private closed=false;
 private job:{ticket:ValidationTicket;fingerprint:string;fixture:ValidationFixture;startedAt:number;deadline:number;semantic:SemanticOutcome|'pending'}|null=null;
 constructor(read:()=>ValidationFixture,options:{clock?:()=>number;maxAgeMs?:number}={}){this.read=read;this.clock=options.clock??Date.now;this.maxAge=options.maxAgeMs??60_000;if(!integer(this.maxAge)||!this.maxAge)throw Error('Invalid rehearsal freshness.');}
 begin():ValidationTicket|null {
  this.job=null;const serial=++this.serial;if(this.closed)return null;
  try{const fixture=structuredClone(this.read()),now=this.clock();if(this.closed||this.serial!==serial||!valid(fixture)||!integer(now)||!Number.isSafeInteger(now+10_000))return null;
   const ticket=Object.freeze({simulation:true as const,serial});this.job={ticket,fixture,fingerprint:JSON.stringify(fixture),startedAt:now,deadline:now+10_000,semantic:'pending'};return ticket;
  }catch{return null;}
 }
 private current(){
  const job=this.job;if(!job||this.closed)return null;
  try{const now=this.clock(),current=this.read();if(this.job!==job||!integer(now)||now<job.startedAt||!valid(current)||JSON.stringify(current)!==job.fingerprint){this.job=null;return null;}
   if(job.semantic==='pending'&&now>=job.deadline)job.semantic='timeout';
   const hard=checkLocalOutfit(job.fixture,now,this.maxAge);if(this.job!==job)return null;return {job,hard};
  }catch{this.job=null;return null;}
 }
 complete(ticket:ValidationTicket,outcome:SemanticOutcome):boolean {
  const current=this.current();if(!current||current.job.ticket!==ticket||current.job.semantic!=='pending')return false;
  if(!['pass','unknown','blocked','refused','timeout'].includes(outcome)){current.job.semantic='unknown';return false;}
  current.job.semantic=outcome;
  // Recheck after the current-reader callback; old work never authorizes a new job.
  return this.job===current.job;
 }
 snapshot():ValidationSnapshot {const current=this.current();return Object.freeze({hard:current?.hard??held(),semantic:current?.job.semantic??'unknown',simulationEligible:!!current&&current.hard.status==='pass'&&current.job.semantic==='pass',releaseEnabled:false,audioEnabled:false});}
 simulatedVisual(ticket:ValidationTicket){const current=this.current();return !!current&&current.job.ticket===ticket&&current.hard.status==='pass'&&current.job.semantic==='pass';}
 simulatedAudioFrame(ticket:ValidationTicket){return this.simulatedVisual(ticket);}
 clear(){this.serial++;this.job=null;}
 end(){this.closed=true;this.clear();}
}

/** Preserve draft identity/cost only. The collage has no independent stock, size,
 * delivery or preference evidence; empty facts must therefore stay unknown. */
export function draftValidationPieces(draft:DraftOutfit):readonly ValidationPiece[]{
 if(draft.kind!=='illustrated-draft'||draft.releaseEnabled!==false||draft.shoppingEnabled!==false||draft.saveEnabled!==false)throw Error('Only inactive illustrated drafts.');
 return Object.freeze(draft.items.map(p=>Object.freeze({id:p.id,owned:p.kind==='owned-placeholder',sourceId:p.sourceId,productId:p.productId,variantId:p.variantId,priceCents:p.priceCents,checkedAt:draft.checkedAt,facts:Object.freeze({})})));
}
