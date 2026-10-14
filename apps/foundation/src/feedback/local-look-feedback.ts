import {projectSampleLook,SAMPLE_LOOKS} from '../looks/local-saved-looks.ts';
import type {SampleLook,SamplePiece} from '../looks/local-saved-looks.ts';
export type FeedbackKind='like'|'dislike'|'change'|'keep';
export type FeedbackTarget=Readonly<{kind:'look'}|{kind:'item';itemId:string}|{kind:'attribute';itemId:string;attribute:string}|{kind:'ambiguous'}>;
export type FeedbackEntry=Readonly<{id:number;lookId:string;kind:FeedbackKind;target:FeedbackTarget;targetLabel:string;text:string;origin:'touch'|'text'|'simulated-speech';confirmed:boolean}>;
export type FeedbackTicket=Readonly<{simulation:true;revision:number}>;
export type RestoreOutcome='pass'|'unknown'|'blocked'|'no-match'|'timeout';
export type RestoreTicket=Readonly<{simulation:true;revision:number;historyId:number}>;
export type SampleRevision=Readonly<{id:number;label:string;look:SampleLook}>;
export type FeedbackSnapshot=Readonly<{look:SampleLook|null;revision:number;round:number;changeAttempts:number;entries:readonly FeedbackEntry[];keptIds:readonly string[];pending:boolean;history:readonly SampleRevision[];currentHistoryId:number|null;undoAvailable:boolean;restoreStatus:'idle'|'needs-check'|'checking'|RestoreOutcome;restoreAttempts:number;message:string;releaseEnabled:false;audioEnabled:false}>;
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&Object.getPrototypeOf(v)===Object.prototype&&Reflect.ownKeys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k)&&!Object.getOwnPropertyDescriptor(v,k)?.get&&!Object.getOwnPropertyDescriptor(v,k)?.set);
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
function targetValid(target:FeedbackTarget,look:SampleLook){
 if(exact(target,['kind'])&&['look','ambiguous'].includes(String(target.kind)))return true;
 if(!exact(target,target?.kind==='attribute'?['kind','itemId','attribute']:['kind','itemId'])||!['item','attribute'].includes(String(target.kind))||!look.items.some(p=>p.id===('itemId' in target?target.itemId:null)))return false;
 return target.kind!=='attribute'||(text(target.attribute,40)&&/^[a-zA-Z][a-zA-Z -]*$/.test(target.attribute));
}
export const FEEDBACK_SAMPLE=projectSampleLook({...SAMPLE_LOOKS[0],id:'sample_feedback',title:'Feedback rehearsal',items:[SAMPLE_LOOKS[0].items[0],{id:'owned_bag',name:'Illustrated owned bag placeholder',slot:'accessory',color:'#d8ceb9',owned:true,priceCents:0},SAMPLE_LOOKS[0].items[2]]})!;
/** Local synthetic feedback owner. No parser, model, persistence or release port.
 * Tentative speech fixtures require explicit target confirmation. Likes/Keep protect
 * exact pieces; attribute feedback never becomes a profile/global constraint. */
export class LocalLookFeedback {
 private look:SampleLook|null=null;
 private revision=0;private round=0;private changeAttempts=0;private serial=0;private closed=false;
 private entries:FeedbackEntry[]=[];
 private history:SampleRevision[]=[];private historySerial=0;private currentHistoryId:number|null=null;
 private undoEntries:readonly FeedbackEntry[]|null=null;
 private restoreStatus:FeedbackSnapshot['restoreStatus']='idle';private restoreAttempts=0;
 private restoring:{ticket:RestoreTicket;candidate:SampleLook;startedAt:number;deadline:number}|null=null;
 private clock:()=>number;
 constructor(options:{clock?:()=>number}={}){this.clock=options.clock??Date.now;}
 private remember(){if(!this.look)return;const record=Object.freeze({id:++this.historySerial,label:this.history.length===0?'Original sample':'Sample change '+this.round,look:this.look});this.history.push(record);this.currentHistoryId=record.id;}
 private captureUndo(){this.undoEntries=Object.freeze([...this.entries]);}
 private expireRestore(){const job=this.restoring;if(!job)return;let now:number;try{now=this.clock();}catch{now=NaN;}if(this.restoring!==job)return;if(!Number.isSafeInteger(now)||now<job.startedAt||now>=job.deadline){this.restoring=null;this.restoreStatus=Number.isSafeInteger(now)&&now>=job.deadline?'timeout':'unknown';}}

