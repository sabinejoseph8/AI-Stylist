import {FIELDS} from '../../../../packages/style-contracts/src/index.ts';
import type {LocalPrivacy} from './local-privacy.ts';
import type {LocalConsultationView} from '../session/local-consultation-view.ts';
import type {LocalConsultationReference} from '../media/local-consultation-reference.ts';
/** Explicit local sample projection only. No second notebook, account or upload. */
export function bindLocalConsultationPrivacy(privacy:LocalPrivacy,view:LocalConsultationView,reference?:LocalConsultationReference){
 if(reference&&!reference.matches(view))throw Error('Shared sample privacy unavailable');
 const session=privacy.bind('session',{
  read:()=>{
   const s=view.snapshot(),media=reference?.snapshot();
   if(s.state!=='ready'||s.busy||s.inputPending||!s.inputAvailable||!s.session||media?.loading||media?.pending)throw Error('Current shared sample is unavailable');
   const photos=reference?.exportPhotos()??[];
   return{data:{notes:FIELDS.map(([field,label])=>({field,label,value:s.session!.notes[field].value,status:s.session!.notes[field].status})),reference:media?.reference?{description:media.reference.description,ownership:media.reference.ownership,photoId:'session_photo_'+media.reference.photo.id}:null},photos:photos.map(photo=>({id:'session_photo_'+photo.id,blob:photo.blob}))};
  },
  clearAsync:()=>view.clear(),
 });
 const preferences=privacy.bind('preferences',{
  read:()=>{const saved=view.snapshot().saved;return{data:Object.fromEntries((['color','style','budget','lookType'] as const).filter(field=>saved[field]!==undefined).map(field=>[field,saved[field]])),photos:[]};},
  clear:()=>view.clearSavedPreferences(),
 });
 const stopView=view.subscribe(()=>privacy.invalidate()),stopReference=reference?.subscribe(()=>privacy.invalidate());
 return()=>{stopView();stopReference?.();session();preferences();privacy.cancel();};
}
