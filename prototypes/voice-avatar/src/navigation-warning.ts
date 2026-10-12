/** Best-effort warning. Mobile browsers may skip it; pagehide still owns cleanup. */
export function warnBeforeLeaving(active: () => boolean, event: BeforeUnloadEvent): void {
  if (!active()) return;
  event.preventDefault(); event.returnValue = '';
}
