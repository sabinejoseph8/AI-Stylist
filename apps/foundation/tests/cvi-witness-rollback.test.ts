import {it,expect} from 'vitest';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,rm,readFile,writeFile,unlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {cviCredentialDigests} from '../src/server/local-cvi-credentials.ts';
import type {CviCredentialLease} from '../src/server/local-cvi-credentials.ts';
import {credentialBinding,credentialCall,fixtureRequest} from './support/cvi-credential-process.ts';
import {call} from './support/cvi-replay-process.ts';
import {witnessedCall,witnessedEndpoint} from './support/cvi-witness-process.ts';
import type {WitnessFixture} from './support/cvi-witness-process.ts';
async function setup(){const base=await mkdtemp(join(tmpdir(),'stylist-cvi-witness-')),root=join(base,'credentials'),replayRoot=join(base,'replay'),cw=join(base,'credential-witness'),rw=join(base,'replay-witness');for(const dir of [root,replayRoot,cw,rw])await mkdir(dir,{mode:0o700});
 const d=cviCredentialDigests(credentialBinding()),{storeId}=await credentialCall(root,'prepare',d) as {storeId:string};
 const lease=await credentialCall(root,'activate',{storeId,...d,previous:0,bootDigest:'1'.repeat(64)}) as CviCredentialLease;
 const {storeId:replayId}=await call(replayRoot,'prepare',{bindingDigest:d.scopeDigest}) as {storeId:string};
 const credentialWitness=await witnessedCall(root,'prepareWitness',{witnessRoot:cw,storeId,kind:'credentials'}) as Record<string,unknown>;
 const replayWitness=await witnessedCall(replayRoot,'prepareWitness',{witnessRoot:rw,storeId:replayId,kind:'replay'}) as Record<string,unknown>;
 return {root,replayRoot,replayId,lease,credentialWitness,replayWitness,cw,rw,close:()=>rm(base,{recursive:true,force:true})};
}
async function snapshot(p:string){return Promise.all(['ledger.json','checkpoint.json'].map(n=>readFile(join(p,n))));}
async function restore(p:string,data:Buffer[]){for(const [i,n] of ['ledger.json','checkpoint.json'].entries())await writeFile(join(p,n),data[i]);}
function probe(x:WitnessFixture,id='fixture-one',options={}){return new Promise<{status:number;drafts:number;released:boolean}>((resolve,reject)=>{
 const c=spawn(process.execPath,[fileURLToPath(new URL('./support/cvi-witness-process.ts',import.meta.url)),'witness-probe'],{stdio:['pipe','pipe','pipe']});let out='';const t=setTimeout(()=>{c.kill('SIGKILL');reject(Error('Fixture timeout'));},8000);
 c.stdout.on('data',d=>out+=d.toString());c.stderr.resume();c.on('error',()=>{clearTimeout(t);reject(Error('Fixture unavailable'));});c.on('close',code=>{clearTimeout(t);try{if(code!==0)throw Error();resolve(JSON.parse(out));}catch{reject(Error('Fixture unavailable'));}});c.stdin.on('error',()=>{});c.stdin.end(JSON.stringify({...x,id,options}));
});}
async function rotate(f:Awaited<ReturnType<typeof setup>>){return witnessedCall(f.root,'activate',{storeId:f.lease.storeId,...cviCredentialDigests(credentialBinding(2)),previous:1,bootDigest:'2'.repeat(64),witness:f.credentialWitness}) as Promise<CviCredentialLease>;}
it('fresh processes accept witnessed work once and refuse replay',async()=>{const f=await setup();try{expect(await probe(f)).toEqual({status:200,drafts:1,released:true});expect(await probe(f)).toEqual({status:409,drafts:0,released:false});}finally{await f.close();}},15000);
it('coordinated replay journal rollback is rejected before any new draft',async()=>{const f=await setup();try{const old=await snapshot(f.replayRoot);await probe(f);await restore(f.replayRoot,old);expect(await probe(f)).toEqual({status:409,drafts:0,released:false});expect((await probe(f,'fixture-new')).drafts).toBe(0);}finally{await f.close();}},15000);
it('coordinated credential rollback cannot reactivate old bearer authority',async()=>{const f=await setup();try{const old=await snapshot(f.root);await rotate(f);await restore(f.root,old);expect(await probe(f,'fixture-new')).toEqual({status:409,drafts:0,released:false});}finally{await f.close();}},15000);
it('rolling back both histories together is refused while witnesses stay current',async()=>{const f=await setup();try{const r=await snapshot(f.replayRoot),c=await snapshot(f.root);await probe(f);await rotate(f);await restore(f.replayRoot,r);await restore(f.root,c);expect((await probe(f)).drafts).toBe(0);}finally{await f.close();}},15000);
it.each(['cw','rw'] as const)('missing %s witness is not regenerated',async name=>{const f=await setup();try{await unlink(join(f[name],'ledger.json'));expect((await probe(f)).drafts).toBe(0);await expect(readFile(join(f[name],'ledger.json'))).rejects.toThrow();}finally{await f.close();}},15000);
it('rollback after approval prevents response handoff',async()=>{const f=await setup();try{const old=await snapshot(f.replayRoot),s=witnessedEndpoint(f),r=await s.endpoint.handle(fixtureRequest());expect(r.status).toBe(200);await restore(f.replayRoot,old);await expect(r.text()).rejects.toThrow('CVI delivery unavailable');}finally{await f.close();}},15000);
it('rollback during consumption blocks the final credential check',async()=>{const f=await setup();try{const old=await snapshot(f.root),next=await rotate(f),s=witnessedEndpoint({...f,lease:next},{afterConsume:()=>restore(f.root,old)}),r=await s.endpoint.handle(fixtureRequest(credentialBinding(2).secret));await expect(r.text()).rejects.toThrow('CVI delivery unavailable');}finally{await f.close();}},15000);
it('concurrent protected workers deliver one request at most once',async()=>{const f=await setup();try{const r=await Promise.all(Array.from({length:4},()=>probe(f)));expect(r.filter(x=>x.released)).toHaveLength(1);expect(r.reduce((n,x)=>n+x.drafts,0)).toBe(1);}finally{await f.close();}},15000);
it.each(['pending','ledger','checkpoint'])('interrupted witness %s write holds future processes',async stage=>{const f=await setup();try{expect((await probe(f,'fixture-one',{witnessCrashAt:stage})).released).toBe(false);expect((await probe(f,'fixture-new')).drafts).toBe(0);}finally{await f.close();}},15000);
it.each(['pending','ledger','checkpoint'])('interrupted journal %s write after witness advance holds future processes',async stage=>{const f=await setup();try{expect((await probe(f,'fixture-one',{crashAt:stage})).released).toBe(false);expect((await probe(f,'fixture-new')).drafts).toBe(0);}finally{await f.close();}},15000);
it('does not cache a stale witness after history advances',async()=>{const f=await setup();try{const old=await snapshot(f.rw);await probe(f);await restore(f.rw,old);expect((await probe(f,'fixture-new')).drafts).toBe(0);}finally{await f.close();}},15000);
it('documents full rollback including witnesses as undetectable in this local model',async()=>{const f=await setup();try{const r=await snapshot(f.replayRoot),rw=await snapshot(f.rw),c=await snapshot(f.root),cw=await snapshot(f.cw);await probe(f);await rotate(f);for(const [p,s] of [[f.replayRoot,r],[f.rw,rw],[f.root,c],[f.cw,cw]] as const)await restore(p,s);expect((await probe(f)).released).toBe(true);}finally{await f.close();}},15000);
