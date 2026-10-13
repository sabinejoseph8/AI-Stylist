import {describe,it,expect,vi} from 'vitest';
import {NotebookCamera} from '../src/media/notebook-camera.ts';
function stream(audio=false){const video={stop:vi.fn()},mic={stop:vi.fn()};return {getVideoTracks:()=>[video],getAudioTracks:()=>audio?[mic]:[],getTracks:()=>audio?[video,mic]:[video]} as unknown as MediaStream;}
describe('local notebook camera ownership',()=>{
 it('requests video without microphone and stops all tracks',async()=>{const media=stream(),acquire=vi.fn().mockResolvedValue(media),camera=new NotebookCamera(acquire);expect(await camera.start()).toBe(media);expect(acquire.mock.calls[0]![0]).toMatchObject({audio:false});camera.stop();expect(media.getTracks()[0]!.stop).toHaveBeenCalledOnce();});
 it('releases a late permission result after Stop',async()=>{let resolve!:(s:MediaStream)=>void;const camera=new NotebookCamera(()=>new Promise(r=>resolve=r));const pending=camera.start();camera.stop();const media=stream();resolve(media);expect(await pending).toBeNull();expect(media.getTracks()[0]!.stop).toHaveBeenCalledOnce();});
 it('does not let an old permission rejection stop a newer preview',async()=>{let reject!:(e:Error)=>void;const media=stream(),acquire=vi.fn().mockImplementationOnce(()=>new Promise((_r,j)=>reject=j)).mockResolvedValue(media),camera=new NotebookCamera(acquire);const old=camera.start();camera.stop();await camera.start();reject(Error('Denied old request'));expect(await old).toBeNull();expect(media.getTracks()[0]!.stop).not.toHaveBeenCalled();camera.stop();});
 it('rejects unexpected audio tracks and releases them',async()=>{const media=stream(true),camera=new NotebookCamera(async()=>media);await expect(camera.start()).rejects.toThrow('camera-only');media.getTracks().forEach(t=>expect(t.stop).toHaveBeenCalledOnce());});
 it('refuses duplicate active camera starts',async()=>{const camera=new NotebookCamera(async()=>stream());await camera.start();await expect(camera.start()).rejects.toThrow();camera.stop();});
});

