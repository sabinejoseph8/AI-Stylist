import {describe,it,expect,vi} from 'vitest';
import {createLocalCviStyling,CVI_FIELDS} from '../src/server/local-cvi-styling.ts';
import type {CviSimulationPorts,CviCheck} from '../src/server/local-cvi-styling.ts';
const text='Sample: choose the checked long-sleeved jacket.';
const ports=():CviSimulationPorts=>({draft:vi.fn(async()=>text),check:vi.fn(async(t,s)=>({approved:true,revision:s.revision,text:t}))});
const note=(field:typeof CVI_FIELDS[number]='coverage',seq=1)=>({id:`fixture-${seq}`,seq,field,text:'Long sleeves',confirmed:false});
const deferred=<T>()=>{let resolve!:(x:T)=>void;const promise=new Promise<T>(r=>resolve=r);return {promise,resolve};};
const tick=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
describe('disconnected full CVI styling experiment',()=>{
 it('buffers until both draft and independent check complete, then emits once',async()=>{
  const d=deferred<string>(),c=deferred<CviCheck>(),p=ports();p.draft=vi.fn(()=>d.promise);p.check=vi.fn(()=>c.promise);
  const app=createLocalCviStyling(p);app.note(note());let done=false;const request=app.prepare().then(x=>{done=true;return x;});
  await tick();expect(done).toBe(false);expect(p.check).not.toHaveBeenCalled();d.resolve(text);await tick();expect(done).toBe(false);
  c.resolve({approved:true,revision:1,text});const reply=await request;expect(reply.status).toBe('prepared');
  const wire=reply.takeSse()!;expect(JSON.parse(wire.split('\n')[0].slice(6)).choices[0].delta.content).toBe(text);
  expect(wire.endsWith('data: [DONE]\n\n')).toBe(true);expect(reply.takeSse()).toBeNull();
 });
 it('keeps all seven app-owned notes immutable and unconfirmed until explicit confirmation',()=>{
  const app=createLocalCviStyling(ports());CVI_FIELDS.forEach((f,i)=>expect(app.note(note(f,i+1))).toBe(true));
  const old=app.snapshot();expect(Object.keys(old.notes)).toEqual([...CVI_FIELDS]);expect(old.notes.coverage.confirmed).toBe(false);
  expect(Object.isFrozen(old.notes.coverage)).toBe(true);app.note({...note('coverage',8),confirmed:true});
  expect(old.notes.coverage.confirmed).toBe(false);expect(app.snapshot().notes.coverage.confirmed).toBe(true);
 });
 it.each(['duplicate','out-of-order','unknown-field','bad-id','bad-seq','empty','too-long','nonboolean'])('refuses %s normalized note input',kind=>{
  const app=createLocalCviStyling(ports());app.note(note());const x:any=note('coverage',2);
  if(kind==='duplicate')x.id='fixture-1';if(kind==='out-of-order')x.seq=0;if(kind==='unknown-field')x.field='season';
  if(kind==='bad-id')x.id='external';if(kind==='bad-seq')x.seq=NaN;if(kind==='empty')x.text=' ';
  if(kind==='too-long')x.text='x'.repeat(4001);if(kind==='nonboolean')x.confirmed='yes';
  expect(app.note(x)).toBe(false);expect(app.snapshot().revision).toBe(1);
 });
 it('bounds event history without dropping deduplication evidence',()=>{
  const app=createLocalCviStyling(ports());for(let i=1;i<=128;i++)expect(app.note(note('coverage',i))).toBe(true);
  expect(app.note(note('coverage',129))).toBe(false);
 });
 it.each(['interrupt','correction','end','replacement','cancel'])('suppresses late draft after %s',async kind=>{
  const d=deferred<string>(),p=ports();p.draft=()=>d.promise;const app=createLocalCviStyling(p),cancel=new AbortController();
  const pending=app.prepare(cancel.signal);await tick();
  if(kind==='interrupt')app.interrupt();if(kind==='correction')app.note(note());if(kind==='end')app.end();
  if(kind==='replacement'){p.draft=async()=>text;expect((await app.prepare()).status).toBe('prepared');}
  if(kind==='cancel')cancel.abort();expect((await pending).takeSse()).toBeNull();d.resolve('OLD unchecked');await tick();
  expect(p.check).toHaveBeenCalledTimes(kind==='replacement'?1:0);
 });
 it.each(['interrupt','correction','end','cancel'])('invalidates prepared but unsent reply on %s',async kind=>{
  const app=createLocalCviStyling(ports()),c=new AbortController(),reply=await app.prepare(c.signal);
  if(kind==='interrupt')app.interrupt();if(kind==='correction')app.note(note());if(kind==='end')app.end();if(kind==='cancel')c.abort();
  expect(reply.takeSse()).toBeNull();
 });
 it('suppresses a late check after correction and permits separately checked new output',async()=>{
  const c=deferred<CviCheck>(),p=ports();p.check=()=>c.promise;const app=createLocalCviStyling(p);const old=app.prepare();await tick();
  app.note(note());expect((await old).status).toBe('blocked');c.resolve({approved:true,revision:0,text});
  p.check=async(t,s)=>({approved:true,revision:s.revision,text:t});expect((await app.prepare()).takeSse()).toContain(text);
 });
 it.each(['rejected','wrong-revision','different-text','extra-field','null','throws'])('blocks %s checker outcome without generated fallback',async kind=>{
  const p=ports();p.check=async(t,s)=>{if(kind==='throws')throw Error('private provider error');
   if(kind==='null')return null as any;return {approved:kind!=='rejected',revision:s.revision+(kind==='wrong-revision'?1:0),
    text:kind==='different-text'?'unchecked':t,...(kind==='extra-field'?{fallback:'unsafe'}:{})} as CviCheck;};
  const result=await createLocalCviStyling(p).prepare();expect(result.status).toBe('blocked');expect(result.takeSse()).toBeNull();
 });
 it.each(['draft','check'])('times out hung %s and ignores late resolution',async stage=>{
  vi.useFakeTimers();try{const d=deferred<any>(),p=ports();if(stage==='draft')p.draft=()=>d.promise;else p.check=()=>d.promise;
   const result=createLocalCviStyling(p,20).prepare();await tick();await vi.advanceTimersByTimeAsync(21);
   expect((await result).status).toBe('blocked');d.resolve(stage==='draft'?text:{approved:true,revision:0,text});await tick();
  }finally{vi.useRealTimers();}
 });
 it.each(['',' ', 'x'.repeat(4001)])('blocks malformed draft before checker',async t=>{
  const p=ports();p.draft=async()=>t;expect((await createLocalCviStyling(p).prepare()).status).toBe('blocked');expect(p.check).not.toHaveBeenCalled();
 });
 it('redacts thrown drafts and emits nothing',async()=>{const p=ports();p.draft=async()=>{throw Error('secret');};expect((await createLocalCviStyling(p).prepare()).takeSse()).toBeNull();});
 it('encodes arbitrary approved text without extra SSE frames',async()=>{
  const p=ports();p.draft=async()=> 'sample\n\ndata: injected\n<script>fixture</script>';const wire=(await createLocalCviStyling(p).prepare()).takeSse()!;
  expect(wire.split('\n\n').filter(Boolean)).toHaveLength(3);
 });
 it('end clears notes and cannot be reopened',async()=>{const p=ports(),app=createLocalCviStyling(p);app.note(note());app.end();
  expect(Object.values(app.snapshot().notes).every(x=>x.text==='')).toBe(true);expect(app.note(note('coverage',2))).toBe(false);
  expect((await app.prepare()).status).toBe('blocked');expect(p.draft).not.toHaveBeenCalled();
 });
 it('refuses already canceled request without draft work',async()=>{const p=ports(),c=new AbortController();c.abort();expect((await createLocalCviStyling(p).prepare(c.signal)).status).toBe('blocked');expect(p.draft).not.toHaveBeenCalled();});
 it('does not claim recall of bytes already handed to a transport',async()=>{const app=createLocalCviStyling(ports());const wire=(await app.prepare()).takeSse();app.interrupt();expect(wire).toContain(text);});
 it.each([0,-1,8001,NaN,1.5])('refuses invalid deadline %s',n=>{expect(()=>createLocalCviStyling(ports(),n)).toThrow();});
});

