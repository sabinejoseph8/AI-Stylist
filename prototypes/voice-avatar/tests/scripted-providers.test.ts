import { afterEach, describe, expect, it, vi } from 'vitest';
import { tavus } from '../src/scripted-providers.ts';
afterEach(()=>vi.unstubAllGlobals());
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
