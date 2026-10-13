/** Sabine's 13 October 2026 customer notes-policy decision.
 * Prepared for local implementation only. Importing this policy does not
 * authorize hosted activation, provider calls or provider-side deletion.
 * End/Clear removes unsaved notes immediately; explicitly saved preferences
 * have separate ownership and are never deleted by this session policy. */
export type NotesRetentionPolicy=Readonly<{idleMs:number;disconnectMs:number;warningMs:number}>;
export const APPROVED_NOTES_RETENTION:NotesRetentionPolicy=Object.freeze({
 idleMs:30*60*1000,
 disconnectMs:5*60*1000,
 warningMs:60*1000,
});
