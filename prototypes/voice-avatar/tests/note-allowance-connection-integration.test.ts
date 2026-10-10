import {afterEach,describe,expect,it,vi} from 'vitest';
import {createServer} from 'node:http';
import {isDeepStrictEqual} from 'node:util';
import {WebSocket} from 'ws';
import {PreparedNoteAllowance} from '../src/prepared-note-allowance.ts';
import {createPreparedNotePersistenceTransport} from '../src/prepared-note-persistence-transport.ts';
import type {PreparedNoteLedger} from '../src/prepared-note-allowance.ts';
import {attachProtectedSimulatedNoteBridge} from '../src/protected-note-network-bridge.ts';
import {PreparedBrowserNoteSession} from '../src/note-browser-session.ts';
import {bindSimulatedNoteLifecycle} from '../src/note-browser-lifecycle.ts';
import {TRANSCRIPTION_MODEL} from '../src/live-transcription.ts';
const preview={origin:'https://fixture.onrender.com',password:'fixture_password_only_for_tests_123456'};
const headers={Host:'fixture.onrender.com',Origin:preview.origin,Authorization:'Basic '+Buffer.from('stylist:'+preview.password).toString('base64')};
const cleanups:(()=>Promise<void>)[]=[];
afterEach(async()=>{for(const cleanup of cleanups.splice(0).reverse())await cleanup();});
function persistence(){
 let saved:PreparedNoteLedger={version:1,purpose:'notes-only-simulation',approval:{id:'synthetic_only',attempts:2,centsPerAttempt:100,secondsPerAttempt:85},runs:[]};
 const read=vi.fn(async()=>structuredClone(saved));
 const compareAndSwap=vi.fn(async(expected:PreparedNoteLedger,next:PreparedNoteLedger)=>{if(!isDeepStrictEqual(saved,expected))return false;saved=structuredClone(next);return true;});
 return{read,compareAndSwap,snapshot:()=>structuredClone(saved)};
}
async function setup(store=persistence()){
 const providers:(EventTarget&{readyState:number;bufferedAmount:number;close:ReturnType<typeof vi.fn>;send:(value:string)=>void})[]=[];
 const rpcFetch=vi.fn(async(url:string,init:RequestInit)=>{
  if(url==='https://fixture.supabase.co/rest/v1/rpc/stylist_notebook_allowance_read')return Response.json(await store.read());
  if(url!=='https://fixture.supabase.co/rest/v1/rpc/stylist_notebook_allowance_change')throw Error('Unexpected fixture endpoint.');
  const {expected,replacement}=JSON.parse(init.body as string) as {expected:PreparedNoteLedger;replacement:PreparedNoteLedger};
  return Response.json(await store.compareAndSwap(expected,replacement));
 });
 const transport=createPreparedNotePersistenceTransport({simulation:true,url:'https://fixture.supabase.co',fetch:rpcFetch});
 const allowance=new PreparedNoteAllowance({simulation:true,persistence:transport});
 const createTransports=vi.fn(()=>{
  const socket=Object.assign(new EventTarget(),{readyState:1,bufferedAmount:0,close:vi.fn(),send:(value:string)=>{if(JSON.parse(value).type==='session.update')queueMicrotask(()=>socket.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:TRANSCRIPTION_MODEL},turn_detection:null}}}})})));}});
  providers.push(socket);return{socket,fetch:vi.fn(async()=>{throw Error('No extraction expected.');})};
 });
 const server=createServer((_req,res)=>res.end()),bridge=attachProtectedSimulatedNoteBridge(server,{simulation:true,preview,allowance,createTransports});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const address=server.address();if(!address||typeof address==='string')throw Error('No loopback');const url=`ws://127.0.0.1:${address.port}/api/notebook-simulation`;
 const clients:WebSocket[]=[],bindings:ReturnType<typeof bindSimulatedNoteLifecycle>[]=[];
 function connect(){
  const ws=new WebSocket(url,{headers});clients.push(ws);const socketEvents=new EventTarget(),page=new EventTarget(),visibility=Object.assign(new EventTarget(),{hidden:false}),capture={start:vi.fn(async()=>true),stop:vi.fn()};
  const session=new PreparedBrowserNoteSession({simulation:true,capture,socket:{send:v=>ws.send(v),close:()=>ws.close(),get bufferedAmount(){return ws.bufferedAmount;}},changed:vi.fn()});
  const binding=bindSimulatedNoteLifecycle({simulation:true,session,socket:socketEvents,page,visibility,status:vi.fn()});bindings.push(binding);
  ws.on('message',data=>socketEvents.dispatchEvent(new MessageEvent('message',{data:data.toString()})));ws.on('close',()=>socketEvents.dispatchEvent(new Event('close')));ws.on('error',()=>socketEvents.dispatchEvent(new Event('error')));
  return{ws,page,visibility,session,capture};
 }
 async function denied(){const ws=new WebSocket(url,{headers});clients.push(ws);ws.on('error',()=>{});return new Promise<number>(resolve=>ws.on('unexpected-response',(_req,res)=>{res.resume();resolve(res.statusCode!);ws.terminate();}));}
 cleanups.push(async()=>{for(const binding of bindings)binding.dispose();for(const ws of clients)ws.terminate();bridge.dispose();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));});
 return{store,allowance,providers,createTransports,bridge,connect,denied,rpcFetch};
}
describe('bounded persistence and separate allowance through protected browser lifecycle',()=>{
 it('retires a late successful reservation after page exit without opening a provider',async()=>{
  const store=persistence(),write=store.compareAndSwap.getMockImplementation()!;let release!:(value:boolean)=>void;
  store.compareAndSwap.mockImplementationOnce(async(a,b)=>{const result=await write(a,b);return new Promise<boolean>(resolve=>{release=()=>resolve(result);});});
  const s=await setup(store),client=s.connect();await vi.waitFor(()=>expect(store.snapshot().runs).toHaveLength(1));client.page.dispatchEvent(new Event('pagehide'));await vi.waitFor(()=>expect(client.ws.readyState).toBe(WebSocket.CLOSED));expect(await s.denied()).toBe(409);expect(s.createTransports).not.toHaveBeenCalled();
  release(true);await vi.waitFor(()=>expect(s.bridge.snapshot().active).toBe(false));expect(store.snapshot().runs[0]!.closed).toBe(true);expect(store.compareAndSwap).toHaveBeenCalledTimes(2);expect(s.rpcFetch).toHaveBeenCalledTimes(4);expect(s.createTransports).not.toHaveBeenCalled();expect(client.session.snapshot().connection.notes).toBeNull();
 });
 it('holds an uncertain reservation write and preserves the open record across a new adapter',async()=>{
  const store=persistence(),write=store.compareAndSwap.getMockImplementation()!;store.compareAndSwap.mockImplementationOnce(async(a,b)=>{await write(a,b);throw Error('private sentinel');});
  const s=await setup(store),client=s.connect();await vi.waitFor(()=>expect(s.bridge.snapshot().held).toBe(true));expect(s.createTransports).not.toHaveBeenCalled();expect(client.session.snapshot().connection.ready).toBe(false);expect(store.snapshot().runs[0]!.closed).toBe(false);expect(await s.denied()).toBe(409);
  await expect(new PreparedNoteAllowance({simulation:true,persistence:store}).reserve()).rejects.toThrow('requires review');expect(store.compareAndSwap).toHaveBeenCalledTimes(1);expect(JSON.stringify(s.bridge.snapshot())).not.toContain('sentinel');
 });
 it('blocks replacement until page-exit closure succeeds, then uses a fresh reservation',async()=>{
  const store=persistence(),s=await setup(store),client=s.connect();await vi.waitFor(()=>expect(client.session.status().state).toBe('ready'));
  const write=store.compareAndSwap.getMockImplementation()!;let release!:()=>void;store.compareAndSwap.mockImplementationOnce(async(a,b)=>{await new Promise<void>(r=>{release=r;});return write(a,b);});
  client.page.dispatchEvent(new Event('pagehide'));await vi.waitFor(()=>expect(s.bridge.snapshot().allowanceState).toBe('closing'));expect(await s.denied()).toBe(409);expect(store.snapshot().runs[0]!.closed).toBe(false);release();await vi.waitFor(()=>expect(s.bridge.snapshot().active).toBe(false));
  const next=s.connect();await vi.waitFor(()=>expect(next.session.status().state).toBe('ready'));expect(store.snapshot().runs).toHaveLength(2);expect(store.snapshot().runs[0]!.closed).toBe(true);expect(store.snapshot().runs[1]!.closed).toBe(false);next.session.stop();await vi.waitFor(()=>expect(s.bridge.snapshot().active).toBe(false));expect(store.snapshot().runs.every(r=>r.closed)).toBe(true);
 });
 it('keeps a failed closure held without provider or persistence retries',async()=>{
  const store=persistence(),s=await setup(store),client=s.connect();await vi.waitFor(()=>expect(client.session.status().state).toBe('ready'));store.compareAndSwap.mockResolvedValueOnce(false);client.page.dispatchEvent(new Event('pagehide'));await vi.waitFor(()=>expect(s.bridge.snapshot().held).toBe(true));expect(await s.denied()).toBe(409);expect(store.snapshot().runs[0]!.closed).toBe(false);expect(store.compareAndSwap).toHaveBeenCalledTimes(2);expect(s.createTransports).toHaveBeenCalledTimes(1);expect(s.providers[0]!.close).toHaveBeenCalledTimes(1);
 });
 it('closes the separate reservation once when an active browser becomes hidden',async()=>{
  const s=await setup(),client=s.connect();await vi.waitFor(()=>expect(client.session.status().state).toBe('ready'));expect(await client.session.startTurn('t1')).toBe(true);client.visibility.hidden=true;client.visibility.dispatchEvent(new Event('visibilitychange'));await vi.waitFor(()=>expect(s.bridge.snapshot().active).toBe(false));expect(client.capture.stop).toHaveBeenCalled();expect(client.session.snapshot().capturing).toBe(false);expect(client.session.snapshot().connection.notes).toBeNull();expect(s.store.snapshot().runs[0]!.closed).toBe(true);expect(s.store.compareAndSwap).toHaveBeenCalledTimes(2);expect(s.providers[0]!.close).toHaveBeenCalledTimes(1);
 });
 it('allows only one provider owner across two bridges sharing compare-and-swap persistence',async()=>{
  const store=persistence(),a=await setup(store),b=await setup(store),first=a.connect(),second=b.connect();await vi.waitFor(()=>expect([first.session.status().state,second.session.status().state].filter(v=>v==='ready')).toHaveLength(1));await vi.waitFor(()=>expect(a.bridge.snapshot().held||b.bridge.snapshot().held).toBe(true));expect(a.createTransports.mock.calls.length+b.createTransports.mock.calls.length).toBe(1);expect(store.snapshot().runs).toHaveLength(1);
  const winner=first.session.status().state==='ready'?first:second;winner.session.stop();await vi.waitFor(()=>expect(store.snapshot().runs[0]!.closed).toBe(true));expect(a.providers.length+b.providers.length).toBe(1);
 });
});
