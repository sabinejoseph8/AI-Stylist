import { randomUUID } from 'node:crypto';
import { ExperimentBudget } from './experiment-budget.ts';
import { FACE, PAL, MODEL, VOICE, generateScript, tavus, verifyEchoPal } from './scripted-providers.ts';
import type { Fixture } from './scripted-providers.ts';

export class ScriptedService {
  private keys: { openai: string; tavus: string };
  private budget: ExperimentBudget;
  private state = 'idle';
  private message = 'Ready for a scripted test. Microphone and camera stay off.';
  private run = '';
  private room = '';
  private fixture: Fixture | null = null;
  private connection: { url: string; token: string } | null = null;
  private abort = new AbortController();
  private timer?: ReturnType<typeof setInterval>;
  private createdAt = 0;
  private seenAt = 0;
  private automaticStop = '';
  private closing: Promise<void> | null = null;
  private createUncertain = false;
  private busy = false;
  private spoken: boolean;
  private onStop: () => void;
  constructor(keys: { openai: string; tavus: string }, budget: ExperimentBudget, spoken = false, onStop = () => {}) { this.keys = keys; this.budget = budget; this.spoken = spoken; this.onStop = onStop; }
  snapshot() {
    return { state: this.state, message: this.message, model: MODEL, voice: VOICE,
      hasRoom: Boolean(this.room), remainingSeconds: this.room ? Math.max(0, Math.ceil((85_000 - (Date.now() - this.createdAt)) / 1000)) : 0, inputTokens: this.fixture?.inputTokens ?? 0,
      outputTokens: this.fixture?.outputTokens ?? 0, maxSeconds: 90 };
  }
  heartbeat() { this.seenAt = Date.now(); }
  async start() {
    if (this.busy || this.room || !['idle', 'ended', 'failed'].includes(this.state)) throw new Error('A test is already in progress.');
    this.busy = true; this.state = 'preparing'; this.message = this.spoken ? 'Checking the private spoken-test connection.' : 'Checking Echo configuration and generating the fixed OpenAI script.';
    this.fixture = null; this.connection = null; this.run = ''; this.room = ''; this.closing = null; this.createUncertain = false; this.automaticStop = '';
    this.abort = new AbortController(); this.heartbeat();
    try {
      this.run = await this.budget.reserve(this.spoken ? 'spoken' : 'scripted');
      const pal = await tavus(this.keys.tavus, `/v2/pals/${PAL}`); verifyEchoPal(pal);
      const face = await tavus(this.keys.tavus, `/v2/faces/${FACE}`);
      if (face.status !== 'completed') throw new Error('Stock face is not ready.');
      this.fixture = this.spoken ? { pcm: Buffer.alloc(0), transcript: '', inputTokens: 0, outputTokens: 0 } : await generateScript(this.keys.openai, this.abort.signal);
      if (this.abort.signal.aborted) throw new Error('Test canceled.');
      this.createUncertain = true;
      const result = await tavus(this.keys.tavus, '/v2/conversations', {
        face_id: FACE, pal_id: PAL, require_auth: true, max_participants: 2,
        participant_tags: [], dynamic_greeting: false,
        conversation_name: this.spoken ? 'AI Stylist private spoken probe' : 'AI Stylist scripted media probe',
        properties: { max_call_duration: 90, participant_absent_timeout: 10, participant_left_timeout: 5,
          enable_recording: false, auto_start_recording: false, enable_closed_captions: false },
      });
      if (typeof result.conversation_id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(result.conversation_id)) throw new Error('Unrecognized conversation identifier.');
      this.room = result.conversation_id; this.createUncertain = false;
      await this.budget.setRoom(this.run, this.room);
      const url = new URL(result.conversation_url);
      if (url.protocol !== 'https:' || url.hostname !== 'tavus.daily.co' || url.search || url.hash
        || typeof result.meeting_token !== 'string' || !result.meeting_token) throw new Error('Private room credentials are missing.');
      this.connection = { url: url.toString(), token: result.meeting_token };
      this.createdAt = Date.now(); this.heartbeat();
      if (this.abort.signal.aborted) throw new Error('Test canceled.');
      this.state = 'ready'; this.message = this.spoken ? 'Private spoken-test room is ready.' : 'Script generated. Joining the private avatar connection.';
      this.timer = setInterval(() => {
        if (Date.now() - this.createdAt > 85_000) { this.automaticStop = 'The test time limit was reached.'; void this.stop(); }
        else if (Date.now() - this.seenAt > 6_000) { this.automaticStop = 'The test page stopped checking in.'; void this.stop(); }
      }, 500);
    } catch (error) {
      this.message = error instanceof Error ? error.message : 'The scripted test could not start.';
      await this.cleanup(true);
    } finally { this.busy = false; }
  }
  connect() {
    if (this.state !== 'ready' || !this.connection || !this.fixture) throw new Error('Private connection is not ready.');
    this.state = 'connected'; this.message = this.spoken ? 'Private spoken test connected.' : 'Scripted avatar test connected. Use Play script, Interrupt, or End test.';
    return { ...this.connection, conversationId: this.room, pcm: this.fixture.pcm.toString('base64'),
      transcript: this.fixture.transcript, inferenceId: randomUUID() };
  }
  async stop(failed = false) {
    this.onStop(); this.abort.abort();
    if (this.busy) {
      this.state = 'ending'; this.message = 'Stopping preparation and checking connection cleanup.';
      return;
    }
    return this.cleanup(failed);
  }
  private async cleanup(failed = false) {
    this.onStop();
    if (this.timer) clearInterval(this.timer); this.timer = undefined;
    if (this.closing) return this.closing;
    this.closing = (async () => {
      if (this.room) {
        try {
          await tavus(this.keys.tavus, `/v2/conversations/${this.room}/end`, {});
          const result = await tavus(this.keys.tavus, `/v2/conversations/${this.room}`);
          if (result.status !== 'ended') throw new Error('Room end is not verified.');
        } catch {
          this.state = 'held'; this.message = 'Room cleanup needs verification. New tests are blocked; the provider duration limit still applies.';
          this.connection = null; this.fixture = null; return;
        }
      }
      if (this.createUncertain) {
        this.state = 'held'; this.message = 'Room creation returned no usable confirmation. Check Tavus before another test.'; return;
      }
      if (this.run) {
        try { await this.budget.closeVerified(this.run); }
        catch { this.state = 'held'; this.message = 'Usage record needs review before another test.'; return; }
      }
      this.state = failed ? 'failed' : 'ended';
      if (!failed) this.message = `${this.automaticStop || 'Test ended.'} Provider connection closure was checked.`;
      this.room = ''; this.connection = null; this.fixture = null;
    })();
    return this.closing;
  }
}
