import { describe, expect, it } from 'vitest';
import { SILENT_FRAME, echoAudio, pcmDurationMs, privateEchoConversation, realtimeConfiguration, reviewVoicePolicy } from '../src/contracts.ts';
import type { VoicePolicy } from '../src/contracts.ts';
import { VoiceSession } from '../src/voice-session.ts';
import { Simulation } from '../src/simulation.ts';

describe('P1-01: interruption and stale output (synthetic transport)', () => {
  it('cancels both adapters, clears queued frames and truncates at actually heard audio', () => {
    const session = new VoiceSession('room'); const key = session.start('r1', 'i1');
    session.enqueue({ ...key, eventId: '1', pcm: SILENT_FRAME });
    session.enqueue({ ...key, eventId: '2', pcm: SILENT_FRAME });
    session.takeAudio(); session.acknowledgePlayback(key, 12);
    const commands = session.interrupt();
    expect(commands).toEqual([
      { target: 'openai', payload: { type: 'response.cancel', response_id: 'r1' } },
      { target: 'tavus', payload: { message_type: 'conversation', event_type: 'conversation.interrupt', conversation_id: 'room' } },
      { target: 'openai', payload: { type: 'conversation.item.truncate', item_id: 'i1', content_index: 0, audio_end_ms: 12 } },
    ]);
    expect(session.snapshot()).toMatchObject({ state: 'stopped', queued: 0, delivered: 1 });
    expect(session.takeAudio()).toEqual([]);
  });
  it('late audio, acknowledgments and generation-done cannot restart a canceled response', () => {
    const session = new VoiceSession('room'); const old = session.start('r1', 'i1');
    session.acknowledgePlayback(old, 0); session.interrupt();
    session.enqueue({ ...old, eventId: 'late', pcm: SILENT_FRAME });
    expect(session.acknowledgePlayback(old, 0)).toBe(false);
    expect(session.finishGeneration(old, 'completed')).toEqual([]);
    expect(session.finishPlayback(old)).toEqual([]);
    expect(session.takeAudio()).toEqual([]);
    expect(session.snapshot()).toMatchObject({ state: 'stopped', queued: 0, rejected: 4 });
  });
  it('old acknowledgments cannot affect a newer response', () => {
    const session = new VoiceSession('room'); const old = session.start('r1', 'i1');
    session.acknowledgePlayback(old, 0); session.interrupt(); const current = session.start('r2', 'i2');
    session.enqueue({ ...old, eventId: 'late', pcm: SILENT_FRAME });
    session.enqueue({ ...current, eventId: 'new', pcm: SILENT_FRAME }); session.takeAudio();
    expect(session.acknowledgePlayback(old, 20)).toBe(false);
    expect(session.acknowledgePlayback(current, 20)).toBe(true);
    expect(session.snapshot()).toMatchObject({ state: 'speaking', delivered: 1, queued: 0 });
  });
  it('holds the session when actual playback is unknown, without inventing a timestamp', () => {
    const session = new VoiceSession('room'); const key = session.start('r1', 'i1');
    session.enqueue({ ...key, eventId: '1', pcm: SILENT_FRAME }); session.takeAudio();
    const commands = session.interrupt();
    expect(commands.map(c => c.payload.type ?? c.payload.event_type)).toEqual(['response.cancel', 'conversation.interrupt', 'reset_realtime_context']);
    expect(session.snapshot().state).toBe('held');
    expect(() => session.start('r2', 'i2')).toThrow();
  });
  it('rejects negative, backward, nonfinite and beyond-delivered playback positions', () => {
    const session = new VoiceSession('room'); const key = session.start('r1', 'i1');
    session.enqueue({ ...key, eventId: '1', pcm: SILENT_FRAME }); session.takeAudio();
    expect(session.acknowledgePlayback(key, 10)).toBe(true);
    for (const position of [-1, 5, 21, NaN, Infinity]) expect(session.acknowledgePlayback(key, position)).toBe(false);
    expect(session.interrupt().at(-1)?.payload.audio_end_ms).toBe(10);
  });
  it('can resume only after the transport confirms replacement of an unknown-playback context', () => {
    const session = new VoiceSession('room'); const old = session.start('r1', 'i1');
    session.enqueue({ ...old, eventId: 'old', pcm: SILENT_FRAME }); session.takeAudio();
    session.interrupt(); const heldEpoch = session.snapshot().epoch;
    expect(() => session.start('r2', 'i2')).toThrow();
    expect(session.completeContextReset(heldEpoch)).toBe(true);
    expect(session.snapshot()).toMatchObject({ state: 'idle', queued: 0, reason: '' });
    const current = session.start('r2', 'i2');
    session.enqueue({ ...old, eventId: 'late', pcm: SILENT_FRAME });
    expect(session.acknowledgePlayback(old, 20)).toBe(false);
    session.enqueue({ ...current, eventId: 'new', pcm: SILENT_FRAME });
    expect(session.takeAudio()[0]?.payload).toMatchObject({ properties: { inference_id: 'r2' } });
  });
  it('rejects invalid or stale reset acknowledgments and consumes a valid acknowledgment once', () => {
    const session = new VoiceSession('room'); session.start('r1', 'i1'); session.interrupt();
    const heldEpoch = session.snapshot().epoch;
    for (const epoch of [heldEpoch - 1, heldEpoch + 1, NaN, Infinity, 1.5]) {
      expect(session.completeContextReset(epoch)).toBe(false);
      expect(session.snapshot().state).toBe('held');
    }
    expect(session.completeContextReset(heldEpoch)).toBe(true);
    expect(session.completeContextReset(heldEpoch)).toBe(false);
  });
  it('cannot reset an active response or revive an ended session', () => {
    const session = new VoiceSession('room'); session.start('r1', 'i1');
    expect(session.completeContextReset(session.snapshot().epoch)).toBe(false);
    session.interrupt(); const heldEpoch = session.snapshot().epoch; session.end();
    expect(session.completeContextReset(heldEpoch)).toBe(false);
    expect(session.completeContextReset(session.snapshot().epoch)).toBe(false);
    expect(session.snapshot().state).toBe('ended');
  });
  it('does not let an earlier context replacement release a later interruption', () => {
    const session = new VoiceSession('room'); session.start('r1', 'i1'); session.interrupt();
    const firstEpoch = session.snapshot().epoch; session.completeContextReset(firstEpoch);
    session.start('r2', 'i2'); session.interrupt();
    expect(session.completeContextReset(firstEpoch)).toBe(false);
    expect(session.snapshot().state).toBe('held');
    expect(session.completeContextReset(session.snapshot().epoch)).toBe(true);
  });
  it('deduplicates incoming audio events', () => {
    const session = new VoiceSession('room'); const key = session.start('r1', 'i1');
    const frame = { ...key, eventId: 'same', pcm: SILENT_FRAME };
    session.enqueue(frame); session.enqueue(frame); session.takeAudio(); session.enqueue(frame);
    expect(session.snapshot()).toMatchObject({ queued: 0, delivered: 1, rejected: 2 });
  });
  it('holds malformed audio and cancels both outputs', () => {
    const session = new VoiceSession('room'); const key = session.start('r1', 'i1');
    const commands = session.enqueue({ ...key, eventId: 'bad', pcm: 'not audio!' });
    expect(commands.length).toBe(3); expect(session.snapshot().state).toBe('held');
    expect(session.takeAudio()).toEqual([]);
  });
  it('bounds the queue and holds overflow', () => {
    const session = new VoiceSession('room'); const key = session.start('r1', 'i1');
    for (let i = 0; i < 51; i++) session.enqueue({ ...key, eventId: `${i}`, pcm: SILENT_FRAME });
    expect(session.snapshot()).toMatchObject({ state: 'held', queued: 0 });
  });
  it('does not finish playback merely because generation is done', () => {
    const session = new VoiceSession('room'); const key = session.start('r1', 'i1');
    session.enqueue({ ...key, eventId: '1', pcm: SILENT_FRAME }); session.finishGeneration(key, 'completed');
    expect(session.finishPlayback(key)).toEqual([]); expect(session.snapshot().state).toBe('speaking');
    const sent = session.takeAudio();
    expect(sent).toHaveLength(2);
    expect(sent[1]?.payload).toMatchObject({ event_type: 'conversation.echo', properties: { done: true } });
    expect(session.finishPlayback(key)).toEqual([]);
    expect(session.snapshot().state).toBe('speaking');
    session.acknowledgePlayback(key, 20);
    expect(session.finishPlayback(key)).toEqual([]);
    expect(session.snapshot().state).toBe('stopped');
  });
  it('sends completion once when generation finishes after the last frame was sent', () => {
    const session = new VoiceSession('room'); const key = session.start('r1', 'i1');
    session.enqueue({ ...key, eventId: '1', pcm: SILENT_FRAME });
    expect(session.takeAudio()).toHaveLength(1);
    expect(session.finishGeneration(key, 'completed')[0]?.payload).toMatchObject({ properties: { done: true } });
    expect(session.finishGeneration(key, 'completed')).toEqual([]);
    expect(session.takeAudio()).toEqual([]);
    expect(session.snapshot().state).toBe('speaking');
    session.acknowledgePlayback(key, 20); session.finishPlayback(key);
    expect(session.snapshot().state).toBe('stopped');
  });
  it('does not send completion until queued audio drains', () => {
    const session = new VoiceSession('room'); const key = session.start('r1', 'i1');
    session.enqueue({ ...key, eventId: '1', pcm: SILENT_FRAME });
    session.enqueue({ ...key, eventId: '2', pcm: SILENT_FRAME });
    expect(session.finishGeneration(key, 'completed')).toEqual([]);
    expect(session.takeAudio()).toHaveLength(1);
    expect(session.takeAudio()).toHaveLength(2);
    expect(session.takeAudio()).toEqual([]);
  });
  it('interruption after send completion still cancels playback and ignores old events', () => {
    const session = new VoiceSession('room'); const key = session.start('r1', 'i1');
    session.enqueue({ ...key, eventId: '1', pcm: SILENT_FRAME }); session.takeAudio();
    session.finishGeneration(key, 'completed');
    expect(session.interrupt().map(c => c.payload.type ?? c.payload.event_type)).toContain('conversation.interrupt');
    expect(session.acknowledgePlayback(key, 20)).toBe(false);
    expect(session.finishGeneration(key, 'completed')).toEqual([]);
    expect(session.snapshot().state).toBe('held');
  });
  it.each(['cancelled', 'failed', 'incomplete', 'unknown'])('holds unsuccessful generation: %s', status => {
    const session = new VoiceSession('room'); const key = session.start('r1', 'i1');
    session.finishGeneration(key, status); expect(session.snapshot().state).toBe('held');
  });
  it('ends idempotently and refuses another response in an ended session', () => {
    const session = new VoiceSession('room'); const key = session.start('r1', 'i1');
    session.end(); expect(session.end()).toEqual([]);
    session.enqueue({ ...key, eventId: 'late', pcm: SILENT_FRAME });
    expect(session.takeAudio()).toEqual([]); expect(() => session.start('r2', 'i2')).toThrow();
  });
});

