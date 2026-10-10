import { validateSpokenAudio } from './scripted-providers.ts';
import type { SpokenHistory } from './scripted-providers.ts';

export type ConfirmedSnapshot = Readonly<{ revision: number; history: readonly Readonly<SpokenHistory>[] }>;

/** Volatile, server-only memory for the existing two-exchange prototype. Generated
 * replies are pending until explicit whole-reply confirmation. This is not the
 * future saved-preferences store. Never serialize snapshots to logs or endpoints.
 */
export class ConfirmedConversation {
  private epoch = 0;
  private confirmed: SpokenHistory[] = [];
  private pending: { id: string; audio: string; reply: string } | null = null;
  private used = new Set<string>();
  revision() { return this.epoch; }
  awaitingConfirmation() { return this.pending !== null; }
  history(): SpokenHistory[] { return this.confirmed.map(pair => ({...pair})); }
  stage(revision: number, id: string, audio: string, reply: string) {
    if (revision !== this.epoch || this.pending || !id || this.used.has(id) || this.used.size >= 2) throw new Error('Reply context is stale or unavailable.');
    validateSpokenAudio(audio);
    if (typeof reply !== 'string' || !reply.trim() || reply.length > 1000) throw new Error('Reply context is invalid.');
    this.used.add(id); this.pending = {id,audio,reply}; this.epoch++;
  }
  confirm(id: string) {
    if (!this.pending || this.pending.id !== id) throw new Error('Reply confirmation is stale.');
    this.confirmed = [{audio:this.pending.audio,reply:this.pending.reply}];
    this.pending = null; this.epoch++;
  }
  discardPending() { this.pending = null; this.epoch++; }
  capture(): ConfirmedSnapshot { return Object.freeze({revision:this.epoch,history:Object.freeze(this.history().map(pair => Object.freeze(pair)))}); }
  matches(snapshot: ConfirmedSnapshot): boolean { return snapshot.revision === this.epoch; }
  clear() { this.pending = null; this.confirmed = []; this.used.clear(); this.epoch++; }
}
