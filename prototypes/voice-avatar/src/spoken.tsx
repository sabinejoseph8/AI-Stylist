import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Daily from '@daily-co/daily-js';
import type { DailyCall, DailyParticipant } from '@daily-co/daily-js';
import { EchoStream } from './echo-stream.ts';
import { serverChanged } from './server-instance.ts';
import { MicrophoneCapture } from './microphone.ts';
import { StreamingMicrophone } from './streaming-microphone.ts';
import { AutomaticTurn } from './automatic-turn.ts';
import './style.css';
const AUTOMATIC = location.pathname === '/handsfree.html';
type Status = { remainingSeconds: number; state: string; message: string; turns: number; turnLimit: number; awaitingConfirmation: boolean; generating: boolean };
type Phase = 'off' | 'joining' | 'ready' | 'permission' | 'listening' | 'thinking' | 'sending' | 'confirm' | 'ended';
function SpokenApp() {
  const [budget, setBudget] = useState<{remainingAttempts:number;cleanupPending:boolean} | null>(null);
  const [status, setStatus] = useState<Status | null>(null), [phase, setPhase] = useState<Phase>('off');
  const [message, setMessage] = useState('Ready for your private spoken test.'), [transcript, setTranscript] = useState(''), [remaining, setRemaining] = useState(12);
  const [continuousActive, setContinuousActive] = useState(false);
  const continuous = useRef(new StreamingMicrophone()), detector = useRef<AutomaticTurn | null>(null);
  const video = useRef<HTMLVideoElement>(null), audio = useRef<HTMLAudioElement>(null);
  const call = useRef<DailyCall | null>(null), stream = useRef<EchoStream | null>(null), mic = useRef(new MicrophoneCapture());
  const serverInstance = useRef('');
  const sessionId = useRef(''), prepared = useRef(false);
  const epoch = useRef(0), state = useRef<Phase>('off'), reply = useRef(''), remote = useRef('');
  const captureTimer = useRef<ReturnType<typeof setInterval> | null>(null), sending = useRef(false), abort = useRef(new AbortController());
  const transition = (next: Phase) => { state.current = next; setPhase(next); };
  const request = async (action: string, body?: object) => {
    const response = await fetch(`/api/spoken/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sessionId.current, ...body }), signal: abort.current.signal });
    const result = await response.json(); if (!response.ok) throw new Error(result.error || 'The private test is unavailable.'); return result;
  };
  const localStop = () => {
    ++epoch.current; prepared.current = false; mic.current.cancel(); continuous.current.stop(); detector.current?.reset(); detector.current = null; setContinuousActive(false);
    if (captureTimer.current) clearInterval(captureTimer.current); captureTimer.current = null;
    if (audio.current) { audio.current.muted = true; audio.current.pause(); audio.current.srcObject = null; }
    if (video.current) { video.current.pause(); video.current.srcObject = null; }
    stream.current?.interrupt(); stream.current = null; reply.current = ''; sending.current = false;
    abort.current.abort();
    const daily = call.current; call.current = null; if (daily) void daily.destroy().catch(() => {});
    transition('ended'); setTranscript('');
  };
  const end = async (reason = 'Test stopped. Microphone and playback are off.') => {
    localStop(); setMessage(reason);
    try { if (sessionId.current) await fetch('/api/spoken/end', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sessionId.current }), keepalive: true }); } catch { setMessage('Local media is off. Server cleanup could not be confirmed; the provider time limit still applies.'); }
  };
  useEffect(() => {
    let disposed = false, inFlight = false;
    const poll = async () => {
      if (inFlight) return; inFlight = true;
      try {
        const identityResponse = await fetch('/api/status');
        if (!identityResponse.ok) throw new Error('Server access stopped.');
        const identity = await identityResponse.json();
        const restarted = serverChanged(serverInstance.current, identity.instanceId); serverInstance.current = identity.instanceId;
        if (restarted && !['off','ended'].includes(state.current)) { void end('Server restarted. Microphone and playback are off. Temporary conversation was cleared.'); return; }
        const budgetResponse = await fetch('/api/experiment-budget');
        const budgetResult = budgetResponse.ok ? await budgetResponse.json() : { remainingAttempts: 0, cleanupPending: true };
        if (!disposed) setBudget(budgetResult); const response = await fetch('/api/spoken/status'); const next = await response.json() as Status;
        if (disposed) return;
        if (!response.ok) { setMessage('Start the local server in spoken-test mode.'); return; }
        setStatus(next);
        if (prepared.current && ['ended','held','failed'].includes(next.state) && !['off','ended'].includes(state.current)) { localStop(); setMessage(next.message); }
      } catch { if (!disposed && !['off','ended'].includes(state.current)) void end('Server connection stopped. Microphone and playback are off.'); }
      finally { inFlight = false; }
    };
    void poll(); const timer = setInterval(() => { void poll(); }, 1000);
    const hide = () => { if (document.hidden && !['off','ended'].includes(state.current)) void end('Test stopped because you left this tab. Microphone and playback are off.'); };
    const leave = () => { void end(); };
    document.addEventListener('visibilitychange', hide); window.addEventListener('pagehide', leave);
    return () => { disposed = true; clearInterval(timer); document.removeEventListener('visibilitychange', hide); window.removeEventListener('pagehide', leave); void end(); };
  }, []);
  const start = async () => {
    if (!['off','ended'].includes(state.current)) return;
    prepared.current = false; sessionId.current = crypto.randomUUID(); transition('joining'); abort.current = new AbortController(); const current = ++epoch.current; remote.current = '';
    setMessage('Preparing the private avatar room. Your microphone stays off until you select Talk.');
    try {
      await request('start'); if (current !== epoch.current) return; prepared.current = true;
      const connection = await request('connect'); if (current !== epoch.current) return;
      const daily = Daily.createCallObject({ audioSource: false, videoSource: false, dailyConfig: { avoidEval: true } }); call.current = daily;
      const update = (participant: DailyParticipant) => {
        if (current !== epoch.current || participant.local) return;
        if (remote.current && remote.current !== participant.session_id) { void end('Unexpected participant. Test ended.'); return; }
        remote.current = participant.session_id;
        const a = participant.tracks.audio.persistentTrack, v = participant.tracks.video.persistentTrack;
        if (a && audio.current && (audio.current.srcObject as MediaStream | null)?.getAudioTracks()[0]?.id !== a.id) { audio.current.srcObject = new MediaStream([a]); audio.current.muted = false; }
        if (v && video.current && (video.current.srcObject as MediaStream | null)?.getVideoTracks()[0]?.id !== v.id) { video.current.srcObject = new MediaStream([v]); void video.current.play().catch(() => {}); }
        if (a && v && state.current === 'joining') { transition('ready'); setMessage(AUTOMATIC ? 'Avatar connected. Select Start microphone, then speak and pause. Speaking over her reply ends this bounded check.' : 'Avatar connected. Select Talk, speak briefly, then select Send.'); }
      };
      daily.on('participant-joined', e => update(e.participant)); daily.on('participant-updated', e => update(e.participant));
      daily.on('left-meeting', () => { if (current === epoch.current) void end(); }); daily.on('error', () => { if (current === epoch.current) void end('Avatar connection failed. Test ended.'); });
      stream.current = new EchoStream({ conversationId: connection.conversationId, inferenceId: '', pcm: '' }, payload => {
        if (current !== epoch.current) throw new Error('Stale connection.'); daily.sendAppMessage(payload, '*');
      }, label => {
        if (current !== epoch.current) return;
        if (label.startsWith('All chunks sent')) { transition('confirm'); setMessage('Listen to the reply. When she finishes, confirm you heard the whole reply.'); }
        else if (label.includes('held') || label.includes('failed')) void end('Playback could not continue safely. Test ended.');
      });
      await daily.join({ url: connection.url, token: connection.token, userName: 'Private voice prototype' });
      if (current !== epoch.current) { await daily.destroy(); return; }
      for (const participant of Object.values(daily.participants())) update(participant);
    } catch { if (current === epoch.current) await end('The private test could not connect. Check the connection and usage record.'); }
  };
  const send = async () => {
    if (sending.current || !['listening','permission'].includes(state.current)) return;
    sending.current = true; const current = epoch.current; transition('thinking');
    if (captureTimer.current) clearInterval(captureTimer.current); captureTimer.current = null;
    setMessage('Microphone is stopping. Preparing her reply.');
    try {
      const pcm = await mic.current.finish(); if (current !== epoch.current) return;
      const result = await request('turn', { audio: pcm }); if (current !== epoch.current) return;
      reply.current = result.id; setTranscript(result.transcript);
      await audio.current?.play(); await video.current?.play(); if (current !== epoch.current) return;
      const bytes = Uint8Array.from(atob(result.pcm), c => c.charCodeAt(0));
      transition('sending'); setMessage('Sending her reply to the avatar. Your microphone is off.'); stream.current!.play(bytes, result.id);
    } catch { if (current === epoch.current) await end('The spoken turn could not complete. Microphone and playback are off.'); }
    finally { if (current === epoch.current) sending.current = false; }
  };
  const talk = async () => {
    if (state.current !== 'ready') return;
    const current = epoch.current; transition('permission'); setMessage('Allow microphone access if asked. Camera stays off.');
    try {
      await audio.current?.play();
      const active = await mic.current.start(() => { if (current === epoch.current && state.current === 'listening') void send(); });
      if (!active || current !== epoch.current) return;
      transition('listening'); setMessage('Listening locally. Select Send when finished, or End to discard.'); setRemaining(12);
      const deadline = performance.now() + 12000;
      captureTimer.current = setInterval(() => { const left = Math.max(0, Math.ceil((deadline - performance.now()) / 1000)); setRemaining(left); if (!left) void send(); }, 100);
    } catch { if (current === epoch.current) await end('Microphone access failed. Check browser permissions before trying again.'); }
  };
  const sendAutomatic = async (pcm: string, current: number) => {
    if (current !== epoch.current || state.current !== 'listening' || sending.current) return;
    sending.current = true; transition('thinking'); setMessage('Pause detected. Preparing her reply. Microphone remains on for spoken stop.');
    try {
      const result = await request('turn', { audio: pcm }); if (current !== epoch.current) return;
      reply.current = result.id; setTranscript(result.transcript);
      await audio.current?.play(); await video.current?.play(); if (current !== epoch.current) return;
      transition('sending'); setMessage('Listening for a spoken interruption. Speak over her to end this check safely.');
      stream.current!.play(Uint8Array.from(atob(result.pcm), c => c.charCodeAt(0)), result.id);
    } catch { if (current === epoch.current) await end('The automatic turn could not complete. Microphone and playback are off.'); }
    finally { if (current === epoch.current) sending.current = false; }
  };
  const startAutomatic = async () => {
    if (state.current !== 'ready' || continuousActive) return;
    const current = epoch.current; transition('permission'); setMessage('Allow microphone access. Speak a short request, then pause. Camera stays off.');
    // Both activations start in this click, before awaiting device permission.
    void audio.current?.play().catch(() => {});
    detector.current = new AutomaticTurn(() => {
      if (current !== epoch.current) return false;
      if (state.current !== 'listening') {
        void end('Speech detected during the reply or processing. Microphone and playback are off. This check ends instead of guessing what you heard.');
        return false;
      }
      setMessage('Speech detected. Pause when you finish.'); return true;
    }, pcm => { void sendAutomatic(pcm, current); });
    const active = await continuous.current.start(pcm => current === epoch.current && Boolean(detector.current?.consume(pcm)), () => {
      if (current === epoch.current) void end('Microphone capture stopped. Playback is off and connection cleanup is being checked.');
    });
    if (!active || current !== epoch.current) return;
    setContinuousActive(true); transition('listening'); setMessage('Microphone on. Speak a short request, then pause for her reply.');
  };
  const confirm = async () => {
    if (state.current !== 'confirm') return;
    transition('thinking'); const current = epoch.current;
    try {
      const next = await request('confirm', { id: reply.current }); if (current !== epoch.current) return;
      setStatus(next); reply.current = '';
      if (next.turns >= 2) await end('Two exchanges completed. Test ended and microphone is off.');
      else { detector.current?.reset(); transition(AUTOMATIC ? 'listening' : 'ready'); setMessage(AUTOMATIC ? 'Reply confirmed. Microphone is listening for one follow-up. Speaking during her next reply ends the check.' : 'Reply confirmed. Select Talk for one follow-up.'); }
    } catch { if (current === epoch.current) await end('Reply confirmation failed. Test ended.'); }
  };
  return <main><header><p className="eyebrow">AI Personal Stylist / Task 1b</p><h1>{AUTOMATIC ? 'Automatic speech and spoken-stop check' : 'Talk to your stylist: private test'}</h1></header>
    {AUTOMATIC && <aside className="notice"><strong>Private automatic-capture probe</strong><p>After Start microphone, a short pause sends your spoken clip to OpenAI automatically. You do not press Send. Microphone capture continues so speaking during a reply stops and ends the room. Silence detection uses a simple local sound-level threshold and may mistake noise or speaker echo for your voice.</p><p>This is still buffered response generation, not the complete continuous conversation. It does not resume after interruption. After hearing a complete reply, select I heard the whole reply before giving one follow-up. Without that confirmation, speaking ends the check to protect conversation context.</p></aside>}
    <aside className="notice"><strong>Two short exchanges</strong><p>{AUTOMATIC ? "Your spoken clip goes to OpenAI after a short pause or the twelve-second input limit." : "Your spoken message goes to OpenAI after you select Send (or after 12 seconds)."} OpenAI's reply audio goes to Tavus and Daily for the avatar. Camera stays off. Nothing is saved by this app beyond the test; providers have their own retention. Tavus self-serve allows anonymized training without an opt-out.</p><p>This buffered test has a pause before each answer. Full continuous conversation, live notes and looks are not built yet.</p></aside>
    <p role="status">{!['off','ended'].includes(phase) ? "Current test is using its reserved allowance." : budget?.remainingAttempts === 0 ? "Initial test attempt limit reached. Review actual usage before approving more tests." : budget?.cleanupPending ? "A previous connection needs cleanup verification before another test." : budget ? `${budget.remainingAttempts} reserved test attempts remaining.` : "Checking the experiment allowance."}</p>
    <aside className="notice"><h2>Before you start</h2><p>Keep this tab open and visible throughout the test. The avatar appears below under Your stylist. {AUTOMATIC ? "Once connected, select Start microphone, speak a short sentence, then pause." : "Once connected, select Talk, say a short sentence, then select Send."}</p><p>The room stops automatically after about 85 seconds, within its 90-second provider limit. Switching tabs or leaving this page also ends the test. Starting uses one reserved attempt even if you do not speak.</p><p>Try: “I am going to a wedding in November. I like emerald green.”</p></aside>
    <section className="stage"><div className="stage-heading"><h2>Your stylist</h2><span className="badge">{continuousActive ? 'Microphone on: automatic speech detection' : phase === 'listening' ? `Microphone on: ${remaining}s` : 'Microphone off'}</span></div>
      <video ref={video} autoPlay playsInline muted className="device-preview" aria-label="AI stylist avatar"/><audio ref={audio}/>
      <div className="captions">{!['off','ended'].includes(phase) && status && <p className="small">Room time remaining: {status.remainingSeconds} seconds</p>}<p role="status" aria-live="polite">{message}</p><p className="small">Exchange {status?.turns ?? 0} of 2. Ending stops playback and clears the temporary conversation.</p></div>
      <div className="controls"><button onClick={() => { void start(); }} disabled={!budget || budget.remainingAttempts === 0 || budget.cleanupPending || !status || !['off','ended'].includes(phase) || ['held','ready','connected','preparing','ending'].includes(status.state)}>Start private voice test</button>{AUTOMATIC ? <button onClick={() => { void startAutomatic(); }} disabled={phase !== 'ready' || continuousActive}>Start microphone</button> : <><button onClick={() => { void talk(); }} disabled={phase !== 'ready'}>Talk</button><button onClick={() => { void send(); }} disabled={phase !== 'listening'}>Send</button></>}<button className="secondary" onClick={() => { void end(); }} disabled={['off','ended'].includes(phase)}>Interrupt and end</button><button className="secondary" onClick={() => { void confirm(); }} disabled={phase !== 'confirm'}>I heard the whole reply</button></div>
    </section><section className="journal"><h2>Test notebook</h2><p>{transcript || 'Her generated reply will appear here. Preference notes are a later task.'}</p></section>
    <p className="small">Each test reserves $2 and five avatar minutes from the existing experiment allowance. Max two exchanges, 12 seconds per spoken input, 25 seconds per reply, and 90 seconds per room. Failed tests retain their reservations. Do not start a second test if cleanup is unresolved.</p>
    <footer><a href="/devices.html">Local camera and microphone check</a></footer></main>;
}
createRoot(document.getElementById('root')!).render(<SpokenApp/>);
