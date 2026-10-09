import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Daily from '@daily-co/daily-js';
import type { DailyCall, DailyParticipant } from '@daily-co/daily-js';
import { EchoStream } from './echo-stream.ts';
import './style.css';

type Connection = { url: string; token: string; conversationId: string; pcm: string; transcript: string; inferenceId: string };
type Status = { state: string; message: string; inputTokens: number; outputTokens: number; maxSeconds: number };
function ScriptedApp() {
  const [budget, setBudget] = useState<{remainingAttempts:number;cleanupPending:boolean} | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [message, setMessage] = useState('Preparing the local test page.');
  const [transcript, setTranscript] = useState('');
  const [connected, setConnected] = useState(false);
  const [frames, setFrames] = useState(0);
  const [events, setEvents] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const video = useRef<HTMLVideoElement>(null), audio = useRef<HTMLAudioElement>(null);
  const call = useRef<DailyCall | null>(null), streamer = useRef<EchoStream | null>(null);
  const fixture = useRef<Uint8Array | null>(null);
  const closed = useRef(false), remote = useRef('');
  const request = async (action: string) => {
    const response = await fetch(`/api/scripted/${action}`, { method: 'POST' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The scripted test is unavailable.');
    return result;
  };
  const mute = () => {
    if (audio.current) { audio.current.muted = true; audio.current.pause(); audio.current.srcObject = null; }
    if (video.current) { video.current.pause(); video.current.srcObject = null; }
  };
  const end = async () => {
    closed.current = true; mute();
    try { streamer.current?.interrupt(); } catch { /* Local output is already stopped. */ }
    streamer.current = null; fixture.current = null; setConnected(false);
    const active = call.current; call.current = null;
    await Promise.allSettled([request('end'), active ? active.destroy() : Promise.resolve()]);
    setMessage('Playback stopped. Connection cleanup is being checked.');
  };
  useEffect(() => {
    let disposed = false, inFlight = false;
    const poll = async () => {
      if (inFlight) return; inFlight = true;
      try {
        await fetch('/api/status');
        const budgetResponse = await fetch('/api/experiment-budget');
        const budgetResult = budgetResponse.ok ? await budgetResponse.json() : { remainingAttempts: 0, cleanupPending: true };
        if (!disposed) setBudget({ ...budgetResult, remainingAttempts: budgetResult.remainingScriptedAttempts ?? 0 });
        const response = await fetch('/api/scripted/status');
        const next = await response.json() as Status;
        if (disposed) return;
        if (!response.ok) { setMessage('Start the server in scripted-test mode first.'); return; }
        setStatus(next);
        if (['ended', 'held', 'failed'].includes(next.state) && call.current) { mute(); void call.current.destroy(); call.current = null; setConnected(false); closed.current = true; }
      } catch { if (!disposed) { mute(); if (call.current) void end(); setMessage('The server connection stopped. Playback is held.'); } }
      finally { inFlight = false; }
    };
    void poll(); const timer = setInterval(() => { void poll(); }, 1000);
    const hide = () => { if (document.hidden && call.current) void end(); };
    const unload = () => { mute(); void fetch('/api/scripted/end', { method: 'POST', keepalive: true }); };
    document.addEventListener('visibilitychange', hide); window.addEventListener('pagehide', unload);
    return () => { disposed = true; clearInterval(timer); document.removeEventListener('visibilitychange', hide); window.removeEventListener('pagehide', unload); void end(); };
  }, []);
  const start = async () => {
    setBusy(true); closed.current = false; setFrames(0); setEvents([]); setTranscript(''); remote.current = '';
    try {
      const preparation = await request('start'); setStatus(preparation);
      let ready = false;
      for (let i = 0; i < 90 && !closed.current; i++) {
        const response = await fetch('/api/scripted/status'); const current = await response.json() as Status;
        setStatus(current);
        if (current.state === 'ready') { ready = true; break; }
        if (['failed','held','ended'].includes(current.state)) throw new Error(current.message);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      if (!ready || closed.current) throw new Error('Test preparation stopped.');
      const connection = await request('connect') as Connection;
      if (closed.current) throw new Error('Test stopped.');
      const binary = atob(connection.pcm); fixture.current = Uint8Array.from(binary, c => c.charCodeAt(0));
      setTranscript(connection.transcript);
      const daily = Daily.createCallObject({ audioSource: false, videoSource: false, dailyConfig: { avoidEval: true } });
      call.current = daily;
      const updateParticipant = (participant: DailyParticipant) => {
        if (closed.current || participant.local) return;
        if (remote.current && remote.current !== participant.session_id) { void end(); return; }
        remote.current = participant.session_id;
        const audioTrack = participant.tracks.audio.persistentTrack;
        const videoTrack = participant.tracks.video.persistentTrack;
        if (audio.current && audioTrack) { audio.current.srcObject = new MediaStream([audioTrack]); audio.current.muted = false; }
        if (video.current && videoTrack) { video.current.srcObject = new MediaStream([videoTrack]); void video.current.play().catch(() => {}); }
        setConnected(Boolean(audioTrack && videoTrack));
      };
      daily.on('participant-joined', e => updateParticipant(e.participant));
      daily.on('participant-updated', e => updateParticipant(e.participant));
      daily.on('app-message', e => {
        if (closed.current || !remote.current || e.fromId !== remote.current) return;
        const data = e.data;
        if (data?.conversation_id !== connection.conversationId || typeof data.event_type !== 'string') return;
        if (/^(conversation\.(?:(?:pal|replica)\.)?(?:started_speaking|stopped_speaking)|system\.(?:pal|replica)_joined)$/.test(data.event_type)) {
          setEvents(previous => [...previous, data.event_type].slice(-8));
        }
      });
      daily.on('error', () => { setMessage('Avatar connection failed. Ending the test.'); void end(); });
      daily.on('left-meeting', () => { if (!closed.current) void end(); });
      await daily.join({ url: connection.url, token: connection.token, userName: 'Private media probe' });
      if (closed.current) { await daily.destroy(); return; }
      for (const participant of Object.values(daily.participants())) updateParticipant(participant);
      streamer.current = new EchoStream(connection, payload => { if (!closed.current) daily.sendAppMessage(payload, '*'); },
        (label, count) => { setMessage(label); setFrames(count); });
      setMessage('Private room joined. Press Play script when the avatar appears.');
    } catch (error) { await end(); setMessage(error instanceof Error ? error.message : 'Test failed.'); }
    finally { setBusy(false); }
  };
  const play = async () => {
    if (!connected || !streamer.current || !fixture.current || closed.current) return;
    try {
      await audio.current?.play(); await video.current?.play();
      streamer.current.play(fixture.current, crypto.randomUUID());
    } catch { setMessage('Playback was blocked. Press Play script to try again.'); }
  };
  return <main>
    <header><p className="eyebrow">AI Personal Stylist / Task 1b</p><h1>Voice and avatar connection test</h1></header>
    <aside className="notice"><strong>Scripted test</strong><p>A fixed OpenAI voice clip is sent to a Tavus stock avatar. Your microphone and camera stay off on this page. <a href="/devices.html">Open the local camera and microphone check</a>. The clip is buffered first, so this does not measure conversational response time.</p></aside>
    <p role="status">{busy || connected ? "Current test is using its reserved allowance." : budget?.remainingAttempts === 0 ? "Initial test attempt limit reached. Review actual usage before approving more tests." : budget?.cleanupPending ? "A previous connection needs cleanup verification before another test." : budget ? `${budget.remainingAttempts} reserved test attempts remaining.` : "Checking the experiment allowance."}</p>
    <p><a href="/spoken.html">Open the spoken conversation test</a></p>
    <section className="stage"><h2>Your stylist</h2>
      <video ref={video} autoPlay playsInline muted aria-label="Stock AI avatar" style={{ width: '100%', minHeight: 240, background: '#e9e4d9', borderRadius: 12 }}/>
      <audio ref={audio} aria-label="OpenAI voice rendered by the avatar" />
      <p role="status">{status?.message}</p><p role="status" aria-live="polite">{message}</p>
      <div className="controls">
        <button onClick={() => { void start(); }} disabled={!budget || budget.remainingAttempts === 0 || budget.cleanupPending || busy || connected || !status || ['preparing','ending','ready','connected','held'].includes(status.state)}>Start scripted test</button>
        <button onClick={() => { void play(); }} disabled={!connected || busy}>Play script</button>
        <button className="secondary" onClick={() => { void end(); }} disabled={!busy && !connected}>Interrupt and end</button>
      </div>
      <p className="small">Interrupt mutes local playback, discards queued chunks and ends the room. Resuming a natural conversation after interruption remains a later check.</p>
    </section>
    <section className="journal"><h2>Experiment notebook</h2><p>{transcript || 'The generated script will appear here.'}</p>
      <dl><div><dt>Chunks sent</dt><dd>{frames}</dd></div><div><dt>OpenAI input tokens</dt><dd>{status?.inputTokens ?? 0}</dd></div><div><dt>OpenAI output tokens</dt><dd>{status?.outputTokens ?? 0}</dd></div></dl>
      <p className="small">Each attempt reserves $2 of the OpenAI allocation and five avatar minutes, including failed attempts. Up to four attempts; each room has a 90-second provider limit. Reservations are conservative, not actual charges.</p>
      <details><summary>Observed renderer events</summary><ul>{events.map((event,i) => <li key={`${i}-${event}`}>{event}</li>)}</ul></details>
    </section><footer>Task 1b remains in progress. No customer styling preferences are collected by this test.</footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<ScriptedApp/>);
