import type {Server} from 'node:http';
import {attachSimulatedNoteBridge} from './note-network-bridge.ts';
import {createPreparedNoteServerOwner} from './prepared-note-server-owner.ts';
import type {NoteConnectionProbe} from './note-connection-scope.ts';
import type {SimulatedExtractionFetch} from './note-extraction-transport.ts';
import type {SimulatedTranscriptionSocket} from './transcription-socket-wire.ts';
import {NoteTiming} from './note-timing.ts';
type OwnerOptions = Parameters<typeof createPreparedNoteServerOwner>[0];
type Started = Extract<Awaited<ReturnType<ReturnType<typeof createPreparedNoteServerOwner>['start']>>, {status: 200}>;
/** Explicit simulation harness only. The application server never attaches this.
 * Private upgrade checks precede allowance work. A pending allowance never emits
 * Ready, creates a provider, or releases its slot before cancellation settles. */
export function attachProtectedSimulatedNoteBridge(server: Server, options: {
 simulation?: boolean; preview: OwnerOptions['preview']; allowance: OwnerOptions['allowance'];
 createTransports: () => {socket: SimulatedTranscriptionSocket; fetch: SimulatedExtractionFetch};
}) {
 if (options.simulation !== true) throw Error('Live protected notebook bridge is disabled.');
 const owner = createPreparedNoteServerOwner({simulation: true, preview: options.preview, allowance: options.allowance, changed: () => {}, createTransports: capture => {
  if (!capture) throw Error('Simulated capture required.');
  return {...options.createTransports(), capture};
 }});
 const bridge = attachSimulatedNoteBridge(server, {simulation: true, preview: options.preview, deferReady: true, create: (publish, capture, turnReady, ended, ready, req) => {
  const abort = new AbortController();
  let active: Started | undefined, stopping = false, finished = false;
  const stop = () => {stopping = true; abort.abort(); if (active) void active.end();};
  const settled = () => {finished = true; ended();};
  const pendingSnapshot = {ended: false, reason: null, capturing: false, acquiring: true, transcription: null, notes: {accepted: 0, rejected: 0, applied: 0, failures: 0, extracting: false, queued: false, timing: new NoteTiming().report()}, liveEnabled: false as const};
  void owner.start({method: req.method ?? '', path: req.url ?? '', host: req.headers.host ?? '', origin: req.headers.origin ?? '', authorization: req.headers.authorization, signal: abort.signal}, {
   capture, publish, turnReady, ready: () => {if (!stopping) ready();}, stopped: settled,
  }).then(async result => {
   if (result.status !== 200) {settled(); return;}
   active = result;
   if (stopping) {await active.end(); return;}
   publish(active.snapshot(), null);
  }, () => {stop(); settled();});
  const facade: NoteConnectionProbe = {
   audio: frame => !stopping && Boolean(active?.probe.audio(frame)),
   edit: (...args) => !stopping && Boolean(active?.probe.edit(...args)),
   confirm: (...args) => !stopping && Boolean(active?.probe.confirm(...args)),
   beginTurn: async id => !stopping && Boolean(await active?.probe.beginTurn(id)),
   commit: () => !stopping && Boolean(active?.probe.commit()),
   acknowledgeRendered: receipt => !stopping && Boolean(active?.probe.acknowledgeRendered(receipt)),
   receive: event => !stopping && Boolean(active?.probe.receive(event)),
   end: stop, disconnected: stop,
   snapshot: () => {
    const snapshot = active?.probe.snapshot() ?? pendingSnapshot;
    // Keep scope active while durable closure is unresolved; hold only after
    // the owner has settled, so a successful late close can release the slot.
    return {...snapshot, ended: finished, reason: finished && owner.status().state === 'held' ? 'cleanup-unverified' : snapshot.reason};
   },
  };
  return facade;
 }});
 return {dispose: bridge.dispose, snapshot: () => ({...bridge.snapshot(), allowanceState: owner.status().state})};
}
