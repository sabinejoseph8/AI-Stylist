import {PreviewGate, validatePreview} from './preview-gate.ts';
import type {PreviewConfig} from './preview-gate.ts';
import type {ExperimentBudget} from './experiment-budget.ts';
import {createPreparedNoteProviderSession} from './prepared-note-provider-session.ts';
import type {ProbeCapture} from './note-session-probe.ts';
import {NotebookState, checkFixture} from './notebook-state.ts';
import {LookRelease} from './look-release.ts';
import type {LookDraft, LookPermit} from './look-release.ts';
import type {CheckTicket} from './notebook-state.ts';
import {prepareSyntheticLook} from './synthetic-look-candidate.ts';
import type {SyntheticLookCandidate} from './synthetic-look-candidate.ts';

type Session = ReturnType<typeof createPreparedNoteProviderSession>;
type SessionOptions = Parameters<typeof createPreparedNoteProviderSession>[0];
/** Method-compatible with the durable ledger, but injected simulations only here.
 * A future notes-only ledger requires its own approved allowance and adapter.
 * This module has no route, credential loading or application-server call site. */
type Allowance = Pick<ExperimentBudget, 'reserve' | 'closeVerified'> & {purpose: 'notes-only-simulation'};
type Hooks = {capture?: ProbeCapture; publish?: (snapshot: ReturnType<NotebookState['snapshot']>, receipt: number | null) => void; ready?: () => void; turnReady?: (turnId: string) => void; stopped?: () => void};
type Request = {method: string; path: string; host: string; origin: string; authorization?: string; signal: AbortSignal};
export function createPreparedNoteServerOwner(options: {
 simulation?: boolean; preview: PreviewConfig; allowance: Allowance;
 createTransports: (capture?: ProbeCapture) => Pick<SessionOptions, 'socket' | 'fetch' | 'capture'>;
 changed: SessionOptions['changed'];
}) {
 if (options.simulation !== true || options.allowance.purpose !== 'notes-only-simulation') throw Error('Live notebook server owner is disabled.');
 const target = validatePreview(options.preview), gate = new PreviewGate(options.preview);
 let state: 'idle' | 'starting' | 'active' | 'closing' | 'held' = 'idle';
 return {
  status: () => ({state, liveEnabled: false as const}),
  async start(request: Request, hooks: Hooks = {}) {
   if (request.method !== 'GET' || request.path !== '/api/notebook-simulation' || request.host !== target.host || request.origin !== target.origin) return {status: 403 as const};
   const auth = gate.check(request.authorization);
   if (auth !== 200) return {status: auth};
   if (state !== 'idle') return {status: 409 as const};
   if (request.signal.aborted) return {status: 499 as const};
   state = 'starting';
   const controller = new AbortController(), notebook = new NotebookState(), release = new LookRelease(notebook);
   let reservation: string | undefined, session: Session | undefined;
   let ending = false, creationFailed = false, finishPromise: Promise<void> | undefined;
   const detach = () => {clearTimeout(timer); request.signal.removeEventListener('abort', stop);};
   const finish = (): Promise<void> => {
    if (finishPromise) return finishPromise;
    finishPromise = (async () => {
     state = 'closing'; detach(); release.dispose(); controller.abort(); session?.end();
     // Probe shutdown and its owner callback must settle before verification.
     await Promise.resolve();
     if (creationFailed || session?.status().cleanupFailed) {state = 'held'; return;}
     try {if (reservation) await options.allowance.closeVerified(reservation); state = 'idle';}
     catch {state = 'held';}
    })();
    void finishPromise.then(() => {try {hooks.stopped?.();} catch {/* Cleanup has already settled. */}});
    return finishPromise;
   };
   const stop = () => {
    ending = true; release.dispose(); controller.abort();
    // A late reservation is closed by the awaiting start, never forgotten.
    if (reservation) void finish();
   };
   const timer = setTimeout(stop, 85_000);
   request.signal.addEventListener('abort', stop, {once: true});
   try {reservation = await options.allowance.reserve();}
   catch {
    // The durable write may have succeeded before its response failed. Fail
    // closed without retries or claims that no reservation was consumed.
    detach(); release.dispose(); controller.abort(); state = 'held'; return {status: 503 as const};
   }
   if (ending || request.signal.aborted) {await finish(); return {status: 499 as const};}
   try {
    session = createPreparedNoteProviderSession({simulation: true, ...options.createTransports(hooks.capture), notebook, signal: controller.signal, changed: receipt => {options.changed(receipt); hooks.publish?.(notebook.snapshot(), receipt);}, inputStarted: () => release.end(), invalidated: () => {release.end(); hooks.publish?.(notebook.snapshot(), null);}, ready: hooks.ready, turnReady: hooks.turnReady, stopped: stop});
   } catch {
    creationFailed = true; await finish(); return {status: 503 as const};
   }
   if (ending || session.status().ended) {await finish(); return {status: 499 as const};}
   state = 'active';
   // Server-only capability: never serialize permits or add look commands to the
   // notebook wire. The narrow fixture checker receives the same immutable data
   // that generates the sample description; no caller-supplied pass is accepted.
   const available = () => !ending && !controller.signal.aborted && state === 'active' && session?.probe.readyForLook() === true;
   const allowed = () => {if (available()) return true; release.end(); return false;};
   let pendingLook: {ticket: CheckTicket; prepared: ReturnType<typeof prepareSyntheticLook>} | null = null;
   const looks = Object.freeze({
    begin: (candidate: SyntheticLookCandidate): CheckTicket | null => {
     if (!allowed()) return null;
     // Even malformed replacement data revokes the previously approved sample.
     release.end(); pendingLook = null;
     let prepared: ReturnType<typeof prepareSyntheticLook>;
     try {prepared = prepareSyntheticLook(candidate);} catch {return null;}
     const ticket = release.begin(prepared.draft); pendingLook = {ticket, prepared}; return ticket;
    },
    complete: (ticket: CheckTicket): LookPermit | null => {
     if (!allowed() || !pendingLook || pendingLook.ticket !== ticket) return null;
     const pending = pendingLook; pendingLook = null;
     return release.complete(ticket, checkFixture(notebook.snapshot(), pending.prepared.candidate));
    },
    visual: (permit: LookPermit): LookDraft | null => allowed() ? release.visual(permit) : null,
    startSpeech: (permit: LookPermit, start: Parameters<LookRelease['startSpeech']>[1]): boolean => allowed() && release.startSpeech(permit, (draft, signal, authorizeFrame) => start(draft, signal, () => allowed() && authorizeFrame())),
   });
   return {status: 200 as const, looks, probe: session.probe, snapshot: () => notebook.snapshot(), end: async () => {ending = true; await finish();}};
  },
 };
}
