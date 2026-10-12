import type { RecoveryTransport } from './context-recovery.ts';
import { RendererTeardown } from './renderer-teardown.ts';

/** Disabled preparation: provider closure and fresh configuration must still be
 * independently acknowledged by the supplied transport. No room is opened here. */
export function withRendererTeardown(
  transport: Omit<RecoveryTransport, 'verifyRendererStopped'>,
  renderer: RendererTeardown,
): RecoveryTransport {
  return {
    stopLocalOutput: () => {
      // Start local disposal before waiting on any remote closure.
      renderer.begin();
      transport.stopLocalOutput();
    },
    closeOldContext: signal => transport.closeOldContext(signal),
    verifyRendererStopped: signal => renderer.dispose(signal),
    openFreshContext: signal => transport.openFreshContext(signal),
    restoreConfirmedContext: (context, history, signal) => transport.restoreConfirmedContext(context, history, signal),
    discardFreshContext: context => transport.discardFreshContext(context),
  };
}
