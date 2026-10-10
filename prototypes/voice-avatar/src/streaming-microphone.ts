import workletUrl from './streaming-microphone-worklet.js?url';

export type CaptureStop = 'requested' | 'time-limit' | 'hidden' | 'device-ended' | 'transport-held' | 'capture-failed';

/** Local capture only. A transport must accept a frame synchronously or return
 * false. No retry queue, audio history, provider connection or automatic start.
 */
export class StreamingMicrophone {
  private epoch = 0;
  private active = false;
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private node: AudioWorkletNode | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private onStop: ((reason: CaptureStop) => void) | null = null;
  private hide = () => { if (document.hidden) this.stop('hidden'); };
  private leave = () => this.stop('hidden');

  async start(accept: (pcm: ArrayBuffer) => boolean, onStop: (reason: CaptureStop) => void): Promise<boolean> {
    this.stop();
    this.active = true; this.onStop = onStop;
    const epoch = this.epoch;
    let sequence = 0;
    document.addEventListener('visibilitychange', this.hide);
    window.addEventListener('pagehide', this.leave);
    this.timer = setTimeout(() => this.stop('time-limit'), 85_000);
    try {
      if (document.hidden) { this.stop('hidden'); return false; }
      // Activate audio in the explicit user gesture before awaiting permission.
      const context = new AudioContext({ sampleRate: 24000 }); this.context = context;
      const resumed = context.resume().then(() => true, () => false);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 }, video: false,
      });
      if (epoch !== this.epoch) { stream.getTracks().forEach(track => track.stop()); return false; }
      this.stream = stream;
      const tracks = stream.getAudioTracks();
      if (!tracks.length || tracks.some(track => track.readyState !== 'live')) throw new Error('Microphone is unavailable.');
      for (const track of tracks) track.addEventListener('ended', () => { if (epoch === this.epoch) this.stop('device-ended'); }, { once: true });
      const didResume = await resumed;
      if (epoch !== this.epoch) return false;
      if (!didResume || context.state !== 'running') throw new Error('Audio is paused.');
      await context.audioWorklet.addModule(workletUrl);
      if (epoch !== this.epoch) return false;
      const node = new AudioWorkletNode(context, 'streaming-microphone'); this.node = node;
      node.onprocessorerror = () => { if (epoch === this.epoch) this.stop('capture-failed'); };
      node.port.onmessage = event => {
        if (epoch !== this.epoch) return;
        const message = event.data;
        if (message?.type === 'stopped') { this.stop(message.reason === 'time-limit' ? 'time-limit' : 'capture-failed'); return; }
        if (message?.type !== 'pcm' || message.sequence !== sequence || !(message.pcm instanceof ArrayBuffer) || message.pcm.byteLength !== 960) {
          this.stop('capture-failed'); return;
        }
        ++sequence;
        try {
          if (accept(message.pcm) !== true) { this.stop('transport-held'); return; }
        } catch { this.stop('transport-held'); return; }
        if (epoch === this.epoch) node.port.postMessage('credit');
      };
      this.source = context.createMediaStreamSource(stream);
      this.source.connect(node); node.connect(context.destination);
      return true;
    } catch {
      if (epoch === this.epoch) this.stop('capture-failed');
      return false;
    }
  }

  stop(reason: CaptureStop = 'requested') {
    const notify = this.active ? this.onStop : null;
    ++this.epoch; this.active = false; this.onStop = null;
    if (this.timer) clearTimeout(this.timer); this.timer = null;
    document.removeEventListener('visibilitychange', this.hide); window.removeEventListener('pagehide', this.leave);
    const safely = (action: () => unknown) => { try { action(); } catch { /* Continue closing all other resources. */ } };
    this.stream?.getTracks().forEach(track => safely(() => track.stop())); this.stream = null;
    if (this.source) safely(() => this.source!.disconnect()); this.source = null;
    if (this.node) {
      this.node.port.onmessage = null; this.node.onprocessorerror = null;
      safely(() => this.node!.port.postMessage('stop')); safely(() => this.node!.disconnect());
      safely(() => this.node!.port.close());
    }
    this.node = null;
    if (this.context) safely(() => { void this.context!.close().catch(() => {}); }); this.context = null;
    // Cleanup precedes notification, so caller errors cannot leave devices open.
    try { notify?.(reason); } catch { /* Owner callbacks cannot undo cleanup. */ }
  }
}
