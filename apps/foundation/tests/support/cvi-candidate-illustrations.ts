/** Explicit synthetic catalog, generator and semantic ports. No real products,
 * providers, photos, accounts or release permissions. */
import {vi} from 'vitest';
import type {CandidateBuildInput} from '../../src/server/local-cvi-candidate-rehearsal.ts';
import {sampleReferenceId} from '../../src/server/local-cvi-candidate-rehearsal.ts';
import type {SampleLook,SamplePiece} from '../../src/looks/local-saved-looks.ts';
import type {ValidationPiece,SemanticOutcome} from '../../src/validation/local-outfit-validation.ts';
export const candidateNoteFixture=Object.freeze({occasion:'Outdoor wedding',season:'November',color:'Emerald',style:'Long sleeves',budget:'USD 350 maximum (items only)',lookType:'Full look',wardrobe:'Owned: Navy blazer'});
export function candidateIllustrationPorts(clock:()=>number){
 const dress:SamplePiece={id:'dress',name:'Illustrated emerald dress',slot:'main',color:'#176653',owned:false,priceCents:14000};
 const shoes=Array.from({length:4},(_,i):SamplePiece=>({id:'shoes_'+i,name:'Illustrated flat shoes '+i,slot:'shoes',color:'#3b3633',owned:false,priceCents:6000+i*100}));
 const catalog=new Map([dress,...shoes].map(p=>[p.id,p]));let outcome:SemanticOutcome='pass';
 const build=vi.fn(async(input:CandidateBuildInput):Promise<SampleLook>=>{
  if(input.previous&&!input.changeTarget)return input.previous;
  if(input.previous){const old=input.previous.items.find(p=>p.id===input.changeTarget);if(old?.slot!=='shoes')throw Error('Synthetic target unavailable');const replacement=shoes[input.feedback.round+1];if(!replacement)throw Error('Synthetic choices exhausted');const items=input.previous.items.map(p=>p.id===old.id?replacement:p);return {...input.previous,items,estimate:{...input.previous.estimate,subtotalCents:items.reduce((n,p)=>n+(p.owned?0:p.priceCents??0),0)}};}
  const items:SamplePiece[]=[dress];if(input.reference?.ownership==='owned')items.push({id:sampleReferenceId(input.reference),name:'Selected owned reference placeholder',slot:'layer',color:'#d8ceb9',owned:true,priceCents:0});items.push(shoes[0]);return {id:'sample_shared',title:'Shared illustrated sample',kind:'sample-only',items,estimate:{currency:'USD',date:'2026-10-16',subtotalCents:20000}};
 });
 const facts=vi.fn(async(look:SampleLook):Promise<readonly ValidationPiece[]>=>look.items.map(item=>{
  const source=item.owned?null:catalog.get(item.id);if(!item.owned&&!source)throw Error('Synthetic catalog item unavailable');const at=clock();return {id:item.id,owned:item.owned,sourceId:item.owned?null:'synthetic_source',productId:item.owned?null:source!.id,variantId:item.owned?null:'fixture_variant',priceCents:item.owned?0:source!.priceCents,checkedAt:at,facts:{availability:{value:'available',checkedAt:at},size:{value:'verified',checkedAt:at},delivery:{value:'verified',checkedAt:at},...(source?.slot==='main'?Object.fromEntries((['occasion','season','color','style','lookType'] as const).map(field=>['note_'+field,{value:candidateNoteFixture[field],checkedAt:at}])):{})}};
 }));
 const semantic=vi.fn(async()=>outcome);
 return {build,facts,semantic,setOutcome:(next:SemanticOutcome)=>{outcome=next;}};
}
