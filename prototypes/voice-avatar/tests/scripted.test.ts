import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ExperimentBudget, initializeExperimentBudget } from '../src/experiment-budget.ts';
import { EchoStream } from '../src/echo-stream.ts';
import { verifyEchoPal } from '../src/scripted-providers.ts';

const directories: string[] = [];
afterEach(async () => { vi.useRealTimers(); await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
async function ledger() {
  const directory = await mkdtemp(join(tmpdir(), 'stylist-budget-')); directories.push(directory);
  const path = join(directory, 'usage.json'); await initializeExperimentBudget(path);
  return { path, budget: new ExperimentBudget(path) };
}
describe('scripted test budget reservations', () => {
  it('reserves before use and retains the full amount after verified cleanup', async () => {
    const { budget } = await ledger(); const id = await budget.reserve(); await budget.setRoom(id, 'fixture-room'); await budget.closeVerified(id);
    expect((await budget.read()).runs).toEqual([{ id, room: 'fixture-room', cents: 200, seconds: 300, closed: true }]);
  });
  it('blocks a second connection and survives a server replacement', async () => {
    const { path, budget } = await ledger(); await budget.reserve();
    await expect(new ExperimentBudget(path).reserve()).rejects.toThrow('cleanup');
  });
  it('refuses missing or corrupt state instead of resetting the budget', async () => {
    const { path, budget } = await ledger(); await writeFile(path, 'bad json'); await expect(budget.reserve()).rejects.toThrow();
    await rm(path); await expect(budget.reserve()).rejects.toThrow();
  });
  it('never silently resets an existing ledger', async () => {
    const { path, budget } = await ledger(); await budget.reserve();
    await expect(initializeExperimentBudget(path)).rejects.toThrow(); expect((await budget.read()).runs).toHaveLength(1);
  });
  it('enforces four conservative reservations across closed and failed attempts', async () => {
    const { budget } = await ledger();
    for (let i=0;i<4;i++) await budget.closeVerified(await budget.reserve());
    await expect(budget.reserve()).rejects.toThrow('limit');
    expect((await budget.read()).runs.reduce((sum,r) => sum+r.seconds,0)).toBe(1200);
    expect((await budget.read()).runs.reduce((sum,r) => sum+r.cents,0)).toBe(800);
  });
  it('permits one explicitly approved spoken extension while preserving all earlier reservations', async () => {
    const {budget}=await ledger(); for(let i=0;i<4;i++) await budget.closeVerified(await budget.reserve());
    const before=(await budget.read()).runs; await budget.approveAdditionalSpokenTest();
    expect((await budget.read()).runs).toEqual(before);
    await expect(budget.reserve()).rejects.toThrow('limit');
    const extra=await budget.reserve('spoken'); expect((await budget.read()).runs[4]).toMatchObject({kind:'spoken',cents:200,seconds:300,closed:false});
    await budget.closeVerified(extra); await expect(budget.reserve('spoken')).rejects.toThrow('limit');
    await expect(budget.approveAdditionalSpokenTest()).rejects.toThrow();
  });
  it('refuses extension before the original attempts are closed', async()=>{
    const {budget}=await ledger(); await budget.reserve(); await expect(budget.approveAdditionalSpokenTest()).rejects.toThrow();
  });
  it('rejects modified extension bounds',async()=>{
    const {path,budget}=await ledger(); for(let i=0;i<4;i++) await budget.closeVerified(await budget.reserve());
    await budget.approveAdditionalSpokenTest(); const data=await budget.read(); data.spokenExtension!.extraAttempts=2 as 1; await writeFile(path,JSON.stringify(data));
    await expect(budget.reserve('spoken')).rejects.toThrow('review');
  });
  it('allows exactly one reserve-funded spoken attempt and preserves the five earlier records',async()=>{
    const {budget}=await ledger(); for(let i=0;i<4;i++) await budget.closeVerified(await budget.reserve());
    await budget.approveAdditionalSpokenTest(); await budget.closeVerified(await budget.reserve('spoken'));
    const previous=(await budget.read()).runs; await budget.approveReserveTransfer();
    expect((await budget.read()).runs).toEqual(previous); await expect(budget.reserve()).rejects.toThrow('limit');
    const sixth=await budget.reserve('spoken'); expect((await budget.read()).runs[5]).toMatchObject({kind:'spoken',cents:200,seconds:300});
    await budget.closeVerified(sixth); await expect(budget.reserve('spoken')).rejects.toThrow('limit');
    await expect(budget.approveReserveTransfer()).rejects.toThrow();
  });
  it('refuses the reserve transfer before five attempts have closed',async()=>{
    const {budget}=await ledger(); await expect(budget.approveReserveTransfer()).rejects.toThrow();
    for(let i=0;i<4;i++) await budget.closeVerified(await budget.reserve());
    await budget.approveAdditionalSpokenTest(); await budget.reserve('spoken');
    await expect(budget.approveReserveTransfer()).rejects.toThrow();
  });
  it('rejects altered reserve-transfer limits',async()=>{
    const {path,budget}=await ledger();for(let i=0;i<4;i++) await budget.closeVerified(await budget.reserve());
    await budget.approveAdditionalSpokenTest(); await budget.closeVerified(await budget.reserve('spoken')); await budget.approveReserveTransfer();
    const data=await budget.read(); data.reserveTransfer!.cents=400 as 200; await writeFile(path,JSON.stringify(data));
    await expect(budget.reserve('spoken')).rejects.toThrow('review');
  });
  it('preserves six closed records and permits exactly one approved phone attempt', async()=>{
    const {budget}=await ledger();for(let i=0;i<4;i++) await budget.closeVerified(await budget.reserve());
    await budget.approveAdditionalSpokenTest();await budget.closeVerified(await budget.reserve('spoken'));
    await budget.approveReserveTransfer();await budget.closeVerified(await budget.reserve('spoken'));
    const previous=(await budget.read()).runs;await budget.approvePhoneTrial();
    expect((await budget.read()).runs).toEqual(previous);await expect(budget.reserve()).rejects.toThrow('limit');
    const seventh=await budget.reserve('spoken');expect((await budget.read()).runs[6]).toMatchObject({kind:'spoken',cents:200,seconds:300});
    await budget.closeVerified(seventh);await expect(budget.reserve('spoken')).rejects.toThrow('limit');
    await expect(budget.approvePhoneTrial()).rejects.toThrow();
  });
  it('refuses phone approval with missing or unresolved history', async()=>{
    const {budget}=await ledger();await expect(budget.approvePhoneTrial()).rejects.toThrow();
    for(let i=0;i<4;i++) await budget.closeVerified(await budget.reserve());
    await budget.approveAdditionalSpokenTest();await budget.closeVerified(await budget.reserve('spoken'));
    await budget.approveReserveTransfer();await budget.reserve('spoken');await expect(budget.approvePhoneTrial()).rejects.toThrow();
  });
  it('rejects modified phone allowance metadata', async()=>{
    const {path,budget}=await ledger();for(let i=0;i<4;i++) await budget.closeVerified(await budget.reserve());
    await budget.approveAdditionalSpokenTest();await budget.closeVerified(await budget.reserve('spoken'));
    await budget.approveReserveTransfer();await budget.closeVerified(await budget.reserve('spoken'));await budget.approvePhoneTrial();
    const data=await budget.read();data.phoneTrial!.extraAttempts=2 as 1;await writeFile(path,JSON.stringify(data));
    await expect(budget.reserve('spoken')).rejects.toThrow('review');
  });
  it('serializes competing processes with an exclusive lock', async () => {
    const { path, budget } = await ledger();
    const outcomes = await Promise.allSettled([budget.reserve(),new ExperimentBudget(path).reserve()]);
    expect(outcomes.filter(r => r.status==='fulfilled')).toHaveLength(1); expect((await budget.read()).runs).toHaveLength(1);
  });
  it('preserves seven records, permits one automatic trial and refuses a ninth attempt', async () => {
    const { budget } = await ledger(); for (let i = 0; i < 4; i++) await budget.closeVerified(await budget.reserve());
    await budget.approveAdditionalSpokenTest(); await budget.closeVerified(await budget.reserve('spoken'));
    await budget.approveReserveTransfer(); await budget.closeVerified(await budget.reserve('spoken'));
    await budget.approvePhoneTrial(); await budget.closeVerified(await budget.reserve('spoken'));
    const previous = await budget.read(); await budget.approveAutomaticTrial();
    const amended = await budget.read(); expect(amended.runs).toEqual(previous.runs);
    expect(amended.phoneTrial).toEqual(previous.phoneTrial);
    await expect(budget.reserve()).rejects.toThrow('limit');
    await budget.closeVerified(await budget.reserve('spoken'));
    expect((await budget.read()).runs).toHaveLength(8);
    await expect(budget.reserve('spoken')).rejects.toThrow('limit');
    await expect(budget.approveAutomaticTrial()).rejects.toThrow();
  });
  it('refuses an automatic amendment before seven closed attempts', async () => {
    const { budget } = await ledger(); await expect(budget.approveAutomaticTrial()).rejects.toThrow();
    for (let i = 0; i < 4; i++) await budget.closeVerified(await budget.reserve());
    await budget.approveAdditionalSpokenTest(); await budget.closeVerified(await budget.reserve('spoken'));
    await budget.approveReserveTransfer(); await budget.closeVerified(await budget.reserve('spoken'));
    await budget.approvePhoneTrial(); await budget.reserve('spoken');
    await expect(budget.approveAutomaticTrial()).rejects.toThrow();
  });
  it('rejects modified automatic-trial metadata', async () => {
    const { path, budget } = await ledger(); for (let i = 0; i < 4; i++) await budget.closeVerified(await budget.reserve());
    await budget.approveAdditionalSpokenTest(); await budget.closeVerified(await budget.reserve('spoken'));
    await budget.approveReserveTransfer(); await budget.closeVerified(await budget.reserve('spoken'));
    await budget.approvePhoneTrial(); await budget.closeVerified(await budget.reserve('spoken')); await budget.approveAutomaticTrial();
    const data = await budget.read(); data.automaticTrial!.extraAttempts = 2 as 1; await writeFile(path, JSON.stringify(data));
    await expect(budget.reserve('spoken')).rejects.toThrow('review');
  });
  it('rejects modified amounts and unknown cleanup IDs', async () => {
    const { path,budget } = await ledger(); await expect(budget.closeVerified('unknown')).rejects.toThrow();
    const id = await budget.reserve(); const data = await budget.read(); data.runs[0]!.cents=0; await writeFile(path,JSON.stringify(data));
    await expect(budget.closeVerified(id)).rejects.toThrow('review');
  });
});

describe('bounded Audio Echo transport', () => {
  it('keeps each frame below 4 KB and sends done with the last audio chunk', () => {
    vi.useFakeTimers({ toFake:['setTimeout','clearTimeout','performance'] }); const messages: any[]=[];
    const stream=new EchoStream({conversationId:'room',inferenceId:'first',pcm:''},m=>messages.push(m),()=>{});
    stream.play(new Uint8Array(1920),'turn-one'); vi.advanceTimersByTime(40);
    const audio=messages.filter(m=>m.event_type==='conversation.echo');
    expect(audio).toHaveLength(2); expect(audio[0].properties.done).toBe(false); expect(audio[1].properties.done).toBe(true);
    expect(audio.every(m=>new TextEncoder().encode(JSON.stringify(m)).length<4096)).toBe(true);
  });
  it('interrupt clears scheduled chunks and old callbacks cannot restart them', () => {
    vi.useFakeTimers({ toFake:['setTimeout','clearTimeout','performance'] }); const messages: any[]=[];
    const stream=new EchoStream({conversationId:'room',inferenceId:'first',pcm:''},m=>messages.push(m),()=>{});
    stream.play(new Uint8Array(9600),'turn-one'); stream.interrupt(); const count=messages.length;
    vi.advanceTimersByTime(1000); expect(messages).toHaveLength(count); expect(messages.at(-1).event_type).toBe('conversation.interrupt');
  });
  it('interrupts previous renderer output before replacing its queue', () => {
    vi.useFakeTimers({ toFake:['setTimeout','clearTimeout','performance'] }); const messages: any[]=[];
    const stream=new EchoStream({conversationId:'room',inferenceId:'first',pcm:''},m=>messages.push(m),()=>{});
    stream.play(new Uint8Array(9600),'old'); stream.play(new Uint8Array(1920),'new'); vi.advanceTimersByTime(100);
    expect(messages[1].event_type).toBe('conversation.interrupt');
    expect(messages.filter(m=>m.event_type==='conversation.echo').map(m=>m.properties.inference_id)).toEqual(['old','new','new']);
  });
  it('rejects empty, odd and oversized audio before sending', () => {
    const send=vi.fn(); const stream=new EchoStream({conversationId:'room',inferenceId:'first',pcm:''},send,()=>{});
    for (const bytes of [0,1,1200002]) expect(()=>stream.play(new Uint8Array(bytes),'turn')).toThrow();
    expect(send).not.toHaveBeenCalled();
  });
  it('does not retry after a transport failure', () => {
    vi.useFakeTimers({ toFake:['setTimeout','clearTimeout','performance'] }); const send=vi.fn(()=>{throw new Error('transport unavailable');});
    const stream=new EchoStream({conversationId:'room',inferenceId:'first',pcm:''},send,()=>{});
    expect(()=>stream.play(new Uint8Array(1920),'turn')).not.toThrow(); vi.advanceTimersByTime(1000);
    expect(send).toHaveBeenCalledTimes(2);
  });
});

describe('inspected Echo configuration gate',()=>{
  const pal={pipeline_mode:'echo',greeting:'',dynamic_greeting:false,layers:{transport:{input_settings:{microphone:'disabled'}}}};
  it('accepts Audio Echo with no TTS, STT or LLM layers',()=>expect(()=>verifyEchoPal(pal)).not.toThrow());
  it('holds unknown modes, microphone input, TTS layers and greetings',()=>{
    for (const bad of [{...pal,pipeline_mode:'full'},{...pal,greeting:'Hello'}, {...pal,dynamic_greeting:true},
      {...pal,layers:{transport:{input_settings:{microphone:'enabled'}}}}, {...pal,layers:{...pal.layers,tts:{tts_engine:'auto'}}}]) {
      expect(()=>verifyEchoPal(bad)).toThrow();
    }
  });
});