import {checkLocalOutfit} from '../src/validation/local-outfit-validation.ts';
import type {ValidationFixture} from '../src/validation/local-outfit-validation.ts';
describe('composed synthetic journey with existing hard validator',()=>{
 it.each(['pass','over-budget','wrong-coverage','missing-price','unknown-semantic','unconfirmed-budget'])('handles %s without bypassing checks',async mode=>{
  const p=ports();let seenRevision=-1;
  p.check=async(t,s)=>{
   seenRevision=s.revision;
   const fixture:ValidationFixture={synthetic:true,sessionId:'sample_cvi',active:true,revision:s.revision,
    profileRevision:0,referenceRevision:0,feedbackRevision:0,candidateId:'sample_jacket',candidateRevision:1,
    pieces:[{id:'jacket',owned:false,sourceId:'sample_source',productId:'sample_product',variantId:'sample_medium',
     priceCents:mode==='missing-price'?null:mode==='over-budget'?40000:25000,checkedAt:1000,
     facts:{coverage:{value:mode==='wrong-coverage'?'short':'long',checkedAt:1000},
      availability:{value:'available',checkedAt:1000},size:{value:'verified',checkedAt:1000},delivery:{value:'verified',checkedAt:1000}}}],
    requirements:[{id:'long_sleeves',scope:'session',confirmed:s.notes.coverage.confirmed,pieceId:'jacket',attribute:'coverage',operator:'is',value:'long'}],
    exceptions:[],requiredPieceIds:['jacket'],budget:s.notes.budget.confirmed?{cents:35000,currency:'USD',basis:'items'}:null,
    shippingCents:null,taxCents:null};
   return {approved:checkLocalOutfit(fixture,1000,60000).status==='pass'&&mode!=='unknown-semantic',revision:s.revision,text:t};
  };
  const app=createLocalCviStyling(p);
  app.note({...note('occasion',1),text:'Outdoor wedding'});app.note({...note('timing',2),text:'November'});
  app.note({...note('coverage',3),text:'long',confirmed:true});
  app.note({...note('budget',4),text:'USD 350 maximum, items only',confirmed:mode!=='unconfirmed-budget'});
  const reply=await app.prepare();expect(seenRevision).toBe(4);expect(reply.takeSse()!==null).toBe(mode==='pass');
  expect(app.snapshot().notes.timing.text).toBe('November');app.interrupt();app.note({...note('color',5),text:'Blue',confirmed:true});
  expect(reply.takeSse()).toBeNull();app.end();expect(Object.values(app.snapshot().notes).every(x=>x.text==='')).toBe(true);
 });
});
