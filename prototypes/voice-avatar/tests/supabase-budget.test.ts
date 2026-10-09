import { afterEach, describe, expect, it, vi } from 'vitest';
import { SupabaseBudget } from '../src/supabase-budget.ts';
const key = 'sb_secret_' + 'fixture'.repeat(8);
const empty = { version: 1, runs: [] };
afterEach(() => vi.unstubAllGlobals());
describe('durable experiment ledger, mocked transport only', () => {
  it('reserves using compare-and-swap without sending secrets in the URL',async()=>{
    const fetcher=vi.fn().mockResolvedValueOnce(Response.json(empty)).mockResolvedValueOnce(Response.json(true)); vi.stubGlobal('fetch',fetcher);
    const budget=new SupabaseBudget('https://fixture.supabase.co',key); const id=await budget.reserve();
    const calls=fetcher.mock.calls;expect(calls).toHaveLength(2);
    expect(calls[0]![0]).toBe('https://fixture.supabase.co/rest/v1/rpc/stylist_prototype_budget_read');
    const body=JSON.parse(calls[1]![1].body);expect(body.expected).toEqual(empty);expect(body.replacement.runs[0]).toMatchObject({id,cents:200,seconds:300,closed:false});
    expect(calls[1]![1].redirect).toBe('error');expect(calls[1]![1].headers.Authorization).toBeUndefined();
  });
  it('blocks missing, malformed or unreachable state without seeding or falling back',async()=>{
    for(const response of [Response.json(null),Response.json({version:1,runs:[]},{status:503}),Response.json({version:1,runs:[{closed:true}]})]){
      const fetcher=vi.fn().mockResolvedValue(response);vi.stubGlobal('fetch',fetcher);
      await expect(new SupabaseBudget('https://fixture.supabase.co',key).reserve()).rejects.toThrow();expect(fetcher).toHaveBeenCalledOnce();
    }
  });
  it('does not retry an uncertain or conflicting write and sanitizes failures',async()=>{
    const fetcher=vi.fn().mockResolvedValueOnce(Response.json(empty)).mockRejectedValueOnce(new Error('secret detail'));vi.stubGlobal('fetch',fetcher);
    await expect(new SupabaseBudget('https://fixture.supabase.co',key).reserve()).rejects.toThrow('requires review');expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('keeps the six-attempt cap on a server replacement',async()=>{
    const runs=Array.from({length:6},(_,i)=>({id:`00000000-0000-4000-8000-00000000000${i}`,cents:200,seconds:300,closed:true,...(i>=4?{kind:'spoken'}:{})}));
    const data={version:1,runs,spokenExtension:{seconds:300,cents:200,extraAttempts:1,baseAttempts:4,approvedOn:'2026-10-09'},reserveTransfer:{totalBudgetCents:2500,source:'reserve',seconds:300,cents:200,extraAttempts:1,baseAttempts:5,approvedOn:'2026-10-09'}};
    const fetcher=vi.fn().mockResolvedValue(Response.json(data));vi.stubGlobal('fetch',fetcher);
    await expect(new SupabaseBudget('https://fixture.supabase.co',key).reserve('spoken')).rejects.toThrow('limit');expect(fetcher).toHaveBeenCalledOnce();
  });
  it('refuses untrusted destinations and remote allowance amendments',async()=>{
    for(const url of ['http://fixture.supabase.co','https://evil.example','https://fixture.supabase.co/extra','https://user@fixture.supabase.co']) expect(()=>new SupabaseBudget(url,key)).toThrow();
    const budget=new SupabaseBudget('https://fixture.supabase.co',key);await expect(budget.approveReserveTransfer()).rejects.toThrow('separate review');
  });
});
