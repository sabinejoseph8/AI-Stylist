import workletUrl from './microphone-worklet.js?url';

export function encodePcm(samples: Float32Array): string {
  if (samples.length < 4800 || samples.length > 288000) throw new Error('Please speak for between a moment and twelve seconds.');
  const bytes = new Uint8Array(samples.length * 2), view = new DataView(bytes.buffer);
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, Number.isFinite(samples[i]) ? samples[i]! : 0));
    view.setInt16(i * 2, Math.round(sample * (sample < 0 ? 32768 : 32767)), true);
  }
  let raw = ''; for (let i = 0; i < bytes.length; i += 8192) raw += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(raw);
}
export class MicrophoneCapture {
  private epoch = 0;
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private node: AudioWorkletNode | null = null;
  private chunks: Float32Array[] = [];
  private count = 0;
  private completed: Promise<void> | null = null;
  private complete: (() => void) | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  async start(onLimit: () => void) {
    this.cancel(); const epoch = this.epoch;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 }, video: false });
    if (epoch !== this.epoch) { stream.getTracks().forEach(t => t.stop()); return false; }
    this.stream = stream;
    try {
      const context = new AudioContext({ sampleRate: 24000 }); this.context = context;
      await context.audioWorklet.addModule(workletUrl);
      if (epoch !== this.epoch) return false;
      const node = new AudioWorkletNode(context, 'private-microphone'); this.node = node;
      const source = context.createMediaStreamSource(stream); this.source = source;
      this.completed = new Promise(resolve => { this.complete = resolve; });
      node.port.onmessage = event => {
        if (epoch !== this.epoch) return;
        if (event.data.type === 'samples') {
          const samples = event.data.samples;
          if (!(samples instanceof Float32Array) || this.count + samples.length > context.sampleRate * 12) { this.cancel(); return; }
          this.chunks.push(samples); this.count += samples.length;
        } else if (event.data.type === 'finished') { this.complete?.(); onLimit(); }
      };
      // Worklet emits only zeros; capture never loops microphone sound through the speakers.
      source.connect(node); node.connect(context.destination); await context.resume();
      if (epoch !== this.epoch) return false;
      for (const track of stream.getTracks()) track.addEventListener('ended', onLimit, { once: true });
      return true;
    } catch (error) { if (epoch === this.epoch) this.cancel(); throw error; }
  }
  async finish(): Promise<string> {
    if (!this.node || !this.context || !this.completed) throw new Error('Microphone is not active.');
    const epoch = this.epoch, rate = this.context.sampleRate;
    this.node.port.postMessage('finish');
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([this.completed, new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Error('Microphone did not stop.')), 1000); })]);
      if (epoch !== this.epoch) throw new Error('Microphone capture canceled.');
      const samples = new Float32Array(this.count); let offset = 0;
      for (const chunk of this.chunks) { samples.set(chunk, offset); offset += chunk.length; }
      this.cancel();
      if (samples.length < rate / 5 || samples.length > rate * 12) throw new Error('Please speak for between a moment and twelve seconds.');
      // Offline browser resampling supports devices that ignore the requested sample rate.
      const offline = new OfflineAudioContext(1, Math.floor(samples.length * 24000 / rate), 24000);
      const buffer = offline.createBuffer(1, samples.length, rate); buffer.copyToChannel(samples, 0);
      const source = offline.createBufferSource(); source.buffer = buffer; source.connect(offline.destination); source.start();
      const result = await offline.startRendering();
      if (this.epoch !== epoch + 1) throw new Error('Microphone capture canceled.');
      return encodePcm(result.getChannelData(0));
    } finally { if (timer) clearTimeout(timer); if (this.epoch === epoch) this.cancel(); }
  }
  cancel() {
    ++this.epoch; this.complete?.(); this.complete = null; this.completed = null;
    this.stream?.getTracks().forEach(t => t.stop()); this.stream = null;
    this.source?.disconnect(); this.source = null;
    this.node?.disconnect(); this.node = null;
    if (this.context) void this.context.close().catch(() => {}); this.context = null;
    this.chunks = []; this.count = 0;
  }
}
