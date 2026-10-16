import {it,expect} from 'vitest';
import {readFile,access} from 'node:fs/promises';
import {startupAdmissionFixture} from './support/cvi-startup-admission-fixture.ts';
import {continuingHttpFixture} from './support/cvi-continuing-http-fixture.ts';
import {isLocalCviStartedOwner} from '../src/server/local-cvi-startup-owner.ts';
import {localOwnedReplayExecutionContext} from '../src/server/local-cvi-owned-replay.ts';
import {localGatedExecutionFinished} from '../src/server/local-cvi-gated-execution.ts';
const signal=()=>new AbortController().signal;
it('actual gated startup and renewal preserve the complete two-turn transcript/notebook/HTTP exchange within the fixed journal cap',async()=>{
 const x=await continuingHttpFixture(true);try{
  expect(isLocalCviStartedOwner(x.owner)).toBe(true);const firstContext=localOwnedReplayExecutionContext(x.f.resources.replay)!;expect(localGatedExecutionFinished(firstContext)).toBe(true);await expect(access(x.f.replayRoot+'/owner-transition.json')).rejects.toThrow();
  expect((await x.say('Long sleeves')).status).toBe('applied');const first=await x.wire.handle(x.http('Long sleeves'));expect(first.status).toBe(200);expect(await first.text()).toContain('Long sleeves');
  const notes=structuredClone(x.context.flow.snapshot().notes),records=await x.records();expect(records).toHaveLength(2);
  x.at(1500);expect(await x.wire.continue(x.continuation,signal())).toBe(true);expect(x.context.flow.snapshot().notes).toEqual(notes);expect(x.context.flow.snapshot().context?.nativeRevision).toBe(6);expect(await x.records()).toEqual(records);
  const renewedContext=localOwnedReplayExecutionContext(x.f.resources.replay)!;expect(renewedContext).not.toBe(firstContext);expect(localGatedExecutionFinished(renewedContext)).toBe(true);expect(isLocalCviStartedOwner(x.owner)).toBe(true);await expect(access(x.f.replayRoot+'/owner-transition.json')).rejects.toThrow();
  x.at(2000);expect((await x.say('Prefer loose sleeves')).status).toBe('applied');const second=await x.wire.handle(x.http('Prefer loose sleeves','Earlier synthetic reply'));expect(second.status).toBe(200);expect(await second.text()).toContain('Prefer loose sleeves');
  expect(await x.records()).toHaveLength(4);expect((await x.records()).every((v:any)=>v.status==='spent')).toBe(true);expect(x.wire.isHeld()).toBe(false);
  expect((await x.wire.handle(x.http('Long sleeves'))).status).toBe(409);const authority=await x.f.x.inspect();expect(authority.requests).toHaveLength(127);expect(authority.requests.length).toBeLessThanOrEqual(128);
 }finally{await x.close();}
},60000);
it.each(['copy','ordinary'])('a %s final startup inspection cannot finish or publish the original owner',async mode=>{
 const f=await startupAdmissionFixture(()=>1000,10000,true,true);try{
  const original=f.checkpoint.inspectOwnerGatedFresh!;f.checkpoint.inspectOwnerGatedFresh=async(owner,b,s)=>mode==='copy'?structuredClone(await original(owner,b,s)):f.inspector().inspectOwner(owner,s);
  expect(await f.make().start(signal())).toBeNull();expect(f.drafts()).toBe(0);expect((await f.x.inspect()).pending).toBeNull();expect((await readFile(f.replayRoot+'/owner-transition.json','utf8')).length).toBeGreaterThan(0);
 }finally{await f.close();}
},30000);
it('cancellation after the last signed startup inspection prevents publication without undoing commit',async()=>{
 const f=await startupAdmissionFixture(()=>1000,10000,true,true),c=new AbortController();try{
  const original=f.checkpoint.inspectOwnerGatedFresh!;f.checkpoint.inspectOwnerGatedFresh=async(owner,b,s)=>{const r=await original(owner,b,s);c.abort();return r;};
  expect(await f.make().start(c.signal)).toBeNull();expect(f.drafts()).toBe(0);expect((await f.x.inspect()).revision).toBe(4);expect((await readFile(f.replayRoot+'/owner-transition.json','utf8')).length).toBeGreaterThan(0);
 }finally{await f.close();}
},30000);
it('a copied final renewal inspection holds after adoption and cannot release renewed HTTP output',async()=>{
 let finals=0;const x=await continuingHttpFixture(true,f=>{const original=f.checkpoint.inspectOwnerGatedFresh!;f.checkpoint.inspectOwnerGatedFresh=async(owner,b,s)=>{const r=await original(owner,b,s);return ++finals===2?structuredClone(r):r;};});try{
  expect((await x.say('Long sleeves')).status).toBe('applied');x.at(1500);expect(await x.wire.continue(x.continuation,signal())).toBe(false);expect(x.wire.isHeld()).toBe(true);expect(isLocalCviStartedOwner(x.owner)).toBe(false);expect(x.draft).not.toHaveBeenCalled();expect((await x.f.x.inspect()).revision).toBe(6);expect((await readFile(x.f.replayRoot+'/owner-transition.json','utf8')).length).toBeGreaterThan(0);
 }finally{await x.close();}
},60000);
it('End during final renewal inspection prevents acceptance of the longer grant',async()=>{
 let finals=0,end:(()=>void)|undefined;const x=await continuingHttpFixture(true,f=>{const original=f.checkpoint.inspectOwnerGatedFresh!;f.checkpoint.inspectOwnerGatedFresh=async(owner,b,s)=>{const r=await original(owner,b,s);if(++finals===2)end?.();return r;};});try{
  end=()=>x.wire.close();x.at(1500);expect(await x.wire.continue(x.continuation,signal())).toBe(false);expect(isLocalCviStartedOwner(x.owner)).toBe(false);expect(x.draft).not.toHaveBeenCalled();expect(x.transcript.currentInput()).toBeNull();expect((await readFile(x.f.replayRoot+'/owner-transition.json','utf8')).length).toBeGreaterThan(0);
 }finally{await x.close();}
},60000);
