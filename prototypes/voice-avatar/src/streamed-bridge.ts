import { IncrementalEcho } from './incremental-echo.ts';
import { streamSpokenReply } from './scripted-providers.ts';
import type { SpokenHistory } from './scripted-providers.ts';

/** Server-side bridge building block, not an exposed HTTP endpoint or enabled
 * phone test. The owner must first reserve allowance, verify its private room,
 * supply confirmed history only, and enforce its original room deadline.
 */
export function startStreamedBridge(options: {
  openaiKey: string; conversationId: string; signal: AbortSignal; audio: string;
  history: SpokenHistory[]; send: (message: object) => boolean;
}) {
  const controller = new AbortController();
  const signal = AbortSignal.any([options.signal, controller.signal]);
  let resolveOutput!: () => void, rejectOutput!: (error: Error) => void;
  const output = new Promise<void>((resolve, reject) => { resolveOutput = resolve; rejectOutput = reject; });
  // The generator may still be unwinding when output is held.
  void output.catch(() => {});
  const echo = new IncrementalEcho(options.conversationId, options.send, state => {
    if (state === 'sent') resolveOutput();
    else { rejectOutput(new Error('Streamed output stopped.')); if (state === 'held') controller.abort(); }
  });
  const epoch = echo.begin();
  const cancel = () => { controller.abort(); echo.stop(); };
  const onAbort = () => { echo.stop(); };
  signal.addEventListener('abort', onAbort, {once:true});
  const result = (async () => {
    try {
      if (signal.aborted) throw new Error('Stream canceled.');
      const generated = await streamSpokenReply(options.openaiKey, signal, options.audio, options.history, frame => echo.accept(epoch, frame));
      if (signal.aborted || !echo.finish(epoch)) throw new Error('Stream completion unavailable.');
      await output;
      return { ...generated, outputState: 'sent' as const, playbackConfirmed: false as const };
    } catch {
      cancel(); throw new Error('Streamed reply stopped. Room cleanup requires verification.');
    } finally { signal.removeEventListener('abort', onAbort); }
  })();
  return {result, cancel, snapshot:()=>echo.snapshot()};
}
