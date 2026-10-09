export type EchoConnection = { conversationId: string; inferenceId: string; pcm: string };
export const FRAME_BYTES = 960;

/** Buffered media probe: actual OpenAI generation completes before this paced stream.
 * This measures rendering/routing and stop behavior, not conversational end-to-end latency.
 */
export class EchoStream {
  private generation = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private frames = 0;
  private connection: EchoConnection;
  private send: (message: object) => void;
  private notify: (state: string, frames: number) => void;
  constructor(connection: EchoConnection, send: (message: object) => void, notify: (state: string, frames: number) => void) {
    this.connection = connection; this.send = send; this.notify = notify;
  }
  play(pcmBytes: Uint8Array, inferenceId: string) {
    if (!pcmBytes.length || pcmBytes.length % 2 || pcmBytes.length > 1_200_000) throw new Error('Audio fixture exceeds the bound.');
    this.interrupt(this.frames > 0); this.connection.inferenceId = inferenceId;
    const generation = ++this.generation; this.frames = 0;
    let offset = 0, next = performance.now();
    const tick = () => {
      if (generation !== this.generation) return;
      try {
        const end = Math.min(offset + FRAME_BYTES, pcmBytes.length);
        let raw = ''; for (let i = offset; i < end; i++) raw += String.fromCharCode(pcmBytes[i]!);
        const message = { message_type: 'conversation', event_type: 'conversation.echo', conversation_id: this.connection.conversationId,
          properties: { modality: 'audio', audio: btoa(raw), sample_rate: 24000, inference_id: inferenceId, done: end === pcmBytes.length } };
        if (new TextEncoder().encode(JSON.stringify(message)).length > 4096) throw new Error('Transport message exceeds 4 KB.');
        this.send(message); offset = end; this.frames++;
        this.notify(offset === pcmBytes.length ? 'All chunks sent; awaiting renderer playback.' : 'Sending script', this.frames);
        if (offset < pcmBytes.length) {
          // No burst catch-up after tab stalls. A late tab ends rather than accumulating output.
          next += 20;
          if (performance.now() - next > 250) { this.interrupt(); this.notify('Playback held after a browser scheduling delay.', this.frames); return; }
          this.timer = setTimeout(tick, Math.max(0, next - performance.now()));
        }
      } catch { this.interrupt(); this.notify('Transport failed; script held.', this.frames); }
    };
    tick();
  }
  interrupt(transmit = true) {
    this.generation++; if (this.timer) clearTimeout(this.timer); this.timer = undefined;
    if (transmit) {
      try { this.send({ message_type: 'conversation', event_type: 'conversation.interrupt', conversation_id: this.connection.conversationId }); }
      catch { /* Local queue is already invalidated. The owning page ends the room. */ }
    }
    this.notify('Stopped. Old script chunks are discarded.', this.frames);
  }
}
