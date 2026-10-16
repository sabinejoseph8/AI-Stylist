/** Actual COMMIT followed by exact full-state refusal, through mandatory paired startup. */
import {readFile} from 'node:fs/promises';
import {it,expect} from 'vitest';
import {pairedOwnerFixture} from './support/cvi-paired-owner-fixture.ts';
import {localOwnedReplayState} from '../src/server/local-cvi-owned-replay.ts';
const signal=()=>new AbortController().signal;
it.each(['grant-history','transaction','claim'])('a post-COMMIT %s mismatch cannot reconcile, activate or publish',async mode=>{
 let activations=0,observations=0;
 const x=await pairedOwnerFixture(ports=>{
  const observe=ports.observe,activate=ports.credentials.activate;
  ports.observe=async(c:any,s:AbortSignal)=>{const original=await observe(c,s);observations++;const changed=structuredClone(original);if(mode==='grant-history')changed.snapshot.grants[0][3]='0'.repeat(64);if(mode==='transaction')changed.transactionId=String(BigInt(changed.transactionId)+1n);if(mode==='claim')changed.claimHash='0'.repeat(64);return changed;};
  ports.credentials={...ports.credentials,activate:async(i:any,s:AbortSignal)=>{activations++;return activate(i,s);}};
 });try{
  const ledger=await readFile(x.f.replayRoot+'/ledger.json','utf8');const startup=x.make();expect(await startup.start(signal())).toBeNull();expect(startup.isHeld()).toBe(true);expect(observations).toBe(1);expect(activations).toBe(0);expect(x.draft).not.toHaveBeenCalled();expect(localOwnedReplayState(x.pair.replay)).toEqual({bound:false,held:true});
  const authority=await x.f.x.inspect();expect(authority.revision).toBe(3);expect(authority.pending).not.toBeNull();const snapshot=await x.f.snapshot();expect(snapshot.grants.filter((r:any)=>r[6]==='active')).toHaveLength(1);expect(snapshot.grants.at(-1)[0]).toBe(2);expect(x.nativeLease().generation).toBe(2);
  expect(await startup.start(signal())).toBeNull();expect(observations).toBe(1);expect((await x.f.x.inspect()).pending).toBe(authority.pending);expect(await x.f.snapshot()).toEqual(snapshot);await expect(x.records()).rejects.toThrow();expect(await readFile(x.f.replayRoot+'/ledger.json','utf8')).toBe(ledger);
 }finally{await x.close();}
},60000);
