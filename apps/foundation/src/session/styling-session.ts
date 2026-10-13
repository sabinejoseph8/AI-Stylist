import {FIELDS} from '../../../../packages/style-contracts/src/index.ts';
import type {Field} from '../../../../packages/style-contracts/src/index.ts';

export type NoteOrigin='speech'|'text'|'touch'|'saved-profile';
export type StylingNote=Readonly<{value:string;status:'missing'|'tentative'|'confirmed';origin:NoteOrigin|null;scope:'session'|'saved-profile';revision:number;sequence:number}>;
export type SessionSnapshot=Readonly<{epoch:number;revision:number;state:'active'|'disconnected'|'ended';reason:'ended'|'expired'|null;warning:boolean;notes:Readonly<Record<Field,StylingNote>>}>;
export type SessionTicket=Readonly<{epoch:number;revision:number;signal:AbortSignal}>;
export type SessionUpdate=Readonly<{id:string;epoch:number;field:Field;baseRevision:number;sequence:number;value:string;status:'tentative'|'confirmed';origin:'speech'|'text'|'touch'}>;
export type UpdateResult='applied'|'duplicate'|'stale'|'invalid'|'unavailable'|'limit';
const empty=():Record<Field,StylingNote>=>Object.fromEntries(FIELDS.map(([id])=>[id,Object.freeze({value:'',status:'missing',origin:null,scope:'session',revision:0,sequence:-1})])) as Record<Field,StylingNote>;
const validInteger=(v:unknown)=>Number.isSafeInteger(v)&&Number(v)>=0;
const validId=(v:unknown):v is string=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(v);

/** Local Phase 3 preparation only. One authoritative owner, no network,
 * persistence, timers, credentials, extraction or production retention default.
 * The caller must explicitly supply preview lifetimes. This is not identity
 * verification; a future hosted owner must bind its verified customer itself. */
