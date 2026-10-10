import { ConfirmedConversation } from './confirmed-conversation.ts';
import type { SpokenHistory } from './scripted-providers.ts';
import { VoiceSession } from './voice-session.ts';

export type FreshContext = { id: string; configurationVerified: boolean };
export type RecoveryTransport = {
  stopLocalOutput: () => void;
  closeOldContext: (signal: AbortSignal) => Promise<boolean>;
  verifyRendererStopped: (signal: AbortSignal) => Promise<boolean>;
  openFreshContext: (signal: AbortSignal) => Promise<FreshContext>;
  restoreConfirmedContext: (context: FreshContext, history: readonly Readonly<SpokenHistory>[], signal: AbortSignal) => Promise<boolean>;
  discardFreshContext: (context: FreshContext) => Promise<void>;
};

/** One explicit recovery attempt per held epoch. No provider calls are implemented
 * here. Adapters must verify closure/configuration using actual transport events;
 * sending close/update/interrupt is not an acknowledgment. The renderer verifier
 * must establish old output cannot resume, not merely a server speaking duration.
 * A fresh context must contain no
 * unconfirmed assistant reply. Confirmed history is copied from the server-only
 * memory and restored only after a transport acknowledgment.
 */
export class ContextRecovery {
  private active: AbortController | null = null;
  private attempted = new Set<number>();
  private cleanupFailed = false;
  private cleanupPending = 0;
  private session: VoiceSession;
  private transport: RecoveryTransport;
  private confirmed: ConfirmedConversation;
  constructor(session: VoiceSession, transport: RecoveryTransport, confirmed = new ConfirmedConversation()) { this.session = session; this.transport = transport; this.confirmed = confirmed; }

  cancel() { this.active?.abort(); }
  snapshot() { return { recovering: Boolean(this.active), cleanupFailed: this.cleanupFailed, cleanupPending: this.cleanupPending > 0 }; }

  async recover(oldContextId: string, timeoutMs = 8000): Promise<boolean> {
    const initial = this.session.snapshot();
    if (!oldContextId || initial.state !== 'held' || this.active || this.cleanupFailed || this.cleanupPending || this.attempted.has(initial.epoch)
      || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 8000) return false;
    // The session itself has a bounded life; keep only this recovery identity.
    this.attempted.clear(); this.attempted.add(initial.epoch);
    this.confirmed.discardPending(); const snapshot = this.confirmed.capture();
    const controller = new AbortController(); this.active = controller;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let freshPending: FreshContext | null = null, accepted = false;
    const discarded = new Set<FreshContext>();
    const isCurrent = () => !controller.signal.aborted && this.session.snapshot().state === 'held' && this.session.snapshot().epoch === initial.epoch && this.confirmed.matches(snapshot);
    const discard = async (context: FreshContext) => {
      if (discarded.has(context)) return;
      discarded.add(context); this.cleanupPending++;
      try { await this.transport.discardFreshContext(context); }
      catch { this.cleanupFailed = true; }
      finally { this.cleanupPending--; }
    };
    controller.signal.addEventListener('abort', () => { if (freshPending && !accepted) void discard(freshPending); }, {once:true});
    const stopped = new Promise<false>(resolve => {
      controller.signal.addEventListener('abort', () => resolve(false), { once: true });
      timer = setTimeout(() => controller.abort(), timeoutMs);
    });
    const work = async () => {
      try {
        this.transport.stopLocalOutput();
        if (!isCurrent()) return false;
        const closed = await this.transport.closeOldContext(controller.signal);
        if (closed !== true || !isCurrent()) return false;
        const rendererStopped = await this.transport.verifyRendererStopped(controller.signal);
        if (rendererStopped !== true || !isCurrent()) return false;
        const fresh = await this.transport.openFreshContext(controller.signal);
        freshPending = fresh;
        if (!fresh || typeof fresh.id !== 'string' || !fresh.id || fresh.id === oldContextId || fresh.configurationVerified !== true || !isCurrent()) {
          if (fresh) await discard(fresh);
          return false;
        }
        try {
          const restored = await this.transport.restoreConfirmedContext(fresh, snapshot.history, controller.signal);
          if (restored !== true || !isCurrent()) { await discard(fresh); return false; }
        } catch { await discard(fresh); return false; }
        if (!this.session.completeContextReset(initial.epoch)) { await discard(fresh); return false; }
        accepted = true;
        return true;
      } catch { return false; }
    };
    try { return await Promise.race([work(), stopped]); }
    finally {
      if (timer) clearTimeout(timer);
      // Invalidate late work on errors, cancellation and deadline. A late fresh
      // connection is discarded by work(), never installed in the coordinator.
      controller.abort(); if (this.active === controller) this.active = null;
    }
  }
}
