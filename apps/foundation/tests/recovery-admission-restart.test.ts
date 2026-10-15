import {it,expect,vi} from 'vitest';
import {createHmac,createHash,randomBytes} from 'node:crypto';
import {createDurableRecoveryAdmission} from '../src/server/recovery-durable-admission.ts';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,unlink,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fixtureCall,fixturePort} from './support/recovery-admission-process.ts';
async function setup(){const root=await mkdtemp(join(tmpdir(),'stylist-durable-admission-')),expected=await fixtureCall(root,{},'prepare');return {root,expected,close:()=>rm(root,{recursive:true,force:true})};}
function probe(root:string,expected:unknown,mode='complete',generation=1){
 return new Promise<{code:number|null;value?:{status:string;providerCalls:number;passwordCalls:number}}>((resolve,reject)=>{
  const child=spawn(process.execPath,[fileURLToPath(new URL('./support/recovery-admission-process.ts',import.meta.url)),'probe'],{stdio:['pipe','pipe','pipe']});let text='';const timer=setTimeout(()=>{child.kill('SIGKILL');reject(Error('Probe timeout'));},8000);
  child.stdout.on('data',data=>text+=data.toString());child.stderr.resume();child.on('error',error=>{clearTimeout(timer);reject(error);});
  child.on('close',code=>{clearTimeout(timer);try{resolve({code,...(text?{value:JSON.parse(text)}:{})});}catch{reject(Error('Probe failed'));}});child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify({root,expected,mode,generation}));
 });
}
it('fresh Node/Python processes preserve counts through three full reset/cleanup cycles',async()=>{
 const f=await setup();try{
  for(let n=0;n<3;n++)expect((await probe(f.root,f.expected)).value).toEqual({status:'complete',providerCalls:1,passwordCalls:1});
  expect((await probe(f.root,f.expected)).value).toEqual({status:'notCreated',providerCalls:0,passwordCalls:0});
  const state=await fixtureCall(f.root,f.expected,'inspect') as {records:Array<{kind:string;state:string}>};expect(state.records.filter(x=>x.kind==='verify').map(x=>x.state)).toEqual(['completed','completed','completed']);
  expect(await readFile(join(f.root,'ledger.json'),'utf8')).not.toMatch(/made-up-only|synthetic-only|access_token|password/);
 }finally{await f.close();}
},15000);
it.each([['crash-verify',71,'reserved'],['crash-reset',72,'resetting']])('a crash at %s blocks the next fresh process before provider work',async(mode,exit,state)=>{
 const f=await setup();try{
  expect((await probe(f.root,f.expected,mode as string)).code).toBe(exit);expect((await probe(f.root,f.expected)).value).toEqual({status:'notCreated',providerCalls:0,passwordCalls:0});
  const saved=await fixtureCall(f.root,f.expected,'inspect') as {records:Array<{state:string}>};expect(saved.records.at(-1)?.state).toBe(state);
 }finally{await f.close();}
},15000);
it('missing journal state blocks a new process without reseeding or provider work',async()=>{
 const f=await setup();try{await unlink(join(f.root,'ledger.json'));expect((await probe(f.root,f.expected)).value).toEqual({status:'notCreated',providerCalls:0,passwordCalls:0});await expect(readFile(join(f.root,'ledger.json'))).rejects.toThrow();}finally{await f.close();}
},15000);

