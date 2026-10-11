import {it,expect} from 'vitest';
import sharp from 'sharp';
import {sanitizeImage} from '../src/server/sanitize-image.ts';
async function image(format:'png'|'jpeg'|'webp',width=10,height=20){return sharp({create:{width,height,channels:3,background:'#008080'}}).toFormat(format).toBuffer();}
for(const format of ['png','jpeg','webp'] as const)it(`decodes ${format} and emits bounded webp`,async()=>{const x=await sanitizeImage(await image(format),`image/${format}`);expect(x.contentType).toBe('image/webp');expect(x.width).toBe(10);expect(x.height).toBe(20);expect(x.checksum).toMatch(/^[a-f0-9]{64}$/);expect((await sharp(x.bytes).metadata()).format).toBe('webp');});
it('strips EXIF and honors orientation',async()=>{const input=await sharp(await image('jpeg')).withMetadata({orientation:6}).toBuffer();expect((await sharp(input).metadata()).exif).toBeDefined();const x=await sanitizeImage(input,'image/jpeg');const meta=await sharp(x.bytes).metadata();expect(meta.exif).toBeUndefined();expect(meta.xmp).toBeUndefined();expect(meta.icc).toBeUndefined();expect(x.width).toBe(20);expect(x.height).toBe(10);});
it('rejects mismatched MIME',async()=>expect(sanitizeImage(await image('png'),'image/jpeg')).rejects.toThrow());
it('rejects SVG and fake image headers',async()=>{await expect(sanitizeImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),'image/png')).rejects.toThrow();await expect(sanitizeImage(Buffer.from([255,216,255,...Array(20).fill(0)]),'image/jpeg')).rejects.toThrow();});
it('rejects byte overflow and empty input',async()=>{await expect(sanitizeImage(new Uint8Array(10*1024*1024+1),'image/png')).rejects.toThrow();await expect(sanitizeImage(new Uint8Array(),'image/png')).rejects.toThrow();});
it('rejects dimension overflow',async()=>expect(sanitizeImage(await image('png',8193,1),'image/png')).rejects.toThrow());
it('bounds concurrent decoding without a queue',async()=>{const input=await image('png');const first=sanitizeImage(input,'image/png');await expect(sanitizeImage(input,'image/png')).rejects.toThrow('busy');await first;expect((await sanitizeImage(input,'image/png')).width).toBe(10);});
it('rejects truncated supported files and releases admission after failure',async()=>{
 for(const format of ['png','jpeg','webp'] as const){
  const bytes=await image(format);
  await expect(sanitizeImage(bytes.subarray(0,Math.min(32,bytes.length-1)),`image/${format}`)).rejects.toThrow('Image unavailable');
 }
 expect((await sanitizeImage(await image('png'),'image/png')).width).toBe(10);
});
it('rejects pixel overflow even when each side is within the limit',async()=>{
 const bytes=await image('png',4001,4000);
 await expect(sanitizeImage(bytes,'image/png')).rejects.toThrow('Image unavailable');
});
it('rejects animated WebP rather than silently saving its first frame',async()=>{
 const bytes=await sharp(Buffer.concat([Buffer.alloc(300,0),Buffer.alloc(300,255)]),{raw:{width:10,height:20,channels:3,pageHeight:10}}).webp({loop:0,delay:[100,100]}).toBuffer();
 expect((await sharp(bytes,{animated:true}).metadata()).pages).toBe(2);
 await expect(sanitizeImage(bytes,'image/webp')).rejects.toThrow('Image unavailable');
});
