import {createLocalCviNotebookContext} from '../src/server/local-cvi-notebook-context.ts';
import {APPROVED_NOTES_RETENTION} from '../src/session/notes-retention-policy.ts';
import {it,expect} from 'vitest';
import {access} from 'node:fs/promises';
import {pairedOwnerFixture} from './support/cvi-paired-owner-fixture.ts';
import {createLocalCviStartupOwner,isLocalCviStartedOwner} from '../src/server/local-cvi-startup-owner.ts';
import {createLocalGatedSqliteOwnerPair} from '../src/server/local-cvi-owner-pair.ts';
const signal=()=>new AbortController().signal;
it('only original paired ports publish startup and renewal through the complete 127-of-128 journey',async()=>{
 const x=await pairedOwnerFixture();try{
  const {owner,wire,say}=await x.start();expect(isLocalCviStartedOwner(owner)).toBe(true);expect((await say('Long sleeves')).status).toBe('applied');const a=await wire.handle(x.http('Long sleeves'));expect(a.status).toBe(200);expect(await a.text()).toContain('Long sleeves');const notes=structuredClone(x.context.flow.snapshot().notes),before=await x.records();
  x.at(1500);expect(await wire.continue(x.pair.continuation(),signal())).toBe(true);expect(x.context.flow.snapshot().notes).toEqual(notes);expect(await x.records()).toEqual(before);
  x.at(2000);expect((await say('Prefer loose sleeves')).status).toBe('applied');const b=await wire.handle(x.http('Prefer loose sleeves','Earlier synthetic reply'));expect(b.status).toBe(200);expect(await b.text()).toContain('Prefer loose sleeves');expect(await x.records()).toHaveLength(4);expect((await wire.handle(x.http('Long sleeves'))).status).toBe(409);expect((await x.f.x.inspect()).requests).toHaveLength(127);
 }finally{await x.close();}
},60000);
it.each(['admission','checkpoint','replay','wrapper'])('refuses a copied %s identity before native work',async mode=>{
 const x=await pairedOwnerFixture();try{
  const admission=mode==='admission'?{...x.pair.admission}:x.pair.admission,checkpoint=mode==='checkpoint'?{...x.pair.checkpoint}:mode==='wrapper'?{...x.context.checkpoint}:x.context.checkpoint,replay=mode==='replay'?{...x.pair.replay}:x.pair.replay;
  expect(()=>createLocalCviStartupOwner(x.f.expected,checkpoint,admission,{...x.resources,replay},x.clock)).toThrow();expect(x.ports.planFull).not.toHaveBeenCalled();expect((await x.f.x.inspect()).revision).toBe(2);await expect(access(x.f.replayRoot+'/owner-transition.json')).rejects.toThrow();
 }finally{await x.close();}
},30000);
it('refuses mismatched original objects from two configured pairs before work',async()=>{
 const x=await pairedOwnerFixture(),other=createLocalGatedSqliteOwnerPair(x.config,x.ports,x.clock);try{
  expect(()=>createLocalCviStartupOwner(x.f.expected,other.checkpoint,x.pair.admission,{...x.resources,replay:x.pair.replay},x.clock)).toThrow();expect(()=>createLocalCviStartupOwner(x.f.expected,x.pair.checkpoint,x.pair.admission,{...x.resources,replay:other.replay},x.clock)).toThrow();expect(x.ports.planFull).not.toHaveBeenCalled();
 }finally{await other.close();await x.close();}
},30000);
it('a copied continuation refuses before privileged renewal work',async()=>{
 const x=await pairedOwnerFixture();try{const {owner,wire}=await x.start(),port=x.pair.continuation(),calls=x.ports.planFull.mock.calls.length;expect(await wire.continue({...port},signal())).toBe(false);expect(x.ports.planFull).toHaveBeenCalledTimes(calls);expect((await x.f.x.inspect()).revision).toBe(4);expect(isLocalCviStartedOwner(owner)).toBe(true);}finally{await x.close();}
},30000);
it('two controllers cannot claim the same pair or retire the successful owner',async()=>{
 const x=await pairedOwnerFixture();try{const one=x.make(),two=x.make(),first=one.start(signal());expect(await two.start(signal())).toBeNull();const owner=await first;expect(owner).not.toBeNull();expect(isLocalCviStartedOwner(owner!)).toBe(true);expect(x.ports.planFull).toHaveBeenCalledTimes(1);owner!.end();}finally{await x.close();}
},30000);

