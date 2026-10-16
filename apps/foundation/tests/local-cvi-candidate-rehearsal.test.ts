/** Lower-flow unit fixtures only. No real owner, native store or provider. */
import {expect,it,vi} from 'vitest';
import {createLocalCviCandidateRehearsal,sampleReferenceId} from '../src/server/local-cvi-candidate-rehearsal.ts';
import type {SampleReference} from '../src/server/local-cvi-candidate-rehearsal.ts';
import {StylingSession} from '../src/session/styling-session.ts';
import {APPROVED_NOTES_RETENTION} from '../src/session/notes-retention-policy.ts';
import {FIELDS} from '../../../packages/style-contracts/src/index.ts';
import type {SampleLook} from '../src/looks/local-saved-looks.ts';
import type {ValidationPiece} from '../src/validation/local-outfit-validation.ts';
function fixture(){
 let time=1000,inputRevision=0,nativeRevision=6,round=0;const session=new StylingSession({simulation:true,owner:'sample',clock:()=>time,policy:APPROVED_NOTES_RETENTION}),resets=new Set<()=>void>();
 const values={occasion:'Outdoor wedding',season:'November',color:'Emerald',style:'Long sleeves',budget:'USD 350 maximum (items only)',lookType:'Full look',wardrobe:'Owned: Navy blazer'};
 for(const [field] of FIELDS)session.update('sample',{id:'initial_'+field,epoch:1,field,baseRevision:0,sequence:0,value:values[field],status:'confirmed',origin:'touch'});
 const ref:SampleReference={epoch:1,fieldRevision:1,photoId:1,description:'Navy blazer',ownership:'owned'};
 const auth=(r:Request)=>r.headers.get('authorization')==='Bearer fixture';
 const context:any={snapshot:async(r:Request)=>auth(r)?session.snapshot('sample'):null,flow:{snapshot:()=>{const s=session.snapshot('sample')!;const map={occasion:'occasion',season:'timing',color:'color',style:'coverage',budget:'budget',lookType:'lookType',wardrobe:'wardrobe'};return{revision:s.revision,context:{epoch:s.epoch,nativeRevision,inputRevision},notes:Object.fromEntries(FIELDS.map(([f])=>[(map as any)[f],{text:s.notes[f].value,confirmed:s.notes[f].status==='confirmed'}]))};}},onReset:(f:()=>void)=>{resets.add(f);return()=>{resets.delete(f);};},beginProposal:vi.fn(async(r:Request)=>{if(!auth(r))return null;inputRevision++;return{fixture:true};}),acceptProposal:vi.fn(async(r:Request,_t:unknown,_n:number,proposals:unknown[])=>auth(r)&&proposals.length===0?{status:'accepted'}:null)};
 const makeLook=(r=0):SampleLook=>({id:'sample_shared',title:'Shared illustrated sample',kind:'sample-only',items:[{id:'dress',name:'Illustrated emerald dress',slot:'main',color:'#176653',owned:false,priceCents:14000},{id:sampleReferenceId(ref),name:'Selected owned reference placeholder',slot:'layer',color:'#d8ceb9',owned:true,priceCents:0},{id:'shoes_'+r,name:'Illustrated flat shoes '+r,slot:'shoes',color:'#3b3633',owned:false,priceCents:6000+r*100}],estimate:{currency:'USD',date:'2026-10-16',subtotalCents:20000+r*100}});
 const build=vi.fn(async(input:any)=>makeLook(input.previous?++round:0));
 const facts=vi.fn(async(look:SampleLook):Promise<readonly ValidationPiece[]>=>look.items.map(item=>({id:item.id,owned:item.owned,sourceId:item.owned?null:'synthetic_source',productId:item.owned?null:item.id,variantId:item.owned?null:'fixture_variant',priceCents:item.priceCents,checkedAt:time,facts:{availability:{value:'available',checkedAt:time},size:{value:'verified',checkedAt:time},delivery:{value:'verified',checkedAt:time},...item.slot==='main'?Object.fromEntries((['occasion','season','color','style','lookType'] as const).map(field=>['note_'+field,{value:values[field],checkedAt:time}])):{}}})));
 const semantic=vi.fn(async()=> 'pass' as const),options={simulation:true as const,context,request:new Request('https://app.example.test/sample',{headers:{authorization:'Bearer fixture'}}),clock:()=>time,build,facts,semantic};
 const model=createLocalCviCandidateRehearsal(options),signal=()=>new AbortController().signal;
 const read=()=>model.snapshot(signal()),prepare=async()=>model.prepare({expected:(await read())!.version,reference:ref},signal());
 const clear=()=>{session.clear('sample');for(const f of resets)f();};
 return {model,session,context,ref,build,facts,semantic,makeLook,options,signal,read,prepare,clear,at:(n:number)=>time=n,native:()=>nativeRevision++,input:()=>inputRevision++,clock:()=>time};
}
it('one context reaches separate generation, fact and semantic checks with real release always disabled',async()=>{
 const x=fixture();try{const s=await x.prepare();expect(s).toMatchObject({state:'sample',releaseEnabled:false,audioEnabled:false,shoppingEnabled:false,hard:{status:'pass',knownSubtotalCents:20000}});expect(x.build.mock.calls[0][0].notes.notes.style.value).toBe('Long sleeves');expect(x.semantic).toHaveBeenCalledOnce();expect(s!.look!.items.find(p=>p.owned)?.priceCents).toBe(0);}finally{x.model.close();}
});
it('three item-scoped changes preserve kept dress, owned anchor and global notes',async()=>{
 const x=fixture();try{let s=(await x.prepare())!,notes=x.session.snapshot('sample')!;const anchor=s.look!.items.find(p=>p.owned),dress=s.look!.items[0];
 s=(await x.model.feedback({expected:s.version,kind:'keep',target:{kind:'item',itemId:'dress'},text:'Keep this dress'},x.signal()))!;
 // Rechecking a kept look does not manufacture a replacement.
 x.build.mockImplementationOnce(async()=>x.makeLook(0));s=(await x.model.prepare({expected:s.version,reference:x.ref},x.signal()))!;
 for(let i=1;i<=3;i++){const shoes=s.look!.items.find(p=>p.slot==='shoes')!;s=(await x.model.feedback({expected:s.version,kind:'change',target:{kind:'item',itemId:shoes.id},text:'Change these shoes'},x.signal()))!;s=(await x.model.prepare({expected:s.version,reference:x.ref},x.signal()))!;expect(s.state).toBe('sample');expect(s.look!.items[0]).toEqual(dress);expect(s.look!.items.find(p=>p.owned)).toEqual(anchor);expect(s.feedback.round).toBe(i);}
 expect(x.session.snapshot('sample')).toEqual(notes);expect(x.context.acceptProposal.mock.calls.every((call:any[])=>call[3].length===0)).toBe(true);
 }finally{x.model.close();}
});
it.each(['native','input'] as const)('%s-only changes hide old output even when note revision stays unchanged',async key=>{
 const x=fixture();try{await x.prepare();const revision=x.session.snapshot('sample')!.revision;x[key]();expect((await x.read())!.look).toBeNull();expect(x.session.snapshot('sample')!.revision).toBe(revision);}finally{x.model.close();}
});
it('a semantic pass cannot override independently conflicting facts or over-budget costs',async()=>{
 for(const reason of ['facts','budget']){const x=fixture();try{
 // Keep the independent source literal; a changed customer requirement must fail.
 const s=x.session.snapshot('sample')!,field=reason==='facts'?'color':'budget';x.session.update('sample',{id:'correction',epoch:s.epoch,field,baseRevision:s.notes[field].revision,sequence:s.notes[field].sequence+1,value:reason==='facts'?'Blue':'USD 1 maximum (items only)',status:'confirmed',origin:'touch'});
 const result=await x.prepare();expect(result!.state).toBe('held');expect(result!.look).toBeNull();expect(x.semantic).not.toHaveBeenCalled();}finally{x.model.close();}}
});
it('a mismatched generated reference or extra command fields are refused before generation',async()=>{
 const x=fixture();try{const v=(await x.read())!.version;expect((await x.model.prepare({expected:v,reference:{...x.ref,fieldRevision:2}},x.signal()))!.state).toBe('held');expect(await x.model.prepare({expected:v,reference:x.ref,release:true},x.signal())).toBeNull();expect(x.build).not.toHaveBeenCalled();}finally{x.model.close();}
});
it('unauthorized captured requests cannot read the shared candidate or generate',async()=>{
 const x=fixture();const other=createLocalCviCandidateRehearsal({...x.options,request:new Request('https://app.example.test/sample')});try{expect(await other.snapshot(x.signal())).toBeNull();expect(await other.prepare({expected:{epoch:1,revision:7,nativeRevision:6,inputRevision:0},reference:x.ref},x.signal())).toBeNull();expect(x.build).not.toHaveBeenCalled();}finally{other.close();x.model.close();}
});
it('Clear cancels pending generation and late data cannot recreate look or feedback',async()=>{
 const x=fixture();let done!:(v:SampleLook)=>void;try{x.build.mockImplementationOnce(()=>new Promise(r=>done=r));const pending=x.prepare();await vi.waitFor(()=>expect(done).toBeTypeOf('function'));x.clear();expect(await pending).toBeNull();done(x.makeLook());await Promise.resolve();const s=await x.read();expect(s!.look).toBeNull();expect(s!.feedback.entries).toEqual([]);}finally{x.model.close();}
});
it('a changed full version during semantic work refuses the old candidate',async()=>{
 const x=fixture();let done!:(v:'pass')=>void;try{x.semantic.mockImplementationOnce(()=>new Promise(r=>done=r));const pending=x.prepare();await vi.waitFor(()=>expect(done).toBeTypeOf('function'));x.input();done('pass');expect(await pending).toBeNull();expect((await x.read())!.look).toBeNull();}finally{x.model.close();}
});
it('invalid feedback cannot become global style or advance input admission',async()=>{
 const x=fixture();try{const s=(await x.prepare())!;expect((await x.model.feedback({expected:s.version,kind:'keep',target:{kind:'look'},text:'Keep everything'},x.signal()))!.state).toBe('held');expect(x.context.beginProposal).not.toHaveBeenCalled();expect(x.session.snapshot('sample')!.notes.style.value).toBe('Long sleeves');}finally{x.model.close();}
});

