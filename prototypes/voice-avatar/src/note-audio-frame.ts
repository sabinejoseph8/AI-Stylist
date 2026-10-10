/** Simulation protocol: magic/version NPC1, uint32 big-endian sequence, then
 * exactly 20 ms of mono PCM16 at 24 kHz. Contains no transcript or identity.
 * The authenticated owning socket supplies session authority separately. */
const MAGIC=0x4e504331;
export function encodeNoteAudio(pcm:ArrayBuffer,sequence:number):ArrayBuffer{
 if(!(pcm instanceof ArrayBuffer)||pcm.byteLength!==960||!Number.isSafeInteger(sequence)||sequence<0||sequence>=4250)throw Error('Notebook audio held.');
 const frame=new ArrayBuffer(968),view=new DataView(frame);view.setUint32(0,MAGIC);view.setUint32(4,sequence);new Uint8Array(frame,8).set(new Uint8Array(pcm));return frame;
}
export function decodeNoteAudio(frame:ArrayBuffer):{pcm:ArrayBuffer;sequence:number}{
 if(!(frame instanceof ArrayBuffer)||frame.byteLength!==968)throw Error('Notebook audio held.');
 const view=new DataView(frame),sequence=view.getUint32(4);
 if(view.getUint32(0)!==MAGIC||sequence>=4250)throw Error('Notebook audio held.');
 return{pcm:frame.slice(8),sequence};
}
