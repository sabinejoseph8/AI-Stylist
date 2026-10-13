const MAX_PIXELS=16_000_000;
const u24=(v:DataView,offset:number)=>v.getUint8(offset)+(v.getUint8(offset+1)<<8)+(v.getUint8(offset+2)<<16);
/** Reject large declared dimensions before invoking the browser decoder. A
 * bounded header scan deliberately refuses uncommon/unsupported encodings. */
export function imageDimensions(bytes:Uint8Array,type:string):{width:number;height:number}|null{
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),n=bytes.length;let width=0,height=0;
 if(type==='image/png'&&n>=24&&[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b)&&String.fromCharCode(...bytes.slice(12,16))==='IHDR'){width=v.getUint32(16);height=v.getUint32(20);}
 else if(type==='image/jpeg'&&n>=4&&bytes[0]===255&&bytes[1]===216){
  let p=2;while(p+4<=n){if(bytes[p++]!==255)return null;while(p<n&&bytes[p]===255)p++;const marker=bytes[p++];if(marker===217||marker===218)return null;if(marker===1||(marker>=208&&marker<=215))continue;if(p+2>n)return null;const size=v.getUint16(p);if(size<2||p+size>n)return null;if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){if(size<8)return null;height=v.getUint16(p+3);width=v.getUint16(p+5);break;}p+=size;}
 }else if(type==='image/webp'&&n>=30&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP'){
  const chunk=String.fromCharCode(...bytes.slice(12,16));
  if(chunk==='VP8X'){width=u24(v,24)+1;height=u24(v,27)+1;}
  else if(chunk==='VP8 '&&bytes[23]===157&&bytes[24]===1&&bytes[25]===42){width=v.getUint16(26,true)&16383;height=v.getUint16(28,true)&16383;}
  else if(chunk==='VP8L'&&bytes[20]===47){const bits=v.getUint32(21,true);width=(bits&16383)+1;height=((bits>>>14)&16383)+1;}
 }
 return width>0&&height>0&&width<=8192&&height<=8192&&width*height<=MAX_PIXELS?{width,height}:null;
}
/** Rasterize locally, dropping source metadata and scaling the longest edge.
 * No filename, original bytes, EXIF, audio or frame stream is persisted. */
export async function normalizeBrowserImage(file:Blob):Promise<Blob>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size<1||file.size>8*1024*1024)throw Error('Photo unavailable');
 let retired=false,bitmap:ImageBitmap|null=null,canvas:HTMLCanvasElement|null=null;
 const releaseBitmap=()=>{const current=bitmap;bitmap=null;current?.close();};
 let timer:ReturnType<typeof setTimeout>|undefined;
 const deadline=new Promise<never>((_resolve,reject)=>{timer=setTimeout(()=>{retired=true;reject(Error('Photo unavailable'));},8000);});
 const work=(async()=>{
  const header=new Uint8Array(await file.slice(0,65536).arrayBuffer());
  if(retired||!imageDimensions(header,file.type))throw Error('Photo unavailable');
  bitmap=await createImageBitmap(file);
  if(retired||bitmap.width<1||bitmap.height<1||bitmap.width*bitmap.height>MAX_PIXELS){releaseBitmap();throw Error('Photo unavailable');}
  const scale=Math.min(1,1280/bitmap.width,1280/bitmap.height);canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const context=canvas.getContext('2d');if(!context)throw Error('Photo unavailable');context.drawImage(bitmap,0,0,canvas.width,canvas.height);releaseBitmap();
  return await new Promise<Blob>((resolve,reject)=>canvas!.toBlob(blob=>!retired&&blob?.type==='image/webp'&&blob.size<=8*1024*1024?resolve(blob):reject(Error('Photo unavailable')),'image/webp',0.85));
 })();
 try{return await Promise.race([work,deadline]);}
 finally{retired=true;if(timer!==undefined)clearTimeout(timer);releaseBitmap();if(canvas){(canvas as HTMLCanvasElement).width=0;(canvas as HTMLCanvasElement).height=0;}}
}