it.each(['unknown','blocked','refused','timeout'] as const)('separate semantic %s leaves the sample hidden',async outcome=>{
 const x=fixture();try{x.semantic.mockResolvedValueOnce(outcome as any);const s=await x.prepare();expect(s!.state).toBe('held');expect(s!.look).toBeNull();expect(s!.releaseEnabled).toBe(false);}finally{x.model.close();}
});
it('facts that expire during semantic checking cannot be published as a current sample',async()=>{
 const x=fixture();try{x.semantic.mockImplementationOnce(async()=>{x.at(61_000);return 'pass';});const s=await x.prepare();expect(s!.state).toBe('held');expect(s!.look).toBeNull();expect(s!.hard!.status).toBe('unknown');}finally{x.model.close();}
});
it('a new photo ID cannot replace the accepted reference at the same wardrobe revision',async()=>{
 const x=fixture();try{const s=(await x.prepare())!;const calls=x.build.mock.calls.length;const held=await x.model.prepare({expected:s.version,reference:{...x.ref,photoId:2}},x.signal());expect(held!.state).toBe('held');expect(x.build).toHaveBeenCalledTimes(calls);expect(held!.reference).toEqual(x.ref);}finally{x.model.close();}
});
it('kept and owned pieces cannot become a change target',async()=>{
 for(const id of ['dress','ref_1_1_1']){const x=fixture();try{let s=(await x.prepare())!;if(id==='dress')s=(await x.model.feedback({expected:s.version,kind:'keep',target:{kind:'item',itemId:id},text:'Keep it'},x.signal()))!;s=(await x.model.feedback({expected:s.version,kind:'change',target:{kind:'item',itemId:id},text:'Replace it'},x.signal()))!;const before=x.build.mock.calls.length;s=(await x.model.prepare({expected:s.version,reference:x.ref},x.signal()))!;expect(s.state).toBe('held');expect(x.build).toHaveBeenCalledTimes(before);}finally{x.model.close();}}
});
it('generated prices must match the separate fact source before semantics can pass',async()=>{
 const x=fixture();try{const original=x.facts.getMockImplementation()!;x.facts.mockImplementationOnce(async look=>(await original(look)).map(p=>({...p,priceCents:p.owned?0:1})));const s=await x.prepare();expect(s!.state).toBe('held');expect(x.semantic).not.toHaveBeenCalled();}finally{x.model.close();}
});
it('a stalled generation is bounded at eight seconds and late data stays hidden',async()=>{
 const x=fixture();let done!:(v:SampleLook)=>void;try{const v=(await x.read())!.version;x.build.mockImplementationOnce(()=>new Promise(r=>done=r));vi.useFakeTimers();const pending=x.model.prepare({expected:v,reference:x.ref},x.signal());await vi.advanceTimersByTimeAsync(8000);expect(await pending).toBeNull();done(x.makeLook());await Promise.resolve();vi.useRealTimers();expect((await x.read())!.look).toBeNull();}finally{vi.useRealTimers();x.model.close();}
});
it('a competing request is refused without canceling the original operation',async()=>{
 const x=fixture();let done!:(v:SampleLook)=>void;try{const expected=(await x.read())!.version;x.build.mockImplementationOnce(()=>new Promise(r=>done=r));const pending=x.model.prepare({expected,reference:x.ref},x.signal());await vi.waitFor(()=>expect(done).toBeTypeOf('function'));expect(await x.model.prepare({expected,reference:x.ref},x.signal())).toBeNull();done(x.makeLook());expect((await pending)!.state).toBe('sample');}finally{x.model.close();}
});
it('closing during work cancels it and cannot restart the terminal rehearsal',async()=>{
 const x=fixture();let done!:(v:SampleLook)=>void;x.build.mockImplementationOnce(()=>new Promise(r=>done=r));const pending=x.prepare();await vi.waitFor(()=>expect(done).toBeTypeOf('function'));x.model.close();expect(await pending).toBeNull();done(x.makeLook());expect(await x.read()).toBeNull();expect(await x.prepare().catch(()=>null)).toBeNull();
});

