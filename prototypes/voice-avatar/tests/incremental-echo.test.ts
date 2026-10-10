import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IncrementalEcho } from '../src/incremental-echo.ts';
const frame=(sequence:number)=>({responseId:'response',itemId:'item',sequence,pcm:new Uint8Array(960)});
beforeEach(()=>vi.useFakeTimers({toFake:['setTimeout','clearTimeout','performance']}));afterEach(()=>vi.useRealTimers());
function fixture(){const send=vi.fn().mockReturnValue(true),notify=vi.fn();const echo=new IncrementalEcho('room',send,notify);return {echo,send,notify,epoch:echo.begin()};}
describe('incremental Echo pacing with synthetic audio only',()=>{
  it('starts before generation finishes and sends completion separately from playback',()=>{
    const {echo,send,notify,epoch}=fixture();expect(echo.accept(epoch,frame(0))).toBe(true);expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0]![0].properties.done).toBe(false);expect(echo.accept(epoch,frame(1))).toBe(true);
    expect(echo.finish(epoch)).toBe(true);vi.advanceTimersByTime(40);
    expect(send.mock.calls.map(c=>c[0].properties.done)).toEqual([false,false,true]);expect(notify).toHaveBeenCalledWith('sent');expect(echo.snapshot().active).toBe(false);
  });
  it('still interrupts after all chunks are sent and requires stop before reuse',()=>{
    const {echo,send,epoch}=fixture();echo.accept(epoch,frame(0));echo.finish(epoch);vi.advanceTimersByTime(20);
    expect(()=>echo.begin()).toThrow('Stop');echo.stop();expect(send.mock.calls.at(-1)![0].event_type).toBe('conversation.interrupt');
    const count=send.mock.calls.length;echo.stop();expect(send).toHaveBeenCalledTimes(count);expect(()=>echo.begin()).not.toThrow();
  });
  it('copies accepted frames and keeps messages below 4 KB',()=>{
    const {echo,send,epoch}=fixture();echo.accept(epoch,frame(0));const pending=frame(1);echo.accept(epoch,pending);pending.pcm.fill(255);echo.finish(epoch);vi.advanceTimersByTime(40);
    expect(send.mock.calls[1]![0].properties.audio).toBe(Buffer.alloc(960).toString('base64'));
    expect(send.mock.calls.every(c=>new TextEncoder().encode(JSON.stringify(c[0])).length<4096)).toBe(true);
  });
  it('bounds queued output at one second and refuses further generation',()=>{
    const {echo,notify,epoch}=fixture();for(let i=0;i<51;i++)expect(echo.accept(epoch,frame(i))).toBe(true);
    expect(echo.snapshot().queued).toBe(50);expect(echo.accept(epoch,frame(51))).toBe(false);expect(echo.snapshot()).toMatchObject({active:false,queued:0});expect(notify).toHaveBeenCalledWith('held');
  });
  it('rejects duplicate, out-of-order and changed response frames',()=>{
    for(const bad of [frame(0),frame(2),{...frame(1),itemId:'old'},{...frame(1),responseId:'old'}]){
      const {echo,epoch}=fixture();echo.accept(epoch,frame(0));expect(echo.accept(epoch,bad)).toBe(false);expect(echo.snapshot().active).toBe(false);
    }
  });
  it('cancels pending output and ignores old generation callbacks after replacement',()=>{
    const {echo,send,epoch}=fixture();echo.accept(epoch,frame(0));echo.accept(epoch,frame(1));echo.stop();const current=echo.begin();
    expect(echo.accept(epoch,frame(2))).toBe(false);expect(echo.finish(epoch)).toBe(false);
    echo.accept(current,{...frame(0),responseId:'new'});const count=send.mock.calls.length;vi.advanceTimersByTime(100);expect(send).toHaveBeenCalledTimes(count);
  });
  it('holds when downstream transport refuses, without retry',()=>{
    const {echo,send,notify,epoch}=fixture();send.mockReturnValue(false);expect(echo.accept(epoch,frame(0))).toBe(false);
    vi.advanceTimersByTime(100);expect(send.mock.calls.filter(c=>c[0].event_type==='conversation.echo')).toHaveLength(1);expect(notify).toHaveBeenCalledWith('held');
  });
  it('does not emit completion for empty or canceled generation',()=>{
    const {echo,send,epoch}=fixture();expect(echo.finish(epoch)).toBe(false);expect(send).not.toHaveBeenCalled();
  });
  it('holds after a scheduling stall rather than sending a catch-up burst',()=>{
    const {echo,send,notify,epoch}=fixture();echo.accept(epoch,frame(0));echo.accept(epoch,frame(1));
    vi.spyOn(performance,'now').mockReturnValue(1000);vi.advanceTimersByTime(20);
    expect(send.mock.calls.filter(c=>c[0].event_type==='conversation.echo')).toHaveLength(1);expect(notify).toHaveBeenCalledWith('held');vi.restoreAllMocks();
  });
});
