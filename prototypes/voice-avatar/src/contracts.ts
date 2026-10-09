/** Candidate provider messages, checked against official documentation on 9 October 2026.
 * These builders do not connect to a provider or prove account compatibility.
 */
export const AUDIO_RATE = 24_000;
export type ResponseKey = { epoch: number; responseId: string; itemId: string };
export type AudioFrame = ResponseKey & { eventId: string; pcm: string };
export type Command =
  | { target: 'openai'; payload: Record<string, unknown> }
  | { target: 'tavus'; payload: Record<string, unknown> }
  | { target: 'coordinator'; payload: Record<string, unknown> & { type: 'reset_realtime_context'; reason: string } };

// 20 ms of mono, little-endian PCM16 silence. This is a fixture, not a voice.
export const SILENT_FRAME = Buffer.alloc(AUDIO_RATE * 2 * 0.02).toString('base64');

export function pcmDurationMs(pcm: string): number {
  if (!pcm || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(pcm)) {
    throw new Error('Invalid PCM base64');
  }
  const bytes = Buffer.from(pcm, 'base64');
  if (bytes.toString('base64') !== pcm || bytes.length % 2 !== 0 || bytes.length > 960) {
    throw new Error('Expected at most 20 ms of PCM16');
  }
  return bytes.length / (AUDIO_RATE * 2) * 1000;
}

export function echoAudio(conversationId: string, inferenceId: string, pcm: string, done = false): Command {
  if (!conversationId || !inferenceId) throw new Error('Missing conversation or inference ID');
  if (pcm) pcmDurationMs(pcm);
  else if (!done) throw new Error('Empty audio requires completion');
  return { target: 'tavus', payload: {
    message_type: 'conversation', event_type: 'conversation.echo', conversation_id: conversationId,
    properties: { modality: 'audio', audio: pcm, sample_rate: AUDIO_RATE, inference_id: inferenceId, done },
  } };
}

export function interruptAvatar(conversationId: string): Command {
  return { target: 'tavus', payload: {
    message_type: 'conversation', event_type: 'conversation.interrupt', conversation_id: conversationId,
  } };
}

export function realtimeConfiguration(model: string, voice: string): Record<string, unknown> {
  if (!model.trim() || !voice.trim()) throw new Error('Explicit model and voice required');
  return { type: 'session.update', session: {
    type: 'realtime', model, output_modalities: ['audio'],
    instructions: 'Private media test. Use only the supplied neutral test sentence. Do not recommend products or looks.',
    audio: {
      input: { format: { type: 'audio/pcm', rate: AUDIO_RATE }, turn_detection: null },
      output: { format: { type: 'audio/pcm', rate: AUDIO_RATE }, voice },
    },
  } };
}

export type VoicePolicy = {
  voiceProvider: string;
  fallbackProviders: string[] | null;
  pipeline: string;
  tavusTtsBypassed: boolean;
  evidenceReference: string;
};
export function reviewVoicePolicy(policy: VoicePolicy): { allowed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (policy.voiceProvider.trim().toLowerCase() !== 'openai') reasons.push('Voice provider is excluded or unverified.');
  if (!Array.isArray(policy.fallbackProviders)) reasons.push('Fallback configuration is unknown.');
  else if (policy.fallbackProviders.some(p => p.trim().toLowerCase() !== 'openai')) reasons.push('A fallback is excluded or unverified.');
  if (policy.pipeline !== 'audio-echo' || policy.tavusTtsBypassed !== true) reasons.push('Audio Echo and the TTS bypass are unverified.');
  if (!policy.evidenceReference.trim()) reasons.push('Actual account configuration needs an evidence reference.');
  return { allowed: reasons.length === 0, reasons };
}

export function privateEchoConversation(faceId: string, palId: string): Record<string, unknown> {
  if (!faceId.trim() || !palId.trim()) throw new Error('Account-verified face and Echo PAL IDs required');
  return { face_id: faceId, pal_id: palId, require_auth: true, max_participants: 2, participant_tags: [] };
}
