/** Fixed UI labels only. Never expose exception messages, provider bodies or speech. */
export type AutomaticTurnStage = 'request' | 'playback' | 'stream';
export function automaticTurnFailure(stage: AutomaticTurnStage): string {
  const detail = {
    request: 'The reply request failed before playback began.',
    playback: 'The reply arrived, but browser playback could not start.',
    stream: 'The reply arrived, but avatar audio delivery could not start.',
  }[stage];
  return `${detail} Microphone and playback are off. Do not retry. Report this message.`;
}
