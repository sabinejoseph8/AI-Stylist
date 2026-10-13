import {it,expect,vi} from 'vitest';
import {prepareServerNoteHttpAdapter} from './server-note-http-adapter.ts';
import {NOTE_EXTRACTION_ENDPOINT as endpoint} from './note-extraction-transport.ts';
import {NOTE_TOKEN_COUNT_ENDPOINT as counter} from './note-token-count-transport.ts';
const key='synthetic_key_never_real';
const init=()=>({method:'POST',body:'{}',signal:new AbortController().signal});
it('construction is dormant and exposes no key field',()=>{const request=vi.fn();const a=prepareServerNoteHttpAdapter({apiKey:key,request});expect(request).not.toHaveBeenCalled();expect(JSON.stringify(a)).not.toContain(key);});
for(const url of [endpoint,counter])it('authenticates only fixed endpoint '+url,async()=>{
 const request=vi.fn(async(_u:string,_i:RequestInit)=>new Response('{}'));const a=prepareServerNoteHttpAdapter({apiKey:key,request});
 await a.fetch(url,{...init(),headers:{Authorization:'evil',Cookie:'private'},redirect:'follow',credentials:'include'});
 const [destination,options]=request.mock.calls[0]!;expect(destination).toBe(url);expect(options.headers).toEqual({'Content-Type':'application/json',Authorization:`Bearer ${key}`});expect(options.redirect).toBe('error');expect(options.credentials).toBe('omit');expect(options.body).toBe('{}');
});
for(const url of ['https://example.test',endpoint+'?x=1',endpoint.replace('https:','http:')])it('rejects alternate destination '+url,async()=>{const request=vi.fn();const a=prepareServerNoteHttpAdapter({apiKey:key,request});await expect(a.fetch(url,init())).rejects.toThrow('unavailable');expect(request).not.toHaveBeenCalled();});
it('end aborts pending work and permanently prevents reuse',async()=>{
 let signal:AbortSignal|undefined;let reject!:(e:Error)=>void;const request=vi.fn((_u:string,i:RequestInit)=>{signal=i.signal!;return new Promise<Response>((_r,j)=>reject=j);});
 const a=prepareServerNoteHttpAdapter({apiKey:key,request});const pending=a.fetch(endpoint,init());a.end();expect(signal?.aborted).toBe(true);reject(Error(key));await expect(pending).rejects.toThrow('Notebook provider request unavailable.');await expect(a.fetch(endpoint,init())).rejects.toThrow('unavailable');expect(request).toHaveBeenCalledOnce();
});
it('upstream abort rejects a late response',async()=>{
 let release!:(r:Response)=>void;let signal:AbortSignal|undefined;const a=prepareServerNoteHttpAdapter({apiKey:key,request:async(_u,i)=>{signal=i.signal!;return new Promise(r=>release=r);}});
 const c=new AbortController();const pending=a.fetch(endpoint,{...init(),signal:c.signal});c.abort();expect(signal?.aborted).toBe(true);release(new Response('{}'));await expect(pending).rejects.toThrow('unavailable');
});
it('rejects malformed credentials before network work',()=>{const request=vi.fn();for(const apiKey of ['',key+'\n','Bearer '+key])expect(()=>prepareServerNoteHttpAdapter({apiKey,request})).toThrow('unavailable');expect(request).not.toHaveBeenCalled();});
