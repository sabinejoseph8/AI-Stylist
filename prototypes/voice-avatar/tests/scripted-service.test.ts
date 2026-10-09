import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScriptedService } from '../src/scripted-service.ts';
import { generateScript, tavus } from '../src/scripted-providers.ts';
import type { ExperimentBudget } from '../src/experiment-budget.ts';

vi.mock('../src/scripted-providers.ts', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/scripted-providers.ts')>();
  return { ...actual, generateScript: vi.fn(), tavus: vi.fn() };
});
const generated = { pcm: Buffer.alloc(1920), transcript: 'Synthetic fixture', inputTokens: 20, outputTokens: 10 };
const pal = { pipeline_mode:'echo', greeting:'', dynamic_greeting:false, layers:{transport:{input_settings:{microphone:'disabled'}}} };
const privateRoom = { conversation_id:'fixture-room', conversation_url:'https://tavus.daily.co/fixture-room', meeting_token:'fixture-token' };
describe('scripted provider lifecycle, mocked transports only', () => {
  let service: ScriptedService;
  let budget: { reserve: ReturnType<typeof vi.fn>; setRoom: ReturnType<typeof vi.fn>; closeVerified: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    vi.resetAllMocks(); budget={reserve:vi.fn().mockResolvedValue('fixture-reservation'), setRoom:vi.fn().mockResolvedValue(undefined), closeVerified:vi.fn().mockResolvedValue(undefined)};
    vi.mocked(generateScript).mockResolvedValue(generated);
    vi.mocked(tavus).mockImplementation(async (_key,path) => {
      if (path.includes('/pals/')) return pal;
      if (path.includes('/faces/')) return {status:'completed'};
      if (path === '/v2/conversations') return privateRoom;
      return {status:'ended'};
    });
    service=new ScriptedService({openai:'fixture-key',tavus:'fixture-key'},budget as unknown as ExperimentBudget);
  });
  afterEach(async()=>{await service.stop();});
  it('reserves before provider work and returns private credentials only on explicit connect',async()=>{
    await service.start(); expect(service.snapshot()).toMatchObject({state:'ready',hasRoom:true});
    expect(service.snapshot()).not.toHaveProperty('token'); expect(budget.reserve.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(tavus).mock.invocationCallOrder[0]!);
    const connection=service.connect(); expect(connection.token).toBe('fixture-token'); expect(()=>service.connect()).toThrow();
    await service.stop(); expect(service.snapshot().state).toBe('ended'); expect(budget.closeVerified).toHaveBeenCalledTimes(1);
  });
  it('creates only authenticated, stateless, recording-disabled bounded rooms',async()=>{
    await service.start();
    expect(tavus).toHaveBeenCalledWith('fixture-key','/v2/conversations',expect.objectContaining({require_auth:true,participant_tags:[],max_participants:2,
      properties:expect.objectContaining({max_call_duration:90,enable_recording:false,auto_start_recording:false,participant_absent_timeout:10,participant_left_timeout:5})}));
  });
  it('does not call providers when budget reservation is refused',async()=>{
    budget.reserve.mockRejectedValue(new Error('Usage needs review')); await service.start();
    expect(tavus).not.toHaveBeenCalled(); expect(generateScript).not.toHaveBeenCalled(); expect(service.snapshot().state).toBe('failed');
  });
  it('cancels generation before any room is created',async()=>{
    vi.mocked(generateScript).mockImplementation((_key,signal)=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('Canceled')),{once:true})));
    const starting=service.start(); await vi.waitFor(()=>expect(generateScript).toHaveBeenCalled());
    await service.stop(); await starting;
    expect(vi.mocked(tavus).mock.calls.some(([,path])=>path==='/v2/conversations')).toBe(false);
    expect(budget.closeVerified).toHaveBeenCalledTimes(1); expect(service.snapshot().state).toBe('failed');
  });
  it('finishes cleanup when cancellation races room creation',async()=>{
    let complete!: (value:typeof privateRoom)=>void;
    const pending=new Promise<typeof privateRoom>(resolve=>{complete=resolve;});
    const original=vi.mocked(tavus).getMockImplementation()!;
    vi.mocked(tavus).mockImplementation((key,path,body)=>path==='/v2/conversations'?pending:original(key,path,body));
    const starting=service.start(); await vi.waitFor(()=>expect(tavus).toHaveBeenCalledWith('fixture-key','/v2/conversations',expect.anything()));
    await service.stop(); expect(budget.closeVerified).not.toHaveBeenCalled(); complete(privateRoom); await starting;
    expect(tavus).toHaveBeenCalledWith('fixture-key','/v2/conversations/fixture-room/end',{});
    expect(budget.closeVerified).toHaveBeenCalledTimes(1); expect(service.snapshot().hasRoom).toBe(false);
  });
  it('holds unknown room-creation outcomes and never retries them',async()=>{
    const original=vi.mocked(tavus).getMockImplementation()!;
    vi.mocked(tavus).mockImplementation((key,path,body)=>path==='/v2/conversations'?Promise.reject(new Error('Timeout')):original(key,path,body));
    await service.start(); expect(service.snapshot().state).toBe('held'); expect(budget.closeVerified).not.toHaveBeenCalled();
    await expect(service.start()).rejects.toThrow(); expect(vi.mocked(tavus).mock.calls.filter(([,path])=>path==='/v2/conversations')).toHaveLength(1);
  });
  it('holds failed cleanup without refunding the reservation',async()=>{
    await service.start(); const original=vi.mocked(tavus).getMockImplementation()!;
    vi.mocked(tavus).mockImplementation((key,path,body)=>path.endsWith('/end')?Promise.reject(new Error('Failed')):original(key,path,body));
    await service.stop(); expect(service.snapshot().state).toBe('held'); expect(budget.closeVerified).not.toHaveBeenCalled();
    await expect(service.start()).rejects.toThrow();
  });
  it('heartbeat loss and duration bound end the room',async()=>{
    vi.useFakeTimers(); await service.start(); await vi.advanceTimersByTimeAsync(6500);
    expect(service.snapshot().state).toBe('ended'); expect(service.snapshot().message).toContain('stopped checking in'); vi.useRealTimers();
  });
  it('shows the remaining time and identifies automatic expiry while heartbeats continue',async()=>{
    vi.useFakeTimers(); await service.start();
    expect(service.snapshot().remainingSeconds).toBe(85);
    for(let i=0;i<17;i++){service.heartbeat(); await vi.advanceTimersByTimeAsync(5000);}
    service.heartbeat(); await vi.advanceTimersByTimeAsync(500);
    expect(service.snapshot()).toMatchObject({state:'ended',remainingSeconds:0});
    expect(service.snapshot().message).toContain('time limit was reached');
    expect(budget.closeVerified).toHaveBeenCalledOnce(); vi.useRealTimers();
  });

});
