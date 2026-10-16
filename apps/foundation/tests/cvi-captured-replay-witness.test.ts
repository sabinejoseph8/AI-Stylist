/** Genuine concrete pair; disposable witness independence is assumed, not hosted proof. */
import {it,expect} from 'vitest';
import {readFile,writeFile,access,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pairedOwnerFixture} from './support/cvi-paired-owner-fixture.ts';
import {witnessedCall} from './support/cvi-witness-process.ts';
import {createLocalGatedSqliteOwnerPair} from '../src/server/local-cvi-owner-pair.ts';
import {createLocalCviStartupOwner} from '../src/server/local-cvi-startup-owner.ts';
const signal=()=>new AbortController().signal;
const snapshot=async(root:string)=>Promise.all(['ledger.json','checkpoint.json'].map(n=>readFile(root+'/'+n)));
async function restore(root:string,files:Buffer[]){for(const [i,n] of ['ledger.json','checkpoint.json'].entries())await writeFile(root+'/'+n,files[i]);}
function fresh(x:Awaited<ReturnType<typeof pairedOwnerFixture>>){const pair=createLocalGatedSqliteOwnerPair(x.config,x.ports,x.clock);const startup=createLocalCviStartupOwner(x.f.expected,pair.checkpoint,pair.admission,{...x.f.resources,authority:pair.credentials,replay:pair.replay},x.clock,5000,8000);return {pair,startup};}
it.each(['missing','journal','kind','same-root','nested-root','native-root','relative-root','raw-backend'])('refuses %s witness configuration before privileged work',async mode=>{
 const x=await pairedOwnerFixture();try{
  const c:any=structuredClone(x.config),p:any={...x.ports};if(mode==='missing')delete c.witness;if(mode==='journal')c.witness.journalId='11111111-1111-4111-8111-111111111111';if(mode==='kind')c.witness.kind='credentials';if(mode==='same-root')c.witness.root=c.replayRoot;if(mode==='nested-root')c.witness.root=c.replayRoot+'/child';if(mode==='native-root')c.witness.root=c.nativeRoot;if(mode==='relative-root')c.witness.root='relative';if(mode==='raw-backend')p.replay={inspect:()=>{},mutate:()=>{}};
  expect(()=>createLocalGatedSqliteOwnerPair(c,p,x.clock)).toThrow();expect(x.ports.planFull).not.toHaveBeenCalled();expect((await x.f.x.inspect()).revision).toBe(2);
 }finally{await x.close();}
},30000);
it('a syntactically valid but unknown witness ID refuses before authority or planning',async()=>{
 const x=await pairedOwnerFixture();let other:ReturnType<typeof fresh>|undefined;try{
  x.config.witness={...x.config.witness,witnessId:'11111111-1111-4111-8111-111111111111'};other=fresh(x);const before=(await x.f.x.inspect()).requests.length;expect(await other.startup.start(signal())).toBeNull();expect(x.ports.planFull).not.toHaveBeenCalled();expect((await x.f.x.inspect()).requests.length).toBe(before);expect((await x.f.x.inspect()).revision).toBe(2);
 }finally{await other?.pair.close();await x.close();}
},30000);
it('captured witness configuration survives caller changes and tracks actual replay writes',async()=>{
 const x=await pairedOwnerFixture();try{
  const root=x.config.witness.root;Object.assign(x.config.witness,{root:x.f.replayRoot,witnessId:'11111111-1111-4111-8111-111111111111'});const {wire,say}=await x.start();await say('Long sleeves');const response=await wire.handle(x.http('Long sleeves'));expect(response.status).toBe(200);await response.text();const ledger=await readFile(x.f.replayRoot+'/ledger.json'),w=JSON.parse(await readFile(root+'/ledger.json','utf8'));expect(w.epoch).toBeGreaterThan(0);expect(w.head).toBe(createHash('sha256').update(ledger).digest('hex'));expect((await x.records()).every((r:any)=>r.status==='spent')).toBe(true);
 }finally{await x.close();}
},60000);
it.each(['replay','witness'])('restoring only %s files cannot reuse spent records while the other store is preserved',async selected=>{
 const x=await pairedOwnerFixture();let other:ReturnType<typeof fresh>|undefined;try{
  const oldReplay=await snapshot(x.f.replayRoot),oldWitness=await snapshot(x.config.witness.root),{wire,say}=await x.start();await say('Long sleeves');await (await wire.handle(x.http('Long sleeves'))).text();expect(await x.records()).toHaveLength(2);wire.close();const currentReplay=await snapshot(x.f.replayRoot),currentWitness=await snapshot(x.config.witness.root);await restore(selected==='replay'?x.f.replayRoot:x.config.witness.root,selected==='replay'?oldReplay:oldWitness);const before=await x.f.x.inspect(),calls=x.ports.planFull.mock.calls.length;other=fresh(x);expect(await other.startup.start(signal())).toBeNull();expect((await x.f.x.inspect()).requests).toEqual(before.requests);expect(x.ports.planFull).toHaveBeenCalledTimes(calls);expect(await snapshot(x.config.witness.root)).toEqual(selected==='replay'?currentWitness:oldWitness);expect(await snapshot(x.f.replayRoot)).toEqual(selected==='replay'?oldReplay:currentReplay);expect((await x.f.x.inspect()).revision).toBe(4);
 }finally{await other?.pair.close();await x.close();}
},60000);
it('coordinated replay and witness restoration remains an explicit non-authorizing negative boundary',async()=>{
 const x=await pairedOwnerFixture();let other:ReturnType<typeof fresh>|undefined;try{
  const replay=await snapshot(x.f.replayRoot),witness=await snapshot(x.config.witness.root),{wire,say}=await x.start();await say('Long sleeves');await (await wire.handle(x.http('Long sleeves'))).text();wire.close();await restore(x.f.replayRoot,replay);await restore(x.config.witness.root,witness);other=fresh(x);
  const result:any=await other.pair.replay.inspect!({storeId:x.f.journal.storeId,bindingDigest:x.f.scope.bindingDigest,challenge:'a'.repeat(64),now:1000},signal());expect(result.recordCount).toBe(0);expect(Object.values(result.permissions).every(v=>v===false)).toBe(true);expect(await other.startup.start(signal())).toBeNull();expect((await x.f.x.inspect()).revision).toBe(4);expect(x.ports.planFull).toHaveBeenCalledTimes(1);
 }finally{await other?.pair.close();await x.close();}
},60000);
it('an interrupted witness update is held by the concrete driver without repair or fallback',async()=>{
 const x=await pairedOwnerFixture();try{
  const before=await snapshot(x.f.replayRoot);await expect(witnessedCall(x.f.replayRoot,'reserve',{request:{storeId:x.f.journal.storeId,bindingDigest:x.config.physicalBindingDigest,requestDigest:'d'.repeat(64),now:1000},witness:x.config.witness,witnessCrashAt:'pending'})).rejects.toThrow();await access(x.config.witness.root+'/pending');const pending=await readFile(x.config.witness.root+'/pending');expect(await x.make().start(signal())).toBeNull();expect(x.ports.planFull).not.toHaveBeenCalled();expect((await x.f.x.inspect()).revision).toBe(2);expect(await snapshot(x.f.replayRoot)).toEqual(before);expect(await readFile(x.config.witness.root+'/pending')).toEqual(pending);
 }finally{await x.close();}
},30000);

