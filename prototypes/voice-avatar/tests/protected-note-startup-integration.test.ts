import {afterEach,describe,expect,it,vi} from 'vitest';
import {createServer} from 'node:http';
import {isDeepStrictEqual} from 'node:util';
import {WebSocket} from 'ws';
import {attachProtectedSimulatedNoteBridge} from '../src/protected-note-network-bridge.ts';
import {PreparedNoteAllowance} from '../src/prepared-note-allowance.ts';
import type {PreparedNoteLedger} from '../src/prepared-note-allowance.ts';
import {PreparedBrowserNoteSession} from '../src/note-browser-session.ts';
import {bindSimulatedNoteLifecycle} from '../src/note-browser-lifecycle.ts';
import {TRANSCRIPTION_MODEL} from '../src/live-transcription.ts';
const preview={origin:'https://fixture.onrender.com',password:'fixture_password_only_for_tests_123456'};
const headers={Host:'fixture.onrender.com',Origin:preview.origin,Authorization:'Basic '+Buffer.from('stylist:'+preview.password).toString('base64')};
const config={type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:TRANSCRIPTION_MODEL},turn_detection:null}}}};
const cleanups:(()=>Promise<void>)[]=[];
afterEach(async()=>{for(const cleanup of cleanups.splice(0).reverse())await cleanup();});
function store(){
 let saved:PreparedNoteLedger={version:1,purpose:'notes-only-simulation',approval:{id:'synthetic_startup',attempts:2,centsPerAttempt:100,secondsPerAttempt:85},runs:[]};
 return{read:vi.fn(async()=>structuredClone(saved)),compareAndSwap:vi.fn(async(expected:PreparedNoteLedger,next:PreparedNoteLedger)=>{if(!isDeepStrictEqual(saved,expected))return false;saved=structuredClone(next);return true;}),snapshot:()=>structuredClone(saved)};
}
async function setup(persistence=store()){
 const allowance=new PreparedNoteAllowance({simulation:true,persistence});
 const socket=Object.assign(new EventTarget(),{readyState:1,bufferedAmount:0,send:vi.fn(),close:vi.fn()}),detachInitialEvents=vi.fn();
 let release!:(value:{socket:typeof socket;detachInitialEvents:()=>void})=>void,initial!:(value:unknown)=>void;
 const open=vi.fn((_signal:AbortSignal,event:(value:unknown)=>void)=>{initial=event;return new Promise<{socket:typeof socket;detachInitialEvents:()=>void}>(resolve=>{release=resolve;});});
 const createStartupTransports=vi.fn(()=>({open,fetch:vi.fn(async()=>{throw Error('No extraction expected.');})}));
 const server=createServer((_req,res)=>res.end()),bridge=attachProtectedSimulatedNoteBridge(server,{simulation:true,cleanupRequirement:'remote-verified',preview,allowance,createStartupTransports});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const address=server.address();if(!address||typeof address==='string')throw Error('No local address');const url=`ws://127.0.0.1:${address.port}/api/notebook-simulation`;
 const clients:WebSocket[]=[],bindings:ReturnType<typeof bindSimulatedNoteLifecycle>[]=[];
 function connect(){
  const ws=new WebSocket(url,{headers});clients.push(ws);const events=new EventTarget(),page=new EventTarget(),visibility=Object.assign(new EventTarget(),{hidden:false}),capture={start:vi.fn(async()=>true),stop:vi.fn()};
  const session=new PreparedBrowserNoteSession({simulation:true,capture,socket:{send:v=>ws.send(v),close:()=>ws.close(),get bufferedAmount(){return ws.bufferedAmount;}},changed:vi.fn()});
  bindings.push(bindSimulatedNoteLifecycle({simulation:true,session,socket:events,page,visibility,status:vi.fn()}));
  ws.on('message',data=>events.dispatchEvent(new MessageEvent('message',{data:data.toString()})));ws.on('close',()=>events.dispatchEvent(new Event('close')));ws.on('error',()=>events.dispatchEvent(new Event('error')));
  return{ws,page,session,capture};
 }
 cleanups.push(async()=>{for(const binding of bindings)binding.dispose();for(const ws of clients)ws.terminate();if(open.mock.calls.length)release({socket,detachInitialEvents});bridge.dispose();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));});
 return{bridge,connect,persistence,createStartupTransports,open,socket,opened:()=>release({socket,detachInitialEvents}),created:()=>initial({type:'session.created',session:{id:'synthetic'}}),ack:(value:unknown=config)=>socket.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(value)}))};
}
describe('startup through protected loopback browser and separate allowance',()=>{
 it('keeps browser capture unavailable until creation and configuration, then retains the hold on end',async()=>{
  const s=await setup(),client=s.connect();await vi.waitFor(()=>expect(s.open).toHaveBeenCalledTimes(1));expect(client.session.status().state).not.toBe('ready');expect(await client.session.startTurn('early')).toBe(false);expect(client.capture.start).not.toHaveBeenCalled();
  s.opened();await Promise.resolve();s.created();expect(client.session.status().state).not.toBe('ready');s.ack();await vi.waitFor(()=>expect(client.session.status().state).toBe('ready'));
  expect(await client.session.startTurn('first')).toBe(true);client.session.stop();await vi.waitFor(()=>expect(s.bridge.snapshot().allowanceState).toBe('held'));expect(client.session.snapshot().capturing).toBe(false);expect(client.session.snapshot().connection.notes).toBeNull();expect(s.socket.close).toHaveBeenCalledTimes(1);expect(s.persistence.compareAndSwap).toHaveBeenCalledTimes(1);expect(s.persistence.snapshot().runs[0]!.closed).toBe(false);
  const fresh=await setup(s.persistence),replacement=fresh.connect();await vi.waitFor(()=>expect(fresh.bridge.snapshot().held).toBe(true));expect(fresh.open).not.toHaveBeenCalled();expect(replacement.session.status().state).not.toBe('ready');expect(s.persistence.snapshot().runs).toHaveLength(1);
 });
 it('holds page exit during opening until the late socket is closed and blocks a fresh owner',async()=>{
  const s=await setup(),client=s.connect();await vi.waitFor(()=>expect(s.open).toHaveBeenCalledTimes(1));client.page.dispatchEvent(new Event('pagehide'));await vi.waitFor(()=>expect(s.bridge.snapshot().allowanceState).toBe('closing'));expect(s.persistence.compareAndSwap).toHaveBeenCalledTimes(1);expect(s.persistence.snapshot().runs[0]!.closed).toBe(false);
  s.opened();await vi.waitFor(()=>expect(s.bridge.snapshot().held).toBe(true));expect(s.socket.close).toHaveBeenCalledTimes(1);expect(s.socket.send).not.toHaveBeenCalled();expect(client.capture.start).not.toHaveBeenCalled();expect(client.session.snapshot().connection.notes).toBeNull();
  const fresh=await setup(s.persistence);fresh.connect();await vi.waitFor(()=>expect(fresh.bridge.snapshot().held).toBe(true));expect(fresh.createStartupTransports).not.toHaveBeenCalled();expect(s.persistence.compareAndSwap).toHaveBeenCalledTimes(1);
 });
 it('never reports Ready for mismatched provider configuration',async()=>{
  const s=await setup(),client=s.connect();await vi.waitFor(()=>expect(s.open).toHaveBeenCalledTimes(1));s.opened();await Promise.resolve();s.created();s.ack({type:'session.updated',session:{type:'transcription'}});await vi.waitFor(()=>expect(s.bridge.snapshot().held).toBe(true));expect(client.session.status().state).not.toBe('ready');expect(client.capture.start).not.toHaveBeenCalled();expect(s.socket.close).toHaveBeenCalledTimes(1);expect(s.persistence.snapshot().runs[0]!.closed).toBe(false);
 });
});
