import {projectSampleLook,SAMPLE_LOOKS} from '../looks/local-saved-looks.ts';
export type SampleListEntry=Readonly<{key:string;lookId:string;pieceId:string;name:string;color:string;priceCents:number;date:string;state:'available'|'unavailable'|'needs-check'}>;
export type SampleListTicket=Readonly<{key:string;revision:number}>;
export type SampleListSnapshot=Readonly<{entries:readonly SampleListEntry[];unavailable:readonly string[];subtotalCents:number|null;message:string}>;
type SampleSource=Readonly<{look:Readonly<{id:string;estimate:Readonly<{date:string}>}>;piece:import('../looks/local-saved-looks.ts').SamplePiece}>;
const initialSources=()=>new Map<string,SampleSource>(SAMPLE_LOOKS.flatMap(look=>look.items.map(piece=>[`${look.id}:${piece.id}`,Object.freeze({look:Object.freeze({id:look.id,estimate:Object.freeze({date:look.estimate.date})}),piece})] as const)));
/** A fixed-fixture shopping rehearsal. No product links, checkout, profile or persistence port. */
export class LocalShoppingList {
 private sources=initialSources();
 private entries:SampleListEntry[]=[];
 private revision=0;
 private tickets=new WeakSet<SampleListTicket>();
 private availability=new Map<string,boolean>();
 private message='No sample shopping items added. Nothing is purchased or stored in an account.';
 private listeners=new Set<()=>void>();
 subscribe(listener:()=>void){this.listeners.add(listener);return()=>{this.listeners.delete(listener);};}
 snapshot():SampleListSnapshot{return Object.freeze({entries:Object.freeze([...this.entries]),unavailable:Object.freeze([...this.availability].filter(([,available])=>!available).map(([key])=>key)),subtotalCents:this.entries.some(entry=>entry.state!=='available')?null:this.entries.reduce((total,entry)=>total+entry.priceCents,0),message:this.message});}
 private publish(message:string){this.message=message;for(const listener of [...this.listeners])try{listener();}catch{}}
 /** Register an explicit immutable illustration projection, not a retailer
  * source or a shopping action. Existing piece keys cannot be redefined. */
 registerSampleLook(raw:unknown){
  const look=projectSampleLook(raw);if(!look){this.publish('This illustration could not be registered. Nothing was added.');return false;}
  const additions:readonly (readonly [string,SampleSource])[]=look.items.map(piece=>[`${look.id}:${piece.id}`,Object.freeze({look:Object.freeze({id:look.id,estimate:Object.freeze({date:look.estimate.date})}),piece})] as const);
  if(additions.some(([key,value])=>this.sources.has(key)&&JSON.stringify(this.sources.get(key))!==JSON.stringify(value))||this.sources.size+additions.filter(([key])=>!this.sources.has(key)).length>64){this.publish('This illustration conflicts with an existing sample or the sample catalog is full. Nothing was added.');return false;}
  const changed=additions.some(([key])=>!this.sources.has(key));if(changed){this.revision++;this.tickets=new WeakSet();for(const [key,value] of additions)this.sources.set(key,value);}
  return true;
 }
 prepare(lookId:string,pieceId:string):SampleListTicket|null{
  const key=`${lookId}:${pieceId}`,source=this.sources.get(key);
  if(!source){this.publish('This item is not in the fixed sample catalog.');return null;}
  if(source.piece.owned){this.publish('Owned items cannot be added to the shopping list.');return null;}
  if(source.piece.priceCents===null){this.publish('Sample price missing. This item cannot be added until its price is known.');return null;}
  if(this.availability.get(key)===false){this.publish('This sample item is simulated unavailable.');return null;}
  const ticket=Object.freeze({key,revision:this.revision});this.tickets.add(ticket);return ticket;
 }
 add(ticket:SampleListTicket|null){
  if(!ticket||!this.tickets.has(ticket)||ticket.revision!==this.revision){this.publish('This sample addition is unverified or stale. Choose the item again.');return false;}this.tickets.delete(ticket);
  const source=this.sources.get(ticket.key);if(!source||source.piece.owned||source.piece.priceCents===null||this.availability.get(ticket.key)===false){this.publish('The sample item is no longer eligible.');return false;}
  if(this.entries.some(entry=>entry.key===ticket.key)){this.publish('This sample item is already in your list.');return false;}
  if(this.entries.length>=16){this.publish('Sample list limit reached. Remove an item first.');return false;}
  this.entries.push(Object.freeze({key:ticket.key,lookId:source.look.id,pieceId:source.piece.id,name:source.piece.name,color:source.piece.color,priceCents:source.piece.priceCents,date:source.look.estimate.date,state:'available'}));this.publish('Only this item was added to sample shopping memory. No look, preference or Wardrobe item was saved.');return true;
 }
 addPiece(lookId:string,pieceId:string){const ticket=this.prepare(lookId,pieceId);return ticket?this.add(ticket):false;}
 simulateAvailability(key:string,available:boolean){const source=this.sources.get(key);if(!source||source.piece.owned||typeof available!=='boolean')return false;this.revision++;this.availability.set(key,available);this.entries=this.entries.map(entry=>entry.key===key?Object.freeze({...entry,state:available?'needs-check':'unavailable'}):entry);this.publish(available?'Sample availability restored. Recheck the item before treating its subtotal as complete.':'Sample item marked unavailable. The list subtotal is incomplete. No retailer was contacted.');return true;}
 recheck(key:string){const entry=this.entries.find(item=>item.key===key);if(!entry)return false;const source=this.sources.get(key),eligible=!!source&&!source.piece.owned&&source.piece.priceCents!==null&&this.availability.get(key)!==false;this.entries=this.entries.map(item=>item.key===key?Object.freeze({...item,state:eligible?'available':'unavailable'}):item);this.publish(eligible?'Fixed sample checks passed. Live price, stock, delivery and customer requirements remain unchecked.':'Sample recheck failed. This item remains unavailable and the subtotal incomplete.');return eligible;}
 remove(key:string){if(!this.entries.some(item=>item.key===key))return false;this.revision++;this.entries=this.entries.filter(item=>item.key!==key);this.publish('Sample shopping item removed. Saved looks, Wardrobe and preferences are unchanged.');return true;}
 clear(){this.revision++;this.tickets=new WeakSet();this.entries=[];this.availability.clear();this.sources=initialSources();this.publish('Sample shopping memory cleared.');}
}
