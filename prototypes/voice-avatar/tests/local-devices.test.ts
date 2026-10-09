import { describe, expect, it, vi } from 'vitest';
import { LocalDevices } from '../src/local-devices.ts';
function fixture(audio = true, video = true) {
  const tracks = [audio && { stop: vi.fn() }, video && { stop: vi.fn() }].filter(Boolean) as { stop: ReturnType<typeof vi.fn> }[];
  return { tracks, stream: { getTracks: () => tracks, getAudioTracks: () => audio ? [tracks[0]] : [], getVideoTracks: () => video ? [tracks[tracks.length - 1]] : [] } as unknown as MediaStream };
}
describe('local device ownership', () => {
  it('requests both devices only on explicit start and stops every track', async () => {
    const media = fixture(), acquire = vi.fn(async () => media.stream), devices = new LocalDevices(acquire);
    expect(acquire).not.toHaveBeenCalled();
    expect(await devices.start()).toBe(media.stream);
    expect(acquire).toHaveBeenCalledWith(expect.objectContaining({ audio: expect.any(Object), video: expect.any(Object) }));
    devices.stop(); devices.stop(); media.tracks.forEach(track => expect(track.stop).toHaveBeenCalledOnce());
  });
  it('rejects concurrent starts', async () => {
    const media = fixture(), devices = new LocalDevices(async () => media.stream);
    const first = devices.start(); await expect(devices.start()).rejects.toThrow('already active'); await first;
    await expect(devices.start()).rejects.toThrow('already active'); devices.stop();
  });
  it('stops a stream returned after cancellation', async () => {
    const media = fixture(); let grant!: (s: MediaStream) => void;
    const devices = new LocalDevices(() => new Promise(resolve => { grant = resolve; }));
    const request = devices.start(); devices.stop(); grant(media.stream);
    expect(await request).toBeNull(); media.tracks.forEach(track => expect(track.stop).toHaveBeenCalledOnce());
  });
  it('allows retry after a denied request', async () => {
    const media = fixture(), acquire = vi.fn().mockRejectedValueOnce(new Error('Denied')).mockResolvedValueOnce(media.stream);
    const devices = new LocalDevices(acquire); await expect(devices.start()).rejects.toThrow('Denied');
    expect(await devices.start()).toBe(media.stream); devices.stop();
  });
  it.each([[true, false], [false, true]])('stops partial device grants (%s, %s)', async (audio, video) => {
    const media = fixture(audio, video), devices = new LocalDevices(async () => media.stream);
    await expect(devices.start()).rejects.toThrow('Both'); media.tracks.forEach(track => expect(track.stop).toHaveBeenCalledOnce());
  });
  it('does not let an old grant replace a newer stream', async () => {
    const old = fixture(), current = fixture(); let grant!: (s: MediaStream) => void;
    const acquire = vi.fn().mockImplementationOnce(() => new Promise(resolve => { grant = resolve; })).mockResolvedValueOnce(current.stream);
    const devices = new LocalDevices(acquire), stale = devices.start(); devices.stop(); await devices.start(); grant(old.stream); await stale;
    old.tracks.forEach(track => expect(track.stop).toHaveBeenCalledOnce()); current.tracks.forEach(track => expect(track.stop).not.toHaveBeenCalled());
    devices.stop(); current.tracks.forEach(track => expect(track.stop).toHaveBeenCalledOnce());
  });
});
