// Device ownership only. No recorder, network transport or persistence.
export class LocalDevices {
  private generation = 0;
  private stream: MediaStream | null = null;
  private pending = false;
  private acquire: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  constructor(acquire: (constraints: MediaStreamConstraints) => Promise<MediaStream>) { this.acquire = acquire; }
  async start(): Promise<MediaStream | null> {
    if (this.pending || this.stream) throw new Error('Device check is already active.');
    const generation = ++this.generation;
    this.pending = true;
    try {
      const stream = await this.acquire({ audio: { echoCancellation: true, noiseSuppression: true }, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } });
      if (generation !== this.generation) { stream.getTracks().forEach(track => track.stop()); return null; }
      if (!stream.getAudioTracks().length || !stream.getVideoTracks().length) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error('Both a microphone and a camera are needed for this check.');
      }
      this.stream = stream;
      return stream;
    } finally { if (generation === this.generation) this.pending = false; }
  }
  stop() {
    ++this.generation; this.pending = false;
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
  }
}
