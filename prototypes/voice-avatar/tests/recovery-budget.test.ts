import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ExperimentBudget, initializeExperimentBudget, validateLedger } from '../src/experiment-budget.ts';
const dirs:string[]=[];
afterEach(async()=>{await Promise.all(dirs.splice(0).map(p=>rm(p,{recursive:true,force:true})));});
async function fixture(){
 const dir=await mkdtemp(join(tmpdir(),'recovery-budget-'));dirs.push(dir);const path=join(dir,'ledger.json');await initializeExperimentBudget(path);const b=new ExperimentBudget(path);
 for(let i=0;i<4;i++)await b.closeVerified(await b.reserve());
 for(const approve of [()=>b.approveAdditionalSpokenTest(),()=>b.approveReserveTransfer(),()=>b.approvePhoneTrial(),()=>b.approveAutomaticTrial(),()=>b.approveRepeatTrial()]){await approve();await b.closeVerified(await b.reserve('spoken'));}
 return b;
}
describe('approved two-room recovery allowance, local fixtures only',()=>{
 it('preserves prior records and reserves both units before either room starts',async()=>{
  const b=await fixture();const prior=await b.read();await b.approveRecoveryTrial();const pair=await b.reserveRecoveryPair();
  const ledger=await b.read();expect(ledger.runs.slice(0,9)).toEqual(prior.runs);expect(ledger.runs.slice(9).map(r=>[r.cents,r.seconds,r.started])).toEqual([[200,300,false],[200,300,false]]);
  await expect(b.claimRecoveryRoom(pair[1])).rejects.toThrow();await b.claimRecoveryRoom(pair[0]);await expect(b.claimRecoveryRoom(pair[0])).rejects.toThrow();
  await b.setRoom(pair[0],'initial');await b.closeVerified(pair[0]);await b.claimRecoveryRoom(pair[1]);await b.setRoom(pair[1],'replacement');await b.closeVerified(pair[1]);
  await expect(b.reserveRecoveryPair()).rejects.toThrow();await expect(b.reserve('spoken')).rejects.toThrow();await expect(b.approveRecoveryTrial()).rejects.toThrow();
 });
 it('refuses use without the specific amendment and unclaimed room assignment',async()=>{
  const b=await fixture();await expect(b.reserveRecoveryPair()).rejects.toThrow();await b.approveRecoveryTrial();const pair=await b.reserveRecoveryPair();await expect(b.setRoom(pair[0],'unclaimed')).rejects.toThrow();
 });
 it('rejects altered approval, partial pair and reopened predecessor claims',async()=>{
  const b=await fixture();await b.approveRecoveryTrial();await b.reserveRecoveryPair();const ledger=await b.read();
  const altered={...structuredClone(ledger),recoveryTrial:{...ledger.recoveryTrial!,cents:401}};expect(()=>validateLedger(altered)).toThrow();
  const partial=structuredClone(ledger);partial.runs.pop();expect(()=>validateLedger(partial)).toThrow();
 });
});

it('permits exactly the approved repeat while preserving the unused original replacement',async()=>{
 const b=await fixture();await b.approveRecoveryTrial();const old=await b.reserveRecoveryPair();await b.claimRecoveryRoom(old[0]);await b.setRoom(old[0],'ended-initial');await b.closeVerified(old[0]);const before=await b.read();
 await b.approveRecoveryRepeat();const pair=await b.reserveRecoveryPair();expect((await b.read()).runs.slice(0,11)).toEqual(before.runs);
 await expect(b.claimRecoveryRoom(old[1])).rejects.toThrow();await expect(b.claimRecoveryRoom(pair[1])).rejects.toThrow();
 await b.claimRecoveryRoom(pair[0]);await b.setRoom(pair[0],'repeat-initial');await b.closeVerified(pair[0]);await b.claimRecoveryRoom(pair[1]);await b.setRoom(pair[1],'repeat-replacement');await b.closeVerified(pair[1]);
 await expect(b.reserveRecoveryPair()).rejects.toThrow();await expect(b.approveRecoveryRepeat()).rejects.toThrow();await expect(b.reserve('spoken')).rejects.toThrow();
});
it('refuses repeat amendment while initial cleanup is unresolved',async()=>{
 const b=await fixture();await b.approveRecoveryTrial();await b.reserveRecoveryPair();await expect(b.approveRecoveryRepeat()).rejects.toThrow();
});

