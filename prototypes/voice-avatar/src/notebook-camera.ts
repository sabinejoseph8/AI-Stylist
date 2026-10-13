function releaseCameraTracks(stream:MediaStream){
  for(const track of stream.getTracks()){try{track.stop();}catch{}}
}
/** Camera only, local preview. Stop also invalidates an outstanding permission request. */
export class NotebookCamera {
  private epoch=0;
  private stream:MediaStream|null=null;
  private pending=false;
  private detach:(()=>void)[]=[];
  get busy(){return this.pending||this.stream!==null;}
  private acquire:(constraints:MediaStreamConstraints)=>Promise<MediaStream>;
  constructor(acquire:(constraints:MediaStreamConstraints)=>Promise<MediaStream>){this.acquire=acquire;}
  async start():Promise<MediaStream|null>{
    if(this.stream||this.pending)throw Error('Camera is already starting or active.');
    const epoch=++this.epoch;this.pending=true;
    try{
      const stream=await this.acquire({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});
      if(epoch!==this.epoch){releaseCameraTracks(stream);return null;}
      if(!stream.getVideoTracks().length || stream.getAudioTracks().length){releaseCameraTracks(stream);throw Error('A camera-only stream is required.');}
      this.stream=stream;return stream;
    }catch(error){if(epoch!==this.epoch)return null;throw error;}finally{if(epoch===this.epoch)this.pending=false;}
  }
  /** Bind video playback and device callbacks to the stream that acquired them. */
  async preview(options:{attached:(stream:MediaStream)=>Promise<void>;ready:()=>void;failed:()=>void;disconnected:()=>void}):Promise<void>{
    if(this.busy)return;
    const epoch=this.epoch+1;
    try{
      const stream=await this.start();if(!stream||epoch!==this.epoch)return;
      const current=()=>epoch===this.epoch&&this.stream===stream;
      const ended=()=>{if(current())options.disconnected();};
      for(const track of stream.getVideoTracks()){
        track.addEventListener('ended',ended,{once:true});
        this.detach.push(()=>track.removeEventListener('ended',ended));
      }
      if(stream.getVideoTracks().some(track=>track.readyState==='ended')){ended();return;}
      await options.attached(stream);
      if(current())options.ready();
    }catch{if(epoch===this.epoch)options.failed();}
  }
  stop(){
    this.epoch++;this.pending=false;
    const stream=this.stream;this.stream=null;
    for(const detach of this.detach.splice(0)){try{detach();}catch{}}
    // A broken device must not prevent release of the remaining tracks.
    for(const track of stream?.getTracks()??[]){try{track.stop();}catch{}}
  }
}
