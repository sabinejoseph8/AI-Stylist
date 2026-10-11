import {it,expect,vi} from 'vitest';
import sharp from 'sharp';
import {saveImage,deleteImage} from '../src/server/media-lifecycle.ts';
import type {MediaLifecyclePort} from '../src/server/media-lifecycle.ts';
const actor='00000000-0000-0000-0000-000000000001';
const id='00000000-0000-0000-0000-000000000002';
function port(){return {stage:vi.fn(async()=>{}),putIfAbsent:vi.fn(async()=>{}),commit:vi.fn(async()=>{}),beginDelete:vi.fn(async()=>({key:`${actor}/${id}.webp`,deletionToken:id})),remove:vi.fn(async()=>{}),finishDelete:vi.fn(async()=>{})} satisfies MediaLifecyclePort;}
async function image(){return sharp({create:{width:5,height:5,channels:3,background:'red'}}).png().toBuffer();}
it('stages before object upload and commit',async()=>{const p=port();const result=await saveImage(p,actor,true,await image(),'image/png');expect(p.stage).toHaveBeenCalledOnce();expect(p.putIfAbsent).toHaveBeenCalledOnce();expect(p.commit).toHaveBeenCalledOnce();expect(p.stage.mock.invocationCallOrder[0]).toBeLessThan(p.putIfAbsent.mock.invocationCallOrder[0]);expect(p.putIfAbsent.mock.invocationCallOrder[0]).toBeLessThan(p.commit.mock.invocationCallOrder[0]);expect(result.width).toBe(5);expect(result).not.toHaveProperty('key');});
it('requires consent before sanitizing or staging',async()=>{const p=port();await expect(saveImage(p,actor,false,await image(),'image/png')).rejects.toThrow();expect(p.stage).not.toHaveBeenCalled();});
for(const step of ['stage','putIfAbsent','commit'] as const)it(`holds ambiguous ${step} failure without automatic deletion`,async()=>{const p=port();p[step].mockRejectedValueOnce(Error('private provider detail'));await expect(saveImage(p,actor,true,await image(),'image/png')).rejects.toThrow('requires reconciliation');expect(p.remove).not.toHaveBeenCalled();if(step==='stage')expect(p.putIfAbsent).not.toHaveBeenCalled();if(step!=='commit')expect(p.commit).not.toHaveBeenCalled();});
it('deletes only after reference-safe claim, then finalizes',async()=>{const p=port();await deleteImage(p,actor,id,1,true);expect(p.beginDelete.mock.invocationCallOrder[0]).toBeLessThan(p.remove.mock.invocationCallOrder[0]);expect(p.remove.mock.invocationCallOrder[0]).toBeLessThan(p.finishDelete.mock.invocationCallOrder[0]);});
it('a referenced image cannot reach object deletion',async()=>{const p=port();p.beginDelete.mockRejectedValueOnce(Error('referenced'));await expect(deleteImage(p,actor,id,1,true)).rejects.toThrow();expect(p.remove).not.toHaveBeenCalled();});
it('uncertain object deletion preserves pending metadata',async()=>{const p=port();p.remove.mockRejectedValueOnce(Error('timeout'));await expect(deleteImage(p,actor,id,1,true)).rejects.toThrow();expect(p.finishDelete).not.toHaveBeenCalled();});
it('refuses a foreign owner deletion claim',async()=>{const p=port();p.beginDelete.mockResolvedValueOnce({key:`${id}/foreign.webp`,deletionToken:id});await expect(deleteImage(p,actor,id,1,true)).rejects.toThrow();expect(p.remove).not.toHaveBeenCalled();});
it('refuses a nested legacy deletion key',async()=>{const p=port();p.beginDelete.mockResolvedValueOnce({key:`${actor}/other/fixture.jpg`,deletionToken:id});await expect(deleteImage(p,actor,id,1,true)).rejects.toThrow();expect(p.remove).not.toHaveBeenCalled();});
it('refuses missing confirmation and invalid revision',async()=>{const p=port();await expect(deleteImage(p,actor,id,1,false)).rejects.toThrow();await expect(deleteImage(p,actor,id,0,true)).rejects.toThrow();expect(p.beginDelete).not.toHaveBeenCalled();});

it('refuses path traversal in deletion claims',async()=>{const p=port();p.beginDelete.mockResolvedValueOnce({key:`${actor}/../other.webp`,deletionToken:id});await expect(deleteImage(p,actor,id,1,true)).rejects.toThrow();expect(p.remove).not.toHaveBeenCalled();});
