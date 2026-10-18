import {ConnectionProbeAdmission} from './cvi-connection-probe-contract.ts';
type Room={id:string;url:string;token:string};
export type ConnectionProbeProvider={create:()=>Promise<Room>;end:(id:string)=>Promise<void>;isEnded:(id:string)=>Promise<boolean>};
/** Explicit operator activation/preflight stays outside this disabled session.
 * One durable admission before create, no retries, absolute deadline before create.
 * The caller schedules tick() at least once a second and on every request. */
export class ConnectionProbeSession{
 private state:'unused'|'starting'|'active'|'stopping'|'ended'|'held'='unused';
 private reservation:string|null=null;
 private room:Room|null=null;
 private started=0;
 private heartbeatAt=0;
 private stopPromise:Promise<void>|null=null;
 private callbacks=0;
 private setup:Promise<void>|null=null;
 private readonly admission:ConnectionProbeAdmission;
 private readonly provider:ConnectionProbeProvider;
 private readonly now:()=>number;
 constructor(options:{admission:ConnectionProbeAdmission;provider:ConnectionProbeProvider;monotonicNow:()=>number}){this.admission=options.admission;this.provider=options.provider;this.now=options.monotonicNow;}
 snapshot(){return{state:this.state,callbackCount:this.callbacks,additionalCents:0 as const,maxRooms:1 as const,maxSeconds:300 as const};}
 async start(consent:boolean){
  if(!consent||this.state!=='unused')throw Error('Connection probe cannot start.');
  this.state='starting';this.started=this.now();this.heartbeatAt=this.started;
  try{
   this.setup=(async()=>{
    this.reservation=await this.admission.reserve();
    if(this.state!=='starting'||this.expired())throw Error('held');
    this.room=await this.provider.create();
    await this.admission.attachRoom(this.reservation,this.room.id);
   })();
   await this.setup;
   if(this.state!=='starting'||this.expired()||!this.room)throw Error('held');
   this.heartbeatAt=this.now();this.state='active';return{url:this.room.url,token:this.room.token};
  }catch{
   // Never retry create, even if the response or reservation acknowledgment was lost.
   await this.stop();throw Error('Connection probe stopped. No retry is available.');
  }
 }
 private expired(){const elapsed=this.now()-this.started;return !Number.isFinite(elapsed)||elapsed<0||elapsed>=270000;}
 heartbeat(){if(this.state!=='active'||this.expired()){void this.stop();return false;}this.heartbeatAt=this.now();return true;}
 tick(){if(['starting','active'].includes(this.state)&&(this.expired()||(this.state==='active'&&this.now()-this.heartbeatAt>=15000)))void this.stop();}
 admitCallback(){this.tick();if(this.state!=='active'||this.callbacks>=32)return false;this.callbacks++;return true;}
 stop(){
  if(this.stopPromise)return this.stopPromise;
  if(this.state==='ended'||this.state==='held')return Promise.resolve();
  this.state='stopping';
  this.stopPromise=(async()=>{
   if(this.setup)try{await this.setup;}catch{/* creation uncertainty remains held */}
   let ended=false;
   try{if(this.room){await this.provider.end(this.room.id);ended=await this.provider.isEnded(this.room.id);}}catch{/* fixed state only */}
   this.state=ended?'ended':'held';
   if(this.reservation)try{await this.admission.finish(this.reservation,ended?'ended':'held');}catch{this.state='held';}
  })();
  return this.stopPromise;
 }
}
