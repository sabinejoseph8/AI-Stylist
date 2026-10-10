export const FIELDS = [
  ['occasion','Occasion'],['season','Season / date'],['color','Color'],['style','Style'],
  ['budget','Budget'],['lookType','Look type'],['wardrobe','Owned wardrobe'],
] as const;
export type Field = typeof FIELDS[number][0];
export type Note = {value:string;status:'missing'|'tentative'|'confirmed';revision:number;sequence:number;source:'speech'|'touch'|null};
export type Capture = {session:number;field:Field;baseRevision:number;sequence:number;value:string;confirmed:boolean};
export type Reference = {label:string;kind:'owned'|'inspiration'};
export type CheckTicket = Readonly<{id:number;revision:number;session:number}>;
export type Candidate = {color:string;style:string;occasion:string;lookType:string;newItemCents:number;currency:'USD';excludedColors:string[]};
export type CheckResult = {outcome:'passed'|'blocked'|'unknown';reason:string};
const empty = ():Record<Field,Note> => Object.fromEntries(FIELDS.map(([id])=>[id,{value:'',status:'missing',revision:0,sequence:-1,source:null}])) as Record<Field,Note>;

/** Local synthetic prototype state. No extraction API, persistence or profile writes. */
export class NotebookState {
  private notes=empty();
  private listeners=new Set<()=>void>();
  subscribe(listener:()=>void){this.listeners.add(listener);return()=>{this.listeners.delete(listener);};}
  private notify(){for(const listener of [...this.listeners])listener();}
  private session=1;
  private revision=0;
  private reference:Reference|null=null;
  private checkId=0;
  private gate:{ticket:CheckTicket;state:'checking'|'passed'|'held';reason:string}|null=null;
  snapshot(){return {session:this.session,revision:this.revision,notes:Object.fromEntries(FIELDS.map(([id])=>[id,{...this.notes[id]}])) as Record<Field,Note>,reference:this.reference?{...this.reference}:null,gate:this.gate?{...this.gate,ticket:{...this.gate.ticket}}:null};}
  private changed(){this.revision++;this.gate=null;this.notify();}
  capture(event:Capture):boolean {
    const note=this.notes[event.field];
    if(!note || event.session!==this.session || !Number.isSafeInteger(event.sequence) || event.sequence<=note.sequence || event.baseRevision!==note.revision || typeof event.value!=='string' || !event.value.trim() || event.value.length>160) return false;
    this.notes[event.field]={value:event.value.trim(),status:event.confirmed?'confirmed':'tentative',revision:note.revision+1,sequence:event.sequence,source:'speech'};this.changed();return true;
  }
  edit(field:Field,value:string){
    if(typeof value!=='string'||value.length>160)throw Error('Keep the note within 160 characters.');
    const previous=this.notes[field];if(!previous)throw Error('Unknown note.');
    this.notes[field]={...previous,value:value.trim(),status:value.trim()?'confirmed':'missing',revision:previous.revision+1,source:'touch'};this.changed();
  }
  confirm(field:Field){if(!this.notes[field]?.value)throw Error('Add a value first.');this.edit(field,this.notes[field].value);}
  setReference(reference:Reference|null){
    if(reference && (!reference.label.trim() || reference.label.length>100 || !['owned','inspiration'].includes(reference.kind)))throw Error('Describe the item and choose owned or inspiration.');
    this.reference=reference?{...reference,label:reference.label.trim()}:null;this.changed();
  }
  preferencesChanged(){this.changed();}
  beginCheck():CheckTicket {
    const ticket=Object.freeze({id:++this.checkId,revision:this.revision,session:this.session});
    this.gate={ticket,state:'checking',reason:'Checking your preferences'};this.notify();return ticket;
  }
  completeCheck(ticket:CheckTicket,result:CheckResult):boolean{
    if(!this.gate || this.gate.state!=='checking' || ticket.id!==this.gate.ticket.id || ticket.session!==this.session || ticket.revision!==this.revision) return false;
    const passed=result?.outcome==='passed' && typeof result.reason==='string' && Boolean(result.reason.trim());
    this.gate={ticket:this.gate.ticket,state:passed?'passed':'held',reason:typeof result?.reason==='string' && result.reason.trim()?result.reason:'The preference check could not be completed.'};return passed;
  }
  timeout(ticket:CheckTicket){return this.completeCheck(ticket,{outcome:'unknown',reason:'The check timed out. No look was released.'});}
  canPresent(){return this.gate?.state==='passed' && this.gate.ticket.revision===this.revision && this.gate.ticket.session===this.session;}
  clear(){this.session++;this.notes=empty();this.reference=null;this.changed();}
}

/** Deliberately narrow fixture validator, not the future AI preference agent. */
export function checkFixture(snapshot:ReturnType<NotebookState['snapshot']>,candidate:Candidate):CheckResult {
  const required:Field[]=['occasion','season','color','style','budget','lookType'];
  const missing=required.find(id=>snapshot.notes[id].status!=='confirmed');
  if(missing)return {outcome:'unknown',reason:`Confirm ${FIELDS.find(([id])=>id===missing)![1].toLowerCase()} before showing a look.`};
  const norm=(s:string)=>s.trim().toLowerCase();
  if(candidate.excludedColors.some(color=>norm(color)===norm(candidate.color)))return {outcome:'blocked',reason:'This sample conflicts with the saved color exclusion. Clarification is needed.'};
  for(const field of ['occasion','color','style','lookType'] as const)if(norm(snapshot.notes[field].value)!==norm(candidate[field]))return {outcome:'blocked',reason:`This sample does not match the confirmed ${FIELDS.find(([id])=>id===field)![1].toLowerCase()}.`};
  const budget=/^USD (\d+(?:\.\d{1,2})?) maximum \(items only\)$/.exec(snapshot.notes.budget.value);
  if(!budget)return {outcome:'unknown',reason:'Confirm a USD maximum for item prices. Other budget scopes need clarification in this prototype.'};
  const maximum=Number(budget[1]);
  if(!Number.isFinite(maximum)||maximum<0||maximum>100000)return {outcome:'unknown',reason:'The budget amount needs clarification.'};
  if(candidate.currency!=='USD'||!Number.isSafeInteger(candidate.newItemCents)||candidate.newItemCents<0)return {outcome:'unknown',reason:'A required price is unverified.'};
  if(candidate.newItemCents>Math.round(maximum*100))return {outcome:'blocked',reason:'The sample exceeds the confirmed item-price maximum.'};
  // Fixtures have no real item matching or season suitability engine.
  if(norm(snapshot.notes.season.value)!=='november; season not specified')return {outcome:'unknown',reason:'This sample has only a November fixture. Seasonal suitability needs a real check.'};
  if(snapshot.reference)return {outcome:'unknown',reason:'The supplied item must be included and checked before a look can be released. Image matching is not connected.'};
  if(snapshot.notes.wardrobe.value)return {outcome:'unknown',reason:'Owned items need matching before this sample can be released.'};
  return {outcome:'passed',reason:'Synthetic sample matches the confirmed fixture fields. No real products or seasonal suitability were verified.'};
}
