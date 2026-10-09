class PrivateMicrophone extends AudioWorkletProcessor {
  constructor() { super(); this.count = 0; this.buffer = new Float32Array(2048); this.used = 0; this.done = false; this.port.onmessage = e => { if (e.data === 'finish') this.finish(); }; }
  flush() { if (this.used) { const chunk = this.buffer.slice(0, this.used); this.port.postMessage({ type: 'samples', samples: chunk }, [chunk.buffer]); this.used = 0; } }
  finish() { if (this.done) return; this.flush(); this.done = true; this.port.postMessage({ type: 'finished' }); }
  process(inputs) {
    if (this.done) return false;
    const channel = inputs[0]?.[0];
    if (channel) for (const value of channel) {
      if (this.count >= sampleRate * 12) { this.finish(); return false; }
      this.buffer[this.used++] = value; ++this.count;
      if (this.used === this.buffer.length) this.flush();
    }
    return true;
  }
}
registerProcessor('private-microphone', PrivateMicrophone);
