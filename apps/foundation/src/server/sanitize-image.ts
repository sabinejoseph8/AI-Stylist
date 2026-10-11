import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const MAX_BYTES=10*1024*1024;
const MAX_REPLY_BYTES=14*1024*1024;
const DEADLINE_MS=7000;
let active=false;

function imageFormat(bytes:Buffer){
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'png';
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'jpeg';
 if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')return 'webp';
 return null;
}

/** Local preparation. The host still needs an OS memory/CPU limit before customer uploads. */
export async function sanitizeImage(input:Uint8Array,contentType:string){
 if(active)throw Error('Image processing busy');
 if(!(input instanceof Uint8Array)||input.byteLength<12||input.byteLength>MAX_BYTES)throw Error('Image unavailable');
 const bytes=Buffer.from(input);
 const format=imageFormat(bytes);
 if(!format||contentType!==`image/${format}`)throw Error('Image unavailable');
 active=true;
 try{
  const raw=await decodeInChild(bytes,format);
  const parsed=JSON.parse(raw) as {bytes?:unknown;width?:unknown;height?:unknown};
  if(typeof parsed.bytes!=='string'||typeof parsed.width!=='number'||typeof parsed.height!=='number'||
   !Number.isInteger(parsed.width)||!Number.isInteger(parsed.height)||parsed.width<1||parsed.height<1||
   parsed.width>8192||parsed.height>8192||parsed.width*parsed.height>16_000_000)throw Error('Image unavailable');
  const output=Buffer.from(parsed.bytes,'base64');
  if(output.length<12||output.length>MAX_BYTES||output.toString('ascii',0,4)!=='RIFF'||
   output.toString('ascii',8,12)!=='WEBP')throw Error('Image unavailable');
  return Object.freeze({bytes:output,contentType:'image/webp' as const,width:parsed.width,height:parsed.height,
   checksum:createHash('sha256').update(output).digest('hex')});
 }catch{throw Error('Image unavailable');}finally{active=false;}
}

export function decodeInChild(bytes:Buffer,format:string,
 workerFile=fileURLToPath(new URL('./image-decoder-worker.mjs',import.meta.url)),deadlineMs=DEADLINE_MS):Promise<string>{
 return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['--max-old-space-size=128',workerFile],
   {stdio:['pipe','pipe','ignore'],env:{PATH:process.env.PATH??'',NODE_ENV:'production'}});
  let reply='';let failed=false;let closed=false;
  const timer=setTimeout(()=>{failed=true;child.kill('SIGKILL');},deadlineMs);
  timer.unref();
  child.stdout.setEncoding('utf8');
  child.stdout.on('data',(chunk:string)=>{
   if(reply.length+chunk.length>MAX_REPLY_BYTES){failed=true;child.kill('SIGKILL');return;}
   reply+=chunk;
  });
  child.on('error',()=>{failed=true;child.kill('SIGKILL');});
  child.on('close',(code)=>{
   if(closed)return;
   closed=true;clearTimeout(timer);
   if(failed||code!==0)return reject(Error('Image unavailable'));
   resolve(reply);
  });
  child.stdin.on('error',()=>{failed=true;child.kill('SIGKILL');});
  child.stdin.end(JSON.stringify({format,bytes:bytes.toString('base64')}));
 });
}