it('a generic legacy admission and private replay port cannot enter protected startup',async()=>{
 const x=await pairedOwnerFixture();try{
  expect(()=>createLocalCviStartupOwner(x.f.expected,x.f.checkpoint,x.f.admission(),x.f.resources,x.clock)).toThrow();expect(x.ports.planFull).not.toHaveBeenCalled();expect((await x.f.x.inspect()).revision).toBe(2);
 }finally{await x.close();}
},30000);
it('direct admission without claiming the original pair refuses before planning',async()=>{
 const x=await pairedOwnerFixture();try{await expect(x.pair.admission.admit(x.f.input(),signal())).rejects.toThrow();expect(x.ports.planFull).not.toHaveBeenCalled();expect((await x.f.x.inspect()).revision).toBe(2);await expect(access(x.f.replayRoot+'/owner-transition.json')).rejects.toThrow();}finally{await x.close();}
},30000);
it.each(['principal','baseline'])('invalid %s configuration refuses before callbacks',async mode=>{
 const x=await pairedOwnerFixture();try{const bad=mode==='principal'?{...x.config,principal:'bad principal'}:{...x.config,baseline:{...x.config.baseline,historyDigest:'0'.repeat(64)}};expect(()=>createLocalGatedSqliteOwnerPair(bad,x.ports,x.clock)).toThrow();expect(x.ports.planFull).not.toHaveBeenCalled();expect((await x.f.x.inspect()).revision).toBe(2);}finally{await x.close();}
},30000);

it.each(['clock','credentials'])('a substituted %s refuses before privileged startup',async mode=>{
 const x=await pairedOwnerFixture();try{expect(()=>createLocalCviStartupOwner(x.f.expected,x.context.checkpoint,x.pair.admission,{...x.resources,authority:mode==='credentials'?{...x.pair.credentials}:x.pair.credentials},mode==='clock'?()=>1000:x.clock)).toThrow();expect(x.ports.planFull).not.toHaveBeenCalled();expect((await x.f.x.inspect()).revision).toBe(2);}finally{await x.close();}
},30000);

it('a notebook wrapper cannot substitute a different application clock',async()=>{
 const x=await pairedOwnerFixture();try{const identity={ownerId:'00000000-0000-4000-8000-000000000001',sessionId:'11111111-1111-4111-8111-111111111111',isCurrent:async()=>true};const context=createLocalCviNotebookContext({simulation:true,identity,authorize:async()=>identity,checkpoint:x.pair.checkpoint,ports:{draft:async()=> 'Synthetic',check:async(text,s)=>({approved:true,text,revision:s.revision})},clock:()=>1000,policy:APPROVED_NOTES_RETENTION});expect(()=>createLocalCviStartupOwner(x.f.expected,context.checkpoint,x.pair.admission,{...x.resources,makeFlow:()=>context.flow},x.clock)).toThrow();expect(x.ports.planFull).not.toHaveBeenCalled();context.flow.end();}finally{await x.close();}
},30000);
it('a genuine paired HTTP owner continues across a verified same-owner state write',async()=>{
 const x=await pairedOwnerFixture();try{const {owner,wire,say}=await x.start();await say('Long sleeves');const a=await wire.handle(x.http('Long sleeves'));expect(a.status).toBe(200);await a.text();await x.write();expect((await x.f.x.inspect()).revision).toBe(6);await say('Loose sleeves');const b=await wire.handle(x.http('Loose sleeves','Earlier synthetic reply'));expect(b.status).toBe(200);expect(await b.text()).toContain('Loose sleeves');expect(isLocalCviStartedOwner(owner)).toBe(true);expect((await x.f.x.inspect()).requests.length).toBeLessThanOrEqual(128);}finally{await x.close();}
},60000);
it('a reference feed cannot replace an original known target or authorize output',async()=>{
 let corrupt=false;const x=await pairedOwnerFixture(ports=>{const original=ports.references;ports.references=()=>{const r=original();if(corrupt)r.entries[0].target.historyDigest='0'.repeat(64);return r;};});try{const {owner,wire,say}=await x.start();await say('Long sleeves');corrupt=true;expect((await wire.handle(x.http('Long sleeves'))).status).not.toBe(200);expect(isLocalCviStartedOwner(owner)).toBe(false);expect(x.draft).not.toHaveBeenCalled();expect(await x.records()).toHaveLength(0);}finally{await x.close();}
},60000);