const reviewedFixture: VoicePolicy = { voiceProvider: 'OpenAI', fallbackProviders: [], pipeline: 'audio-echo', tavusTtsBypassed: true, evidenceReference: 'synthetic test fixture, not an inspected account' };
describe('P1-07: excluded and unknown voice paths', () => {
  it('accepts a fully described synthetic compliant path', () => expect(reviewVoicePolicy(reviewedFixture).allowed).toBe(true));
  it.each(['ElevenLabs', ' elevenlabs ', 'unknown', '', 'auto', 'Tavus'])('holds direct voice provider %s', voiceProvider => {
    expect(reviewVoicePolicy({ ...reviewedFixture, voiceProvider }).allowed).toBe(false);
  });
  it.each([['ElevenLabs'], ['unknown'], ['auto'], null])('holds excluded or unknown fallback %s', fallbackProviders => {
    expect(reviewVoicePolicy({ ...reviewedFixture, fallbackProviders }).allowed).toBe(false);
  });
  it('holds an unverified Tavus TTS bypass', () => expect(reviewVoicePolicy({ ...reviewedFixture, tavusTtsBypassed: false }).allowed).toBe(false));
  it('holds text Echo and full pipeline', () => {
    for (const pipeline of ['text-echo', 'full', 'unknown']) expect(reviewVoicePolicy({ ...reviewedFixture, pipeline }).allowed).toBe(false);
  });
  it('requires an account evidence reference', () => expect(reviewVoicePolicy({ ...reviewedFixture, evidenceReference: ' ' }).allowed).toBe(false));
});

