import {afterEach,expect,it,vi} from 'vitest';
import {EchoStream} from '../src/echo-stream.ts';
import {IncrementalEcho} from '../src/incremental-echo.ts';
afterEach(()=>vi.useRealTimers());
it('buffered output refuses an interrupted inference without sending more audio',()=>{
 vi.useFakeTimers();const send=vi.fn();const stream=new EchoStream({conversationId:'room',inferenceId:'',pcm:''},send,()=>{});
 stream.play(new Uint8Array(960),'old');stream.interrupt();const count=send.mock.calls.length;
 expect(()=>stream.play(new Uint8Array(960),'old')).toThrow('fresh');expect(send).toHaveBeenCalledTimes(count);
 stream.play(new Uint8Array(960),'new');expect(send.mock.calls.at(-1)![0].properties.inference_id).toBe('new');stream.interrupt();
});
it('incremental output refuses an old response in a fresh epoch and permits a new identity',()=>{
 vi.useFakeTimers();const send=vi.fn().mockReturnValue(true);const echo=new IncrementalEcho('room',send,()=>{});
 const frame=(responseId:string)=>({responseId,itemId:'item',sequence:0,pcm:new Uint8Array(960)});
 let epoch=echo.begin();expect(echo.accept(epoch,frame('old'))).toBe(true);echo.stop();const count=send.mock.calls.length;
 epoch=echo.begin();expect(echo.accept(epoch,frame('old'))).toBe(false);expect(send).toHaveBeenCalledTimes(count);
 epoch=echo.begin();expect(echo.accept(epoch,frame('new'))).toBe(true);echo.stop();
});
it('identity history is bounded without evicting canceled identities',()=>{
 vi.useFakeTimers();const send=vi.fn().mockReturnValue(true);const stream=new EchoStream({conversationId:'room',inferenceId:'',pcm:''},send,()=>{});const echo=new IncrementalEcho('room',send,()=>{});
 for(let i=0;i<64;i++){stream.play(new Uint8Array(2),String(i));stream.interrupt();const epoch=echo.begin();expect(echo.accept(epoch,{responseId:String(i),itemId:'item',sequence:0,pcm:new Uint8Array(2)})).toBe(true);echo.stop();}
 expect(()=>stream.play(new Uint8Array(2),'65')).toThrow('fresh');const epoch=echo.begin();expect(echo.accept(epoch,{responseId:'65',itemId:'item',sequence:0,pcm:new Uint8Array(2)})).toBe(false);
});
