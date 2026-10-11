import {afterEach,describe,expect,it,vi} from 'vitest';
import {createPreparedNoteServerOwner} from '../src/prepared-note-server-owner.ts';
import {prepareNoteOpener} from '../src/prepared-note-opener.ts';
import {TRANSCRIPTION_MODEL} from '../src/live-transcription.ts';
const preview={origin:'https://fixture.onrender.com',password:'fixture_password_only_for_tests_123456'};
const request=(signal=new AbortController().signal)=>({method:'GET',path:'/api/notebook-simulation',host:'fixture.onrender.com',origin:preview.origin,authorization:'Basic '+Buffer.from('stylist:'+preview.password).toString('base64'),signal});
const config={type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:TRANSCRIPTION_MODEL},turn_detection:null}}}};
function fixture(cleanupRequirement:'remote-verified'|'simulation-local'='remote-verified',dormant=false){
 const socket=Object.assign(new EventTarget(),{readyState:dormant?0:1,bufferedAmount:0,send:vi.fn(),close:vi.fn()}),detachInitialEvents=vi.fn(),capture={start:vi.fn(async()=>true),stop:vi.fn()};
 let resolve!:(v:{socket:typeof socket;detachInitialEvents:()=>void})=>void,initial!:(v:unknown)=>void,openingSignal!:AbortSignal;
 const manualOpen=vi.fn((signal:AbortSignal,event:(v:unknown)=>void)=>{initial=event;openingSignal=signal;return new Promise<{socket:typeof socket;detachInitialEvents:()=>void}>(r=>{resolve=r;});});
 const startTransport=vi.fn(),construct=vi.fn(()=>({socket,start:startTransport}));
 const open=dormant?vi.fn(prepareNoteOpener({simulation:true,construct})):manualOpen;
 const allowance={purpose:'notes-only-simulation' as const,reserve:vi.fn(async()=> 'synthetic'),closeVerified:vi.fn(async(_id:string)=>{})};
 const createStartupTransports=vi.fn(()=>({open,fetch:vi.fn(async()=>{throw Error('No extraction expected.');}),capture}));
 const options={simulation:true,cleanupRequirement,preview,allowance,createStartupTransports,changed:vi.fn()};
 const owner=createPreparedNoteServerOwner(options);
 return{...options,owner,socket,capture,open,startTransport,construct,detachInitialEvents,openingSignal:()=>openingSignal,initial:(v:unknown={type:'session.created',session:{id:'synthetic'}})=>{if(dormant)socket.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(v)}));else initial(v);},opened:()=>{if(dormant){socket.readyState=1;socket.dispatchEvent(new Event('open'));}else resolve({socket,detachInitialEvents});},ack:(v:unknown=config)=>socket.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(v)}))};
}
afterEach(()=>vi.useRealTimers());
describe('startup controller through protected simulated owner',()=>{
 it('requires exactly one transport factory before reservation',()=>{const s=fixture();expect(()=>createPreparedNoteServerOwner({...s,createStartupTransports:undefined})).toThrow('Exactly one');expect(()=>createPreparedNoteServerOwner({...s,createTransports:vi.fn()})).toThrow('Exactly one');expect(s.allowance.reserve).not.toHaveBeenCalled();});
 it.each([{origin:'https://other.invalid'},{authorization:undefined},{path:'/api/notebook-simulation?token=private'}])('checks private access before opening %j',async changes=>{const s=fixture();expect((await s.owner.start({...request(),...changes})).status).not.toBe(200);expect(s.allowance.reserve).not.toHaveBeenCalled();expect(s.open).not.toHaveBeenCalled();});
 it('publishes readiness only after creation and configuration, then preserves the remote hold',async()=>{
  const s=fixture(),ready=vi.fn(),pending=s.owner.start(request(),{ready});await vi.waitFor(()=>expect(s.open).toHaveBeenCalledTimes(1));
  expect(s.owner.status().state).toBe('starting');expect(await s.owner.start(request())).toEqual({status:409});s.opened();await Promise.resolve();expect(s.socket.send).not.toHaveBeenCalled();s.initial();expect(ready).not.toHaveBeenCalled();s.ack();
  const active=await pending;expect(active.status).toBe(200);if(active.status!==200)throw Error('Expected active owner.');expect(s.owner.status().state).toBe('active');expect(ready).toHaveBeenCalledTimes(1);await active.end();expect(s.owner.status().state).toBe('held');expect(s.allowance.closeVerified).not.toHaveBeenCalled();expect(s.socket.close).toHaveBeenCalledTimes(1);
 });
 it.each(['abort','startup-timeout'] as const)('keeps pending opening reserved after %s and closes the late socket before holding',async reason=>{
  vi.useFakeTimers();const s=fixture(),abort=new AbortController(),ready=vi.fn(),pending=s.owner.start(request(abort.signal),{ready});await Promise.resolve();expect(s.open).toHaveBeenCalledTimes(1);
  if(reason==='abort')abort.abort();else await vi.advanceTimersByTimeAsync(5000);
  await Promise.resolve();expect(s.owner.status().state).toBe('closing');expect(s.openingSignal().aborted).toBe(true);expect(s.allowance.closeVerified).not.toHaveBeenCalled();expect(await s.owner.start(request())).toEqual({status:409});
  s.initial();s.opened();expect(await pending).toEqual({status:499});expect(s.owner.status().state).toBe('held');expect(s.socket.close).toHaveBeenCalledTimes(1);expect(s.socket.send).not.toHaveBeenCalled();expect(s.capture.start).not.toHaveBeenCalled();expect(ready).not.toHaveBeenCalled();expect(s.allowance.reserve).toHaveBeenCalledTimes(1);expect(vi.getTimerCount()).toBe(0);
 });
 it('waits for late closure before retiring a simulation-local reservation',async()=>{const s=fixture('simulation-local'),abort=new AbortController(),pending=s.owner.start(request(abort.signal));await vi.waitFor(()=>expect(s.open).toHaveBeenCalledTimes(1));abort.abort();expect(s.allowance.closeVerified).not.toHaveBeenCalled();s.opened();expect(await pending).toEqual({status:499});expect(s.socket.close).toHaveBeenCalledTimes(1);expect(s.allowance.closeVerified).toHaveBeenCalledExactlyOnceWith('synthetic');expect(s.owner.status().state).toBe('idle');});
 it('keeps a late close failure held even under local simulation policy',async()=>{const s=fixture('simulation-local'),abort=new AbortController(),pending=s.owner.start(request(abort.signal));await vi.waitFor(()=>expect(s.open).toHaveBeenCalledTimes(1));s.socket.close.mockImplementation(()=>{throw Error('private sentinel');});abort.abort();s.opened();await pending;expect(s.owner.status().state).toBe('held');expect(s.allowance.closeVerified).not.toHaveBeenCalled();expect(JSON.stringify(s.owner.status())).not.toContain('sentinel');});
 it('holds a mismatched configuration without exposing a session',async()=>{const s=fixture(),ready=vi.fn(),pending=s.owner.start(request(),{ready});await vi.waitFor(()=>expect(s.open).toHaveBeenCalledTimes(1));s.opened();await Promise.resolve();s.initial();s.ack({type:'session.updated',session:{type:'transcription'}});expect(await pending).toEqual({status:499});expect(s.owner.status().state).toBe('held');expect(ready).not.toHaveBeenCalled();expect(s.allowance.closeVerified).not.toHaveBeenCalled();});
 it('retires a canceled late reservation without constructing startup resources',async()=>{const s=fixture(),abort=new AbortController();let release!:(id:string)=>void;s.allowance.reserve.mockImplementation(()=>new Promise(r=>{release=r;}));const pending=s.owner.start(request(abort.signal));abort.abort();release('late-no-provider');expect(await pending).toEqual({status:499});expect(s.createStartupTransports).not.toHaveBeenCalled();expect(s.allowance.closeVerified).toHaveBeenCalledExactlyOnceWith('late-no-provider');expect(s.owner.status().state).toBe('idle');});
 it('holds a configured owner at its full deadline and clears all timers',async()=>{vi.useFakeTimers();const s=fixture(),pending=s.owner.start(request());await Promise.resolve();s.opened();await Promise.resolve();s.initial();s.ack();const active=await pending;if(active.status!==200)throw Error('Expected active startup owner.');await vi.advanceTimersByTimeAsync(85000);await active.end();expect(s.owner.status().state).toBe('held');expect(s.socket.close).toHaveBeenCalledTimes(1);expect(s.allowance.closeVerified).not.toHaveBeenCalled();expect(vi.getTimerCount()).toBe(0);});

 it('does not return an active session when Ready reentrantly aborts the request',async()=>{const s=fixture(),abort=new AbortController(),pending=s.owner.start(request(abort.signal),{ready:()=>abort.abort()});await vi.waitFor(()=>expect(s.open).toHaveBeenCalledTimes(1));s.opened();await Promise.resolve();s.initial();s.ack();expect(await pending).toEqual({status:499});expect(s.owner.status().state).toBe('held');expect(s.socket.close).toHaveBeenCalledTimes(1);expect(s.allowance.closeVerified).not.toHaveBeenCalled();});

});


