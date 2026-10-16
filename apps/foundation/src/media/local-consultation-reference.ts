import {LocalReferenceStore} from './local-reference.ts';
import type {LocalPhotoPorts,LocalReference,Ownership} from './local-reference.ts';
import type {LocalConsultationView} from '../session/local-consultation-view.ts';
/** Local sample reference only. Image bytes never enter the notebook port.
 * The accepted wardrobe field revision correlates the visible photo with its
 * explicitly supplied description/ownership; it is not recognition or auth. */
export class LocalConsultationReference {
 private readonly view:LocalConsultationView;
 private readonly store:LocalReferenceStore;
 private readonly stop:()=>void;
 private readonly stopPhotos:()=>void;
 private bound:{epoch:number;revision:number;photoId:number;value:string}|null=null;
 private pending=false;private generation=0;private disposed=false;
 private message='Choose a generated sample photo. No image is uploaded.';
 private listeners=new Set<()=>void>();
 constructor(view:LocalConsultationView,ports:LocalPhotoPorts){
  this.view=view;this.store=new LocalReferenceStore(Object.freeze({...ports}));
  this.stopPhotos=this.store.subscribe(()=>this.publish());
  this.stop=view.subscribe(()=>{
   const s=view.snapshot().session;
   if(!s){this.reset();return;}
   if(!this.pending&&this.bound&&(s.epoch!==this.bound.epoch||s.notes.wardrobe.revision!==this.bound.revision||s.notes.wardrobe.value!==this.bound.value))this.reset();
  });
 }
 matches(view:LocalConsultationView){return view===this.view;}
 subscribe(listener:()=>void){this.listeners.add(listener);return()=>{this.listeners.delete(listener);};}
 private publish(){for(const listener of [...this.listeners])try{listener();}catch{}}
 private active(){const s=this.view.snapshot();return !this.disposed&&!this.pending&&s.state==='ready'&&!s.busy&&!!s.session;}
 private accepted():LocalReference|null{
  const s=this.view.snapshot().session,r=this.store.snapshot().reference,b=this.bound;
  return !this.disposed&&!!s&&!!r&&!!b&&s.epoch===b.epoch&&s.notes.wardrobe.revision===b.revision&&s.notes.wardrobe.value===b.value&&s.notes.wardrobe.status==='confirmed'&&r.photo.id===b.photoId?r:null;
 }
 snapshot(){const p=this.store.snapshot();return Object.freeze({photos:p.photos,selected:p.selected,loading:p.loading,reset:p.reset,reference:this.accepted(),pending:this.pending,message:this.message});}
 private reset(){this.generation++;this.pending=false;this.bound=null;this.store.clear();this.message='Temporary reference cleared with the shared context.';this.publish();}
 async choose(files:readonly Blob[]){if(!this.active())return false;this.message='Preparing a photo locally. The accepted reference stays separate.';const ok=await this.store.choose(files);this.message=this.store.snapshot().message;this.publish();return ok;}
 select(id:number){if(!this.active())return false;return this.store.select(id);}
 async confirm(description:string,ownership:Ownership){
  const p=this.store.snapshot(),draft=this.view.beginEdit('wardrobe');
  if(!this.active()||!draft||p.loading||p.selected===null||typeof description!=='string'||!description.trim()||description.length>120||!['owned','inspiration'].includes(ownership))return false;
  const photoId=p.selected,generation=this.generation,currentPhoto=this.store.pendingInputGuard(),value=(ownership==='owned'?'Owned: ':'Inspiration: ')+description.trim();
  this.pending=true;this.message='Waiting for the shared notebook before confirming this photo.';this.publish();
  const result=await this.view.save(draft,value),s=this.view.snapshot().session;
  if(this.disposed||generation!==this.generation)return false;
  this.pending=false;
  if(result!=='applied'||!s||s.epoch!==draft.epoch||s.notes.wardrobe.value!==value||s.notes.wardrobe.status!=='confirmed'||s.notes.wardrobe.revision!==draft.baseRevision+1||s.notes.wardrobe.sequence!==draft.sequence||!currentPhoto()||this.store.snapshot().selected!==photoId||!this.store.confirm(description.trim(),ownership)){
   if(this.bound&&(s?.epoch!==this.bound.epoch||s?.notes.wardrobe.revision!==this.bound.revision))this.reset();
   this.message='Photo confirmation was not accepted. Review the current shared notes.';this.publish();return false;
  }
  this.bound=Object.freeze({epoch:s.epoch,revision:s.notes.wardrobe.revision,photoId,value});this.message='Photo and description confirmed for this shared sample session. Nothing was uploaded or saved to an account.';this.publish();return true;
 }
 async removeReference(){
  const reference=this.accepted(),draft=this.view.beginEdit('wardrobe');if(!this.active()||!reference||!draft)return false;
  this.pending=true;this.message='Removing the shared sample reference.';this.publish();const generation=this.generation;
  const result=await this.view.save(draft,'No confirmed session reference');if(this.disposed||generation!==this.generation)return false;this.pending=false;
  if(result!=='applied'){this.message='Reference removal was not confirmed.';this.publish();return false;}
  this.bound=null;this.store.remove(reference.photo.id);this.message='Shared sample reference removed. Separate saved samples are unchanged.';this.publish();return true;
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.stop();this.stopPhotos();this.reset();this.listeners.clear();}
}
