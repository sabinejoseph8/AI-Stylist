import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SpokenService } from '../src/spoken-service.ts';
import { generateScript, generateSpokenReply, tavus, spokenRequest, validateSpokenAudio, MAX_INPUT_BYTES } from '../src/scripted-providers.ts';
import type { ExperimentBudget } from '../src/experiment-budget.ts';
vi.mock('../src/scripted-providers.ts', async original => ({ ...await original<typeof import('../src/scripted-providers.ts')>(), generateScript: vi.fn(), generateSpokenReply: vi.fn(), tavus: vi.fn() }));
const SESSION = '00000000-0000-4000-8000-000000000001', OLD = '00000000-0000-4000-8000-000000000002';
const AUDIO = Buffer.alloc(9600).toString('base64');
const generated = { pcm: Buffer.alloc(1920), transcript: 'What color do you prefer?', inputTokens: 30, outputTokens: 20 };
describe('spoken request bounds', () => {
  it('accepts PCM16 from a fifth of a second through twelve seconds', () => {
    expect(() => validateSpokenAudio(AUDIO)).not.toThrow(); expect(() => validateSpokenAudio(Buffer.alloc(MAX_INPUT_BYTES).toString('base64'))).not.toThrow();
  });
  it('rejects short, odd, malformed and oversized input', () => {
    for (const value of ['', 'bad', Buffer.alloc(9601).toString('base64'), Buffer.alloc(MAX_INPUT_BYTES + 2).toString('base64'), AUDIO + '\n']) expect(() => validateSpokenAudio(value)).toThrow();
  });
  it('builds only explicit, confirmed prior context with no tools or autonomous responses', () => {
    const request = spokenRequest(AUDIO, [{ audio: AUDIO, reply: generated.transcript }]);
    expect(request.conversation).toBe('none'); expect(request.input).toHaveLength(3);
    expect(request.input[1]).toMatchObject({ role: 'assistant', content: [{ type: 'output_text', text: generated.transcript }] });
    expect(request.max_output_tokens).toBe(1024); expect(request).not.toHaveProperty('tools');
    expect(() => spokenRequest(AUDIO, [{ audio: AUDIO, reply: '' }])).toThrow();
    expect(() => spokenRequest(AUDIO, [{ audio: AUDIO, reply: 'a' }, { audio: AUDIO, reply: 'b' }])).toThrow();
  });
});
describe('spoken prototype lifecycle, mocked providers only', () => {
  let service: SpokenService;
  let budget: { reserve: ReturnType<typeof vi.fn>; setRoom: ReturnType<typeof vi.fn>; closeVerified: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    vi.resetAllMocks(); budget = { reserve: vi.fn().mockResolvedValue('fixture'), setRoom: vi.fn().mockResolvedValue(undefined), closeVerified: vi.fn().mockResolvedValue(undefined) };
    vi.mocked(generateSpokenReply).mockResolvedValue(generated);
    vi.mocked(tavus).mockImplementation(async (_key, path) => {
      if (path.includes('/pals/')) return { pipeline_mode: 'echo', greeting: '', dynamic_greeting: false, layers: { transport: { input_settings: { microphone: 'disabled' } } } };
      if (path.includes('/faces/')) return { status: 'completed' };
      if (path === '/v2/conversations') return { conversation_id: 'fixture-room', conversation_url: 'https://tavus.daily.co/fixture-room', meeting_token: 'fixture-token' };
      return { status: 'ended' };
    });
    service = new SpokenService({ openai: 'fixture-key', tavus: 'fixture-key' }, budget as unknown as ExperimentBudget);
  });
  afterEach(async () => { await service.stop(); vi.useRealTimers(); });
  async function connected() { await service.start(SESSION); service.connect(SESSION); }
  it('uses the existing reservation and creates no paid fixed greeting', async () => {
    await connected(); expect(budget.reserve).toHaveBeenCalledOnce(); expect(generateScript).not.toHaveBeenCalled(); expect(generateSpokenReply).not.toHaveBeenCalled();
    expect(service.snapshot()).not.toHaveProperty('token'); expect(service.snapshot()).not.toHaveProperty('audio');
  });
  it('does not start provider work when reservation is refused', async () => {
    budget.reserve.mockRejectedValue(new Error('Cap')); await service.start(SESSION); expect(tavus).not.toHaveBeenCalled();
  });
  it('keeps an unconfirmed reply out of the next turn and rejects duplicate confirmation', async () => {
    await connected(); const first = await service.turn(AUDIO, SESSION);
    await expect(service.turn(AUDIO, SESSION)).rejects.toThrow(); expect(generateSpokenReply).toHaveBeenCalledTimes(1);
    expect(() => service.confirmHeard('wrong', SESSION)).toThrow(); service.confirmHeard(first.id, SESSION);
    expect(() => service.confirmHeard(first.id, SESSION)).toThrow();
    await service.turn(AUDIO, SESSION);
    expect(vi.mocked(generateSpokenReply).mock.calls[1]![3]).toEqual([{ audio: AUDIO, reply: generated.transcript }]);
  });
  it('caps exchanges at two including failures', async () => {
    await connected(); for (let i = 0; i < 2; i++) { const reply = await service.turn(AUDIO, SESSION); service.confirmHeard(reply.id, SESSION); }
    await expect(service.turn(AUDIO, SESSION)).rejects.toThrow(); expect(generateSpokenReply).toHaveBeenCalledTimes(2); expect(service.snapshot().inputTokens).toBe(60);
  });
  it('rejects stale session actions before provider work or ending a current room', async () => {
    await connected(); await expect(service.turn(AUDIO, OLD)).rejects.toThrow(); expect(() => service.connect(OLD)).toThrow();
    await expect(service.end(OLD)).rejects.toThrow(); expect(service.snapshot().state).toBe('connected'); expect(generateSpokenReply).not.toHaveBeenCalled();
  });
  it('stops and discards a late generated reply after interruption', async () => {
    await connected(); let finish!: (value: typeof generated) => void;
    vi.mocked(generateSpokenReply).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const pending = service.turn(AUDIO, SESSION); await expect(service.turn(AUDIO, SESSION)).rejects.toThrow();
    await service.end(SESSION); finish(generated); await expect(pending).rejects.toThrow();
    expect(service.snapshot()).toMatchObject({ state: 'ended', awaitingConfirmation: false, generating: false });
  });
  it('aborts generation immediately when the room expires', async () => {
    vi.useFakeTimers(); await connected(); let signal!: AbortSignal;
    vi.mocked(generateSpokenReply).mockImplementation((_key, active) => { signal = active; return new Promise((_resolve, reject) => active.addEventListener('abort', () => reject(new Error('Canceled')), { once: true })); });
    const pending = service.turn(AUDIO, SESSION).catch(error => error); await vi.advanceTimersByTimeAsync(6500);
    expect(signal.aborted).toBe(true); expect(await pending).toBeInstanceOf(Error); expect(service.snapshot().state).toBe('ended');
  });
  it('clears pending confirmation and context on end', async () => {
    await connected(); const first = await service.turn(AUDIO, SESSION); await service.end(SESSION);
    expect(() => service.confirmHeard(first.id, SESSION)).toThrow(); expect(service.snapshot().awaitingConfirmation).toBe(false);
  });
  it('ends on an unusable reply rather than silently retrying', async () => {
    await connected(); vi.mocked(generateSpokenReply).mockResolvedValue({ ...generated, transcript: '' });
    await expect(service.turn(AUDIO, SESSION)).rejects.toThrow(); expect(service.snapshot().state).toBe('ended'); expect(generateSpokenReply).toHaveBeenCalledOnce();
  });
  it('holds failed cleanup and does not refund a reservation', async () => {
    await connected(); const original = vi.mocked(tavus).getMockImplementation()!;
    vi.mocked(tavus).mockImplementation((key, path, body) => path.endsWith('/end') ? Promise.reject(new Error('Failed')) : original(key, path, body));
    await service.end(SESSION); expect(service.snapshot().state).toBe('held'); expect(budget.closeVerified).not.toHaveBeenCalled(); await expect(service.start(OLD)).rejects.toThrow();
  });
});
