import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

type Snapshot = {
  instanceId: string; mode: 'simulation'; liveEnabled: false;
  state: string; queued: number; delivered: number; rejected: number;
  caption: string; commands: string[]; canInjectLate: boolean; reason: string;
};
function App() {
  const [state, setState] = useState<Snapshot | null>(null);
  const [error, setError] = useState('');
  const [restart, setRestart] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let disposed = false, previousInstance = '', inFlight = false;
    const poll = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const response = await fetch('/api/status');
        if (!response.ok) throw new Error('The local demo is unavailable.');
        const next = await response.json() as Snapshot;
        if (disposed) return;
        if (previousInstance && previousInstance !== next.instanceId) setRestart(true);
        previousInstance = next.instanceId; setState(next); setError('');
      } catch { if (!disposed) setError('The local connection stopped. Wait for it to return, then start a fresh demo.'); }
      finally { inFlight = false; }
    };
    void poll(); const timer = setInterval(() => { void poll(); }, 250);
    return () => { disposed = true; clearInterval(timer); };
  }, []);
  const action = async (name: string) => {
    setBusy(true);
    try {
      const response = await fetch(`/api/${name}`, { method: 'POST' });
      if (!response.ok) throw new Error('This action is not available. Please try again.');
      setState(await response.json() as Snapshot); setError('');
      if (name === 'start') setRestart(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'The local connection stopped.'); }
    finally { setBusy(false); }
  };
  const running = state?.state === 'speaking';
  return <main>
    <header><p className="eyebrow">AI Personal Stylist / Task 1b</p><h1>A natural conversation starts here.</h1>
      <p className="intro">Private voice and avatar experiment</p></header>
    <aside className="notice"><strong>Local simulation</strong><p>This demo uses silent test frames and scripted captions. It does not use your microphone, camera, a real voice or an avatar service.</p></aside>
    {restart && <p role="status" className="notice">The server restarted. Unsaved demo state was lost. Start again when you are ready.</p>}
    {error && <p role="alert" className="error">{error}</p>}
    <section className="stage" aria-labelledby="stage-title">
      <div className="stage-heading"><h2 id="stage-title">Your stylist</h2><span className="badge">{running ? 'Simulating a response' : state?.state === 'stopped' ? 'Stopped' : 'Ready for a local test'}</span></div>
      <div className={`avatar-placeholder ${running ? 'active' : ''}`}><div className="orb" aria-hidden="true"/><p>Realistic avatar preview pending</p><p className="small">The live connection will be tested after account setup.</p></div>
      <div className="captions"><p className="eyebrow">Scripted test captions</p><p role="status" aria-live="polite">{state?.caption ?? 'Connecting to the local demo...'}</p></div>
      <div className="controls">
        <button onClick={() => { void action('start'); }} disabled={!state || busy || running || Boolean(error)}>Start local demo</button>
        <button className="secondary" onClick={() => { void action('interrupt'); }} disabled={!running || busy || Boolean(error)}>Interrupt</button>
        <button className="secondary" onClick={() => { void action('end'); }} disabled={!state || busy || Boolean(error)}>End demo</button>
      </div>
    </section>
    <section className="journal" aria-labelledby="check-title"><h2 id="check-title">Experiment notebook</h2>
      <p>This records simulated connection behavior. Customer styling notes are planned for Task 1c.</p>
      <dl><div><dt>Silent frames sent</dt><dd>{state?.delivered ?? 0}</dd></div><div><dt>Queued frames</dt><dd>{state?.queued ?? 0}</dd></div><div><dt>Late or duplicate events ignored</dt><dd>{state?.rejected ?? 0}</dd></div></dl>
      <button className="secondary" onClick={() => { void action('inject-late'); }} disabled={!state?.canInjectLate || busy || Boolean(error)}>Send a delayed test event</button>
      <p className="small">After interrupting, the frame count must stay fixed when a delayed event arrives.</p>
      {state?.reason && <p role="status">{state.reason}</p>}
      <details><summary>Simulated adapter signals</summary><ul>{state?.commands.map((command, i) => <li key={`${i}-${command}`}>{command}</li>)}</ul></details>
    </section>
    <section className="next"><h2>Before the real call</h2><p>Provider access, the selected voice, privacy settings and the experiment cost limit need to be checked. No paid call is enabled in this version.</p><button disabled aria-describedby="live-status">Connect real voice and avatar</button><p id="live-status" className="small">Pending provider setup and transport verification.</p></section>
    <footer>Task 1b is in progress. Realism, lip sync and natural interruptions still need a live phone test.</footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
