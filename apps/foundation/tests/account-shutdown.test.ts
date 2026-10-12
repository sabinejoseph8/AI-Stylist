import {EventEmitter} from 'node:events';
import {expect,it,vi} from 'vitest';
import {attachAccountShutdown} from '../src/server/account-shutdown.ts';
it('waits for actual cleanup and coalesces signals without removing other listeners',async()=>{
 const signals=new EventEmitter(),other=vi.fn(),report=vi.fn();signals.on('SIGTERM',other);
 let finish!:(value:boolean)=>void;const cleanup=vi.fn(()=>new Promise<boolean>(resolve=>{finish=resolve;}));
 const shutdown=attachAccountShutdown(signals,{close:cleanup},report);expect(cleanup).not.toHaveBeenCalled();
 signals.emit('SIGTERM');signals.emit('SIGINT');await Promise.resolve();expect(cleanup).toHaveBeenCalledTimes(1);expect(report).not.toHaveBeenCalled();
 finish(true);expect(await shutdown.close()).toBe(true);expect(report).toHaveBeenCalledExactlyOnceWith(true);expect(signals.listeners('SIGTERM')).toEqual([other]);expect(signals.listenerCount('SIGINT')).toBe(0);
});
it('reports rejected and unconfirmed cleanup as unconfirmed',async()=>{
 for(const close of [async()=>false,async()=>{throw Error('private detail');}]){const signals=new EventEmitter(),report=vi.fn();const shutdown=attachAccountShutdown(signals,{close},report);expect(await shutdown.close()).toBe(false);expect(report).toHaveBeenCalledExactlyOnceWith(false);expect(signals.listenerCount('SIGTERM')).toBe(0);}
});
it('detaches idempotently without claiming cleanup or preventing explicit closure',async()=>{
 const signals=new EventEmitter(),close=vi.fn(async()=>true),report=vi.fn();const shutdown=attachAccountShutdown(signals,{close},report);shutdown.detach();shutdown.detach();signals.emit('SIGTERM');expect(close).not.toHaveBeenCalled();expect(report).not.toHaveBeenCalled();expect(await shutdown.close()).toBe(true);
});
it('keeps cleanup evidence when reporting throws',async()=>{
 const signals=new EventEmitter();const shutdown=attachAccountShutdown(signals,{close:async()=>true},()=>{throw Error('report failed');});expect(await shutdown.close()).toBe(true);expect(signals.listenerCount('SIGINT')).toBe(0);
});
