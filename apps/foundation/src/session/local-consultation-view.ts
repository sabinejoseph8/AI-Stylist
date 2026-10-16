import {FIELDS} from '../../../../packages/style-contracts/src/index.ts';
import type {Field} from '../../../../packages/style-contracts/src/index.ts';
import type {SessionSnapshot,UpdateResult} from './styling-session.ts';
/** Local rehearsal only. The port owns notes; this model never creates a
 * StylingSession, infers confirmations, authenticates a user or grants release. */
export type ConsultationEdit=Readonly<{field:Field;epoch:number;baseRevision:number;sequence:number;value:string}>;
export type ConsultationViewPort=Readonly<{
 snapshot(signal:AbortSignal):Promise<SessionSnapshot|null>;
 edit(command:unknown,signal:AbortSignal):Promise<UpdateResult>;
 clear(signal:AbortSignal):Promise<boolean>;
 end(signal:AbortSignal):Promise<boolean>;
 onReset(listener:()=>void):()=>void;
}>;
export type ConsultationViewSnapshot=Readonly<{
 state:'loading'|'ready'|'held'|'ended';session:SessionSnapshot|null;
 message:string;busy:boolean;saved:Readonly<Partial<Record<Field,string>>>;
 releaseEnabled:false;
}>;
const integer=(v:unknown)=>Number.isSafeInteger(v)&&Number(v)>=0;
const exact=(v:unknown,keys:readonly string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
/** Defensive response boundary, including per-field revisions used for edits. */
export function consultationSnapshot(raw:unknown):SessionSnapshot|null{
 try{
  const s=structuredClone(raw);
  if(!exact(s,['epoch','revision','state','reason','warning','notes'])||!integer(s.epoch)||!integer(s.revision)||!['active','disconnected','ended'].includes(String(s.state))||!['ended','expired',null].includes(s.reason as any)||typeof s.warning!=='boolean'||!exact(s.notes,FIELDS.map(([f])=>f)))return null;
  for(const [field] of FIELDS){const n=s.notes[field];if(!exact(n,['value','status','origin','scope','revision','sequence'])||typeof n.value!=='string'||n.value.length>160||!['missing','tentative','confirmed'].includes(String(n.status))||!['speech','text','touch','saved-profile',null].includes(n.origin as any)||!['session','saved-profile'].includes(String(n.scope))||!integer(n.revision)||!Number.isSafeInteger(n.sequence)||Number(n.sequence)<-1||n.status==='missing'&&(n.value!==''||n.origin!==null)||n.status!=='missing'&&!n.value.trim()||s.state==='ended'&&n.value!=='')return null;Object.freeze(n);}
  Object.freeze(s.notes);return Object.freeze(s) as SessionSnapshot;
 }catch{return null;}
}
export class LocalConsultationView {
 private readonly port:ConsultationViewPort;
 private readonly unsubscribe:()=>void;
 private state:ConsultationViewSnapshot['state']='loading';
 private current:SessionSnapshot|null=null;
 private message='Loading the shared sample notebook.';
 private saved:Partial<Record<Field,string>>={};
 private floor:{epoch:number;revision:number;fingerprint:string}|null=null;
 private generation=0;private operation=0;private busy=false;private disposed=false;
 private cleanup=new Set<AbortController>();
 private lifetime=new AbortController();private listeners=new Set<()=>void>();
 constructor(port:ConsultationViewPort){
  if(!port||['snapshot','edit','clear','end','onReset'].some(k=>typeof(port as any)[k]!=='function'))throw Error('Local consultation view unavailable');
  this.port=Object.freeze({snapshot:port.snapshot.bind(port),edit:port.edit.bind(port),clear:port.clear.bind(port),end:port.end.bind(port),onReset:port.onReset.bind(port)});
  this.unsubscribe=this.port.onReset(()=>this.invalidate('Shared session changed. Refresh its current notes.'));
 }
 subscribe(listener:()=>void){this.listeners.add(listener);return()=>{this.listeners.delete(listener);};}
 snapshot():ConsultationViewSnapshot{return Object.freeze({state:this.state,session:this.current,message:this.message,busy:this.busy,saved:Object.freeze({...this.saved}),releaseEnabled:false});}
 private publish(){for(const listener of [...this.listeners])try{listener();}catch{/* Observers cannot veto cleanup. */}}
 private invalidate(message:string,ended=false){if(this.state==='ended'&&!ended)return;this.generation++;this.lifetime.abort();this.lifetime=new AbortController();this.current=null;this.busy=false;this.state=ended?'ended':'held';this.message=message;this.publish();}
 private async wait<T>(external:AbortSignal,work:(signal:AbortSignal)=>Promise<T>):Promise<T>{
  if(external.aborted)throw Error('Local view canceled');
  const abort=new AbortController(),signal=abort.signal,relay=()=>abort.abort();
  external.addEventListener('abort',relay,{once:true});
  let listener:(()=>void)|undefined;
  const timer=setTimeout(()=>abort.abort(),8000);
  try{return await Promise.race([Promise.resolve().then(()=>{if(signal.aborted)throw Error();return work(signal);}),new Promise<never>((_,reject)=>{listener=()=>reject(Error('Local view unavailable'));signal.addEventListener('abort',listener,{once:true});if(signal.aborted)listener();})]);}
  finally{clearTimeout(timer);external.removeEventListener('abort',relay);if(listener)signal.removeEventListener('abort',listener);}
 }
 private async accept(raw:unknown,generation:number,signal:AbortSignal){
  const next=consultationSnapshot(raw);if(!next)return false;
  // Keep only a digest of the last accepted notes after cleanup, not old text.
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(next.notes)));
  const fingerprint=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
  if(this.disposed||generation!==this.generation||signal.aborted)return false;
  if(!next||this.floor&&(next.epoch<this.floor.epoch||next.revision<this.floor.revision||next.epoch===this.floor.epoch&&next.revision===this.floor.revision&&fingerprint!==this.floor.fingerprint))return false;
  this.floor={epoch:next.epoch,revision:next.revision,fingerprint};
  this.current=next.state==='active'?next:null;this.state=next.state==='active'?'ready':next.state==='ended'?'ended':'held';return true;
 }
 async refresh(){
  if(this.disposed||this.state==='ended'||this.busy)return false;
  const generation=this.generation,signal=this.lifetime.signal;this.busy=true;this.publish();
  try{const raw=await this.wait(signal,s=>this.port.snapshot(s));if(this.disposed||generation!==this.generation||signal.aborted)return false;if(!await this.accept(raw,generation,signal)){if(generation!==this.generation||signal.aborted)return false;this.invalidate('Shared notes could not be verified. No old notes are displayed.');return false;}this.message=this.state==='ready'?'Shared sample notes are current.':'Shared sample session is unavailable.';return this.state==='ready';}
  catch{if(generation===this.generation)this.invalidate('Connection unavailable. Temporary notes are hidden.');return false;}
  finally{if(generation===this.generation){this.busy=false;this.publish();}}
 }
 beginEdit(field:Field):ConsultationEdit|null{const s=this.current;if(this.disposed||this.busy||this.state!=='ready'||!s||!FIELDS.some(([f])=>f===field))return null;const n=s.notes[field];return Object.freeze({field,epoch:s.epoch,baseRevision:n.revision,sequence:n.sequence+1,value:n.value});}
 async save(draft:ConsultationEdit,value:string,confirm=false):Promise<UpdateResult>{
  const s=this.current;if(this.disposed||this.busy||!s||this.state!=='ready')return 'unavailable';
  if(!draft||!FIELDS.some(([f])=>f===draft.field)||typeof value!=='string'||!value.trim()||value.length>160)return 'invalid';
  const n=s.notes[draft.field];if(draft.epoch!==s.epoch||draft.baseRevision!==n.revision||draft.sequence!==n.sequence+1||confirm&&value!==draft.value)return 'stale';
  const generation=this.generation,signal=this.lifetime.signal,id='view_'+(++this.operation);
  const command=Object.freeze({action:confirm?'confirm':'edit',id,epoch:draft.epoch,field:draft.field,baseRevision:draft.baseRevision,sequence:draft.sequence,...(!confirm?{value}: {})});
  this.busy=true;this.message='Waiting for the shared notebook to accept this edit.';this.publish();
  try{
   const result=await this.wait(signal,s=>this.port.edit(command,s));if(this.disposed||generation!==this.generation||signal.aborted)return 'unavailable';
   if(!['applied','duplicate','stale','invalid','unavailable','limit'].includes(result))throw Error();
   const raw=await this.wait(signal,s=>this.port.snapshot(s));if(this.disposed||generation!==this.generation||signal.aborted)return 'unavailable';
   if(!await this.accept(raw,generation,signal))throw Error();this.message=result==='applied'?'Shared notebook updated. Ambiguous budgets remain To confirm.':'This detail was not accepted. Review the current notes.';return result;
  }catch{if(generation===this.generation)this.invalidate('The edit could not be verified. No optimistic notes are displayed.');return 'unavailable';}
  finally{if(generation===this.generation){this.busy=false;this.publish();}}
 }
 async confirm(field:Field){const draft=this.beginEdit(field);return draft?this.save(draft,draft.value,true):'unavailable' as const;}
 /** Explicit sample-only projection. Never an account/profile write. */
 savePreferences(fields:readonly Field[]){
  const s=this.current;if(this.disposed||this.busy||this.state!=='ready'||!s||!Array.isArray(fields)||!fields.length)return false;
  const selected:readonly Field[]=fields;if(new Set(selected).size!==selected.length||selected.some(f=>!(['color','style','budget','lookType'] as Field[]).includes(f)||s.notes[f].status!=='confirmed'))return false;
  for(const f of selected)this.saved[f]=s.notes[f].value;this.message='Selected preferences copied to separate sample memory only.';this.publish();return true;
 }
 private async cleanupCall(work:(signal:AbortSignal)=>Promise<boolean>){
  const abort=new AbortController();this.cleanup.add(abort);
  try{return await this.wait(abort.signal,work)===true;}finally{this.cleanup.delete(abort);}
 }
 async clear(){
  if(this.disposed||this.state==='ended')return false;
  this.invalidate('Clearing shared temporary notes.');
  try{if(!await this.cleanupCall(s=>this.port.clear(s))){this.invalidate('Clear could not be confirmed. Temporary notes remain hidden.');return false;}return await this.refresh();}catch{this.invalidate('Clear could not be confirmed. Temporary notes remain hidden.');return false;}
 }
 async end(){if(this.disposed||this.state==='ended')return false;this.invalidate('Shared sample session ended locally.',true);try{return await this.cleanupCall(s=>this.port.end(s));}catch{return false;}}
 transportLost(){if(!this.disposed&&this.state!=='ended')this.invalidate('Connection unavailable. Temporary notes are hidden.');}
 dispose(){if(this.disposed)return;this.disposed=true;this.unsubscribe();for(const abort of this.cleanup)abort.abort();this.saved={};this.invalidate('Local rehearsal closed.',true);this.listeners.clear();}
}