it('generation cannot invent owned status to avoid the independent purchase subtotal',async()=>{
 const x=fixture();try{x.build.mockImplementationOnce(async()=>{const look=x.makeLook();return {...look,items:look.items.map(p=>p.id==='dress'?{...p,owned:true,priceCents:0}:p),estimate:{...look.estimate,subtotalCents:6000}};});expect((await x.prepare())!.state).toBe('held');expect(x.semantic).not.toHaveBeenCalled();}finally{x.model.close();}
});
it('attribute changes retain their exact item target and never become global style notes',async()=>{
 const x=fixture();try{let s=(await x.prepare())!,style=x.session.snapshot('sample')!.notes.style;const shoes=s.look!.items.find(p=>p.slot==='shoes')!;s=(await x.model.feedback({expected:s.version,kind:'change',target:{kind:'attribute',itemId:shoes.id,attribute:'heel'},text:'Use another flat shoe'},x.signal()))!;s=(await x.model.prepare({expected:s.version,reference:x.ref},x.signal()))!;expect(s.state).toBe('sample');expect(x.build.mock.calls.at(-1)![0].changeTarget).toBe(shoes.id);expect(x.session.snapshot('sample')!.notes.style).toEqual(style);expect(s.feedback.entries[0].target).toEqual({kind:'attribute',itemId:shoes.id,attribute:'heel'});}finally{x.model.close();}
});
it('ambiguous touch targets are refused before any input admission',async()=>{
 const x=fixture();try{const s=(await x.prepare())!;expect((await x.model.feedback({expected:s.version,kind:'dislike',target:{kind:'ambiguous'},text:'Not that'},x.signal()))!.state).toBe('held');expect(x.context.beginProposal).not.toHaveBeenCalled();}finally{x.model.close();}
});

