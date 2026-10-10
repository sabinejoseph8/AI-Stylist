export type EchoFrame = { responseId: string; itemId: string; sequence: number; pcm: Uint8Array };

/** Bounded, paced queue for the future streaming bridge. Transport acceptance is
 * not proof of renderer playback. No retries, catch-up bursts or history commits.
 * The owner must enforce its room deadline and stop generation when this holds.
 */
export class IncrementalEcho {
  private epoch = 0;
  private responseId = '';
  private itemId = '';
  private sequence = 0;
  private queue: Uint8Array[] = [];
  private totalBytes = 0;
  private sent = 0;
  private done = false;
  private active = false;
  private stopTransmitted = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private next = 0;
  private conversationId: string;
  private send: (message: object) => boolean;
  private notify: (state: 'held' | 'sent' | 'stopped') => void;

  constructor(conversationId: string, send: (message: object) => boolean, notify: (state: 'held' | 'sent' | 'stopped') => void) {
    if (!conversationId) throw new Error('Conversation identity required.');
    this.conversationId = conversationId; this.send = send; this.notify = notify;
  }
  begin(): number {
    if (this.active || (this.responseId && !this.stopTransmitted)) throw new Error('Stop the previous stream first.');
    this.epoch++; this.responseId = ''; this.itemId = ''; this.sequence = 0;
    this.queue = []; this.totalBytes = 0; this.sent = 0; this.done = false;
    this.active = true; this.stopTransmitted = false; this.next = performance.now(); return this.epoch;
  }
  private signal(state: 'held' | 'sent' | 'stopped') { try { this.notify(state); } catch { /* Output is already invalidated. */ } }
  accept(epoch: number, frame: EchoFrame): boolean {
    if (!this.active || epoch !== this.epoch || this.done) return false;
    if (!frame || !frame.responseId || !frame.itemId || frame.sequence !== this.sequence
      || !(frame.pcm instanceof Uint8Array) || !frame.pcm.length || frame.pcm.length > 960 || frame.pcm.length % 2
      || (this.responseId && (frame.responseId !== this.responseId || frame.itemId !== this.itemId))
      || this.queue.length >= 50 || this.totalBytes + frame.pcm.length > 1_200_000) {
      this.stop('held'); return false;
    }
    this.responseId = frame.responseId; this.itemId = frame.itemId; this.sequence++;
    this.totalBytes += frame.pcm.length; this.queue.push(new Uint8Array(frame.pcm));
    if (!this.timer) this.tick(epoch);
    return this.active && epoch === this.epoch;
  }
  finish(epoch: number): boolean {
    if (!this.active || epoch !== this.epoch || this.done) return false;
    if (!this.totalBytes) { this.stop('held'); return false; }
    this.done = true; if (!this.timer) this.tick(epoch);
    return epoch === this.epoch;
  }
  private message(pcm: Uint8Array | undefined, done: boolean) {
    const raw = pcm ? String.fromCharCode(...pcm) : '';
    return { message_type: 'conversation', event_type: 'conversation.echo', conversation_id: this.conversationId,
      properties: { modality: 'audio', audio: btoa(raw), sample_rate: 24000, inference_id: this.responseId, done } };
  }
  private tick(epoch: number) {
    if (!this.active || epoch !== this.epoch) return;
    this.timer = undefined;
    if (performance.now() - this.next > 250) { this.stop('held'); return; }
    const pcm = this.queue.shift();
    if (!pcm && !this.done) return;
    const final = !pcm && this.done;
    try {
      const message = this.message(pcm, final);
      if (new TextEncoder().encode(JSON.stringify(message)).length > 4096 || this.send(message) !== true) { this.stop('held'); return; }
      // A synchronous sink can stop the stream; never schedule its old epoch.
      if (!this.active || epoch !== this.epoch) return;
      if (pcm) this.sent++;
      if (final) { this.active = false; this.signal('sent'); return; }
      this.next = performance.now() + pcm!.length / 48;
      this.timer = setTimeout(() => this.tick(epoch), Math.max(0, this.next - performance.now()));
    } catch { this.stop('held'); }
  }
  stop(state: 'held' | 'stopped' = 'stopped') {
    this.active = false; this.epoch++;
    if (this.timer) clearTimeout(this.timer); this.timer = undefined; this.queue = [];
    if (!this.stopTransmitted && this.responseId) {
      this.stopTransmitted = true;
      try { this.send({message_type:'conversation',event_type:'conversation.interrupt',conversation_id:this.conversationId}); } catch { /* The owner must verify room cleanup. */ }
    }
    this.signal(state);
  }
  snapshot() { return {active:this.active,queued:this.queue.length,sent:this.sent,generatedBytes:this.totalBytes}; }
}
