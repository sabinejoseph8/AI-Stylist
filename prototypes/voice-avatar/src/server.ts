import { createServer } from 'node:http';
import type { IncomingMessage } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvFile } from 'node:process';
import { ScriptedService } from './scripted-service.ts';
import { SpokenService } from './spoken-service.ts';
import { ExperimentBudget } from './experiment-budget.ts';
import { SupabaseBudget } from './supabase-budget.ts';
import { PreviewGate, validatePreview } from './preview-gate.ts';
import type { PreviewConfig } from './preview-gate.ts';
import { Simulation } from './simulation.ts';

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const MIME: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
export function boundedJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let bytes = 0, done = false; const chunks: Buffer[] = [];
    const finish = (error?: Error) => {
      if (done) return; done = true; clearTimeout(timer);
      req.off('data', data); req.off('end', end); req.off('error', failed); req.off('aborted', failed);
      if (error) { chunks.length = 0; req.resume(); reject(error); }
    };
    const failed = () => finish(new Error('Input stopped.'));
    const data = (chunk: Buffer) => { bytes += chunk.length; if (bytes > 780000) finish(new Error('Input exceeds the limit.')); else chunks.push(chunk); };
    const end = () => {
      try {
        const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error();
        finish(); chunks.length = 0; resolve(value);
      } catch { finish(new Error('Invalid request.')); }
    };
    const timer = setTimeout(() => finish(new Error('Input timed out.')), 8000);
    req.on('data', data); req.on('end', end); req.on('error', failed); req.on('aborted', failed);
  });
}
export function createPrototypeServer(options: { scripted?: ScriptedService; spoken?: SpokenService; budget?: ExperimentBudget; preview?: PreviewConfig } = {}) {
  const publicAddress = options.preview ? validatePreview(options.preview) : null;
  const gate = options.preview ? new PreviewGate(options.preview) : null;
  const instanceId = randomUUID();
  const ownerToken = randomBytes(32).toString('hex');
  let demo = new Simulation();
  let timer: ReturnType<typeof setInterval> | undefined;
  const stopTimer = () => { if (timer) clearInterval(timer); timer = undefined; };
  const server = createServer(async (req, res) => {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    const host = publicAddress?.host ?? `127.0.0.1:${port}`;
    const origin = publicAddress?.origin ?? `http://${host}`;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    const spokenPage = req.url === '/spoken.html' || req.url === '/handsfree.html';
    const scriptedPage = req.url === '/scripted.html' || spokenPage;
    const devicePage = req.url === '/devices.html';
    const dailyDomains = 'https://*.daily.co https://*.dailywebrtc.com https://*.dailywebrtc.net';
    res.setHeader('Content-Security-Policy', scriptedPage
      ? `default-src 'self'; connect-src 'self' ${dailyDomains} https://prod-ks.pluot.blue wss://*.daily.co wss://*.dailywebrtc.com wss://*.dailywebrtc.net; script-src 'self' ${dailyDomains}; worker-src 'self' blob:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`
      : "default-src 'self'; connect-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    if (devicePage) res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'none'; media-src 'self' blob:; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
    res.setHeader('Permissions-Policy', devicePage ? 'microphone=(self), camera=(self), geolocation=()' : spokenPage ? 'microphone=(self), camera=(), geolocation=()' : 'microphone=(), camera=(), geolocation=()');
    const json = (status: number, body: unknown) => {
      res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body));
    };
    const path = new URL(req.url ?? '/', origin).pathname;
    if (path === '/healthz' && req.method === 'GET') { json(200, { ok: true }); return; }
    if (req.headers.host !== host) { json(403, { error: 'Use the configured prototype address.' }); return; }
    if (gate) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000');
      const access = gate.check(req.headers.authorization);
      if (access !== 200) {
        if (access === 401) res.setHeader('WWW-Authenticate', 'Basic realm="AI Stylist private preview", charset="UTF-8"');
        if (access === 429) res.setHeader('Retry-After', '60');
        json(access, { error: 'Private preview access required.' }); return;
      }
    }
    const owns = req.headers.cookie?.split(';').some(c => c.trim() === `prototype_owner=${ownerToken}`) ?? false;
    if (path === '/api/status' && req.method === 'GET') {
      // Local-only experiment token, not a customer login or a production auth design.
      if (!owns) res.setHeader('Set-Cookie', `prototype_owner=${ownerToken}; HttpOnly; SameSite=Strict; Path=/${publicAddress ? '; Secure' : ''}`);
      json(200, { instanceId, liveEnabled: false, ...demo.snapshot() }); return;
    }
    if (path === '/api/experiment-budget' && req.method === 'GET') {
      if (!owns) { json(403, { error: 'Open the local test page first.' }); return; }
      if (!options.budget) { json(423, { error: 'Experiment budget is unavailable.' }); return; }
      try {
        const ledger = await options.budget.read();
        json(200, { remainingAttempts: Math.max(0, (ledger.spokenExtension ? (ledger.reserveTransfer ? (ledger.phoneTrial ? (ledger.automaticTrial ? (ledger.repeatTrial ? 9 : 8) : 7) : 6) : 5) : 4) - ledger.runs.length), remainingScriptedAttempts: Math.max(0, 4 - ledger.runs.length), cleanupPending: ledger.runs.some(run => !run.closed), reservedCents: ledger.runs.length * 200 });
      } catch { json(423, { error: 'Experiment budget requires review.' }); }
      return;
    }
    if (path.startsWith('/api/spoken/')) {
      if (!owns) { json(403, { error: 'Open the local test page first.' }); return; }
      if (!options.spoken) { json(423, { error: 'Spoken test mode is not enabled.' }); return; }
      if (req.method === 'GET' && path === '/api/spoken/status') { options.spoken.heartbeat(); json(200, options.spoken.snapshot()); return; }
      if (req.method !== 'POST') { json(405, { error: 'Method not allowed.' }); return; }
      if (req.headers.origin !== origin) { json(403, { error: 'Open the local test page first.' }); return; }
      if (!['/api/spoken/start','/api/spoken/connect','/api/spoken/turn','/api/spoken/confirm','/api/spoken/end'].includes(path)) { json(404, { error: 'Unknown test action.' }); return; }
      if (req.headers['content-type'] !== 'application/json') { json(415, { error: 'Expected JSON.' }); return; }
      let body: Record<string, unknown>;
      try { body = await boundedJson(req); }
      catch { json(400, { error: 'Invalid or oversized spoken-test request.' }); return; }
      const allowed = path.endsWith('/turn') ? ['sessionId','audio'] : path.endsWith('/confirm') ? ['sessionId','id'] : ['sessionId'];
      if (Object.keys(body).length !== allowed.length || Object.keys(body).some(key => !allowed.includes(key)) || allowed.some(key => typeof body[key] !== 'string')) { json(400, { error: 'Unexpected spoken-test fields.' }); return; }
      const sessionId = body.sessionId as string;
      try {
        if (path.endsWith('/start')) await options.spoken.start(sessionId);
        else if (path.endsWith('/connect')) { json(200, options.spoken.connect(sessionId)); return; }
        else if (path.endsWith('/turn')) { json(200, await options.spoken.turn(body.audio as string, sessionId)); return; }
        else if (path.endsWith('/confirm')) { json(200, options.spoken.confirmHeard(body.id as string, sessionId)); return; }
        else await options.spoken.end(sessionId);
        json(200, options.spoken.snapshot());
      } catch { json(409, { error: 'Spoken test is unavailable or stopped. Check the connection and usage record.' }); }
      return;
    }
    if (path.startsWith('/api/scripted/')) {
      if (!owns) { json(403, { error: 'Open the local test page first.' }); return; }
      if (!options.scripted) { json(423, { error: 'Scripted test mode is not enabled.' }); return; }
      if (req.method === 'GET' && path === '/api/scripted/status') {
        options.scripted.heartbeat(); json(200, options.scripted.snapshot()); return;
      }
      if (req.method !== 'POST') { json(405, { error: 'Method not allowed.' }); return; }
      if (req.headers.origin !== origin) { json(403, { error: 'Open the local test page first.' }); return; }
      try {
        if (path === '/api/scripted/start') await options.scripted.start();
        else if (path === '/api/scripted/connect') { json(200, options.scripted.connect()); return; }
        else if (path === '/api/scripted/end') await options.scripted.stop();
        else { json(404, { error: 'Unknown test action.' }); return; }
        json(200, options.scripted.snapshot());
      } catch { json(409, { error: 'Test is unavailable. Check the usage ledger and current connection state.' }); }
      return;
    }
    if (path.startsWith('/api/')) {
      if (req.method !== 'POST') { json(405, { error: 'Method not allowed.' }); return; }
      if (req.headers.origin !== origin || !owns) { json(403, { error: 'Open the local prototype first.' }); return; }
      if (path === '/api/live') { json(423, { error: 'Live provider calls are not implemented or enabled. Account, privacy, cost and transport checks are pending.' }); return; }
      try {
        switch (path) {
          case '/api/start':
            demo.start(); stopTimer(); timer = setInterval(() => {
              demo.tick(); if (demo.snapshot().state !== 'speaking') stopTimer();
            }, 200); break;
          case '/api/interrupt': stopTimer(); demo.interrupt(); break;
          case '/api/inject-late': demo.injectLate(); break;
          case '/api/end': stopTimer(); demo.end(); break;
          default: json(404, { error: 'Unknown action.' }); return;
        }
        json(200, { instanceId, liveEnabled: false, ...demo.snapshot() });
      } catch { json(409, { error: 'That action is not available in the current demo state.' }); }
      return;
    }
    if (req.method !== 'GET') { res.writeHead(405); res.end(); return; }
    try {
      const requested = path === '/' ? 'index.html' : decodeURIComponent(path).replace(/^\//, '');
      const file = resolve(DIST, requested);
      if (!file.startsWith(`${DIST}${sep}`)) { res.writeHead(403); res.end(); return; }
      const data = await readFile(file);
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' }); res.end(data);
    } catch { res.writeHead(404); res.end('Page not found.'); }
  });
  server.on('close', stopTimer);
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const prototypeRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const remotePreview = process.argv.includes('--preview');
  const envPath = resolve(prototypeRoot, '.env');
  if (existsSync(envPath)) loadEnvFile(envPath);
  const supabaseEnvPath = resolve(prototypeRoot, '.env.supabase');
  if (existsSync(supabaseEnvPath)) loadEnvFile(supabaseEnvPath);
  const preview = remotePreview ? { origin: process.env.PREVIEW_ORIGIN || process.env.RENDER_EXTERNAL_URL || '', password: process.env.PREVIEW_PASSWORD || '' } : undefined;
  if (preview) validatePreview(preview);
  let scripted: ScriptedService | undefined;
  let spoken: SpokenService | undefined;
  let budget: ExperimentBudget | undefined;
  if (process.argv.includes('--scripted') || process.argv.includes('--spoken')) {

    const openai = process.env.OPENAI_API_KEY, tavus = process.env.TAVUS_API_KEY;
    if (!openai || !tavus) throw new Error('Private provider keys are missing.');
    budget = remotePreview ? new SupabaseBudget(process.env.SUPABASE_URL || '', process.env.SUPABASE_SECRET_KEY || '') : new ExperimentBudget(resolve(prototypeRoot, '.experiment-usage.json'));
    if (remotePreview) await budget.read();
    if (process.argv.includes('--scripted')) scripted = new ScriptedService({ openai, tavus }, budget);
    if (process.argv.includes('--spoken')) spoken = new SpokenService({ openai, tavus }, budget);
  }
  const server = createPrototypeServer({ scripted, spoken, budget, preview });
  const port = remotePreview ? Number(process.env.PORT || '10000') : 4318;
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid preview port.');
  server.listen(port, remotePreview ? '0.0.0.0' : '127.0.0.1', () => console.log(preview ? `Private phone preview: ${validatePreview(preview).origin}/spoken.html` : spoken ? 'Private spoken test: http://127.0.0.1:4318/spoken.html' : scripted ? 'Private scripted test: http://127.0.0.1:4318/scripted.html' : 'Private simulation: http://127.0.0.1:4318'));
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => {
    void (async () => { await Promise.allSettled([scripted?.stop(), spoken?.stop()]); server.close(() => process.exit(0)); })();
  });
}
