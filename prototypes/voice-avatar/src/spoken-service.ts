import { randomUUID } from 'node:crypto';
import { ScriptedService } from './scripted-service.ts';
import { generateSpokenReply, validateSpokenAudio } from './scripted-providers.ts';
import { ConfirmedConversation } from './confirmed-conversation.ts';
import type { ExperimentBudget } from './experiment-budget.ts';

/** Two buffered exchanges, not continuous streaming. Context advances only on owner confirmation. */
export class SpokenService {
  private room: ScriptedService;
  private key: string;
  private abort = new AbortController();
  private busy = false;
  private turns = 0;
  private context = new ConfirmedConversation();
  private sessionId = '';
  private inputTokens = 0;
  private outputTokens = 0;
  constructor(keys: { openai: string; tavus: string }, budget: ExperimentBudget) {
    this.room = new ScriptedService(keys, budget, true, () => { this.abort.abort(); this.context.clear(); }); this.key = keys.openai;
  }
  heartbeat() { this.room.heartbeat(); }
  snapshot() {
    const room = this.room.snapshot();
    if (['ended', 'held', 'failed'].includes(room.state)) { this.abort.abort(); this.context.clear(); }
    return { ...room, mode: 'spoken', turns: this.turns, turnLimit: 2, awaitingConfirmation: this.context.awaitingConfirmation(),
      generating: this.busy, inputTokens: this.inputTokens, outputTokens: this.outputTokens };
  }
  async start(sessionId: string) {
    if (!/^[a-f0-9-]{36}$/.test(sessionId)) throw new Error('Invalid test identifier.');
    if (this.busy) throw new Error('Reply still stopping.');
    const state = this.room.snapshot().state;
    if (!['idle', 'ended', 'failed'].includes(state)) throw new Error('Test already active.');
    this.sessionId = sessionId; this.abort = new AbortController(); this.turns = 0; this.context.clear(); this.inputTokens = 0; this.outputTokens = 0;
    await this.room.start();
  }
  private checkSession(sessionId: string) { if (!sessionId || sessionId !== this.sessionId) throw new Error('Stale test.'); }
  connect(sessionId: string) { this.checkSession(sessionId); const { url, token, conversationId } = this.room.connect(); return { url, token, conversationId }; }
  async turn(audio: string, sessionId: string) {
    this.checkSession(sessionId);
    validateSpokenAudio(audio);
    if (this.room.snapshot().state !== 'connected' || this.abort.signal.aborted || this.busy || this.context.awaitingConfirmation() || this.turns >= 2) throw new Error('A spoken turn is unavailable.');
    this.busy = true; ++this.turns;
    const signal = this.abort.signal; const revision = this.context.revision();
    try {
      const fixture = await generateSpokenReply(this.key, signal, audio, this.context.history());
      if (signal.aborted || this.room.snapshot().state !== 'connected') throw new Error('Reply canceled.');
      if (!fixture.transcript) throw new Error('Reply transcript is unavailable.');
      this.inputTokens += fixture.inputTokens; this.outputTokens += fixture.outputTokens;
      const id = randomUUID(); this.context.stage(revision, id, audio, fixture.transcript);
      return { id, pcm: fixture.pcm.toString('base64'), transcript: fixture.transcript, inputTokens: fixture.inputTokens, outputTokens: fixture.outputTokens };
    } catch {
      await this.stop(); throw new Error('Spoken reply stopped. Connection cleanup is being checked.');
    } finally { this.busy = false; }
  }
  confirmHeard(id: string, sessionId: string) {
    this.checkSession(sessionId);
    if (this.abort.signal.aborted || this.room.snapshot().state !== 'connected') throw new Error('Reply confirmation is stale.');
    this.context.confirm(id);
    return this.snapshot();
  }
  async end(sessionId: string) { this.checkSession(sessionId); await this.stop(); }
  async stop() { this.abort.abort(); this.context.clear(); await this.room.stop(); }
}