export class StylingSession {
 private notes=empty();
 private epoch=1;
 private revision=0;
 private state:SessionSnapshot['state']='active';
 private reason:SessionSnapshot['reason']=null;
 private lastActivity:number;
 private observedTime:number;
 private disconnectedAt:number|null=null;
 private lifetime=new AbortController();
 private operations=new Set<string>();
 private listeners=new Set<()=>void>();
 private readonly owner:string;
 private readonly clock:()=>number;
 private readonly policy:Readonly<{idleMs:number;disconnectMs:number;warningMs:number}>;
 constructor(options:{simulation:true;owner:string;clock:()=>number;policy:{idleMs:number;disconnectMs:number;warningMs:number};saved?:Partial<Record<Field,string>>}){
  if(options?.simulation!==true||!validId(options.owner)||typeof options.clock!=='function'||!options.policy||!validInteger(options.policy.idleMs)||options.policy.idleMs===0||!validInteger(options.policy.disconnectMs)||options.policy.disconnectMs===0||!validInteger(options.policy.warningMs)||options.policy.warningMs>=options.policy.idleMs)throw Error('Local session configuration is invalid.');
  this.owner=options.owner;this.clock=options.clock;this.policy=Object.freeze({...options.policy});
  const now=this.clock();if(!validInteger(now))throw Error('Local session clock is invalid.');this.observedTime=now;this.lastActivity=now;
  if(options.saved)for(const [field,value] of Object.entries(options.saved)){
   if(!FIELDS.some(([id])=>id===field)||typeof value!=='string'||!value.trim()||value.length>160)throw Error('Saved preview preferences are invalid.');
   this.notes[field as Field]=Object.freeze({value:value.trim(),status:'confirmed',origin:'saved-profile',scope:'saved-profile',revision:0,sequence:-1});
  }
 }
 subscribe(listener:()=>void){this.listeners.add(listener);return()=>{this.listeners.delete(listener);};}
 private notify(){for(const listener of [...this.listeners])try{listener();}catch{/* A failed observer cannot block invalidation. */}}
 private time():number{
  const value=this.clock();
  // A bad or backwards clock cannot extend a session or make old jobs current.
  if(!validInteger(value)||value<this.observedTime){this.finish('expired');return this.observedTime;}
  this.observedTime=value;return value;
 }
 private finish(reason:NonNullable<SessionSnapshot['reason']>){
  if(this.state==='ended')return;
  this.state='ended';this.reason=reason;this.epoch++;this.revision++;this.notes=empty();this.operations.clear();this.disconnectedAt=null;this.lifetime.abort();this.notify();
 }
 private available(owner:string){
  const now=this.time();
  if(this.state!=='ended'&&(now-this.lastActivity>=this.policy.idleMs||(this.disconnectedAt!==null&&now-this.disconnectedAt>=this.policy.disconnectMs)))this.finish('expired');
  return owner===this.owner&&this.state==='active';
 }
 snapshot(owner:string):SessionSnapshot|null{
  this.available(owner);if(owner!==this.owner)return null;
  return Object.freeze({epoch:this.epoch,revision:this.revision,state:this.state,reason:this.reason,warning:this.state!=='ended'&&this.observedTime-this.lastActivity>=this.policy.idleMs-this.policy.warningMs,notes:Object.freeze({...this.notes})});
 }
 ticket(owner:string):SessionTicket|null{return this.available(owner)?Object.freeze({epoch:this.epoch,revision:this.revision,signal:this.lifetime.signal}):null;}
 isCurrent(owner:string,ticket:SessionTicket){return this.available(owner)&&ticket.signal===this.lifetime.signal&&!ticket.signal.aborted&&ticket.epoch===this.epoch&&ticket.revision===this.revision;}
 update(owner:string,event:SessionUpdate):UpdateResult{
  if(!this.available(owner))return 'unavailable';
  if(!event||!validId(event.id)||!FIELDS.some(([id])=>id===event.field)||!validInteger(event.epoch)||!validInteger(event.baseRevision)||!validInteger(event.sequence)||typeof event.value!=='string'||event.value.length>160||!event.value.trim()||!['tentative','confirmed'].includes(event.status)||!['speech','text','touch'].includes(event.origin))return 'invalid';
  if(event.epoch!==this.epoch)return 'stale';
  if(this.operations.has(event.id))return 'duplicate';
  const note=this.notes[event.field];
  if(event.baseRevision!==note.revision||event.sequence<=note.sequence)return 'stale';
  if(this.operations.size>=256)return 'limit';
  this.operations.add(event.id);
  this.notes[event.field]=Object.freeze({value:event.value.trim(),status:event.status,origin:event.origin,scope:'session',revision:note.revision+1,sequence:event.sequence});
  this.lastActivity=this.observedTime;this.revision++;this.notify();return 'applied';
 }
 /** Cancel is represented by never submitting an update. Clear is explicit and
  * invalidates every prior epoch, including an otherwise unused operation ID. */
 clear(owner:string){
  if(!this.available(owner))return false;
  const old=this.lifetime;this.lifetime=new AbortController();this.epoch++;this.revision++;this.notes=empty();this.operations.clear();this.lastActivity=this.observedTime;old.abort();this.notify();return true;
 }
 end(owner:string){if(owner!==this.owner)return false;this.finish('ended');return true;}
 disconnect(owner:string){if(!this.available(owner))return false;this.disconnectedAt=this.observedTime;this.state='disconnected';this.lifetime.abort();this.notify();return true;}
 reconnect(owner:string){
  this.available(owner);if(owner!==this.owner||this.state!=='disconnected')return false;
  this.state='active';this.disconnectedAt=null;this.lifetime=new AbortController();this.epoch++;this.revision++;this.notify();return true;
 }
 /** Returns an explicit projection only. Calling this never saves a profile. */
 selectedPreferences(owner:string,fields:readonly Field[]):Readonly<Partial<Record<Field,string>>>|null{
  if(!this.available(owner)||!Array.isArray(fields))return null;
  const selected=fields as readonly Field[];
  if(selected.some(field=>!FIELDS.some(([id])=>id===field)||this.notes[field].status!=='confirmed'))return null;
  return Object.freeze(Object.fromEntries(selected.map(field=>[field,this.notes[field].value])));
 }
}
