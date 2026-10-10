import {describe,it,expect,vi} from 'vitest';
import {NotebookCamera} from '../src/notebook-camera.ts';
function stream(audio=false){const video={stop:vi.fn()},mic={stop:vi.fn()};return {getVideoTracks:()=>[video],getAudioTracks:()=>audio?[mic]:[],getTracks:()=>audio?[video,mic]:[video]} as unknown as MediaStream;}
describe('local notebook camera ownership',()=>{
 it('requests video without microphone and stops all tracks',async()=>{const media=stream(),acquire=vi.fn().mockResolvedValue(media),camera=new NotebookCamera(acquire);expect(await camera.start()).toBe(media);expect(acquire.mock.calls[0]![0]).toMatchObject({audio:false});camera.stop();expect(media.getTracks()[0]!.stop).toHaveBeenCalledOnce();});
 it('releases a late permission result after Stop',async()=>{let resolve!:(s:MediaStream)=>void;const camera=new NotebookCamera(()=>new Promise(r=>resolve=r));const pending=camera.start();camera.stop();const media=stream();resolve(media);expect(await pending).toBeNull();expect(media.getTracks()[0]!.stop).toHaveBeenCalledOnce();});
 it('does not let an old permission rejection stop a newer preview',async()=>{let reject!:(e:Error)=>void;const media=stream(),acquire=vi.fn().mockImplementationOnce(()=>new Promise((_r,j)=>reject=j)).mockResolvedValue(media),camera=new NotebookCamera(acquire);const old=camera.start();camera.stop();await camera.start();reject(Error('Denied old request'));expect(await old).toBeNull();expect(media.getTracks()[0]!.stop).not.toHaveBeenCalled();camera.stop();});
 it('rejects unexpected audio tracks and releases them',async()=>{const media=stream(true),camera=new NotebookCamera(async()=>media);await expect(camera.start()).rejects.toThrow('camera-only');media.getTracks().forEach(t=>expect(t.stop).toHaveBeenCalledOnce());});
 it('refuses duplicate active camera starts',async()=>{const camera=new NotebookCamera(async()=>stream());await camera.start();await expect(camera.start()).rejects.toThrow();camera.stop();});
});
