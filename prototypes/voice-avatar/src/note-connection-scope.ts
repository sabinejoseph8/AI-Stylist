import {FIELDS} from './notebook-state.ts';
import type {Field} from './notebook-state.ts';
import type {NoteSessionProbe} from './note-session-probe.ts';
export type NoteConnectionProbe=Pick<NoteSessionProbe,'audio'|'edit'|'confirm'|'beginTurn'|'commit'|'acknowledgeRendered'|'receive'|'end'|'disconnected'|'snapshot'>;
type Probe=NoteConnectionProbe;
type Lease={owner:object;id:string;probe:Probe;sequence:number;commands:number};
const object=(v:unknown):v is Record<string,unknown>=>Boolean(v)&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
/** Simulated, process-local connection ownership preparation only.
 * owner is an opaque server connection object, NEVER an identity from JSON.
 * A real endpoint must authenticate the upgrade and supply that exact object.
 * No endpoint, credentials, socket, reconnect, distributed lease or paid call.
 */
export class NoteConnectionScope {
 private lease:Lease|null=null;
 private used=new Set<string>();
 private closed=false;
 private held=false;
 private create:()=>Probe;
 private id:()=>string;
 constructor(options:{simulation?:boolean;create:()=>Probe;id?:()=>string}){
   if(options.simulation!==true)throw Error('Live note connections are disabled.');
   this.create=options.create;this.id=options.id??(()=>globalThis.crypto.randomUUID());
 }
 private reap(){
   const lease=this.lease;if(!lease||!lease.probe.snapshot().ended)return;
   const snapshot=lease.probe.snapshot();
   if(snapshot.reason==='cleanup-unverified'||snapshot.reason==='capture-cleanup-held'||snapshot.transcription?.cleanupFailed){this.held=true;return;}
   // Simulations have no remote resources. This is not remote cleanup evidence.
   this.lease=null;
 }
 open(owner:object):string|null{
   if(!object(owner))return null;this.reap();
   if(this.closed||this.held||this.lease||this.used.size>=256)return null;
   const id=this.id();if(typeof id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(id)||this.used.has(id))return null;
   // Reserve before construction: reentrant start cannot claim a second slot.
   this.used.add(id);this.held=true;
   try{const probe=this.create();this.lease={owner,id,probe,sequence:-1,commands:0};if(this.closed){this.stop(this.lease);return null;}this.held=false;this.reap();return this.lease?.id??null;}
   catch{return null;/* Construction cleanup is unknown: keep the slot held. */}
 }
 private owned(owner:object,id:unknown){
   this.reap();const lease=this.lease;
   return !this.closed&&!this.held&&lease&&lease.owner===owner&&lease.id===id?lease:null;
 }
 async command(owner:object,value:unknown):Promise<boolean>{
   if(!object(value))return false;
   const lease=this.owned(owner,value.sessionId);if(!lease)return false;
   const fields=value.type==='edit'?['version','sessionId','sequence','type','field','value','expectedRevision']:value.type==='confirm'?['version','sessionId','sequence','type','field','expectedRevision']:value.type==='begin'?['version','sessionId','sequence','type','turnId']:value.type==='rendered'?['version','sessionId','sequence','type','receipt']:['version','sessionId','sequence','type'];
   if(!exact(value,fields)||value.version!==1||!Number.isSafeInteger(value.sequence)||(value.sequence as number)<=lease.sequence||(lease.commands>=256&&value.type!=='end')
      ||!['begin','commit','rendered','edit','confirm','end'].includes(value.type as string))return false;
   if(value.type==='begin'&&(typeof value.turnId!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(value.turnId)))return false;
   if(value.type==='rendered'&&(!Number.isSafeInteger(value.receipt)||(value.receipt as number)<1))return false;
   if(['edit','confirm'].includes(value.type as string)&&(!FIELDS.some(([id])=>id===value.field)||!Number.isSafeInteger(value.expectedRevision)||(value.expectedRevision as number)<0))return false;
   if(value.type==='edit'&&(typeof value.value!=='string'||value.value.length>160))return false;
   lease.sequence=value.sequence as number;lease.commands++;
   try{
     let accepted=false;
     if(value.type==='begin')accepted=await lease.probe.beginTurn(value.turnId as string);
     else if(value.type==='edit')accepted=lease.probe.edit(value.field as Field,value.value as string,value.expectedRevision as number);
     else if(value.type==='confirm')accepted=lease.probe.confirm(value.field as Field,value.expectedRevision as number);
     else if(value.type==='commit')accepted=lease.probe.commit();
     else if(value.type==='rendered')accepted=lease.probe.acknowledgeRendered(value.receipt as number);
     else{lease.probe.end();this.reap();return true;}
     this.reap();return this.lease===lease&&!this.closed&&!this.held&&accepted;
   }catch{this.stop(lease);return false;}
 }
 /** Binary audio is authorized by the same opaque connection as commands. */
 audio(owner:object,id:string,frame:ArrayBuffer):boolean{
   const lease=this.owned(owner,id);if(!lease)return false;
   try{const accepted=lease.probe.audio(frame);this.reap();return this.lease===lease&&!this.held&&accepted;}
   catch{this.stop(lease);return false;}
 }
 /** Called only by the server's provider callback bound to this connection. */
 receive(owner:object,id:string,event:unknown):boolean{
   const lease=this.owned(owner,id);if(!lease)return false;
   try{const accepted=lease.probe.receive(event);this.reap();return this.lease===lease&&!this.held&&accepted;}
   catch{this.stop(lease);return false;}
 }
 disconnect(owner:object,id:string):boolean{
   const lease=this.owned(owner,id);if(!lease)return false;
   try{lease.probe.disconnected();this.reap();return true;}catch{this.held=true;return false;}
 }
 private stop(lease:Lease){try{lease.probe.end();this.reap();}catch{this.held=true;}}
 close(){if(this.closed)return;this.closed=true;if(this.lease)this.stop(this.lease);}
 snapshot(){this.reap();return{active:Boolean(this.lease),held:this.held,closed:this.closed,sessionsCreated:this.used.size,liveEnabled:false as const};}
}