function canonical(value:unknown):string{
 if(value&&typeof value==='object'&&!Array.isArray(value))return '{'+Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,entry])=>JSON.stringify(key)+':'+canonical(entry)).join(',')+'}';
 return JSON.stringify(value);
}
async function witnesses(f:Awaited<ReturnType<typeof setup>>,operationId:string){
 const base=await fixtureCall(f.root,f.expected,'challenge',{...(f.expected as {store_id:string;policy_digest:string}),storeId:(f.expected as {store_id:string}).store_id,policyId:(f.expected as {policy_digest:string}).policy_digest,operationId}) as Record<string,string|number>;
 const state=await fixtureCall(f.root,f.expected,'inspect') as {clock:number};const now=state.clock+1;
 const common={...base,version:1,issued_at:now,expires_at:now+10,fence_epoch:1};
 const sign=(body:Record<string,unknown>,key:string)=>({body,signature:createHmac('sha256',Buffer.from(key.repeat(32),'hex')).update(canonical(body)).digest('hex')});
 const fence=sign({...common,role:'fence',evidence_id:'fixture-evidence-'+randomBytes(16).toString('hex'),worker_fenced:true,capabilities_retired:true},'11');
 const cleanup=sign({...common,role:'cleanup',evidence_id:'fixture-evidence-'+randomBytes(16).toString('hex'),provider_final:true,sessions_absent:true,all_correlated:true,fence_digest:createHash('sha256').update(canonical(fence)).digest('hex')},'22');
 return {storeId:(f.expected as {store_id:string}).store_id,policyId:(f.expected as {policy_digest:string}).policy_digest,operationId,fence,cleanup,fenceEpoch:1,now};
}
it.each([['crash-verify',71],['crash-reset',72]])('reconciles %s without reviving old generation or refunding counters',async(mode,exit)=>{
 const f=await setup();try{
  expect((await probe(f.root,f.expected,mode as string)).code).toBe(exit);
  const state=await fixtureCall(f.root,f.expected,'inspect') as {records:Array<{id:string;kind:string;state:string}>},id=state.records.at(-1)!.id,request=await witnesses(f,id);
  expect(await fixtureCall(f.root,f.expected,'reconcile',request)).toMatchObject({status:'retired',operation_id:id});
  expect((await probe(f.root,f.expected)).value).toEqual({status:'notCreated',providerCalls:0,passwordCalls:0});
  const send={storeId:request.storeId,policyId:request.policyId,operationId:'fixture-operation-'+randomBytes(16).toString('hex')};
  const receipt=await fixtureCall(f.root,f.expected,'resend',send) as {generation:number};expect(receipt.generation).toBe(2);
  expect((await probe(f.root,f.expected,'complete',2)).value).toEqual({status:'complete',providerCalls:1,passwordCalls:1});
  const saved=await fixtureCall(f.root,f.expected,'inspect') as typeof state;expect(saved.records.filter(x=>x.kind==='verify').map(x=>x.state)).toEqual(['retired','completed']);
 }finally{await f.close();}
},15000);
it('retirement refuses a stale in-memory reset capability before password dispatch',async()=>{
 const f=await setup();try{
  const expected=f.expected as {store_id:string;policy_digest:string},reset=vi.fn(async()=>true);
  const guard=createDurableRecoveryAdmission({storeId:expected.store_id,policyId:expected.policy_digest},fixturePort(f.root,f.expected),{exchange:async()=>({ownerId:'00000000-0000-4000-8000-000000000002',expiresAt:Date.now()+60000,resetPassword:reset,discard:async()=>true})});
  const value=await guard.exchange({subjectKey:'b'.repeat(64),generation:1},'synthetic-only',new AbortController().signal);if('status' in value)throw Error();
  const state=await fixtureCall(f.root,f.expected,'inspect') as {records:Array<{id:string;state:string}>},id=state.records.at(-1)!.id;
  await fixtureCall(f.root,f.expected,'reconcile',await witnesses(f,id));
  expect(await value.resetPassword('made-up-only',new AbortController().signal)).toBe(false);expect(reset).not.toHaveBeenCalled();expect(await value.discard(new AbortController().signal)).toBe(false);
  const saved=await fixtureCall(f.root,f.expected,'inspect') as typeof state;expect(saved.records.at(-1)?.state).toBe('retired');
 }finally{await f.close();}
},15000);
it('unknown signed cleanup facts keep the crash reservation blocked',async()=>{
 const f=await setup();try{
  await probe(f.root,f.expected,'crash-verify');const state=await fixtureCall(f.root,f.expected,'inspect') as {records:Array<{id:string}>},request=await witnesses(f,state.records.at(-1)!.id);
  request.cleanup.body.provider_final=false;request.cleanup.signature=createHmac('sha256',Buffer.from('22'.repeat(32),'hex')).update(canonical(request.cleanup.body)).digest('hex');
  await expect(fixtureCall(f.root,f.expected,'reconcile',request)).rejects.toThrow();expect((await probe(f.root,f.expected)).value).toEqual({status:'notCreated',providerCalls:0,passwordCalls:0});
 }finally{await f.close();}
},15000);
it('an interrupted reconciliation checkpoint blocks a fresh Node process',async()=>{
 const f=await setup();try{
  await probe(f.root,f.expected,'crash-reset');const state=await fixtureCall(f.root,f.expected,'inspect') as {records:Array<{id:string}>};
  await expect(fixtureCall(f.root,f.expected,'reconcile',{...await witnesses(f,state.records.at(-1)!.id),crashAt:'ledger'})).rejects.toThrow();
  expect((await probe(f.root,f.expected)).value).toEqual({status:'notCreated',providerCalls:0,passwordCalls:0});
 }finally{await f.close();}
},15000);
