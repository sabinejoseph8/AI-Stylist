import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { request } from 'node:http';
import { createPrototypeServer } from '../src/server.ts';

describe('local experiment boundary', () => {
  let server: Server; let base: string; let cookie: string;
  beforeEach(async () => {
    server = createPrototypeServer();
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address(); if (!address || typeof address === 'string') throw new Error('Missing test address');
    base = `http://127.0.0.1:${address.port}`;
    const response = await fetch(`${base}/api/status`); cookie = response.headers.get('set-cookie')!.split(';')[0]!;
  });
  afterEach(async () => { server.closeAllConnections(); await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve())); });
  const command = async (name: string, origin: string, token: string) => fetch(`${base}/api/${name}`, { method: 'POST', headers: { Origin: origin, Cookie: token } });
  it('defaults to simulation and prevents microphone/camera use', async () => {
    const response = await fetch(`${base}/api/status`);
    expect(await response.json()).toMatchObject({ mode: 'simulation', liveEnabled: false, state: 'idle' });
    expect(response.headers.get('permissions-policy')).toContain('microphone=(), camera=()');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('content-security-policy')).toContain("connect-src 'self'");
  });
  it('allows devices only on the isolated local check and denies its network connections', async () => {
    const response = await fetch(`${base}/devices.html`);
    expect(response.headers.get('permissions-policy')).toBe('microphone=(self), camera=(self), geolocation=()');
    expect(response.headers.get('content-security-policy')).toContain("connect-src 'none'");
    const scripted = await fetch(`${base}/scripted.html`);
    expect(scripted.headers.get('permissions-policy')).toContain('microphone=(), camera=()');
  });
  it('does not expose budget status without a configured ledger', async () => {
    expect((await fetch(`${base}/api/experiment-budget`, {headers:{Cookie:cookie}})).status).toBe(423);
  });
  it('denies live calls even from the local owner', async () => {
    const response = await command('live', base, cookie); expect(response.status).toBe(423);
  });
  it('rejects cross-origin actions and requests without the local token', async () => {
    expect((await command('start', 'https://unrelated.example', cookie)).status).toBe(403);
    expect((await command('start', base, '')).status).toBe(403);
  });
  it('rejects DNS-rebinding host names', async () => {
    // Fetch normalizes Host. Use a raw HTTP request to exercise the server boundary.
    const status = await new Promise<number | undefined>((resolve, reject) => {
      const req = request(`${base}/api/status`, { headers: { Host: 'unrelated.example' } }, res => {
        res.resume(); res.on('end', () => resolve(res.statusCode));
      }); req.on('error', reject); req.end();
    });
    expect(status).toBe(403);
  });
  it('runs, interrupts, and rejects late output through the actual local endpoints', async () => {
    expect((await command('start', base, cookie)).status).toBe(200);
    expect((await command('start', base, cookie)).status).toBe(409);
    const stopped = await (await command('interrupt', base, cookie)).json();
    const late = await (await command('inject-late', base, cookie)).json();
    expect(late.state).toBe(stopped.state); expect(late.delivered).toBe(stopped.delivered); expect(late.rejected).toBe(stopped.rejected + 2);
  });
  it('has no endpoint for secrets or customer data', async () => {
    expect((await command('save-preferences', base, cookie)).status).toBe(404);
    expect((await fetch(`${base}/.env`)).status).toBe(404);
  });
});