describe('candidate contracts and honest simulation', () => {
  it('uses explicit 24 kHz audio Echo, not text TTS', () => {
    expect(echoAudio('room', 'response', SILENT_FRAME)).toMatchObject({ target: 'tavus', payload: {
      properties: { modality: 'audio', sample_rate: 24000, inference_id: 'response', done: false },
    } }); expect(pcmDurationMs(SILENT_FRAME)).toBe(20);
  });
  it('rejects malformed, oversized and non-PCM16 frames', () => {
    for (const pcm of ['', 'bad?', Buffer.alloc(1).toString('base64'), Buffer.alloc(962).toString('base64')]) expect(() => pcmDurationMs(pcm)).toThrow();
  });
  it('requires explicit model/voice and disables automatic conversation output for a controlled media test', () => {
    expect(() => realtimeConfiguration('', 'marin')).toThrow();
    expect(realtimeConfiguration('account-verified-model', 'account-verified-voice')).toMatchObject({ type: 'session.update', session: {
      audio: { input: { turn_detection: null }, output: { voice: 'account-verified-voice' } },
    } });
  });
  it('builds a private room with no participant-memory tag', () => {
    expect(privateEchoConversation('fixture-face', 'fixture-pal')).toEqual({ face_id: 'fixture-face', pal_id: 'fixture-pal', require_auth: true, max_participants: 2, participant_tags: [] });
    expect(() => privateEchoConversation('', 'fixture-pal')).toThrow();
  });
  it('local delayed events leave interrupted output stopped', () => {
    const demo = new Simulation(); demo.start(); demo.tick(); demo.interrupt();
    const before = demo.snapshot(); demo.injectLate(); const after = demo.snapshot();
    expect(after.state).toBe('stopped'); expect(after.delivered).toBe(before.delivered); expect(after.rejected).toBe(before.rejected + 2);
  });
  it('a replacement instance loses unsaved state and contains no transcripts or images', () => {
    const demo = new Simulation(); demo.start(); demo.tick();
    const fresh = new Simulation(); expect(fresh.snapshot()).toMatchObject({ state: 'idle', delivered: 0, rejected: 0, queued: 0 });
    expect(fresh.snapshot()).not.toHaveProperty('notes');
  });
});
