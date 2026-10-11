import sharp from 'sharp';

const MAX_REQUEST_BYTES=14*1024*1024;
const MAX_OUTPUT_BYTES=10*1024*1024;
sharp.cache(false);
sharp.concurrency(1);
let input='';
try{
 for await(const part of process.stdin){
  input+=part.toString('utf8');
  if(input.length>MAX_REQUEST_BYTES)throw Error('Image unavailable');
 }
 const message=JSON.parse(input);
 if(!['jpeg','png','webp'].includes(message.format)||typeof message.bytes!=='string')throw Error('Image unavailable');
 const bytes=Buffer.from(message.bytes,'base64');
 if(bytes.length<12||bytes.length>MAX_OUTPUT_BYTES)throw Error('Image unavailable');
 const decoder=sharp(bytes,{failOn:'warning',limitInputPixels:16_000_000,animated:false});
 const meta=await decoder.metadata();
 if(meta.format!==message.format||!meta.width||!meta.height||meta.width>8192||meta.height>8192||
  meta.width*meta.height>16_000_000||(meta.pages??1)!==1)throw Error('Image unavailable');
 const {data,info}=await decoder.rotate().webp({quality:90}).timeout({seconds:5}).toBuffer({resolveWithObject:true});
 if(data.length>MAX_OUTPUT_BYTES||info.width>8192||info.height>8192||info.width*info.height>16_000_000)throw Error('Image unavailable');
 process.stdout.write(JSON.stringify({bytes:data.toString('base64'),width:info.width,height:info.height}));
}catch{
 process.exitCode=1;
}
