import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { createPrototypeServer } from '../src/server.ts';
import type { SpokenService } from '../src/spoken-service.ts';
const SESSION = '00000000-0000-4000-8000-000000000001';
describe('spoken HTTP boundary, mocked service only', () => {
  let server: Server, base: string, cookie: string;
  const service = { heartbeat: vi.fn(), snapshot: vi.fn(() => ({ state: 'idle', mode: 'spoken' })), start: vi.fn(), connect: vi.fn(() => ({ url: 'https://tavus.daily.co/fixture', token: 'fixture-token' })), turn: vi.fn(async () => ({ pcm: 'fixture' })), confirmHeard: vi.fn(), end: vi.fn() };
  beforeEach(async () => {
    vi.clearAllMocks(); server = createPrototypeServer({ spoken: service as unknown as SpokenService });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve)); const address = server.address(); if (!address || typeof address === 'string') throw new Error();
    base = `http://127.0.0.1:${address.port}`; const response = await fetch(`${base}/api/status`); cookie = response.headers.get('set-cookie')!.split(';')[0]!;
  });
  afterEach(async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); });
  const post = (action: string, body: unknown, origin?: string, token?: string) => fetch(`${base}/api/spoken/${action}`, { method: 'POST', headers: { Origin: origin ?? base, Cookie: token ?? cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  it('permits microphone only on the spoken page with bounded provider destinations', async () => {
    const response = await fetch(`${base}/spoken.html`); expect(response.headers.get('permissions-policy')).toBe('microphone=(self), camera=(), geolocation=()');
    expect(response.headers.get('content-security-policy')).toContain('wss://*.daily.co'); expect(response.headers.get('content-security-policy')).not.toContain('unsafe-eval');
    expect(response.headers.get('content-security-policy')).not.toContain("script-src 'self' data:");
  });
  it('requires owner token and same origin for every mutation', async () => {
    expect((await post('turn', { sessionId: SESSION, audio: 'fixture' }, 'https://other.example')).status).toBe(403);
    expect((await post('turn', { sessionId: SESSION, audio: 'fixture' }, base, '')).status).toBe(403); expect(service.turn).not.toHaveBeenCalled();
  });
  it('validates exact request fields and rejects unknown routes', async () => {
    for (const body of [{}, [], null, { sessionId: SESSION, audio: 'fixture', unexpected: true }, { sessionId: SESSION, audio: 5 }]) expect((await post('turn', body)).status).toBe(400);
    expect((await post('unrecognized', { sessionId: SESSION })).status).toBe(404); expect(service.turn).not.toHaveBeenCalled();
  });
  it('rejects oversized bodies before passing audio to a service', async () => {
    expect((await post('turn', { sessionId: SESSION, audio: 'a'.repeat(780001) })).status).toBe(400); expect(service.turn).not.toHaveBeenCalled();
  });
  it('forwards session identity and audio only to the intended service', async () => {
    expect((await post('start', { sessionId: SESSION })).status).toBe(200); expect(service.start).toHaveBeenCalledWith(SESSION);
    expect((await post('turn', { sessionId: SESSION, audio: 'fixture' })).status).toBe(200); expect(service.turn).toHaveBeenCalledWith('fixture', SESSION);
    expect((await post('confirm', { sessionId: SESSION, id: 'reply' })).status).toBe(200); expect(service.confirmHeard).toHaveBeenCalledWith('reply', SESSION);
    expect((await post('end', { sessionId: SESSION })).status).toBe(200); expect(service.end).toHaveBeenCalledWith(SESSION);
  });
  it('does not return private provider failures', async () => {
    service.turn.mockRejectedValueOnce(new Error('private content')); const response = await post('turn', { sessionId: SESSION, audio: 'fixture' });
    expect(response.status).toBe(409); expect(await response.text()).not.toContain('private content');
  });
  it('keeps provider calls disabled without explicit startup mode', async () => {
    const disabled = createPrototypeServer(); await new Promise<void>(resolve => disabled.listen(0, '127.0.0.1', resolve));
    try {
      const address = disabled.address(); if (!address || typeof address === 'string') throw new Error(); const target = `http://127.0.0.1:${address.port}`;
      const owner = await fetch(`${target}/api/status`); const token = owner.headers.get('set-cookie')!.split(';')[0]!;
      expect((await fetch(`${target}/api/spoken/start`, { method: 'POST', headers: { Cookie: token, Origin: target } })).status).toBe(423);
    } finally { disabled.closeAllConnections(); await new Promise<void>(resolve => disabled.close(() => resolve())); }
  });
});