describe('dormant protected startup edge cases',()=>{
 it.each(['opening','configuration'] as const)('expires during %s and rejects late activity',async stage=>{
  vi.useFakeTimers();const s=fixture('remote-verified',true),ready=vi.fn(),pending=s.owner.start(request(),{ready});await Promise.resolve();
  expect(s.construct).toHaveBeenCalledTimes(1);
  if(stage==='configuration'){s.opened();await Promise.resolve();s.initial();await vi.waitFor(()=>expect(s.socket.send).toHaveBeenCalledTimes(1));}
  await vi.advanceTimersByTimeAsync(5000);expect(await pending).toEqual({status:499});
  s.opened();s.initial();s.ack();expect(s.owner.status().state).toBe('held');expect(ready).not.toHaveBeenCalled();
  expect(s.socket.close).toHaveBeenCalledTimes(1);expect(s.capture.start).not.toHaveBeenCalled();expect(s.allowance.closeVerified).not.toHaveBeenCalled();expect(vi.getTimerCount()).toBe(0);
  expect(await s.owner.start(request())).toEqual({status:409});expect(s.construct).toHaveBeenCalledTimes(1);
 });
 it('ignores duplicate open notifications without replaying configuration',async()=>{
  const s=fixture('remote-verified',true),ready=vi.fn(),pending=s.owner.start(request(),{ready});await Promise.resolve();s.opened();s.opened();await Promise.resolve();s.initial();s.opened();
  await vi.waitFor(()=>expect(s.socket.send).toHaveBeenCalledTimes(1));s.ack();const active=await pending;if(active.status!==200)throw Error('Expected active owner');
  s.opened();expect(ready).toHaveBeenCalledTimes(1);expect(s.socket.send).toHaveBeenCalledTimes(1);await active.end();expect(s.socket.close).toHaveBeenCalledTimes(1);expect(s.allowance.closeVerified).not.toHaveBeenCalled();
 });
 it.each(['construction','start','ready'] as const)('handles reentrant abort during %s without returning an active capability',async stage=>{
  const s=fixture('remote-verified',true),abort=new AbortController();
  if(stage==='construction')s.construct.mockImplementation(()=>{abort.abort();return{socket:s.socket,start:s.startTransport};});
  if(stage==='start')s.startTransport.mockImplementation(()=>abort.abort());
  const pending=s.owner.start(request(abort.signal),{ready:()=>{if(stage==='ready')abort.abort();}});await Promise.resolve();
  if(stage==='ready'){s.opened();await Promise.resolve();s.initial();s.ack();}
  expect(await pending).toEqual({status:499});s.opened();s.ack();
  expect(s.owner.status().state).toBe('held');expect(s.socket.close).toHaveBeenCalledTimes(1);expect(s.capture.start).not.toHaveBeenCalled();expect(s.allowance.closeVerified).not.toHaveBeenCalled();
  expect(await s.owner.start(request())).toEqual({status:409});expect(s.construct).toHaveBeenCalledTimes(1);
 });
});
