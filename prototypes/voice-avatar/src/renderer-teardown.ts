/** Local renderer disposal only. This does not prove provider room termination,
 * final usage, or the playback position heard by the customer. The owner must
 * invalidate all old attachment callbacks synchronously before disposal. */
export type RendererClient = { destroy(): Promise<void>; isDestroyed(): boolean };
export type RendererElement = Pick<HTMLMediaElement, 'muted' | 'pause' | 'srcObject'>;
export class RendererTeardown {
  private result: Promise<boolean> | null = null;
  private client: RendererClient;
  private elements: readonly RendererElement[];
  private invalidateAttachments: () => void;
  constructor(client: RendererClient, elements: readonly RendererElement[], invalidateAttachments: () => void) {
    this.client = client; this.elements = [...elements]; this.invalidateAttachments = invalidateAttachments;
  }
  begin(): void { if (!this.result) this.result = this.run(); }
  dispose(signal: AbortSignal): Promise<boolean> {
    if (signal.aborted) return Promise.resolve(false);
    this.begin();
    return new Promise(resolve => {
      const abort = () => resolve(false);
      signal.addEventListener('abort', abort, { once: true });
      void this.result!.then(value => { signal.removeEventListener('abort', abort); resolve(!signal.aborted && value); });
    });
  }
  private async run(): Promise<boolean> {
    let safe = true;
    try { this.invalidateAttachments(); } catch { safe = false; }
    for (const element of this.elements) {
      try { element.muted = true; } catch { safe = false; }
      try { element.pause(); } catch { safe = false; }
      try { element.srcObject = null; } catch { safe = false; }
    }
    try {
      await this.client.destroy();
      return safe && this.client.isDestroyed() === true && this.elements.every(element => element.muted && element.srcObject === null);
    } catch { return false; }
  }
}
