import {it,expect} from 'vitest';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,rm,readFile,writeFile,unlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {cviCredentialDigests} from '../src/server/local-cvi-credentials.ts';
import type {CviCredentialLease} from '../src/server/local-cvi-credentials.ts';
import {credentialBinding,credentialCall,makeEndpoint,fixtureRequest} from './support/cvi-credential-process.ts';
import {call} from './support/cvi-replay-process.ts';
async function setup(){const base=await mkdtemp(join(tmpdir(),'stylist-cvi-credentials-')),root=join(base,'authority'),replayRoot=join(base,'replay');await mkdir(root,{mode:0o700});await mkdir(replayRoot,{mode:0o700});
 const digests=cviCredentialDigests(credentialBinding()),{storeId}=await credentialCall(root,'prepare',digests) as {storeId:string};
 const lease=await credentialCall(root,'activate',{storeId,...digests,previous:0,bootDigest:'1'.repeat(64)}) as CviCredentialLease;
 const {storeId:replayId}=await call(replayRoot,'prepare',{bindingDigest:digests.scopeDigest}) as {storeId:string};
 const rotate=(extra:Record<string,unknown>={})=>credentialCall(root,'activate',{storeId,...cviCredentialDigests(credentialBinding(2)),previous:1,bootDigest:'2'.repeat(64),...extra}) as Promise<CviCredentialLease>;
 return {root,replayRoot,replayId,storeId,lease,rotate,close:()=>rm(base,{recursive:true,force:true})};}
function probe(f:Awaited<ReturnType<typeof setup>>,lease=f.lease,secret?:string,id='fixture-one'){
 return new Promise<{status:number;drafts:number;released:boolean}>((resolve,reject)=>{const c=spawn(process.execPath,[fileURLToPath(new URL('./support/cvi-credential-process.ts',import.meta.url)),'credential-probe'],{stdio:['pipe','pipe','pipe']});let out='';const t=setTimeout(()=>{c.kill('SIGKILL');reject(Error('Fixture timeout'));},8000);
 c.stdout.on('data',d=>out+=d.toString());c.stderr.resume();c.on('error',()=>{clearTimeout(t);reject(Error('Fixture unavailable'));});c.on('close',code=>{clearTimeout(t);try{if(code!==0)throw Error();resolve(JSON.parse(out));}catch{reject(Error('Fixture unavailable'));}});c.stdin.on('error',()=>{});c.stdin.end(JSON.stringify({...f,lease,secret,id}));});}
it('fresh worker generation refuses old bearer and old process lease, without refunding replay history',async()=>{const f=await setup();try{
 expect(await probe(f)).toEqual({status:200,drafts:1,released:true});const next=await f.rotate();
 expect(await probe(f,f.lease,undefined,'fixture-new')).toEqual({status:409,drafts:0,released:false});
 expect(await probe(f,next,credentialBinding().secret,'fixture-new')).toEqual({status:401,drafts:0,released:false});
 expect(await probe(f,next,undefined,'fixture-one')).toEqual({status:409,drafts:0,released:false});
 expect(await probe(f,next,undefined,'fixture-new')).toEqual({status:200,drafts:1,released:true});
 const s=await call(f.replayRoot,'inspect',{storeId:f.replayId}) as any;expect(s.records).toHaveLength(2);
 }finally{await f.close();}},15000);
it('rotation after preparation prevents old worker delivery and preserves its unresolved hold',async()=>{const f=await setup();try{
 const old=makeEndpoint(f.root,f.replayRoot,f.replayId,f.lease),r=await old.endpoint.handle(fixtureRequest());expect(r.status).toBe(200);const next=await f.rotate();
 await expect(r.text()).rejects.toThrow('CVI delivery unavailable');expect(await probe(f,next,undefined,'fixture-new')).toEqual({status:409,drafts:0,released:false});
 }finally{await f.close();}},15000);
it('rotation during consume acknowledgment suppresses already-spent permission',async()=>{const f=await setup();try{
 const old=makeEndpoint(f.root,f.replayRoot,f.replayId,f.lease,undefined,async()=>{await f.rotate();});const r=await old.endpoint.handle(fixtureRequest());await expect(r.text()).rejects.toThrow('CVI delivery unavailable');
 const s=await call(f.replayRoot,'inspect',{storeId:f.replayId}) as any;expect(s.records[0].status).toBe('spent');
 }finally{await f.close();}},15000);
