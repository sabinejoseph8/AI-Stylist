import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LocalDevices } from './local-devices.ts';
import './style.css';

function DeviceCheck() {
  const preview = useRef<HTMLVideoElement>(null);
  const devices = useRef<LocalDevices | null>(null);
  const context = useRef<AudioContext | null>(null);
  const source = useRef<MediaStreamAudioSourceNode | null>(null);
  const silentOutput = useRef<GainNode | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const generation = useRef(0);
  const [state, setState] = useState<'off' | 'requesting' | 'on'>('off');
  const [message, setMessage] = useState('Camera and microphone are off.');
  const [level, setLevel] = useState(0);
  const stop = (reason = 'Camera and microphone are off.') => {
    ++generation.current;
    devices.current?.stop();
    if (timer.current) clearInterval(timer.current); timer.current = null;
    source.current?.disconnect(); source.current = null;
    silentOutput.current?.disconnect(); silentOutput.current = null;
    if (context.current) void context.current.close().catch(() => {}); context.current = null;
    if (preview.current) { preview.current.pause(); preview.current.srcObject = null; }
    setState('off'); setLevel(0); setMessage(reason);
  };
  useEffect(() => {
    devices.current = new LocalDevices(c => navigator.mediaDevices.getUserMedia(c));
    const hide = () => { if (document.hidden) stop('Stopped because you left this page.'); };
    const leave = () => stop();
    document.addEventListener('visibilitychange', hide); window.addEventListener('pagehide', leave);
    return () => { document.removeEventListener('visibilitychange', hide); window.removeEventListener('pagehide', leave); stop(); };
  }, []);
  const start = async () => {
    if (state !== 'off') return;
    if (!navigator.mediaDevices?.getUserMedia) { setMessage('This browser cannot access your devices here. Open this local page in a browser with camera and microphone support.'); return; }
    const attempt = ++generation.current;
    setState('requesting'); setMessage('Allow camera and microphone in the browser prompt.');
    try {
      // Create and resume during the button gesture, before a permission prompt can consume it.
      const ctx = new AudioContext(); context.current = ctx;
      void ctx.resume().catch(() => {});
      const stream = await devices.current!.start();
      if (!stream || attempt !== generation.current) return;
      for (const track of stream.getTracks()) track.addEventListener('ended', () => { if (attempt === generation.current) stop('A device disconnected. Camera and microphone are off.'); }, { once: true });
      preview.current!.srcObject = stream;
      const input = ctx.createMediaStreamSource(stream); source.current = input;
      const analyser = ctx.createAnalyser(); analyser.fftSize = 1024; input.connect(analyser);
      // A zero-gain output keeps the graph processing on Safari without audible microphone playback.
      const silent = ctx.createGain(); silent.gain.value = 0; silentOutput.current = silent;
      analyser.connect(silent); silent.connect(ctx.destination);
      void ctx.resume().catch(() => {});
      if (attempt !== generation.current) return;
      await preview.current!.play();
      if (attempt !== generation.current) return;
      const samples = new Float32Array(analyser.fftSize), started = performance.now(), deadline = started + 120000;
      let detected = false;
      timer.current = setInterval(() => {
        if (attempt !== generation.current) return;
        if (performance.now() >= deadline) { stop('Two-minute check finished. Camera and microphone are off.'); return; }
        analyser.getFloatTimeDomainData(samples);
        const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
        const nextLevel = Math.min(100, Math.round(rms * 500));
        if (nextLevel > 0) detected = true;
        setLevel(nextLevel);
        const audioTrack = stream.getAudioTracks()[0];
        setMessage(ctx.state !== 'running' ? 'Camera is on. Tap Resume microphone meter to enable audio processing.' : audioTrack?.muted ? 'Camera is on. The microphone input is paused by the browser or another app.' : !detected && performance.now() - started > 5000 ? 'Camera is on, but no microphone signal has been detected. Speak near your phone. If the meter stays at 0%, stop the check.' : 'Camera and microphone are on for this local check. Speak and watch the meter move.');
      }, 100);
      setState('on'); setMessage('Camera and microphone are on for this local check. Speak and watch the meter move.');
    } catch (error) {
      if (attempt !== generation.current) return;
      const name = error instanceof DOMException ? error.name : '';
      stop(name === 'NotAllowedError' ? 'Access was blocked. Allow camera and microphone for this page in browser or system settings, then try again.' : name === 'NotFoundError' ? 'A microphone or camera was not found. Connect both devices, then try again.' : 'The device check could not start. Close other apps using the camera or microphone, then try again.');
    }
  };
  return <main>
    <header><p className="eyebrow">AI Personal Stylist / Task 1b</p><h1>Camera and microphone check</h1></header>
    <aside className="notice"><strong>On this device only</strong><p>This preview does not send your camera or microphone to Tavus or OpenAI, record it, or save it. The stylist cannot hear or see you through this check yet.</p></aside>
    <section className="stage">
      <div className="stage-heading"><h2>Your camera</h2><span className="badge">{state === 'on' ? 'On' : state === 'requesting' ? 'Waiting for permission' : 'Off'}</span></div>
      <video className="device-preview" ref={preview} muted playsInline aria-label="Your local camera preview" />
      <div className="captions"><p role="status" aria-live="polite">{message}</p><label htmlFor="microphone-level">Microphone level</label><meter className="device-meter" id="microphone-level" min="0" max="100" value={level}>{level}%</meter><p aria-live="off">Microphone level: {level}%</p><p className="small">You will not hear your microphone through the speakers. This avoids echo.</p></div>
      <div className="controls"><button onClick={() => { void start(); }} disabled={state !== 'off'}>Turn on camera and microphone</button><button className="secondary" onClick={() => { void context.current?.resume().catch(() => setMessage('Audio processing could not resume. Stop the check and try again.')); }} disabled={state !== 'on'}>Resume microphone meter</button><button className="secondary" onClick={() => stop()} disabled={state === 'off'}>Stop camera and microphone</button></div>
    </section>
    <p className="small">Stops automatically after two minutes, when you switch tabs, or when you close this page. Browser permission does not start a paid provider call.</p>
    <footer><a href="/scripted.html">Return to the avatar test</a></footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<DeviceCheck/>);
