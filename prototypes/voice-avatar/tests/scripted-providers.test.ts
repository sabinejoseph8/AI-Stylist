import { afterEach, describe, expect, it, vi } from 'vitest';
import { tavus, MAX_TAVUS_RESPONSE_BYTES } from '../src/scripted-providers.ts';
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
describe('Tavus HTTP response contract, mocked HTTP only',()=>{
  it('accepts the documented empty 200 end response',async()=>{
    const request=vi.fn().mockResolvedValue(new Response(null,{status:200})); vi.stubGlobal('fetch',request);
    await expect(tavus('fixture-key','/v2/conversations/fixture-room/end',{})).resolves.toEqual({});
    expect(request).toHaveBeenCalledWith('https://tavusapi.com/v2/conversations/fixture-room/end',expect.objectContaining({redirect:'error'}));
  });
  it('requires JSON on room creation and lookup',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(null,{status:200})));
    await expect(tavus('fixture-key','/v2/conversations',{})).rejects.toThrow();
  });
  it('does not expose a provider error body',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('private provider body',{status:401})));
    await expect(tavus('fixture-key','/v2/pals/pipecat0')).rejects.toThrow('HTTP 401');
  });
  it('rejects arbitrary outbound destinations before sending the key',async()=>{
    const request=vi.fn(); vi.stubGlobal('fetch',request);
    await expect(tavus('fixture-key','https://unrelated.example')).rejects.toThrow('refused'); expect(request).not.toHaveBeenCalled();
  });
});

describe('bounded Tavus body and deadline, mocked HTTP only',()=>{
  it('accepts a streamed object within the bound and preserves the method',async()=>{
    const request=vi.fn().mockResolvedValue(new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('{"status":'));c.enqueue(new TextEncoder().encode('"ended"}'));c.close();}})));vi.stubGlobal('fetch',request);
    await expect(tavus('fixture-key','/v2/conversations/fixture-room')).resolves.toEqual({status:'ended'});expect(request).toHaveBeenCalledWith(expect.any(String),expect.objectContaining({method:'GET',redirect:'error'}));
  });
  it('refuses oversized declared bodies before reading and cancels them',async()=>{
    const canceled=vi.fn(),response=new Response(new ReadableStream({cancel:canceled}),{headers:{'content-length':String(MAX_TAVUS_RESPONSE_BYTES+1)}});vi.stubGlobal('fetch',vi.fn().mockResolvedValue(response));
    await expect(tavus('fixture-key','/v2/pals/pipecat0')).rejects.toThrow('unavailable');expect(canceled).toHaveBeenCalledOnce();
  });
  it('enforces bytes on a chunked body without trusting content-length',async()=>{
    const canceled=vi.fn();vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(MAX_TAVUS_RESPONSE_BYTES));c.enqueue(new Uint8Array(1));},cancel:canceled}))));
    await expect(tavus('fixture-key','/v2/pals/pipecat0')).rejects.toThrow('unavailable');expect(canceled).toHaveBeenCalledOnce();
  });
  it.each(['null','[]','"private"','42','{"secret":"private"',''])('refuses invalid/non-object JSON without exposing the body',async body=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(body)));await expect(tavus('fixture-key','/v2/pals/pipecat0')).rejects.toThrow(/^Tavus response unavailable\.$/);
  });
  it('refuses invalid UTF-8 instead of silently replacing bytes',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(new Uint8Array([123,34,120,34,58,34,255,34,125]))));await expect(tavus('fixture-key','/v2/pals/pipecat0')).rejects.toThrow('unavailable');
  });
  it('bounds stalled body reads even if cancellation never settles',async()=>{
    vi.useFakeTimers();const canceled=vi.fn(()=>new Promise<void>(()=>{}));vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(new ReadableStream({cancel:canceled}))));
    const result=tavus('fixture-key','/v2/pals/pipecat0');const assertion=expect(result).rejects.toThrow('unavailable');await vi.advanceTimersByTimeAsync(8000);await assertion;expect(canceled).toHaveBeenCalledOnce();
  });
  it('uses one deadline across headers and body',async()=>{
    vi.useFakeTimers();let resolve!:(response:Response)=>void;const request=vi.fn(()=>new Promise<Response>(r=>resolve=r));vi.stubGlobal('fetch',request);
    const result=tavus('fixture-key','/v2/pals/pipecat0');const assertion=expect(result).rejects.toThrow('unavailable');await vi.advanceTimersByTimeAsync(7000);resolve(new Response(new ReadableStream()));await vi.advanceTimersByTimeAsync(1000);await assertion;
  });
  it('cancels late response bodies after an uncooperative fetch times out',async()=>{
    vi.useFakeTimers();let resolve!:(response:Response)=>void;vi.stubGlobal('fetch',vi.fn(()=>new Promise<Response>(r=>resolve=r)));const result=tavus('fixture-key','/v2/pals/pipecat0');const assertion=expect(result).rejects.toThrow('unavailable');await vi.advanceTimersByTimeAsync(8000);await assertion;
    const canceled=vi.fn();resolve(new Response(new ReadableStream({cancel:canceled})));await Promise.resolve();await Promise.resolve();expect(canceled).toHaveBeenCalledOnce();
  });
  it('does not block an empty end acknowledgment on stalled body cancellation',async()=>{
    const canceled=vi.fn(()=>new Promise<void>(()=>{}));vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(new ReadableStream({cancel:canceled}))));await expect(tavus('fixture-key','/v2/conversations/fixture-room/end',{})).resolves.toEqual({});expect(canceled).toHaveBeenCalledOnce();
  });
  it('redacts transport and stream failures',async()=>{
    for(const request of [vi.fn().mockRejectedValue(Error('private-key')),vi.fn().mockResolvedValue(new Response(new ReadableStream({start(c){c.error(Error('private-body'));}})))]){vi.stubGlobal('fetch',request);await expect(tavus('fixture-key','/v2/pals/pipecat0')).rejects.toThrow(/^Tavus response unavailable\.$/);}
  });
});