it('two competing rotations cannot both adopt generation two',async()=>{const f=await setup();try{const results=await Promise.allSettled([f.rotate(),f.rotate({bindingDigest:cviCredentialDigests(credentialBinding(3)).bindingDigest,bootDigest:'3'.repeat(64)})]);expect(results.filter(x=>x.status==='fulfilled')).toHaveLength(1);expect((await probe(f,f.lease,undefined,'fixture-new')).drafts).toBe(0);}finally{await f.close();}},15000);
it.each(['pending','ledger','checkpoint'])('interrupted %s rotation refuses both old and new owners',async stage=>{const f=await setup();try{
 await expect(f.rotate({crashAt:stage})).rejects.toThrow();expect((await probe(f)).drafts).toBe(0);
 const next={...f.lease,...cviCredentialDigests(credentialBinding(2)),generation:2,bootDigest:'2'.repeat(64)};expect((await probe(f,next)).drafts).toBe(0);
 }finally{await f.close();}},15000);
it.each(['ledger.json','checkpoint.json','lock'])('missing authority %s never reseeds or permits old owner',async name=>{const f=await setup();try{await unlink(join(f.root,name));expect((await probe(f)).drafts).toBe(0);await expect(readFile(join(f.root,name))).rejects.toThrow();}finally{await f.close();}},15000);
it('retired credential and boot digests cannot be reactivated',async()=>{const f=await setup();try{await f.rotate();await expect(credentialCall(f.root,'activate',{storeId:f.storeId,...cviCredentialDigests(credentialBinding()),previous:2,bootDigest:'3'.repeat(64)})).rejects.toThrow();await expect(credentialCall(f.root,'activate',{storeId:f.storeId,...cviCredentialDigests(credentialBinding(3)),previous:2,bootDigest:'1'.repeat(64)})).rejects.toThrow();}finally{await f.close();}},15000);
it('keeps only digests and generations in authority history',async()=>{const f=await setup();try{await f.rotate();const s=await readFile(join(f.root,'ledger.json'),'utf8');expect(s).not.toContain(credentialBinding().secret);expect(s).not.toContain('Bearer');const x=JSON.parse(s);expect(x.generations.map((g:any)=>g.active)).toEqual([false,true]);}finally{await f.close();}});
it('records coordinated authority rollback as unresolved revocation limitation',async()=>{const f=await setup();try{const l=await readFile(join(f.root,'ledger.json')),c=await readFile(join(f.root,'checkpoint.json'));await f.rotate();await writeFile(join(f.root,'ledger.json'),l);await writeFile(join(f.root,'checkpoint.json'),c);expect((await probe(f)).released).toBe(true);}finally{await f.close();}},15000);

function bootProbe(f:Awaited<ReturnType<typeof setup>>,generation:number,previous:number){return new Promise<any>((resolve,reject)=>{
 const c=spawn(process.execPath,[fileURLToPath(new URL('./support/cvi-credential-process.ts',import.meta.url)),'boot-probe'],{stdio:['pipe','pipe','pipe']});let out='';const t=setTimeout(()=>{c.kill('SIGKILL');reject(Error('Fixture timeout'));},8000);c.stdout.on('data',d=>out+=d.toString());c.stderr.resume();c.on('error',()=>{clearTimeout(t);reject(Error('Fixture failed'));});c.on('close',code=>{clearTimeout(t);try{if(code!==0)throw Error();resolve(JSON.parse(out));}catch{reject(Error('Fixture failed'));}});c.stdin.on('error',()=>{});c.stdin.end(JSON.stringify({...f,generation,previous}));
});}
it('fresh startup commits generation two before serving and old worker loses authority',async()=>{const f=await setup();try{expect(await bootProbe(f,2,1)).toEqual({started:true,drafts:1,released:true});expect(await probe(f,f.lease,undefined,'fixture-old')).toEqual({status:409,drafts:0,released:false});}finally{await f.close();}},15000);
it('startup with a reused credential/boot cannot create any endpoint',async()=>{const f=await setup();try{expect(await bootProbe(f,1,1)).toEqual({started:false,drafts:0,released:false});}finally{await f.close();}},15000);
