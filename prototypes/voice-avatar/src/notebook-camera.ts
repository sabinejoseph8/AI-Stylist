/** Camera only, local preview. Stop also invalidates an outstanding permission request. */
export class NotebookCamera {
  private epoch=0;
  private stream:MediaStream|null=null;
  private pending=false;
  private acquire:(constraints:MediaStreamConstraints)=>Promise<MediaStream>;
  constructor(acquire:(constraints:MediaStreamConstraints)=>Promise<MediaStream>){this.acquire=acquire;}
  async start():Promise<MediaStream|null>{
    if(this.stream||this.pending)throw Error('Camera is already starting or active.');
    const epoch=++this.epoch;this.pending=true;
    try{
      const stream=await this.acquire({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});
      if(epoch!==this.epoch){stream.getTracks().forEach(t=>t.stop());return null;}
      if(!stream.getVideoTracks().length || stream.getAudioTracks().length){stream.getTracks().forEach(t=>t.stop());throw Error('A camera-only stream is required.');}
      this.stream=stream;return stream;
    }catch(error){if(epoch!==this.epoch)return null;throw error;}finally{if(epoch===this.epoch)this.pending=false;}
  }
  stop(){this.epoch++;this.pending=false;this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;}
}
