import {projectSampleLook} from '../looks/local-saved-looks.ts';
import type {SampleLook} from '../looks/local-saved-looks.ts';
import type {LocalConsultationView} from './local-consultation-view.ts';
import type {LocalConsultationReference} from '../media/local-consultation-reference.ts';
import type {CandidateFeedback} from '../server/local-cvi-candidate-rehearsal.ts';
type Version=Readonly<{epoch:number;revision:number;nativeRevision:number;inputRevision:number}>;
export type CandidateProjection=Readonly<{version:Version;look:SampleLook|null;sampleRevision:number|null;history:readonly SampleLook[];keptIds:readonly string[];message:string}>;
export type CandidatePort=Readonly<{snapshot(signal:AbortSignal):Promise<unknown>;prepare(command:unknown,signal:AbortSignal):Promise<unknown>;feedback(command:unknown,signal:AbortSignal):Promise<unknown>}>;
/** UI replica only. It owns neither notebook facts nor feedback decisions. */
export class LocalConsultationCandidate {
 private value:CandidateProjection|null=null;private busy=false;private generation=0;private abort:AbortController|null=null;private disposed=false;
 private sampleFloor=0;private sampleFingerprint='';
 private floor:Version|null=null;private listeners=new Set<()=>void>();private stop:()=>void;private port:CandidatePort;
 private namespace=crypto.randomUUID().replaceAll('-','');
 private view:LocalConsultationView;private reference?:LocalConsultationReference;
 constructor(view:LocalConsultationView,port:CandidatePort,reference?:LocalConsultationReference){
  this.view=view;this.reference=reference;
  this.port=Object.freeze({snapshot:port.snapshot.bind(port),prepare:port.prepare.bind(port),feedback:port.feedback.bind(port)});
  this.stop=view.subscribe(()=>{const s=view.snapshot();if(s.busy||s.state!=='ready'||this.value&&(s.session?.epoch!==this.value.version.epoch||s.session.revision!==this.value.version.revision))this.invalidate();});
 }
 matches(view:LocalConsultationView){return view===this.view;}
 subscribe(fn:()=>void){this.listeners.add(fn);return()=>{this.listeners.delete(fn);};}
 snapshot(){return Object.freeze({value:this.value,busy:this.busy});}
 private publish(){for(const f of [...this.listeners])try{f();}catch{}}
 private invalidate(){this.generation++;this.abort?.abort();this.abort=null;this.busy=false;this.value=null;this.publish();}
 private accept(raw:any){
  const s=this.view.snapshot(),v=raw?.version;
  if(s.state!=='ready'||s.busy||!s.session||!v||Object.keys(v).sort().join(',')!=='epoch,inputRevision,nativeRevision,revision'||!Object.values(v).every(n=>Number.isSafeInteger(n)&&Number(n)>=0)||v.epoch!==s.session.epoch||v.revision!==s.session.revision||raw.releaseEnabled!==false||raw.audioEnabled!==false||raw.shoppingEnabled!==false||!['idle','checking','sample','held','ended'].includes(raw.state))return false;
  if(this.floor&&Object.keys(v).some(k=>v[k]<this.floor![k as keyof Version]))return false;
  let look:SampleLook|null=null;
  if(raw.state==='sample'){
   if(raw.hard?.status!=='pass'||raw.semantic!=='pass'||!Number.isSafeInteger(raw.sampleRevision)||raw.sampleRevision<1||!(look=projectSampleLook(raw.look)))return false;
   const fingerprint=JSON.stringify(look);if(raw.sampleRevision<this.sampleFloor||raw.sampleRevision===this.sampleFloor&&fingerprint!==this.sampleFingerprint)return false;
  }else if(raw.look!==null||raw.sampleRevision!==null)return false;
  const history:SampleLook[]=[];if(!Array.isArray(raw.feedback?.history)||raw.feedback.history.length>4||!Array.isArray(raw.feedback.keptIds)||raw.feedback.keptIds.some((id:unknown)=>typeof id!=='string'||id.length>48))return false;
  for(const h of raw.feedback.history){const prior=projectSampleLook(h?.look);if(!prior)return false;history.push(prior);}
  if(look){this.sampleFloor=raw.sampleRevision;this.sampleFingerprint=JSON.stringify(look);}
  this.floor=Object.freeze({...v});this.value=Object.freeze({version:this.floor!,look,sampleRevision:look?raw.sampleRevision:null,history:Object.freeze(history),keptIds:Object.freeze([...raw.feedback.keptIds]),message:look?'Checked illustrated sample only. Real recommendations, audio and shopping are unavailable.':'Shared sample needs fresh checks.'});return true;
 }
 async run(feedback?:CandidateFeedback){
  const s=this.view.snapshot();if(this.disposed||this.busy||s.state!=='ready'||s.busy)return false;
  const previous=this.value;
  const mine=this.generation,abort=new AbortController();this.abort=abort;this.busy=true;this.value=null;this.publish();
  const wait=(work:Promise<unknown>)=>Promise.race([work,new Promise<never>((_,reject)=>{const fn=()=>reject(Error());abort.signal.addEventListener('abort',fn,{once:true});if(abort.signal.aborted)fn();})]);
  const timer=setTimeout(()=>abort.abort(),8000),current=()=>!this.disposed&&!abort.signal.aborted&&mine===this.generation;
  try{
   // An existing observed version is only an expected-version precondition.
   // Each server mutation still performs fresh original admission and comparison.
   if(previous)this.value=previous;else{const raw=await wait(this.port.snapshot(abort.signal));if(!current()||!this.accept(raw))throw Error();}
   if(!current())throw Error();
   if(feedback){const updated=await wait(this.port.feedback({...feedback,expected:this.value!.version},abort.signal));if(!current()||!this.accept(updated))throw Error();}
   const notes=this.view.snapshot().session!,r=this.reference?.snapshot().reference;
   const ref=r?{epoch:notes.epoch,fieldRevision:notes.notes.wardrobe.revision,photoId:r.photo.id,description:r.description,ownership:r.ownership}:null;
   const checked=await Promise.race([this.port.prepare({expected:this.value!.version,reference:ref},abort.signal),new Promise<never>((_,reject)=>abort.signal.addEventListener('abort',()=>reject(Error()),{once:true}))]);
   if(!current()||!this.accept(checked))throw Error();return !!this.snapshot().value?.look;
  }catch{if(mine===this.generation)this.value=null;return false;}
  finally{clearTimeout(timer);if(mine===this.generation){this.busy=false;this.abort=null;this.publish();}}
 }
 savedProjection(){const s=this.view.snapshot(),v=this.value;if(this.busy||s.busy||s.state!=='ready'||!v?.look||v.version.epoch!==s.session?.epoch||v.version.revision!==s.session.revision)return null;return projectSampleLook({...v.look,id:`sample_${this.namespace}_${v.sampleRevision}`});}
 dispose(){if(this.disposed)return;this.disposed=true;this.stop();this.invalidate();this.listeners.clear();}
}
