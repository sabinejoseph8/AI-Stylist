/** Encode one explicitly selected frame. The owner decides whether its result is
 * still current; this helper never requests media or stores/uploads an image. */
export function captureNotebookStill(options:{video:HTMLVideoElement;createCanvas:()=>HTMLCanvasElement;current:()=>boolean;completed:(blob:Blob)=>void;failed:()=>void}){
 let settled=false;
 const fail=()=>{if(settled)return;settled=true;if(options.current())options.failed();};
 try{
  const {video}=options;
  if(!Number.isSafeInteger(video.videoWidth)||!Number.isSafeInteger(video.videoHeight)||video.videoWidth<1||video.videoHeight<1||video.videoWidth*video.videoHeight>24_000_000){fail();return;}
  const canvas=options.createCanvas(),scale=Math.min(1,1280/video.videoWidth,1280/video.videoHeight);
  canvas.width=Math.max(1,Math.round(video.videoWidth*scale));canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
  const context=canvas.getContext('2d');if(!context){fail();return;}
  context.drawImage(video,0,0,canvas.width,canvas.height);
  canvas.toBlob(blob=>{
   if(settled)return;
   if(!blob||blob.type!=='image/jpeg'||blob.size===0||blob.size>8*1024*1024){fail();return;}
   settled=true;if(options.current())options.completed(blob);
  },'image/jpeg',0.85);
 }catch{fail();}
}
