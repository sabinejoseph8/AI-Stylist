import {PreviewGate, validatePreview} from './preview-gate.ts';
import type {PreviewConfig} from './preview-gate.ts';
import type {ExperimentBudget} from './experiment-budget.ts';
import {createPreparedNoteProviderSession} from './prepared-note-provider-session.ts';
import {NotebookState} from './notebook-state.ts';

type Session = ReturnType<typeof createPreparedNoteProviderSession>;
type SessionOptions = Parameters<typeof createPreparedNoteProviderSession>[0];
/** Method-compatible with the durable ledger, but injected simulations only here.
 * A future notes-only ledger requires its own approved allowance and adapter.
 * This module has no route, credential loading or application-server call site. */
type Allowance = Pick<ExperimentBudget, 'reserve' | 'closeVerified'> & {purpose: 'notes-only-simulation'};
type Request = {method: string; path: string; host: string; origin: string; authorization?: string; signal: AbortSignal};
export function createPreparedNoteServerOwner(options: {
 simulation?: boolean; preview: PreviewConfig; allowance: Allowance;
 createTransports: () => Pick<SessionOptions, 'socket' | 'fetch' | 'capture'>;
 changed: SessionOptions['changed'];
}) {
 if (options.simulation !== true || options.allowance.purpose !== 'notes-only-simulation') throw Error('Live notebook server owner is disabled.');
 const target = validatePreview(options.preview), gate = new PreviewGate(options.preview);
 let state: 'idle' | 'starting' | 'active' | 'closing' | 'held' = 'idle';
 return {
  status: () => ({state, liveEnabled: false as const}),
  async start(request: Request) {
   if (request.method !== 'GET' || request.path !== '/api/notebook-simulation' || request.host !== target.host || request.origin !== target.origin) return {status: 403 as const};
   const auth = gate.check(request.authorization);
   if (auth !== 200) return {status: auth};
   if (state !== 'idle') return {status: 409 as const};
   if (request.signal.aborted) return {status: 499 as const};
   state = 'starting';
   const controller = new AbortController();
   let reservation: string | undefined, session: Session | undefined;
   let ending = false, creationFailed = false, finishPromise: Promise<void> | undefined;
   const detach = () => {clearTimeout(timer); request.signal.removeEventListener('abort', stop);};
   const finish = (): Promise<void> => {
    if (finishPromise) return finishPromise;
    finishPromise = (async () => {
     state = 'closing'; detach(); controller.abort(); session?.end();
     // Probe shutdown and its owner callback must settle before verification.
     await Promise.resolve();
     if (creationFailed || session?.status().cleanupFailed) {state = 'held'; return;}
     try {if (reservation) await options.allowance.closeVerified(reservation); state = 'idle';}
     catch {state = 'held';}
    })();
    return finishPromise;
   };
   const stop = () => {
    ending = true; controller.abort();
    // A late reservation is closed by the awaiting start, never forgotten.
    if (reservation) void finish();
   };
   const timer = setTimeout(stop, 85_000);
   request.signal.addEventListener('abort', stop, {once: true});
   try {reservation = await options.allowance.reserve();}
   catch {
    // The durable write may have succeeded before its response failed. Fail
    // closed without retries or claims that no reservation was consumed.
    detach(); controller.abort(); state = 'held'; return {status: 503 as const};
   }
   if (ending || request.signal.aborted) {await finish(); return {status: 499 as const};}
   try {
    session = createPreparedNoteProviderSession({simulation: true, ...options.createTransports(), notebook: new NotebookState(), signal: controller.signal, changed: options.changed, stopped: stop});
   } catch {
    creationFailed = true; await finish(); return {status: 503 as const};
   }
   if (ending || session.status().ended) {await finish(); return {status: 499 as const};}
   state = 'active';
   return {status: 200 as const, probe: session.probe, end: async () => {ending = true; await finish();}};
  },
 };
}
