import sharp from 'sharp';
import {createHash} from 'node:crypto';
const MAX_BYTES=10*1024*1024;
let active=false;
/** Local-only preparation. Deployment still requires process/container resource limits. */
export async function sanitizeImage(input:Uint8Array,contentType:string){
 if(active)throw Error('Image processing busy');
 if(!(input instanceof Uint8Array)||input.byteLength<12||input.byteLength>MAX_BYTES)throw Error('Image unavailable');
 const bytes=Buffer.from(input);
 const format=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'png':bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'jpeg':bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'?'webp':null;
 if(!format||contentType!==`image/${format}`)throw Error('Image unavailable');
 active=true;
 try{
  const decoder=sharp(bytes,{failOn:'warning',limitInputPixels:16_000_000,animated:false});
  const meta=await decoder.metadata();
  if(meta.format!==format||!meta.width||!meta.height||meta.width>8192||meta.height>8192||(meta.pages??1)!==1)throw Error('Image unavailable');
  const {data,info}=await decoder.rotate().webp({quality:90}).timeout({seconds:5}).toBuffer({resolveWithObject:true});
  if(data.length>MAX_BYTES||info.width>8192||info.height>8192)throw Error('Image unavailable');
  return Object.freeze({bytes:data,contentType:'image/webp' as const,width:info.width,height:info.height,checksum:createHash('sha256').update(data).digest('hex')});
 }catch{throw Error('Image unavailable');}finally{active=false;}
}
