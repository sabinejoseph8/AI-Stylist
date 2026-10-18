export const PROBE_STOP_REASONS=['user-ended','deadline-ended','page-hidden','page-left','left-meeting','client-error','heartbeat-failed','start-request-failed','daily-join-failed','audio-playback-failed','video-playback-failed'] as const;
export type ProbeStopReason=typeof PROBE_STOP_REASONS[number];
/** Fixed categories only. Never log a raw browser/provider error or header. */
export function probeStopReason(value:unknown):ProbeStopReason|'unknown-stop'{
 return typeof value==='string'&&(PROBE_STOP_REASONS as readonly string[]).includes(value)?value as ProbeStopReason:'unknown-stop';
}
/** The initial message is an app-authored constant, never a provider error. */
export function probeCleanupMessage(initial:string,ended:boolean){
 return initial+' '+(ended?'The provider reports the room ended. Check that your microphone indicator is off.':'Remote ending is unverified; no retry is available.');
}
