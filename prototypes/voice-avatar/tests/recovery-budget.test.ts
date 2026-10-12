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