it('direct repeated preparation also rechecks freshness before returning an existing sample',async()=>{
 const x=fixture();try{const s=(await x.prepare())!,stale=await x.facts(s.look!);x.facts.mockResolvedValueOnce(stale);x.at(61_000);const result=await x.model.prepare({expected:s.version,reference:x.ref},x.signal());expect(result!.state).toBe('held');expect(result!.look).toBeNull();expect(x.build).toHaveBeenCalledOnce();}finally{x.model.close();}
});

it('JSON key ordering cannot reject the same expected version or reference',async()=>{
 const x=fixture();try{const first=(await x.prepare())!,v=first.version!,ref=x.ref;const expected={inputRevision:v.inputRevision,nativeRevision:v.nativeRevision,revision:v.revision,epoch:v.epoch},reference={ownership:ref.ownership,description:ref.description,photoId:ref.photoId,fieldRevision:ref.fieldRevision,epoch:ref.epoch};const next=await x.model.prepare({reference,expected},x.signal());expect(next!.state).toBe('sample');expect(x.build).toHaveBeenCalledOnce();}finally{x.model.close();}
});

it('rechecking the same version still calls the separate fact and semantic ports',async()=>{
 const x=fixture();try{let s=(await x.prepare())!;x.semantic.mockResolvedValueOnce('unknown' as any);s=(await x.model.prepare({expected:s.version,reference:x.ref},x.signal()))!;expect(s.state).toBe('held');expect(x.build).toHaveBeenCalledOnce();expect(x.facts).toHaveBeenCalledTimes(2);expect(x.semantic).toHaveBeenCalledTimes(2);}finally{x.model.close();}
});
it('newly unavailable source facts cannot reuse an earlier passing check',async()=>{
 const x=fixture();try{const s=(await x.prepare())!,source=await x.facts(s.look!);x.facts.mockResolvedValueOnce(source.map(p=>p.owned?p:{...p,facts:{...p.facts,availability:{value:'unavailable',checkedAt:x.clock()}}}));const result=await x.model.prepare({expected:s.version,reference:x.ref},x.signal());expect(result!.state).toBe('held');expect(result!.look).toBeNull();expect(x.semantic).toHaveBeenCalledOnce();}finally{x.model.close();}
});
