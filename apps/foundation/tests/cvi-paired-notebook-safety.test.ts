/** Genuine mandatory pair, actual SQLite/signatures; account and model are simulated. */
import {it,expect,vi} from 'vitest';
import {pairedOwnerFixture} from './support/cvi-paired-owner-fixture.ts';
import {isLocalCviStartedOwner} from '../src/server/local-cvi-startup-owner.ts';
const signal=()=>new AbortController().signal;
const request=()=>new Request('https://app.example.test/notebook',{headers:{authorization:'Bearer fixture-customer'}});
async function edit(x:Awaited<ReturnType<typeof pairedOwnerFixture>>,field:string,value:string){
 const s=await x.context.snapshot(request(),signal());expect(s).not.toBeNull();
 return x.context.edit(request(),{action:'edit',id:'paired-edit-'+field,epoch:s!.epoch,field:field as any,baseRevision:(s!.notes as any)[field].revision,sequence:(s!.notes as any)[field].sequence+1,value},signal());
}
it('all seven authenticated fields reach the genuine paired owner after a full-state write',async()=>{
 const x=await pairedOwnerFixture();try{
  const {owner,wire,say}=await x.start();
  const fields={occasion:'Outdoor wedding',season:'November',color:'Emerald',style:'Long sleeves',budget:'USD 350 maximum (items only)',lookType:'Full look',wardrobe:'I own a navy blazer'};
  for(const [field,value] of Object.entries(fields))expect(await edit(x,field,value)).toBe('applied');
  await x.write();await say('Long sleeves');const r=await wire.handle(x.http('Long sleeves'));expect(r.status).toBe(200);await r.text();
  const snapshot=x.draft.mock.calls[0][0];expect(snapshot.context.nativeRevision).toBe(6);expect(snapshot.notes.timing).toEqual({text:'November',confirmed:true});expect(snapshot.notes.budget.text).toBe(fields.budget);expect(Object.values(snapshot.notes).every((v:any)=>v.text.length>0)).toBe(true);expect(isLocalCviStartedOwner(owner)).toBe(true);
 }finally{await x.close();}
},60000);
it('a correction after paired response preparation blocks stale delivery and retains spent evidence',async()=>{
 const x=await pairedOwnerFixture();try{
  const {wire,say}=await x.start();await say('Short sleeves');const old=await wire.handle(x.http('Short sleeves'));expect(old.status).toBe(200);const before=await x.records();
  expect(await edit(x,'style','Long sleeves')).toBe('applied');await expect(old.text()).rejects.toThrow();expect(await x.records()).toEqual(before.map((r:any)=>({...r,status:'spent',spentAt:1000})));expect((await wire.handle(x.http('Short sleeves'))).status).not.toBe(200);
  await say('Long sleeves');const fresh=await wire.handle(x.http('Long sleeves','Earlier reply'));expect(fresh.status).toBe(200);expect(await fresh.text()).toContain('Long sleeves');expect((await x.records()).length).toBeGreaterThan(before.length);
 }finally{await x.close();}
},60000);
it.each(['clear','end'])('a genuine paired pending draft cannot restore notes or output after %s',async mode=>{
 const x=await pairedOwnerFixture();let resolve!:(text:string)=>void;try{
  const {owner,wire,transcript,say}=await x.start();await say('Long sleeves');x.draft.mockImplementation(()=>new Promise(r=>resolve=r));
  const pending=wire.handle(x.http('Long sleeves'));await vi.waitFor(()=>expect(resolve).toBeTypeOf('function'),{timeout:8000});const before=await x.records();expect(before.length).toBeGreaterThan(0);
  if(mode==='end')wire.close();else expect(await x.context.clear(request(),signal())).toBe(true);
  expect((await pending).status).not.toBe(200);resolve('STALE OUTPUT');await new Promise(r=>setTimeout(r,10));expect(Object.values(x.context.flow.snapshot().notes).every(n=>n.text==='')).toBe(true);expect(await x.records()).toEqual(mode==='clear'?before.map((r:any)=>({...r,status:'spent',spentAt:1000})):before);expect(x.draft).toHaveBeenCalledTimes(1);expect((await wire.handle(x.http('Long sleeves'))).status).not.toBe(200);
  if(mode==='end'){expect(isLocalCviStartedOwner(owner)).toBe(false);expect(transcript.currentInput()).toBeNull();}
 }finally{resolve?.('Canceled');await x.close();}
},60000);
