type MediaTarget={srcObject:unknown;play:()=>Promise<void>};
/** Daily can announce the same track through multiple events. Reassigning its
 * stream aborts an outstanding play() in browsers; stale rejections must not
 * end a newer presentation. This owns presentation only, never provider media. */
export function createProbeMediaPresenter(options:{stream:(track:MediaStreamTrack)=>unknown;active:()=>boolean;failure:(kind:'audio'|'video')=>void}){
 const shown=new Map<MediaTarget,{track:MediaStreamTrack;stream:unknown}>();
 return{
  present(element:MediaTarget,track:MediaStreamTrack,kind:'audio'|'video'){
   if(!options.active())return;
   const prior=shown.get(element);
   if(prior?.track===track&&element.srcObject===prior.stream)return;
   const current={track,stream:options.stream(track)};shown.set(element,current);element.srcObject=current.stream;
   try{void element.play().catch(()=>{if(options.active()&&shown.get(element)===current&&element.srcObject===current.stream)options.failure(kind);});}
   catch{if(options.active()&&shown.get(element)===current)options.failure(kind);}
  },
  clear(){shown.clear();},
 };
}