it('restoring replay files and removing a held marker cannot erase the captured witness of unfinished COMMIT',async()=>{
 const x=await pairedOwnerFixture(ports=>{const observe=ports.observe;ports.observe=async(c:any,s:AbortSignal)=>({...await observe(c,s),claimHash:'0'.repeat(64)});});let other:ReturnType<typeof fresh>|undefined;try{
  const initial=await snapshot(x.f.replayRoot);expect(await x.make().start(signal())).toBeNull();await access(x.f.replayRoot+'/owner-transition.json');const witness=await snapshot(x.config.witness.root),before=await x.f.x.inspect();expect(before.pending).not.toBeNull();expect(before.revision).toBe(3);await restore(x.f.replayRoot,initial);await rm(x.f.replayRoot+'/owner-transition.json');other=fresh(x);expect(await other.startup.start(signal())).toBeNull();const after=await x.f.x.inspect();expect(after.requests).toEqual(before.requests);expect(after.pending).toBe(before.pending);expect(after.revision).toBe(3);expect(x.ports.planFull).toHaveBeenCalledTimes(1);expect(await snapshot(x.config.witness.root)).toEqual(witness);expect(await snapshot(x.f.replayRoot)).toEqual(initial);
 }finally{await other?.pair.close();await x.close();}
},60000);
