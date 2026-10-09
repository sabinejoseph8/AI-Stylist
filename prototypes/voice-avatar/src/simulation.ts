import { SILENT_FRAME } from './contracts.ts';
import type { Command, ResponseKey } from './contracts.ts';
import { VoiceSession } from './voice-session.ts';

const CAPTIONS = [
  'Hello. This is a private connection test.',
  'Use Interrupt to test stopping this simulated response.',
  'The real voice and avatar have not been connected yet.',
];
export class Simulation {
  private session = new VoiceSession('synthetic-room');
  private current: ResponseKey | null = null;
  private previous: ResponseKey | null = null;
  private sequence = 0;
  private tickCount = 0;
  private commands: string[] = [];
  private caption = 'Start the local demo to try the interruption controls.';

  private record(commands: Command[]) {
    this.commands = [...this.commands, ...commands.map(c => String(c.payload.event_type ?? c.payload.type))].slice(-8);
  }
  start() {
    if (!['idle', 'stopped', 'ended', 'held'].includes(this.session.snapshot().state)) throw new Error('Demo already running');
    if (['ended', 'held'].includes(this.session.snapshot().state)) this.session = new VoiceSession('synthetic-room');
    this.sequence += 1; this.current = this.session.start(`response-${this.sequence}`, `item-${this.sequence}`);
    this.tickCount = 0; this.commands = []; this.caption = CAPTIONS[0]!;
  }
  tick() {
    if (!this.current || this.session.snapshot().state !== 'speaking') return;
    this.tickCount += 1;
    // Synthetic 20 ms frame, with synthetic playback acknowledgment. No audio is played.
    this.record(this.session.enqueue({ ...this.current, eventId: `event-${this.tickCount}`, pcm: SILENT_FRAME }));
    this.record(this.session.takeAudio());
    this.session.acknowledgePlayback(this.current, this.tickCount * 20);
    this.caption = CAPTIONS[Math.min(2, Math.floor((this.tickCount - 1) / 10))]!;
    if (this.tickCount === 30) {
      this.record(this.session.finishGeneration(this.current, 'completed'));
      this.record(this.session.finishPlayback(this.current)); this.previous = this.current; this.current = null;
      this.caption = 'Simulated response finished. Real avatar quality is still untested.';
    }
  }
  interrupt() {
    this.record(this.session.interrupt()); this.previous = this.current ?? this.previous; this.current = null;
    this.caption = 'Stopped. Delayed events from that response will be ignored.';
  }
  injectLate() {
    if (!this.previous) throw new Error('Interrupt or finish a response first');
    this.record(this.session.enqueue({ ...this.previous, eventId: 'late-frame', pcm: SILENT_FRAME }));
    this.session.acknowledgePlayback(this.previous, 20);
  }
  end() {
    this.record(this.session.end()); this.previous = this.current ?? this.previous; this.current = null;
    this.caption = 'Demo ended. The next start creates a fresh simulated response.';
  }
  snapshot() { return { ...this.session.snapshot(), caption: this.caption, commands: this.commands, canInjectLate: Boolean(this.previous), mode: 'simulation' as const }; }
}