 private pending:{ticket:FeedbackTicket;target:string;kept:readonly SamplePiece[];look:SampleLook}|null=null;
 private message='Open the sample feedback rehearsal. No real recommendation is available.';
 private listeners=new Set<()=>void>();
 subscribe(listener:()=>void){this.listeners.add(listener);return()=>{this.listeners.delete(listener);};}
 private publish(message:string){this.message=message;for(const listener of [...this.listeners])try{listener();}catch{}}
 private invalidate(){this.revision++;this.pending=null;this.restoring=null;this.restoreStatus='needs-check';}
 private label(target:FeedbackTarget){return target.kind==='look'?'This look':target.kind==='ambiguous'?'Which item or attribute?':(this.look?.items.find(p=>p.id===target.itemId)?.name??'Earlier sample item')+(target.kind==='attribute'?': '+target.attribute:'');}
 private kept(){return this.look?.items.filter(item=>item.owned||this.entries.some(e=>e.confirmed&&(e.kind==='like'||e.kind==='keep')&&e.target.kind==='item'&&e.target.itemId===item.id))??[];}
 snapshot():FeedbackSnapshot{this.expireRestore();return Object.freeze({look:this.look,revision:this.revision,round:this.round,changeAttempts:this.changeAttempts,entries:Object.freeze([...this.entries]),keptIds:Object.freeze(this.kept().map(p=>p.id)),pending:!!this.pending||!!this.restoring,history:Object.freeze([...this.history]),currentHistoryId:this.currentHistoryId,undoAvailable:!!this.undoEntries,restoreStatus:this.restoreStatus,restoreAttempts:this.restoreAttempts,message:this.message,releaseEnabled:false,audioEnabled:false});}
 open(input:unknown=FEEDBACK_SAMPLE){if(this.closed)return false;const look=projectSampleLook(input);if(!look)return false;this.invalidate();this.look=look;this.round=0;this.changeAttempts=0;this.entries=[];this.undoEntries=null;this.history=[];this.restoreAttempts=0;this.restoreStatus='idle';this.remember();this.publish('Unvalidated sample opened. Owned anchors are protected automatically.');return true;}
 add(input:{kind:FeedbackKind;target:FeedbackTarget;text:string;origin:FeedbackEntry['origin']}){
  if(this.closed||!this.look||!exact(input,['kind','target','text','origin'])||!['like','dislike','change','keep'].includes(input.kind)||!['touch','text','simulated-speech'].includes(input.origin)||!text(input.text,160)||!targetValid(input.target,this.look))return false;
  if(input.kind==='keep'&&input.target.kind!=='item'&&input.target.kind!=='ambiguous'){this.publish('Choose an exact item to keep.');return false;}
  const target=Object.freeze({...input.target});const confirmed=input.origin!=='simulated-speech'&&target.kind!=='ambiguous';
  const prior=this.entries.find(e=>e.kind===input.kind&&JSON.stringify(e.target)===JSON.stringify(target));
  if(!prior&&this.entries.length>=32){this.publish('Sample feedback memory is full. Remove a note first.');return false;}
  this.captureUndo();this.invalidate();const entry=Object.freeze({id:++this.serial,lookId:this.look.id,kind:input.kind,target,targetLabel:this.label(target),text:input.text.trim(),origin:input.origin,confirmed});
  this.entries=prior?this.entries.map(e=>e===prior?entry:e):[...this.entries,entry];
  this.publish(confirmed?'Sample feedback updated. This exact look needs fresh checks.':'To confirm: choose the intended item or attribute. Nothing was inferred.');return true;
 }
 confirm(id:number,target:FeedbackTarget){const entry=this.entries.find(e=>e.id===id);if(this.closed||!entry||entry.confirmed||!this.look||!targetValid(target,this.look)||target.kind==='ambiguous'||(entry.kind==='keep'&&target.kind!=='item'))return false;this.captureUndo();this.invalidate();this.entries=this.entries.map(e=>e===entry?Object.freeze({...e,target:Object.freeze({...target}),targetLabel:this.label(target),confirmed:true}):e);this.publish('Sample feedback confirmed for the selected target only.');return true;}
 remove(id:number){if(this.closed||!this.entries.some(e=>e.id===id))return false;this.captureUndo();this.invalidate();this.entries=this.entries.filter(e=>e.id!==id);this.publish('Sample feedback removed. Other notes and owned anchors remain.');return true;}
 beginChange(itemId:string):FeedbackTicket|null {
  this.invalidate();if(this.closed||!this.look||!this.look.items.some(p=>p.id===itemId))return null;
  if(this.changeAttempts>=3){this.publish('Three simulated change attempts used. Clear and reopen the separate rehearsal to start again.');return null;}
  if(this.protectedPieces().some(p=>!p||!this.look!.items.some(item=>JSON.stringify(item)===JSON.stringify(p)))){this.publish('A protected item is missing. Restore it or correct its feedback first.');return null;}
  if(this.entries.some(e=>!e.confirmed)){this.publish('Confirm or remove uncertain feedback before changing a sample piece.');return null;}
  if(this.kept().some(p=>p.id===itemId)){this.publish('This piece is kept or owned. Correct its Like/Keep feedback first; owned anchors cannot be replaced here.');return null;}
  this.changeAttempts++;const ticket=Object.freeze({simulation:true as const,revision:this.revision});this.pending={ticket,target:itemId,kept:this.kept(),look:this.look};this.publish('Preparing a simulated change. Previous sample remains unvalidated.');return this.pending?.ticket===ticket?ticket:null;
 }
 completeChange(ticket:FeedbackTicket,replacement:SamplePiece|null){
  const pending=this.pending;if(this.closed||!pending||pending.ticket!==ticket||ticket.revision!==this.revision)return false;
  this.pending=null;
  if(!replacement){this.publish('Sample change failed. Your previous pieces and feedback remain.');return false;}
  try{
   const old=pending.look.items.find(p=>p.id===pending.target)!;
   if(replacement.slot!==old.slot||replacement.owned||replacement.id===old.id||this.history.some(h=>h.look.items.some(p=>p.id===replacement.id)))throw Error();
   const items=pending.look.items.map(p=>p.id===old.id?replacement:p),subtotal=items.some(p=>!p.owned&&p.priceCents===null)?null:items.reduce((sum,p)=>sum+(p.owned?0:p.priceCents??0),0);
   const next=projectSampleLook({...pending.look,items,estimate:{...pending.look.estimate,subtotalCents:subtotal}});
   if(this.closed||this.revision!==ticket.revision||this.look!==pending.look||!next||pending.kept.some(p=>!next.items.some(item=>JSON.stringify(item)===JSON.stringify(p))))throw Error();
   this.invalidate();this.look=next;this.round++;this.remember();this.publish('Sample piece changed. Kept pieces and owned anchor stayed unchanged. Estimate refreshed; recommendation checks remain unavailable.');return true;
  }catch{this.publish('Sample replacement held. Previous pieces and useful feedback remain.');return false;}
 }
 private protectedPieces():readonly (SamplePiece|null)[]{
  const ids=new Set(this.entries.filter(e=>e.confirmed&&(e.kind==='like'||e.kind==='keep')&&e.target.kind==='item').map(e=>e.target.kind==='item'?e.target.itemId:''));
  const anchors=this.history[0]?.look.items.filter(p=>p.owned)??[];
  return [...anchors,...[...ids].map(id=>this.look?.items.find(p=>p.id===id)??[...this.history].reverse().flatMap(h=>h.look.items).find(p=>p.id===id)??null)];
 }
 cancelRestore(){if(!this.restoring)return;this.invalidate();this.publish('Restore selection changed. The old sample check was canceled.');}
 undoFeedback(){
  if(this.closed||!this.look||!this.undoEntries)return false;
  const previous=this.undoEntries;this.undoEntries=null;this.invalidate();this.entries=[...previous];
  this.publish('Latest sample feedback undone. Pieces were not restored; fresh checks are required.');return true;
 }
 compare(historyId:number){
  const earlier=this.history.find(h=>h.id===historyId);if(!earlier||!this.look||this.closed)return null;
  const stayed=this.look.items.filter(p=>earlier.look.items.some(old=>JSON.stringify(old)===JSON.stringify(p))).map(p=>p.name);
  const changed=this.look.items.filter(p=>!earlier.look.items.some(old=>JSON.stringify(old)===JSON.stringify(p))).map(p=>p.name);
  const removed=earlier.look.items.filter(p=>!this.look!.items.some(current=>JSON.stringify(current)===JSON.stringify(p))).map(p=>p.name);
  return Object.freeze({earlier,stayed:Object.freeze(stayed),changed:Object.freeze(changed),removed:Object.freeze(removed),currentSubtotalCents:this.look.estimate.subtotalCents,earlierSubtotalCents:earlier.look.estimate.subtotalCents,releaseEnabled:false as const});
 }
 beginRestore(historyId:number):RestoreTicket|null {
  this.invalidate();if(this.closed||!this.look)return null;
  const earlier=this.history.find(h=>h.id===historyId);
  if(!earlier){this.restoreStatus='no-match';this.publish('No matching sample revision. Your current pieces and feedback remain.');return null;}
  if(this.restoreAttempts>=3){this.restoreStatus='blocked';this.publish('Three restore checks used. No automatic retries or relaxed requirements. Clear and reopen the separate sample rehearsal to start again.');return null;}
  const revision=this.revision,current=this.look;let now:number;try{now=this.clock();}catch{now=NaN;}
  if(this.closed||revision!==this.revision||current!==this.look)return null;
  if(!Number.isSafeInteger(now)||now<0||!Number.isSafeInteger(now+5000)){this.restoreStatus='unknown';this.publish('Sample check clock unavailable. Current pieces remain.');return null;}
  this.restoreAttempts++;
  const ticket=Object.freeze({simulation:true as const,revision:this.revision,historyId});this.restoring={ticket,candidate:earlier.look,startedAt:now,deadline:now+5000};this.restoreStatus='checking';
  this.publish('Earlier sample selected for fresh checks. Restore status is shown below; real recommendation checks remain unavailable.');return this.restoring?.ticket===ticket?ticket:null;
 }
 completeRestore(ticket:RestoreTicket,outcome:RestoreOutcome){
  this.expireRestore();const job=this.restoring;
  if(this.closed||!job||job.ticket!==ticket||ticket.revision!==this.revision)return false;
  this.restoring=null;
  if(!['pass','unknown','blocked','no-match','timeout'].includes(outcome)){this.restoreStatus='unknown';this.publish('Unrecognized simulated result held. Current pieces and feedback remain.');return false;}
  const valid=projectSampleLook(job.candidate);
  if(!valid||this.protectedPieces().some(p=>!p||!valid.items.some(item=>JSON.stringify(item)===JSON.stringify(p)))){this.restoreStatus='blocked';this.publish('Earlier sample conflicts with a current kept piece or owned anchor. Correct feedback explicitly instead of dropping a protected item.');return false;}
  if(this.entries.some(e=>!e.confirmed)){this.restoreStatus='unknown';this.publish('Confirm uncertain feedback before restoring a sample. Current pieces remain.');return false;}
  if(outcome!=='pass'){this.restoreStatus=outcome;this.publish(outcome==='no-match'?'No sample matches the simulated check. Current pieces and useful feedback remain.':outcome==='timeout'?'Simulated check timed out. Current pieces and useful feedback remain.':outcome==='blocked'?'Simulated check found a conflict. Current pieces and useful feedback remain.':'Simulated check is uncertain. Current pieces and useful feedback remain.');return false;}
  this.invalidate();this.look=valid;this.currentHistoryId=ticket.historyId;this.restoreStatus='pass';
  this.publish('Earlier sample restored after fresh local checks and a simulated pass. Current feedback remains; real recommendation and audio release are unavailable.');return true;
 }
 invalidateContext(){if(this.closed)return;this.invalidate();this.publish('Requirements changed. Old sample work canceled; fresh recommendation checks are unavailable.');}
 clear(){this.invalidate();this.look=null;this.entries=[];this.round=0;this.changeAttempts=0;this.history=[];this.currentHistoryId=null;this.undoEntries=null;this.restoreAttempts=0;this.restoreStatus='idle';this.publish('Sample feedback and temporary look cleared. Saved data is unchanged.');}
 end(){this.closed=true;this.clear();}
}
export function sampleShoeReplacement(round:number):SamplePiece|null {
 if(!Number.isSafeInteger(round)||round<1||round>3)return null;
 return Object.freeze({id:'sample_shoes_'+round,name:'Illustrated replacement shoes '+round,slot:'shoes',color:['#365d7f','#8d684f','#3b3633'][round-1],owned:false,priceCents:6500+round*500});
}
