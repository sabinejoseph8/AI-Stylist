import {projectSampleLook,SAMPLE_LOOKS} from '../looks/local-saved-looks.ts';
import type {SampleLook,SamplePiece} from '../looks/local-saved-looks.ts';
export type FeedbackKind='like'|'dislike'|'change'|'keep';
export type FeedbackTarget=Readonly<{kind:'look'}|{kind:'item';itemId:string}|{kind:'attribute';itemId:string;attribute:string}|{kind:'ambiguous'}>;
export type FeedbackEntry=Readonly<{id:number;lookId:string;kind:FeedbackKind;target:FeedbackTarget;targetLabel:string;text:string;origin:'touch'|'text'|'simulated-speech';confirmed:boolean}>;
export type FeedbackTicket=Readonly<{simulation:true;revision:number}>;
export type FeedbackSnapshot=Readonly<{look:SampleLook|null;revision:number;round:number;entries:readonly FeedbackEntry[];keptIds:readonly string[];pending:boolean;message:string;releaseEnabled:false;audioEnabled:false}>;
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
 private revision=0;private round=0;private serial=0;private closed=false;
 private entries:FeedbackEntry[]=[];
 private pending:{ticket:FeedbackTicket;target:string;kept:readonly SamplePiece[];look:SampleLook}|null=null;
 private message='Open the sample feedback rehearsal. No real recommendation is available.';
 private listeners=new Set<()=>void>();
 subscribe(listener:()=>void){this.listeners.add(listener);return()=>{this.listeners.delete(listener);};}
 private publish(message:string){this.message=message;for(const listener of [...this.listeners])try{listener();}catch{}}
 private invalidate(){this.revision++;this.pending=null;}
 private label(target:FeedbackTarget){return target.kind==='look'?'This look':target.kind==='ambiguous'?'Which item or attribute?':(this.look?.items.find(p=>p.id===target.itemId)?.name??'Earlier sample item')+(target.kind==='attribute'?': '+target.attribute:'');}
 private kept(){return this.look?.items.filter(item=>item.owned||this.entries.some(e=>e.confirmed&&(e.kind==='like'||e.kind==='keep')&&e.target.kind==='item'&&e.target.itemId===item.id))??[];}
 snapshot():FeedbackSnapshot{return Object.freeze({look:this.look,revision:this.revision,round:this.round,entries:Object.freeze([...this.entries]),keptIds:Object.freeze(this.kept().map(p=>p.id)),pending:!!this.pending,message:this.message,releaseEnabled:false,audioEnabled:false});}
 open(input:unknown=FEEDBACK_SAMPLE){if(this.closed)return false;const look=projectSampleLook(input);if(!look)return false;this.invalidate();this.look=look;this.round=0;this.entries=[];this.publish('Unvalidated sample opened. Owned anchors are protected automatically.');return true;}
 add(input:{kind:FeedbackKind;target:FeedbackTarget;text:string;origin:FeedbackEntry['origin']}){
  if(this.closed||!this.look||!exact(input,['kind','target','text','origin'])||!['like','dislike','change','keep'].includes(input.kind)||!['touch','text','simulated-speech'].includes(input.origin)||!text(input.text,160)||!targetValid(input.target,this.look))return false;
  if(input.kind==='keep'&&input.target.kind!=='item'&&input.target.kind!=='ambiguous'){this.publish('Choose an exact item to keep.');return false;}
  const target=Object.freeze({...input.target});const confirmed=input.origin!=='simulated-speech'&&target.kind!=='ambiguous';
  const prior=this.entries.find(e=>e.kind===input.kind&&JSON.stringify(e.target)===JSON.stringify(target));
  if(!prior&&this.entries.length>=32){this.publish('Sample feedback memory is full. Remove a note first.');return false;}
  this.invalidate();const entry=Object.freeze({id:++this.serial,lookId:this.look.id,kind:input.kind,target,targetLabel:this.label(target),text:input.text.trim(),origin:input.origin,confirmed});
  this.entries=prior?this.entries.map(e=>e===prior?entry:e):[...this.entries,entry];
  this.publish(confirmed?'Sample feedback updated. This exact look needs fresh checks.':'To confirm: choose the intended item or attribute. Nothing was inferred.');return true;
 }
 confirm(id:number,target:FeedbackTarget){const entry=this.entries.find(e=>e.id===id);if(this.closed||!entry||entry.confirmed||!this.look||!targetValid(target,this.look)||target.kind==='ambiguous'||(entry.kind==='keep'&&target.kind!=='item'))return false;this.invalidate();this.entries=this.entries.map(e=>e===entry?Object.freeze({...e,target:Object.freeze({...target}),targetLabel:this.label(target),confirmed:true}):e);this.publish('Sample feedback confirmed for the selected target only.');return true;}
 remove(id:number){if(this.closed||!this.entries.some(e=>e.id===id))return false;this.invalidate();this.entries=this.entries.filter(e=>e.id!==id);this.publish('Sample feedback removed. Other notes and owned anchors remain.');return true;}
 beginChange(itemId:string):FeedbackTicket|null {
  this.invalidate();if(this.closed||!this.look||!this.look.items.some(p=>p.id===itemId))return null;
  if(this.round>=3){this.publish('Three simulated changes finished. Clear and reopen the separate rehearsal to start again.');return null;}
  if(this.entries.some(e=>!e.confirmed)){this.publish('Confirm or remove uncertain feedback before changing a sample piece.');return null;}
  if(this.kept().some(p=>p.id===itemId)){this.publish('This piece is kept or owned. Correct its Like/Keep feedback first; owned anchors cannot be replaced here.');return null;}
  const ticket=Object.freeze({simulation:true as const,revision:this.revision});this.pending={ticket,target:itemId,kept:this.kept(),look:this.look};this.publish('Preparing a simulated change. Previous sample remains unvalidated.');return this.pending?.ticket===ticket?ticket:null;
 }
 completeChange(ticket:FeedbackTicket,replacement:SamplePiece|null){
  const pending=this.pending;if(this.closed||!pending||pending.ticket!==ticket||ticket.revision!==this.revision)return false;
  this.pending=null;
  if(!replacement){this.publish('Sample change failed. Your previous pieces and feedback remain.');return false;}
  try{
   const old=pending.look.items.find(p=>p.id===pending.target)!;
   if(replacement.slot!==old.slot||replacement.owned||replacement.id===old.id||pending.look.items.some(p=>p.id===replacement.id))throw Error();
   const items=pending.look.items.map(p=>p.id===old.id?replacement:p),subtotal=items.some(p=>!p.owned&&p.priceCents===null)?null:items.reduce((sum,p)=>sum+(p.owned?0:p.priceCents??0),0);
   const next=projectSampleLook({...pending.look,items,estimate:{...pending.look.estimate,subtotalCents:subtotal}});
   if(this.closed||this.revision!==ticket.revision||this.look!==pending.look||!next||pending.kept.some(p=>!next.items.some(item=>JSON.stringify(item)===JSON.stringify(p))))throw Error();
   this.invalidate();this.look=next;this.round++;this.publish('Sample piece changed. Kept pieces and owned anchor stayed unchanged. Estimate refreshed; recommendation checks remain unavailable.');return true;
  }catch{this.publish('Sample replacement held. Previous pieces and useful feedback remain.');return false;}
 }
 invalidateContext(){if(this.closed)return;this.invalidate();this.publish('Requirements changed. Old sample work canceled; fresh recommendation checks are unavailable.');}
 clear(){this.invalidate();this.look=null;this.entries=[];this.round=0;this.publish('Sample feedback and temporary look cleared. Saved data is unchanged.');}
 end(){this.closed=true;this.clear();}
}
export function sampleShoeReplacement(round:number):SamplePiece|null {
 if(!Number.isSafeInteger(round)||round<1||round>3)return null;
 return Object.freeze({id:'sample_shoes_'+round,name:'Illustrated replacement shoes '+round,slot:'shoes',color:['#365d7f','#8d684f','#3b3633'][round-1],owned:false,priceCents:6500+round*500});
}
