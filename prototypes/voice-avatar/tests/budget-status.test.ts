import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { createPrototypeServer } from '../src/server.ts';
import type { ExperimentBudget } from '../src/experiment-budget.ts';
describe('safe experiment budget display', () => {
  let server: Server, base: string, cookie: string;
  const read = vi.fn();
  beforeEach(async () => {
    read.mockReset(); server = createPrototypeServer({ budget: {read} as unknown as ExperimentBudget });
    await new Promise<void>(resolve => server.listen(0,'127.0.0.1',resolve)); const address=server.address(); if(!address || typeof address==='string') throw new Error();
    base=`http://127.0.0.1:${address.port}`; const response=await fetch(`${base}/api/status`); cookie=response.headers.get('set-cookie')!.split(';')[0]!;
  });
  afterEach(async()=>{server.closeAllConnections(); await new Promise<void>(resolve=>server.close(()=>resolve()));});
  it('shows exhausted reservations without exposing IDs or room credentials',async()=>{
    read.mockResolvedValue({runs:Array.from({length:4},()=>({id:'private-id',room:'private-room',closed:true}))});
    const response=await fetch(`${base}/api/experiment-budget`,{headers:{Cookie:cookie}});
    expect(await response.json()).toEqual({remainingAttempts:0,remainingScriptedAttempts:0,cleanupPending:false,reservedCents:800});
  });
  it('shows one remaining approved reserve-funded attempt without reopening scripted tests',async()=>{
    read.mockResolvedValue({spokenExtension:{},reserveTransfer:{},runs:Array.from({length:5},()=>({closed:true}))});
    expect(await (await fetch(`${base}/api/experiment-budget`,{headers:{Cookie:cookie}})).json()).toEqual({remainingAttempts:1,remainingScriptedAttempts:0,cleanupPending:false,reservedCents:1000});
  });
  it('shows cleanup pending even when reservations remain',async()=>{
    read.mockResolvedValue({runs:[{closed:false}]});
    expect(await (await fetch(`${base}/api/experiment-budget`,{headers:{Cookie:cookie}})).json()).toMatchObject({remainingAttempts:3,cleanupPending:true});
  });
  it('shows only the single approved automatic trial and keeps scripted attempts exhausted', async () => {
    read.mockResolvedValue({ spokenExtension: {}, reserveTransfer: {}, phoneTrial: {}, automaticTrial: {}, runs: Array.from({ length: 7 }, () => ({ closed: true })) });
    expect(await (await fetch(`${base}/api/experiment-budget`, { headers: { Cookie: cookie } })).json()).toEqual({ remainingAttempts: 1, remainingScriptedAttempts: 0, cleanupPending: false, reservedCents: 1400 });
  });
  it('fails closed on missing or corrupt ledger and requires local ownership',async()=>{
    read.mockRejectedValue(new Error('private-file-path'));
    expect((await fetch(`${base}/api/experiment-budget`)).status).toBe(403);
    const response=await fetch(`${base}/api/experiment-budget`,{headers:{Cookie:cookie}}); expect(response.status).toBe(423); expect(await response.text()).not.toContain('private-file-path');
  });
});