function previewStream(){
 const track=Object.assign(new EventTarget(),{stop:vi.fn(),readyState:'live'});
 const media={getVideoTracks:()=>[track],getAudioTracks:()=>[],getTracks:()=>[track]} as unknown as MediaStream;
 return {track,media};
}
function deferred(){let resolve!:()=>void,reject!:(reason:unknown)=>void;const promise=new Promise<void>((r,j)=>{resolve=r;reject=j;});return{promise,resolve,reject};}
describe('camera preview callback ownership',()=>{
 it.each(['resolve','reject'] as const)('ignores old playback %s after stop and restart',async result=>{
  const a=previewStream(),b=previewStream(),play=deferred(),readyOld=vi.fn(),failedOld=vi.fn(),readyNew=vi.fn();
  const camera=new NotebookCamera(vi.fn().mockResolvedValueOnce(a.media).mockResolvedValueOnce(b.media));
  const attached=vi.fn(()=>play.promise);const old=camera.preview({attached,ready:readyOld,failed:failedOld,disconnected:vi.fn()});await vi.waitFor(()=>expect(attached).toHaveBeenCalledOnce());camera.stop();
  await camera.preview({attached:async()=>{},ready:readyNew,failed:vi.fn(),disconnected:vi.fn()});
  if(result==='resolve')play.resolve();else play.reject(Error('old private error'));await old;
  expect(readyOld).not.toHaveBeenCalled();expect(failedOld).not.toHaveBeenCalled();expect(readyNew).toHaveBeenCalledOnce();expect(b.track.stop).not.toHaveBeenCalled();camera.stop();
 });
 it('ignores retired device events and releases the active listener on stop',async()=>{
  const a=previewStream(),b=previewStream(),disconnect=vi.fn(),camera=new NotebookCamera(vi.fn().mockResolvedValueOnce(a.media).mockResolvedValueOnce(b.media));
  const options={attached:async()=>{},ready:vi.fn(),failed:vi.fn(),disconnected:disconnect};await camera.preview(options);camera.stop();await camera.preview(options);
  a.track.dispatchEvent(new Event('ended'));expect(disconnect).not.toHaveBeenCalled();b.track.dispatchEvent(new Event('ended'));expect(disconnect).toHaveBeenCalledOnce();camera.stop();b.track.dispatchEvent(new Event('ended'));expect(disconnect).toHaveBeenCalledOnce();
 });
 it('releases a stream acquired after stop without attaching it',async()=>{
  let resolve!:(stream:MediaStream)=>void;const {media,track}=previewStream(),camera=new NotebookCamera(()=>new Promise(r=>resolve=r)),attached=vi.fn();
  const pending=camera.preview({attached,ready:vi.fn(),failed:vi.fn(),disconnected:vi.fn()});camera.stop();resolve(media);await pending;expect(attached).not.toHaveBeenCalled();expect(track.stop).toHaveBeenCalledOnce();
 });
 it('refuses duplicate preview acquisition while permission is pending',async()=>{
  let resolve!:(stream:MediaStream)=>void;const acquire=vi.fn(()=>new Promise<MediaStream>(r=>resolve=r)),camera=new NotebookCamera(acquire),options={attached:async()=>{},ready:vi.fn(),failed:vi.fn(),disconnected:vi.fn()};
  const first=camera.preview(options);await camera.preview(options);expect(acquire).toHaveBeenCalledOnce();resolve(previewStream().media);await first;camera.stop();
 });
 it('reports a current playback failure and already ended track',async()=>{
  const a=previewStream(),camera=new NotebookCamera(async()=>a.media),failed=vi.fn(()=>camera.stop());await camera.preview({attached:async()=>{throw Error('private');},ready:vi.fn(),failed,disconnected:vi.fn()});expect(failed).toHaveBeenCalledOnce();expect(a.track.stop).toHaveBeenCalledOnce();
  const b=previewStream();b.track.readyState='ended';const other=new NotebookCamera(async()=>b.media),attached=vi.fn(),disconnected=vi.fn(()=>other.stop());await other.preview({attached,ready:vi.fn(),failed:vi.fn(),disconnected});expect(attached).not.toHaveBeenCalled();expect(disconnected).toHaveBeenCalledOnce();
 });
 it('stops other tracks even if one device release throws',async()=>{
  const a=previewStream(),b=previewStream();a.track.stop.mockImplementation(()=>{throw Error('device');});const media={getVideoTracks:()=>[a.track,b.track],getAudioTracks:()=>[],getTracks:()=>[a.track,b.track]} as unknown as MediaStream;
  const camera=new NotebookCamera(async()=>media);await camera.start();camera.stop();expect(b.track.stop).toHaveBeenCalledOnce();expect(camera.busy).toBe(false);
 });
 it('holds readiness if stopped while the video is opening',async()=>{
  const a=previewStream(),play=deferred(),camera=new NotebookCamera(async()=>a.media),ready=vi.fn();const attached=vi.fn(()=>play.promise);const start=camera.preview({attached,ready,failed:vi.fn(),disconnected:vi.fn()});await vi.waitFor(()=>expect(attached).toHaveBeenCalledOnce());camera.stop();play.resolve();await start;expect(ready).not.toHaveBeenCalled();expect(a.track.stop).toHaveBeenCalledOnce();
 });
});

it('releases every track from a late permission result even if one stop throws',async()=>{
 let resolve!:(s:MediaStream)=>void;const a=previewStream(),b=previewStream();a.track.stop.mockImplementation(()=>{throw Error('device');});
 const media={getVideoTracks:()=>[a.track,b.track],getAudioTracks:()=>[],getTracks:()=>[a.track,b.track]} as unknown as MediaStream;const camera=new NotebookCamera(()=>new Promise(r=>resolve=r));const pending=camera.start();camera.stop();resolve(media);expect(await pending).toBeNull();expect(b.track.stop).toHaveBeenCalledOnce();
});
