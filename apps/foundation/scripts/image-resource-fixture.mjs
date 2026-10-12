import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import sharp from 'sharp';
import {sanitizeImage,decodeInChild} from './sanitize-image.ts';
const mode=process.argv[2];
if(mode==='limits'){
 assert.equal(process.getuid(),65534);
 assert.equal(sharp.versions.sharp,'0.35.5');
 assert.equal(readFileSync('/sys/fs/cgroup/memory.max','utf8').trim(),'402653184');
 assert.equal(readFileSync('/sys/fs/cgroup/memory.swap.max','utf8').trim(),'0');
 assert.equal(readFileSync('/sys/fs/cgroup/cpu.max','utf8').trim(),'50000 100000');
 assert.equal(readFileSync('/sys/fs/cgroup/pids.max','utf8').trim(),'64');
 assert.throws(()=>writeFileSync('/work/forbidden','x'));
 console.log('Kernel cgroup limits, pinned decoder, non-root identity and read-only source verified');
}else if(mode==='normal'){
 for(const [format,width,height] of [['png',10,20],['jpeg',3000,2000],['webp',4000,4000]]){
  const input=await sharp({create:{width,height,channels:3,background:'#157568'}}).toFormat(format).toBuffer();
  const result=await sanitizeImage(input,`image/${format}`);
  assert.equal(result.width,width);assert.equal(result.height,height);
  assert.equal((await sharp(result.bytes).metadata()).format,'webp');
 }
 console.log('Actual application decoder accepts PNG/JPEG/WebP through the 16MP boundary');
}else if(mode==='invalid'){
 await assert.rejects(sanitizeImage(Buffer.from([255,216,255,...Array(50).fill(0)]),'image/jpeg'));
 const image=await sharp({create:{width:8193,height:1,channels:3,background:'white'}}).png().toBuffer();
 await assert.rejects(sanitizeImage(image,'image/png'));
 console.log('Corrupt and oversized-dimension image inputs refused under kernel limits');
}else if(mode==='hang'){
 const start=performance.now();
 await assert.rejects(decodeInChild(Buffer.from('test'),'png','/work/hang.mjs',100));
 assert.ok(performance.now()-start<2000);
 console.log('Application parent deadline kills and reaps the hung decoder');
}else if(mode==='cpu'){
 const read=()=>Object.fromEntries(readFileSync('/sys/fs/cgroup/cpu.stat','utf8').trim().split('\n').map(s=>s.split(' ').map((v,i)=>i?Number(v):v)));
 const before=read();const started=performance.now();
 while(performance.now()-started<2000){Math.sqrt(Math.random());}
 const after=read();
 assert.ok(after.nr_throttled>before.nr_throttled);
 assert.ok(after.usage_usec-before.usage_usec<1_500_000);
 console.log('CPU quota causes observed kernel throttling of sustained work');
}else if(mode==='oom'){
 const retained=[];
 for(;;)retained.push(Buffer.alloc(1024*1024,0x7f));
}else{throw Error('Unknown resource scenario');}
