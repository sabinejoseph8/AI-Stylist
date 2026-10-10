/** Local energy-based prototype turn detection, not semantic/provider VAD.
 * Retains at most twelve seconds in memory; no persistence or network access.
 * False detections and acoustic echo must be evaluated on the physical phone.
 */
export class AutomaticTurn {
  private pre: Uint8Array[] = [];
  private frames: Uint8Array[] = [];
  private loud = 0;
  private quiet = 0;
  private speaking = false;
  constructor(privateStart: () => boolean, privateTurn: (audio: string) => void) {
    this.onStart = privateStart; this.onTurn = privateTurn;
  }
  private onStart: () => boolean;
  private onTurn: (audio: string) => void;
  consume(pcm: ArrayBuffer): boolean {
    if (pcm.byteLength !== 960) throw new Error('Expected one 20 ms frame.');
    const view = new DataView(pcm); let energy = 0;
    for (let i = 0; i < 480; i++) energy += (view.getInt16(i * 2, true) / 32768) ** 2;
    const loud = Math.sqrt(energy / 480) >= 0.025;
    const frame = new Uint8Array(pcm.slice(0));
    if (!this.speaking) {
      this.pre.push(frame); if (this.pre.length > 10) this.pre.shift();
      this.loud = loud ? this.loud + 1 : 0;
      if (this.loud < 3) return true;
      if (!this.onStart()) { this.reset(); return false; }
      this.speaking = true; this.frames = this.pre; this.pre = []; this.quiet = 0;
    } else {
      this.frames.push(frame); this.quiet = loud ? 0 : this.quiet + 1;
    }
    if (this.quiet >= 30 || this.frames.length >= 600) {
      const frames = this.frames; this.reset();
      const bytes = new Uint8Array(frames.length * 960);
      frames.forEach((part, i) => bytes.set(part, i * 960));
      let raw = ''; for (let i = 0; i < bytes.length; i += 8192) raw += String.fromCharCode(...bytes.subarray(i, i + 8192));
      this.onTurn(btoa(raw));
    }
    return true;
  }
  reset() { this.pre = []; this.frames = []; this.loud = 0; this.quiet = 0; this.speaking = false; }
}