it('permits one second repeat preserving all thirteen records and refuses older unused units',async()=>{
 const b=await fixture();await b.approveRecoveryTrial();const old=await b.reserveRecoveryPair();await b.claimRecoveryRoom(old[0]);await b.setRoom(old[0],'initial');await b.closeVerified(old[0]);
 await b.approveRecoveryRepeat();const repeat=await b.reserveRecoveryPair();await expect(b.approveRecoverySecondRepeat()).rejects.toThrow();await b.claimRecoveryRoom(repeat[0]);await b.setRoom(repeat[0],'repeat');await b.closeVerified(repeat[0]);const before=await b.read();
 await b.approveRecoverySecondRepeat();const pair=await b.reserveRecoveryPair();expect((await b.read()).runs.slice(0,13)).toEqual(before.runs);
 await expect(b.claimRecoveryRoom(old[1])).rejects.toThrow();await expect(b.claimRecoveryRoom(repeat[1])).rejects.toThrow();await expect(b.claimRecoveryRoom(pair[1])).rejects.toThrow();
 await b.claimRecoveryRoom(pair[0]);await b.setRoom(pair[0],'second');await b.closeVerified(pair[0]);await b.claimRecoveryRoom(pair[1]);await b.setRoom(pair[1],'replacement');await b.closeVerified(pair[1]);
 await expect(b.reserveRecoveryPair()).rejects.toThrow();await expect(b.approveRecoverySecondRepeat()).rejects.toThrow();await expect(b.reserve('spoken')).rejects.toThrow();
 const ledger=await b.read();const changed=structuredClone(ledger);changed.recoverySecondRepeat={...changed.recoverySecondRepeat!,cents:401 as 400};expect(()=>validateLedger(changed)).toThrow();const partial=structuredClone(ledger);partial.runs.pop();expect(()=>validateLedger(partial)).toThrow();
});

it('permits one third repeat preserving all thirteen records and refuses older unused units',async()=>{
 const b=await fixture();await b.approveRecoveryTrial();const old=await b.reserveRecoveryPair();await b.claimRecoveryRoom(old[0]);await b.setRoom(old[0],'initial');await b.closeVerified(old[0]);
 await b.approveRecoveryRepeat();const repeat=await b.reserveRecoveryPair();await expect(b.approveRecoverySecondRepeat()).rejects.toThrow();await b.claimRecoveryRoom(repeat[0]);await b.setRoom(repeat[0],'repeat');await b.closeVerified(repeat[0]);const before=await b.read();
 await b.approveRecoverySecondRepeat();const second=await b.reserveRecoveryPair();await b.claimRecoveryRoom(second[0]);await b.setRoom(second[0],'second-ended');await b.closeVerified(second[0]);const previous=await b.read();await b.approveRecoveryThirdRepeat();const pair=await b.reserveRecoveryPair();expect((await b.read()).runs.slice(0,15)).toEqual(previous.runs);
 await expect(b.claimRecoveryRoom(old[1])).rejects.toThrow();await expect(b.claimRecoveryRoom(repeat[1])).rejects.toThrow();await expect(b.claimRecoveryRoom(pair[1])).rejects.toThrow();
 await b.claimRecoveryRoom(pair[0]);await b.setRoom(pair[0],'second');await b.closeVerified(pair[0]);await b.claimRecoveryRoom(pair[1]);await b.setRoom(pair[1],'replacement');await b.closeVerified(pair[1]);
 await expect(b.reserveRecoveryPair()).rejects.toThrow();await expect(b.approveRecoveryThirdRepeat()).rejects.toThrow();await expect(b.reserve('spoken')).rejects.toThrow();
 const ledger=await b.read();const changed=structuredClone(ledger);changed.recoveryThirdRepeat={...changed.recoveryThirdRepeat!,cents:401 as 400};expect(()=>validateLedger(changed)).toThrow();const partial=structuredClone(ledger);partial.runs.pop();expect(()=>validateLedger(partial)).toThrow();
});
