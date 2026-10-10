import {afterEach,describe,expect,it,vi} from 'vitest';
import {isDeepStrictEqual} from 'node:util';
import {PreparedNoteAllowance} from '../src/prepared-note-allowance.ts';
import type {PreparedNoteLedger} from '../src/prepared-note-allowance.ts';
import {createPreparedNotePersistenceTransport} from '../src/prepared-note-persistence-transport.ts';
import {createPreparedNoteServerOwner} from '../src/prepared-note-server-owner.ts';
const preview={origin:'https://fixture.onrender.com',password:'fixture_password_only_for_tests_123456'};
afterEach(()=>vi.useRealTimers());
function setup(mode:'normal'|'reserve-uncertain'|'closure-failed'|'reserve-pending'|'read-invalid'='normal'){
 let ledger:PreparedNoteLedger={version:1,purpose:'notes-only-simulation',approval:{id:'synthetic',attempts:2,centsPerAttempt:100,secondsPerAttempt:85},runs:[]};
 let resolveWrite!:((response:Response)=>void);
 const fetch=vi.fn(async(url:string,init:RequestInit):Promise<Response>=>{
  if(url.endsWith('_read'))return Response.json(mode==='read-invalid'?{version:1,runs:[]}:ledger);
  const {expected,replacement}=JSON.parse(init.body as string) as {expected:PreparedNoteLedger;replacement:PreparedNoteLedger};
  if(!isDeepStrictEqual(ledger,expected))return Response.json(false);
  if(mode==='closure-failed'&&replacement.runs.every(r=>r.closed))return Response.json(false);
  ledger=structuredClone(replacement);
  if(mode==='reserve-uncertain'&&ledger.runs.some(r=>!r.closed))throw Error('private write sentinel');
  if(mode==='reserve-pending'&&ledger.runs.some(r=>!r.closed))return new Promise<Response>(r=>{resolveWrite=r;});
  return Response.json(true);
 });
 const persistence=createPreparedNotePersistenceTransport({simulation:true,url:'https://fixture.supabase.co',fetch}),allowance=new PreparedNoteAllowance({simulation:true,persistence});
 const socket=Object.assign(new EventTarget(),{readyState:1,bufferedAmount:0,send:vi.fn(),close:vi.fn()});
 const createTransports=vi.fn(()=>({socket,capture:{start:vi.fn(async()=>true),stop:vi.fn()},fetch:vi.fn(async()=>{throw Error('No extraction expected.');})}));
 const owner=createPreparedNoteServerOwner({simulation:true,preview,allowance,createTransports,changed:vi.fn()});
 const request=(signal=new AbortController().signal)=>({method:'GET',path:'/api/notebook-simulation',host:'fixture.onrender.com',origin:preview.origin,authorization:'Basic '+Buffer.from('stylist:'+preview.password).toString('base64'),signal});
 return{owner,allowance,fetch,socket,createTransports,request,ledger:()=>structuredClone(ledger),resolve:(response=Response.json(true))=>resolveWrite(response)};
}
describe('protected notebook owner with bounded persistence preparation',()=>{
 it('reserves and closes through only the two injected notebook RPCs',async()=>{
  const s=setup(),result=await s.owner.start(s.request());expect(result.status).toBe(200);if(result.status!==200)throw Error('Owner did not start');
  expect(s.ledger().runs[0]!.closed).toBe(false);await result.end();expect(s.ledger().runs[0]!.closed).toBe(true);expect(s.owner.status().state).toBe('idle');expect(s.fetch).toHaveBeenCalledTimes(4);expect(s.socket.close).toHaveBeenCalledTimes(1);expect(s.ledger().approval.centsPerAttempt).toBe(100);
 });
 it('holds a write that persisted before its acknowledgment failed',async()=>{
  const s=setup('reserve-uncertain');expect((await s.owner.start(s.request())).status).toBe(503);expect(s.owner.status().state).toBe('held');expect(s.ledger().runs[0]!.closed).toBe(false);expect(s.createTransports).not.toHaveBeenCalled();expect((await s.owner.start(s.request())).status).toBe(409);expect(s.fetch).toHaveBeenCalledTimes(2);expect(JSON.stringify(s.owner.status())).not.toContain('sentinel');
 });
 it('keeps failed compare-and-swap closure held without retries',async()=>{
  const s=setup('closure-failed'),result=await s.owner.start(s.request());if(result.status!==200)throw Error('Owner did not start');await result.end();expect(s.owner.status().state).toBe('held');expect(s.allowance.status().held).toBe(true);expect(s.ledger().runs[0]!.closed).toBe(false);expect((await s.owner.start(s.request())).status).toBe(409);expect(s.fetch).toHaveBeenCalledTimes(4);expect(s.socket.close).toHaveBeenCalledTimes(1);
 });
 it('retires a reservation confirmed after the browser has left',async()=>{
  const s=setup('reserve-pending'),abort=new AbortController(),pending=s.owner.start(s.request(abort.signal));await vi.waitFor(()=>expect(s.ledger().runs).toHaveLength(1));abort.abort();expect(s.createTransports).not.toHaveBeenCalled();s.resolve();expect((await pending).status).toBe(499);expect(s.owner.status().state).toBe('idle');expect(s.ledger().runs[0]!.closed).toBe(true);expect(s.fetch).toHaveBeenCalledTimes(4);expect(s.createTransports).not.toHaveBeenCalled();
 });
 it('holds a timed-out write even if a success response arrives later',async()=>{
  vi.useFakeTimers();const s=setup('reserve-pending'),pending=s.owner.start(s.request());await vi.advanceTimersByTimeAsync(0);expect(s.ledger().runs).toHaveLength(1);await vi.advanceTimersByTimeAsync(8000);expect((await pending).status).toBe(503);expect(s.owner.status().state).toBe('held');
  const cancel=vi.fn();s.resolve(new Response(new ReadableStream<Uint8Array>({cancel}),{headers:{'content-type':'application/json'}}));await Promise.resolve();await Promise.resolve();expect(cancel).toHaveBeenCalled();expect(s.ledger().runs[0]!.closed).toBe(false);expect(s.createTransports).not.toHaveBeenCalled();expect(s.fetch).toHaveBeenCalledTimes(2);
 });
 it('refuses legacy or malformed remote snapshots before any reservation or provider',async()=>{
  const s=setup('read-invalid');expect((await s.owner.start(s.request())).status).toBe(503);expect(s.ledger().runs).toHaveLength(0);expect(s.createTransports).not.toHaveBeenCalled();expect(s.fetch).toHaveBeenCalledTimes(1);expect(s.owner.status().state).toBe('held');
 });
});
