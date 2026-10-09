import { createHash, timingSafeEqual } from 'node:crypto';
export type PreviewConfig = { origin: string; password: string };
export function validatePreview(config: PreviewConfig) {
  const url = new URL(config.origin);
  if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.onrender\.com$/.test(url.hostname) || url.pathname !== '/' || url.port || url.username || url.password || url.hash || url.search || config.password.length < 32 || config.password.length > 128 || !/^[A-Za-z0-9_+/=-]+$/.test(config.password)) throw new Error('Private preview configuration is incomplete.');
  return { origin: url.origin, host: url.host };
}
/** Fixed memory and a global failed-guess window. Correct credentials never get locked out. */
export class PreviewGate {
  private expected: Buffer;
  private failures = 0;
  private windowAt = Date.now();
  constructor(config: PreviewConfig) { validatePreview(config); this.expected = createHash('sha256').update(`stylist:${config.password}`).digest(); }
  check(header: string | undefined): 200 | 401 | 429 {
    const match = header && header.length <= 512 ? /^Basic ([A-Za-z0-9+/]+={0,2})$/.exec(header) : null;
    if (match) {
      const provided = createHash('sha256').update(Buffer.from(match[1]!, 'base64')).digest();
      if (timingSafeEqual(this.expected, provided)) return 200;
    }
    if (Date.now() - this.windowAt >= 60_000) { this.failures = 0; this.windowAt = Date.now(); }
    if (++this.failures > 60) return 429;
    return 401;
  }
}
