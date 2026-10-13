import {describe,it,expect,vi} from 'vitest';
import {createServer} from 'node:http';
import {attachProtectedSimulatedNoteBridge} from '../src/protected-note-network-bridge.ts';
import {attachPreparedNotesOnlyTrial} from '../src/notes-trial-entry.ts';
const preview={origin:'https://trial-fixture.onrender.com',password:'fixture_password_12345678901234567890'};
const allowance={purpose:'notes-only-simulation' as const,reserve:vi.fn(),closeVerified:vi.fn()};
describe('disabled notes-only entry',()=>{
 it('refuses normal startup before attaching listeners or creating providers',()=>{
  const server=createServer(),createStartupTransports=vi.fn();expect(()=>attachPreparedNotesOnlyTrial(server,{preview,allowance,createStartupTransports})).toThrow('disabled');
  expect(server.listenerCount('upgrade')).toBe(0);expect(createStartupTransports).not.toHaveBeenCalled();expect(allowance.reserve).not.toHaveBeenCalled();
 });
 it('refuses an avatar allowance without attaching listeners',()=>{
  const server=createServer(),createStartupTransports=vi.fn();expect(()=>attachPreparedNotesOnlyTrial(server,{simulation:true,preview,allowance:{...allowance,purpose:'avatar' as never},createStartupTransports})).toThrow('Separate');
  expect(server.listenerCount('upgrade')).toBe(0);expect(createStartupTransports).not.toHaveBeenCalled();
 });
 it('attaches explicitly in simulation without reserving or constructing on boot',()=>{
  const server=createServer(),createStartupTransports=vi.fn();const entry=attachPreparedNotesOnlyTrial(server,{simulation:true,preview,allowance,createStartupTransports});
  expect(server.listenerCount('upgrade')).toBe(1);expect(createStartupTransports).not.toHaveBeenCalled();expect(allowance.reserve).not.toHaveBeenCalled();entry.dispose();expect(server.listenerCount('upgrade')).toBe(0);
 });
});

it.each([0,-1,17,1.5,NaN])('rejects invalid turn limit %s before attachment',maxTurns=>{
 const server=createServer(),createTransports=vi.fn();expect(()=>attachProtectedSimulatedNoteBridge(server,{simulation:true,maxTurns,preview,allowance,createTransports})).toThrow('turn limit');
 expect(server.listenerCount('upgrade')).toBe(0);expect(createTransports).not.toHaveBeenCalled();
});
