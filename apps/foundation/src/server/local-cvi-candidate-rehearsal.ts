import {LocalLookFeedback} from '../feedback/local-look-feedback.ts';
import type {FeedbackKind,FeedbackTarget} from '../feedback/local-look-feedback.ts';
import {projectSampleLook} from '../looks/local-saved-looks.ts';
import type {SampleLook} from '../looks/local-saved-looks.ts';
import {checkLocalOutfit} from '../validation/local-outfit-validation.ts';
import type {ValidationFixture,ValidationPiece,Requirement,SemanticOutcome,HardCheck} from '../validation/local-outfit-validation.ts';
import type {SessionSnapshot} from '../session/styling-session.ts';
import type {createLocalCviNotebookContext} from './local-cvi-notebook-context.ts';
import {createLocalCviViewPort} from './local-cvi-view-port.ts';
import type {LocalConsultationVersion} from './local-cvi-view-port.ts';
/** Local rendering rehearsal only. This is not an owner, protected HTTP
 * publication, media authorization, provider or persistence port. */
export type SampleReference=Readonly<{epoch:number;fieldRevision:number;photoId:number;description:string;ownership:'owned'|'inspiration'}>;
export type CandidateFeedback=Readonly<{kind:FeedbackKind;target:FeedbackTarget;text:string}>;
export type CandidateBuildInput=Readonly<{version:LocalConsultationVersion;notes:SessionSnapshot;reference:SampleReference|null;previous:SampleLook|null;feedback:ReturnType<LocalLookFeedback['snapshot']>;changeTarget:string|null}>;
const exact=(x:unknown,keys:string[]):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')===[...keys].sort().join(',');
const int=(x:unknown)=>Number.isSafeInteger(x)&&Number(x)>=0;
const canonical=(v:unknown):unknown=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical((v as Record<string,unknown>)[k])])):v;
const same=(a:unknown,b:unknown)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const versionOk=(v:unknown):v is LocalConsultationVersion=>exact(v,['epoch','revision','nativeRevision','inputRevision'])&&Object.values(v).every(int)&&Number(v.epoch)>0;
export const sampleReferenceId=(r:SampleReference)=>`ref_${r.epoch}_${r.fieldRevision}_${r.photoId}`;
function captureReference(raw:unknown,notes:SessionSnapshot):SampleReference|null|false{
 if(raw===null)return null;
 if(!exact(raw,['epoch','fieldRevision','photoId','description','ownership'])||![raw.epoch,raw.fieldRevision,raw.photoId].every(int)||Number(raw.photoId)<1||typeof raw.description!=='string'||!raw.description.trim()||raw.description!==raw.description.trim()||raw.description.length>120||!['owned','inspiration'].includes(String(raw.ownership)))return false;
 const value=(raw.ownership==='owned'?'Owned: ':'Inspiration: ')+raw.description,note=notes.notes.wardrobe;
 if(raw.epoch!==notes.epoch||raw.fieldRevision!==note.revision||note.status!=='confirmed'||note.value!==value)return false;
 return Object.freeze({...raw}) as SampleReference;
}
function fixtureFor(notes:SessionSnapshot,look:SampleLook,pieces:readonly ValidationPiece[],reference:SampleReference|null,feedbackRevision:number,serial:number):ValidationFixture|null{
 if(look.items.some(item=>item.owned&&(reference?.ownership!=='owned'||item.id!==sampleReferenceId(reference))))return null;
 if(!Array.isArray(pieces)||pieces.length!==look.items.length||look.items.some(item=>{const p=pieces.find(p=>p?.id===item.id);return !p||p.owned!==item.owned||p.priceCents!==item.priceCents;}))return null;
 const main=look.items.find(p=>p.slot==='main');if(!main)return null;
 const requirements:Requirement[]=[];
 for(const field of ['occasion','season','color','style','lookType'] as const){const n=notes.notes[field];if(n.status==='confirmed'){if(n.value.length>120)return null;requirements.push({id:'note_'+field,scope:n.scope==='saved-profile'?'saved':'session',confirmed:true,pieceId:main.id,attribute:'note_'+field,operator:'is',value:n.value});}}
 const budgetNote=notes.notes.budget,b=budgetNote.status==='confirmed'?/^USD (\d+)(?:\.(\d{1,2}))? maximum \(items only\)$/.exec(budgetNote.value):null;
 const cents=b?Number(b[1])*100+Number((b[2]??'').padEnd(2,'0')):NaN;
 return {synthetic:true,sessionId:'local_rehearsal',active:true,revision:notes.revision,profileRevision:0,referenceRevision:reference?.fieldRevision??0,feedbackRevision,candidateId:look.id,candidateRevision:serial,pieces,requirements,exceptions:[],requiredPieceIds:reference?.ownership==='owned'?[sampleReferenceId(reference)]:[],budget:Number.isSafeInteger(cents)&&cents>=0&&cents<=100_000_000?{cents,currency:'USD',basis:'items'}:null,shippingCents:null,taxCents:null};
}
export function createLocalCviCandidateRehearsal(options:Readonly<{
 simulation:true;context:ReturnType<typeof createLocalCviNotebookContext>;request:Request;clock:()=>number;
 build(input:CandidateBuildInput,signal:AbortSignal):Promise<unknown>;
 facts(look:SampleLook,signal:AbortSignal):Promise<readonly ValidationPiece[]>;
 semantic(look:SampleLook,input:CandidateBuildInput,signal:AbortSignal):Promise<SemanticOutcome>;
}>){
 if(options?.simulation!==true||typeof options.clock!=='function'||['build','facts','semantic'].some(k=>typeof(options as any)[k]!=='function'))throw Error('Local candidate rehearsal unavailable');
 const context=options.context,request=new Request(options.request),view=createLocalCviViewPort(context,request),clock=options.clock,build=options.build.bind(options),facts=options.facts.bind(options),semantic=options.semantic.bind(options),feedback=new LocalLookFeedback({clock});
 let state:'idle'|'checking'|'sample'|'held'|'ended'='idle',message='No shared sample prepared.',accepted:LocalConsultationVersion|null=null,observed:LocalConsultationVersion|null=null,reference:SampleReference|null=null,wardrobeRevision=-1,changeTarget:string|null=null,serial=0,inputSerial=0,generation=0,busy=false,closed=false,observedTime=-1;
 let operation:AbortController|undefined,hard:HardCheck|null=null,verdict:SemanticOutcome|'pending'='unknown',validation:ValidationFixture|null=null;
 const reset=()=>{generation++;operation?.abort();operation=undefined;accepted=null;observed=null;reference=null;wardrobeRevision=-1;changeTarget=null;hard=null;validation=null;verdict='unknown';feedback.clear();state=closed?'ended':'idle';message='Shared temporary sample and feedback cleared.';};
 const unsubscribe=context.onReset(reset);
 const now=()=>{const n=clock();if(!int(n)||n<observedTime)throw Error();observedTime=n;return n;};
 const held=(text='Shared sample could not be verified.')=>{if(closed)return;feedback.invalidateContext();state='held';hard=null;validation=null;verdict='unknown';message=text;};
 const snapshot=()=>Object.freeze({state,version:observed?Object.freeze({...observed}):null,look:state==='sample'?feedback.snapshot().look:null,sampleRevision:state==='sample'&&validation?validation.candidateRevision:null,feedback:feedback.snapshot(),reference,hard,semantic:verdict,message,releaseEnabled:false as const,audioEnabled:false as const,shoppingEnabled:false as const});
 const read=async(signal:AbortSignal)=>{
  if(signal.aborted||closed)return null;
  const envelope=await view.consultationSnapshot(signal);if(signal.aborted||!envelope)return null;
  const {notes,version}=envelope;if(notes.state!=='active'||!versionOk(version)||notes.epoch!==version.epoch||notes.revision!==version.revision)return null;
  if(observed&&(version.epoch<observed.epoch||version.revision<observed.revision||version.nativeRevision<observed.nativeRevision||version.inputRevision<observed.inputRevision))return null;
  if(observed&&!same(observed,version)){
   if(version.epoch!==observed.epoch||wardrobeRevision!==notes.notes.wardrobe.revision){feedback.clear();reference=null;changeTarget=null;}else feedback.invalidateContext();
   validation=null;hard=null;verdict='unknown';state='held';message='Shared context changed. Fresh sample checks are required.';
  }
  observed=version;return {notes,version};
 };
 const bounded=async<T>(external:AbortSignal,work:(signal:AbortSignal,current:()=>boolean)=>Promise<T>):Promise<T|null>=>{
  if(closed||busy||external.aborted)return null;busy=true;
  const controller=new AbortController(),signal=controller.signal,relay=()=>controller.abort(),mine=generation,started=performance.now();operation=controller;external.addEventListener('abort',relay,{once:true});
  const current=()=>!closed&&!signal.aborted&&mine===generation&&performance.now()-started<8000;
  let rejectAbort:(()=>void)|undefined;const timer=setTimeout(()=>controller.abort(),8000);
  try{return await Promise.race([Promise.resolve().then(()=>work(signal,current)),new Promise<never>((_,reject)=>{rejectAbort=()=>reject(Error());signal.addEventListener('abort',rejectAbort,{once:true});if(external.aborted)controller.abort();})]);}
  catch{if(mine===generation)held();return null;}
  finally{if(mine===generation&&(signal.aborted||performance.now()-started>=8000))held();clearTimeout(timer);external.removeEventListener('abort',relay);if(rejectAbort)signal.removeEventListener('abort',rejectAbort);if(operation===controller)operation=undefined;busy=false;}
 };
 return Object.freeze({
  async snapshot(signal:AbortSignal){return bounded(signal,async(s,current)=>{const live=await read(s);if(!current())return null;if(!live){held();return null;}accepted=live.version;wardrobeRevision=live.notes.notes.wardrobe.revision;if(validation){hard=checkLocalOutfit(validation,now(),60_000);if(hard.status!=='pass'){state='held';message='Sample facts are no longer current.';}}return snapshot();});},
  async prepare(command:unknown,signal:AbortSignal){
   let c:unknown;try{c=structuredClone(command);}catch{return null;}
   return bounded(signal,async(s,current)=>{
    const live=await read(s);if(!current())return null;if(!live||!exact(c,['expected','reference'])||!versionOk(c.expected)||!same(c.expected,live.version)){held();return null;}
    const ref=captureReference(c.reference,live.notes);if(ref===false){held('Review the shared sample reference.');return snapshot();}
    if(reference&&!same(reference,ref)){held('A different photo needs a new accepted wardrobe revision.');return snapshot();}
    const previous=feedback.snapshot().look;if(feedback.snapshot().entries.some(entry=>!entry.confirmed)){held('Confirm the exact feedback target before checking.');return snapshot();}
    const reuse=!!(previous&&!changeTarget&&validation&&same(accepted,live.version)&&state==='sample');
    const ticket=previous&&changeTarget?feedback.beginChange(changeTarget):null;
    if(previous&&changeTarget&&!ticket){held('The kept or owned piece cannot be changed, or three change attempts were used.');return snapshot();}
    if(serial>=32){held('Local sample preparation limit reached.');return snapshot();}
    const input:CandidateBuildInput=Object.freeze({version:live.version,notes:live.notes,reference:ref,previous,feedback:feedback.snapshot(),changeTarget});state='checking';verdict='pending';validation=null;hard=null;message='Checking one shared illustrated sample.';
    const look=reuse?previous:projectSampleLook(structuredClone(await build(input,s)));if(!current())return null;if(!look){held();return null;}
    const evidence=structuredClone(await facts(look,s));if(!current())return null;
    const f=fixtureFor(live.notes,look,evidence,ref,input.feedback.revision,++serial);if(!f){held();return snapshot();}
    hard=checkLocalOutfit(f,now(),60_000);if(hard.status!=='pass'){state='held';verdict='unknown';message='Independent sample facts or budget checks did not pass.';return snapshot();}
    const v=await semantic(look,input,s);if(!current())return null;verdict=['pass','unknown','blocked','refused','timeout'].includes(v)?v:'unknown';
    const final=await read(s);if(!current())return null;if(!final||!same(live.version,final.version)){held();return null;}
    if(verdict!=='pass'){state='held';message='The separate simulated semantic check did not pass.';return snapshot();}
    hard=checkLocalOutfit(f,now(),60_000);if(hard.status!=='pass'){state='held';message='Sample facts changed or expired during checking.';return snapshot();}
    if(previous&&ticket){
     const replacement=look.items.find(p=>p.id!==changeTarget&&!previous.items.some(old=>old.id===p.id));
     const expected=replacement?projectSampleLook({...previous,items:previous.items.map(p=>p.id===changeTarget?replacement:p),estimate:look.estimate}):null;
     if(!replacement||!expected||!same(expected,look)||!feedback.completeChange(ticket,replacement)){held('Sample change would replace a protected piece or change the wrong item.');return snapshot();}
    }else if(previous){if(!same(previous,look)){held('Choose an exact sample item before replacing it.');return snapshot();}}
    else if(!feedback.open(look)){held();return null;}
    if(!current())return null;accepted=live.version;reference=ref;wardrobeRevision=live.notes.notes.wardrobe.revision;validation=f;changeTarget=null;state='sample';message='Illustrated shared sample only. Real recommendation, audio and shopping remain unavailable.';return snapshot();
   });
  },
  async feedback(command:unknown,signal:AbortSignal){
   let c:unknown;try{c=structuredClone(command);}catch{return null;}
   return bounded(signal,async(s,current)=>{
    const live=await read(s),look=feedback.snapshot().look;
    if(!current())return null;if(!live||!look||!exact(c,['expected','kind','target','text'])||!versionOk(c.expected)||!same(c.expected,live.version)){held();return null;}
    const input={kind:c.kind,target:c.target,text:c.text,origin:'touch' as const} as Parameters<LocalLookFeedback['add']>[0];
    const trial=new LocalLookFeedback({clock});if(!trial.open(look)||!trial.add(input)||input.target.kind==='ambiguous'){held('Choose a valid sample feedback target.');return snapshot();}
    if(inputSerial>=64){held('Local feedback input limit reached.');return snapshot();}
    const turn=await context.beginProposal(new Request(request),'sample_item_feedback_'+(++inputSerial),s);if(!current())return null;if(!turn){held();return null;}
    const applied=await context.acceptProposal(new Request(request),turn,0,[],true,s);if(!current())return null;if(applied?.status!=='accepted'){held();return null;}
    const final=await read(s);if(!current())return null;if(!final||final.version.epoch!==live.version.epoch||final.version.revision!==live.version.revision||final.version.nativeRevision!==live.version.nativeRevision||final.version.inputRevision<=live.version.inputRevision||!feedback.add(input)){held();return null;}
    accepted=final.version;wardrobeRevision=final.notes.notes.wardrobe.revision;validation=null;hard=null;verdict='unknown';changeTarget=input.kind==='change'&&(input.target.kind==='item'||input.target.kind==='attribute')?input.target.itemId:null;state='held';message='Item-scoped feedback accepted. Fresh sample checks are required.';return snapshot();
   });
  },
  close(){if(closed)return;closed=true;reset();unsubscribe();feedback.end();},
 });
}
