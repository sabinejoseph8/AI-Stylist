import {describe,it,expect,vi} from 'vitest';
import {LocalReferenceStore} from '../src/media/local-reference.ts';
import {captureNotebookStill} from '../src/media/notebook-still.ts';
function fixture(){
 let finish!:(blob:Blob|null)=>void;
 const drawImage=vi.fn(),canvas={width:0,height:0,getContext:vi.fn(()=>({drawImage})),toBlob:vi.fn(callback=>{finish=callback;})};
 const completed=vi.fn(),failed=vi.fn();
 return {canvas,completed,failed,drawImage,finish:(b:Blob|null)=>finish(b),run:(current=()=>true)=>captureNotebookStill({video:{videoWidth:1920,videoHeight:1080} as HTMLVideoElement,createCanvas:()=>canvas as unknown as HTMLCanvasElement,current,completed,failed})};
}
const jpeg=()=>new Blob(['fixture'],{type:'image/jpeg'});
describe('explicit notebook still encoding',()=>{
 it('draws once with bounded dimensions and delivers a JPEG once',()=>{const f=fixture();f.run();expect(f.canvas.width).toBe(1280);expect(f.canvas.height).toBe(720);expect(f.drawImage).toHaveBeenCalledOnce();f.finish(jpeg());f.finish(jpeg());expect(f.completed).toHaveBeenCalledOnce();expect(f.failed).not.toHaveBeenCalled();});
 it('keeps the latest capture when encoders finish in reverse order',()=>{let epoch=1;const a=fixture(),b=fixture();a.run(()=>epoch===1);epoch=2;b.run(()=>epoch===2);b.finish(jpeg());a.finish(jpeg());expect(b.completed).toHaveBeenCalledOnce();expect(a.completed).not.toHaveBeenCalled();});
 it('suppresses a result and failure after clear, upload or removal invalidates ownership',()=>{let current=true;const a=fixture(),b=fixture();a.run(()=>current);b.run(()=>current);current=false;a.finish(jpeg());b.finish(null);expect(a.completed).not.toHaveBeenCalled();expect(b.failed).not.toHaveBeenCalled();});
 it.each([null,new Blob([],{type:'image/jpeg'}),new Blob(['x'],{type:'image/png'})])('reports unusable encoded data without publishing',blob=>{const f=fixture();f.run();f.finish(blob);expect(f.failed).toHaveBeenCalledOnce();expect(f.completed).not.toHaveBeenCalled();});
 it('reports missing drawing context before encoding',()=>{const f=fixture();f.canvas.getContext.mockReturnValue(null as never);f.run();expect(f.failed).toHaveBeenCalledOnce();expect(f.canvas.toBlob).not.toHaveBeenCalled();});
 it('reports drawing and synchronous encoder failures',()=>{for(const where of ['draw','encode']){const f=fixture();if(where==='draw')f.drawImage.mockImplementation(()=>{throw Error('private');});else f.canvas.toBlob.mockImplementation(()=>{throw Error('private');});f.run();expect(f.failed).toHaveBeenCalledOnce();expect(f.completed).not.toHaveBeenCalled();}});
 it('refuses missing or excessive frame dimensions without allocating a canvas',()=>{const createCanvas=vi.fn(),failed=vi.fn();for(const width of [0,Infinity,24000001])captureNotebookStill({video:{videoWidth:width,videoHeight:1} as HTMLVideoElement,createCanvas,current:()=>true,completed:vi.fn(),failed});expect(createCanvas).not.toHaveBeenCalled();expect(failed).toHaveBeenCalledTimes(3);});
});

// Exercise the actual photo owner, rather than manually flipping a test flag.
it.each(['remove','clear','cancelPending','replace'] as const)('late camera encoding cannot restore photos after %s',async action=>{
 const normalize=vi.fn(async()=>new Blob(['pixels'],{type:'image/webp'}));
 let serial=0;const model=new LocalReferenceStore({normalize,createURL:()=>`blob:still_${++serial}`,revokeURL:vi.fn()});
 await model.choose([jpeg()]);model.confirm('Sample jacket','owned');
 const reference=model.snapshot().reference!,current=model.pendingInputGuard();
 let finish!:(blob:Blob|null)=>void;const completed=vi.fn((blob:Blob)=>{void model.choose([blob]);});
 captureNotebookStill({video:{videoWidth:1280,videoHeight:720} as HTMLVideoElement,createCanvas:()=>({width:0,height:0,getContext:()=>({drawImage:()=>{}}),toBlob:(callback:(blob:Blob|null)=>void)=>{finish=callback;}} as unknown as HTMLCanvasElement),current,completed,failed:vi.fn()});
 if(action==='remove')model.remove(reference.photo.id);
 else if(action==='replace')await model.choose([jpeg()]);
 else model[action]();
 const before=model.snapshot();finish(jpeg());await Promise.resolve();
 expect(completed).not.toHaveBeenCalled();expect(model.snapshot()).toEqual(before);
 expect(normalize).toHaveBeenCalledTimes(action==='replace'?2:1);
});
it('a current camera encoding remains admissible without intervening photo changes',()=>{
 const model=new LocalReferenceStore({normalize:async blob=>blob,createURL:()=>'',revokeURL:()=>{}});
 const f=fixture();f.run(model.pendingInputGuard());f.finish(jpeg());expect(f.completed).toHaveBeenCalledOnce();
});
