// Bounded local capture. The worklet emits silence to the speakers and never
// opens a network connection. Four credits bound the message queue to 80 ms.
class StreamingMicrophone extends AudioWorkletProcessor {
  constructor() {
    super();
    this.done = false; this.credits = 4; this.sequence = 0; this.count = 0;
    this.width = sampleRate / 24000; this.weight = 0; this.sum = 0;
    this.packet = new Int16Array(480); this.used = 0;
    this.port.onmessage = event => {
      if (event.data === 'stop') this.stop('requested');
      if (event.data === 'credit' && !this.done) this.credits = Math.min(4, this.credits + 1);
    };
    if (!Number.isFinite(sampleRate) || sampleRate < 8000 || sampleRate > 192000) this.stop('sample-rate');
  }
  stop(reason) {
    if (this.done) return;
    this.done = true; this.packet.fill(0); this.used = 0; this.sum = 0; this.weight = 0;
    this.port.postMessage({ type: 'stopped', reason });
  }
  sample(value) {
    this.packet[this.used++] = Math.round(value * (value < 0 ? 32768 : 32767));
    if (this.used !== 480) return;
    if (!this.credits) { this.stop('backpressure'); return; }
    // DataView makes the wire byte order independent of the device architecture.
    const pcm = new ArrayBuffer(960), view = new DataView(pcm);
    for (let i = 0; i < 480; i++) view.setInt16(i * 2, this.packet[i], true);
    --this.credits; this.used = 0;
    this.port.postMessage({ type: 'pcm', sequence: this.sequence++, pcm }, [pcm]);
  }
  process(inputs, outputs) {
    for (const output of outputs ?? []) for (const channel of output) channel.fill(0);
    if (this.done) return false;
    const channel = inputs[0]?.[0];
    if (!channel) return true;
    for (const raw of channel) {
      if (this.count++ >= sampleRate * 85) { this.stop('time-limit'); return false; }
      const value = Number.isFinite(raw) ? Math.max(-1, Math.min(1, raw)) : 0;
      // Weighted sample intervals preserve timing at 44.1/48 kHz without
      // retaining an utterance. Voice quality still needs physical-device QA.
      let remaining = 1;
      while (remaining > 1e-9 && !this.done) {
        const part = Math.min(remaining, this.width - this.weight);
        this.sum += value * part; this.weight += part; remaining -= part;
        if (this.width - this.weight < 1e-9) {
          this.sample(this.sum / this.width); this.sum = 0; this.weight = 0;
        }
      }
      if (this.done) return false;
    }
    return true;
  }
}
registerProcessor('streaming-microphone', StreamingMicrophone);
