import {EventEmitter} from 'node:events';
import {it,expect,vi} from 'vitest';
import {prepareServerNoteSocketOpener,NOTE_TRANSCRIPTION_SOCKET_URL} from './server-note-socket-opener.ts';
class Fake extends EventEmitter{readyState=0;bufferedAmount=0;send=vi.fn();close=vi.fn();terminate=vi.fn();}
function setup(){const raw=new Fake();const connect=vi.fn(()=>raw);const owner=prepareServerNoteSocketOpener({apiKey:'synthetic_key_never_real',connect:connect as never});return{raw,connect,owner};}
it('constructor does not connect and open fixes URL and transport options',async()=>{
 const {raw,connect,owner}=setup();expect(connect).not.toHaveBeenCalled();const pending=owner.open(new AbortController().signal,()=>{});
 expect(connect).toHaveBeenCalledWith(NOTE_TRANSCRIPTION_SOCKET_URL,expect.objectContaining({followRedirects:false,maxPayload:16384,handshakeTimeout:5000,perMessageDeflate:false}));raw.readyState=1;raw.emit('open');await pending;owner.end();
});
it('captures first packet before the opening promise is consumed, then forwards later packets',async()=>{
 const {raw,owner}=setup();const initial=vi.fn();const pending=owner.open(new AbortController().signal,initial);raw.readyState=1;raw.emit('open');raw.emit('message',Buffer.from('{"type":"session.created"}'),false);
 expect(initial).toHaveBeenCalledWith({type:'session.created'});const opened=await pending;const receive=vi.fn();opened.socket.addEventListener('message',receive);opened.detachInitialEvents();raw.emit('message',Buffer.from('{"type":"session.updated"}'),false);expect(receive).toHaveBeenCalledOnce();expect(initial).toHaveBeenCalledOnce();owner.end();
});
it('aborts opening and refuses every subsequent connection',async()=>{
 const {raw,owner,connect}=setup();const c=new AbortController();const pending=owner.open(c.signal,()=>{});c.abort();await expect(pending).rejects.toThrow('unavailable');expect(raw.terminate).toHaveBeenCalledOnce();await expect(owner.open(new AbortController().signal,()=>{})).rejects.toThrow('unavailable');expect(connect).toHaveBeenCalledOnce();
});
it('pre-aborted input never constructs a socket',async()=>{const {owner,connect}=setup();const c=new AbortController();c.abort();await expect(owner.open(c.signal,()=>{})).rejects.toThrow('unavailable');expect(connect).not.toHaveBeenCalled();});
for(const [payload,binary] of [[Buffer.from('not json'),false],[Buffer.alloc(16385),false],[Buffer.from('{}'),true]] as const)it('rejects invalid initial media and terminates',async()=>{
 const {owner,raw}=setup();const initial=vi.fn();const pending=owner.open(new AbortController().signal,initial);raw.readyState=1;raw.emit('open');await pending;raw.emit('message',payload,binary);expect(raw.terminate).toHaveBeenCalledOnce();expect(initial).not.toHaveBeenCalled();owner.end();
});
it('provider errors are sanitized and do not leak their contents',async()=>{const {raw,owner}=setup();const pending=owner.open(new AbortController().signal,()=>{});raw.emit('error',Error('private provider details'));await expect(pending).rejects.toThrow('Notebook transcription connection unavailable.');});

it('reports failed termination to the cleanup owner',async()=>{const {raw,owner}=setup();const pending=owner.open(new AbortController().signal,()=>{});raw.readyState=1;raw.emit('open');const {socket}=await pending;raw.terminate.mockImplementation(()=>{throw Error('private detail');});expect(()=>socket.close()).toThrow('Notebook transcription connection unavailable.');expect(socket.readyState).toBe(3);});

it('reports only fixed handshake status and terminates without reading response content',async()=>{
 const raw=new Fake(),diagnostic=vi.fn(),destroy=vi.fn();const owner=prepareServerNoteSocketOpener({apiKey:'synthetic_key_never_real',connect:()=>raw as never,diagnostic});const pending=owner.open(new AbortController().signal,()=>{});
 raw.emit('unexpected-response',{authorization:'private sentinel'},{statusCode:401,body:'private sentinel',destroy});await expect(pending).rejects.toThrow('unavailable');
 expect(diagnostic.mock.calls.map(([v])=>v)).toEqual(['provider-connecting','provider-handshake-401']);expect(destroy).toHaveBeenCalledOnce();expect(raw.terminate).toHaveBeenCalledOnce();expect(JSON.stringify(diagnostic.mock.calls)).not.toContain('sentinel');
});
it('reports redacted initial provider error category without logging its payload',async()=>{
 const raw=new Fake(),diagnostic=vi.fn(),initial=vi.fn();const owner=prepareServerNoteSocketOpener({apiKey:'synthetic_key_never_real',connect:()=>raw as never,diagnostic});const pending=owner.open(new AbortController().signal,initial);raw.readyState=1;raw.emit('open');await pending;
 raw.emit('message',Buffer.from(JSON.stringify({type:'error',error:{type:'invalid_request_error',message:'private sentinel'}})),false);
 expect(diagnostic.mock.calls.map(([v])=>v)).toEqual(['provider-connecting','provider-open','provider-error-invalid-request','provider-param-missing','provider-first-unexpected']);expect(JSON.stringify(diagnostic.mock.calls)).not.toContain('sentinel');owner.end();
});

it('classifies an actual local HTTP handshake rejection without retaining its body',async()=>{
 const {createServer}=await import('node:http');const {default:WebSocket}=await import('ws');const server=createServer((_req,res)=>{res.writeHead(401,{'Content-Type':'application/json'});res.end('{"private":"sentinel"}');});await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();if(!address||typeof address==='string')throw Error('address');
 const diagnostic=vi.fn(),owner=prepareServerNoteSocketOpener({apiKey:'synthetic_key_never_real',diagnostic,connect:(_url,options)=>new WebSocket(`ws://127.0.0.1:${address.port}`,options)});
 try{await expect(owner.open(new AbortController().signal,()=>{})).rejects.toThrow('unavailable');expect(diagnostic.mock.calls.map(([code])=>code)).toEqual(['provider-connecting','provider-handshake-401']);expect(JSON.stringify(diagnostic.mock.calls)).not.toContain('sentinel');}finally{owner.end();server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});

it('emits exact allowlisted error details while excluding the raw payload',async()=>{
 const raw=new Fake(),diagnostic=vi.fn(),owner=prepareServerNoteSocketOpener({apiKey:'synthetic_key_never_real',connect:()=>raw as never,diagnostic});
 const pending=owner.open(new AbortController().signal,()=>{});raw.readyState=1;raw.emit('open');await pending;
 raw.emit('message',Buffer.from(JSON.stringify({type:'error',error:{type:'invalid_request_error',code:'invalid_value',param:'session.type',message:'private sentinel',event_id:'private sentinel'}})),false);
 expect(diagnostic.mock.calls.map(([code])=>code)).toEqual(['provider-connecting','provider-open','provider-error-invalid-request','provider-code-invalid-value','provider-param-session-type','provider-first-unexpected']);expect(JSON.stringify(diagnostic.mock.calls)).not.toContain('sentinel');owner.end();
});
