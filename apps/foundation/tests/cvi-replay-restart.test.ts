import {it,expect} from 'vitest';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,unlink,readFile,writeFile,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {call,fixtureDigest} from './support/cvi-replay-process.ts';
async function setup(limit=64){const root=await mkdtemp(join(tmpdir(),'stylist-cvi-replay-'));const {storeId}=await call(root,'prepare',{bindingDigest:fixtureDigest,limit}) as {storeId:string};return {root,storeId,close:()=>rm(root,{recursive:true,force:true})};}
function probe(root:string,storeId:string,mode='complete',id='fixture-one'){
 return new Promise<{code:number|null;value?:{status:number;draftCalls:number;released:boolean}}>((resolve,reject)=>{
  const c=spawn(process.execPath,[fileURLToPath(new URL('./support/cvi-replay-process.ts',import.meta.url)),'probe'],{stdio:['pipe','pipe','pipe']});let out='';
  const t=setTimeout(()=>{c.kill('SIGKILL');reject(Error('Probe timeout'));},7000);c.stdout.on('data',d=>out+=d.toString());c.stderr.resume();c.on('error',()=>{clearTimeout(t);reject(Error('Probe failed'));});c.on('close',code=>{clearTimeout(t);try{resolve({code,...(out?{value:JSON.parse(out)}:{})});}catch{reject(Error('Probe output failed'));}});c.stdin.on('error',()=>{});c.stdin.end(JSON.stringify({root,storeId,mode,id}));
 });
}
it('fresh processes refuse same request after successful delivery without new draft work',async()=>{const f=await setup();try{
 expect((await probe(f.root,f.storeId)).value).toEqual({status:200,draftCalls:1,released:true});
 expect((await probe(f.root,f.storeId)).value).toEqual({status:409,draftCalls:0,released:false});
 const text=await readFile(join(f.root,'ledger.json'),'utf8');expect(text).not.toMatch(/Synthetic|Bearer|long sleeves|https|fixture-one|aaaaaaaa/);expect(JSON.parse(text).records[0].status).toBe('spent');
 }finally{await f.close();}},15000);
it('unresolved crash blocks both replay and a new request in fresh workers',async()=>{const f=await setup();try{
 expect((await probe(f.root,f.storeId,'crash-reserved')).code).toBe(73);
 for(const id of ['fixture-one','fixture-new'])expect((await probe(f.root,f.storeId,'complete',id)).value).toEqual({status:409,draftCalls:0,released:false});
 }finally{await f.close();}},15000);
it('crash after durable spending but before bytes never refunds original ID',async()=>{const f=await setup();try{
 expect((await probe(f.root,f.storeId,'crash-spent')).code).toBe(74);expect((await probe(f.root,f.storeId)).value).toEqual({status:409,draftCalls:0,released:false});
 const s=await call(f.root,'inspect',{storeId:f.storeId}) as any;expect(s.records).toHaveLength(1);expect(s.records[0].status).toBe('spent');
 }finally{await f.close();}},15000);
it.each(['pending','ledger','checkpoint'])('interrupted %s write blocks future workers without repair',async stage=>{const f=await setup();try{
 expect((await probe(f.root,f.storeId,'write-'+stage)).value).toMatchObject({released:false});
 expect((await probe(f.root,f.storeId,'complete','fixture-new')).value).toEqual({status:409,draftCalls:0,released:false});
 await expect(readFile(join(f.root,'pending'))).resolves.toBeDefined();
 }finally{await f.close();}},15000);
it.each(['ledger.json','checkpoint.json','lock'])('missing %s refuses and never reseeds',async file=>{const f=await setup();try{await unlink(join(f.root,file));expect((await probe(f.root,f.storeId)).value).toEqual({status:409,draftCalls:0,released:false});await expect(readFile(join(f.root,file))).rejects.toThrow();}finally{await f.close();}},15000);
it('competing real processes permit at most one delivery of the same request',async()=>{const f=await setup();try{const results=await Promise.all(Array.from({length:5},()=>probe(f.root,f.storeId)));expect(results.filter(r=>r.value?.released)).toHaveLength(1);expect(results.reduce((sum,r)=>sum+(r.value?.draftCalls??0),0)).toBe(1);}finally{await f.close();}},15000);
it('different requests competing for the final slot preserve the lifetime cap',async()=>{const f=await setup(1);try{const results=await Promise.all(Array.from({length:5},(_,i)=>probe(f.root,f.storeId,'complete',`fixture-${i}`)));expect(results.filter(r=>r.value?.released)).toHaveLength(1);expect((await probe(f.root,f.storeId,'complete','fixture-last')).value?.draftCalls).toBe(0);}finally{await f.close();}},15000);
it.each(['malformed','checksum','permissions'])('rejects %s journal',async kind=>{const f=await setup();try{const p=join(f.root,'ledger.json');if(kind==='permissions')await chmod(p,0o644);else await writeFile(p,kind==='malformed'?'null':'{}',{mode:0o600});expect((await probe(f.root,f.storeId)).value).toEqual({status:409,draftCalls:0,released:false});}finally{await f.close();}},15000);
it('explicit fixture preparation cannot overwrite existing history',async()=>{const f=await setup();try{await probe(f.root,f.storeId);await expect(call(f.root,'prepare',{bindingDigest:fixtureDigest})).rejects.toThrow();expect((await probe(f.root,f.storeId)).value?.released).toBe(false);}finally{await f.close();}},15000);
it('records coordinated valid-file rollback as an unresolved authority limitation',async()=>{const f=await setup();try{const ledger=await readFile(join(f.root,'ledger.json')),checkpoint=await readFile(join(f.root,'checkpoint.json'));await probe(f.root,f.storeId);await writeFile(join(f.root,'ledger.json'),ledger);await writeFile(join(f.root,'checkpoint.json'),checkpoint);expect((await probe(f.root,f.storeId)).value?.released).toBe(true);}finally{await f.close();}},15000);

it.each(['pending','ledger','checkpoint'])('interrupted reservation %s write refuses any new draft',async stage=>{const f=await setup();try{
 expect((await probe(f.root,f.storeId,'reserve-write-'+stage)).value).toEqual({status:409,draftCalls:0,released:false});
 expect((await probe(f.root,f.storeId,'complete','fixture-new')).value).toEqual({status:409,draftCalls:0,released:false});
 }finally{await f.close();}},15000);
