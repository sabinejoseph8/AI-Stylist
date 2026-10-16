import {expect,it} from 'vitest';
import {isNormalizedPreviewPhoto} from '../src/media/normalized-preview-photo.ts';
it.each(['image/webp','image/png'])('accepts bounded normalized %s canvas output',type=>{expect(isNormalizedPreviewPhoto(new Blob(['pixels'],{type}))).toBe(true);});
it('refuses unsupported, empty and oversized normalized output',()=>{for(const v of [null,{},new Blob(['pixels'],{type:'image/jpeg'}),new Blob([],{type:'image/png'}),new Blob([new Uint8Array(8*1024*1024+1)],{type:'image/png'})])expect(isNormalizedPreviewPhoto(v)).toBe(false);});
