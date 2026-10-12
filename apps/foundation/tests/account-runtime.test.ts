import {EventEmitter} from 'node:events';
import {expect,it,vi,beforeEach} from 'vitest';
const mocks=vi.hoisted(()=>({prepare:vi.fn(),network:vi.fn()}));
vi.mock('../src/server/account-application.ts',()=>({prepareAccountApplication:mocks.prepare}));
vi.mock('../src/server/account-network.ts',()=>({createAccountNetwork:mocks.network}));
import {prepareAccountRuntime} from '../src/server/account-runtime.ts';
const env={ACCOUNT_APP_ORIGIN:'https://stylist.test',SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_SECRET_KEY:'synthetic-private-server-key',ACCOUNT_REFRESH_ACTIVE_KEY_ID:'fixture',ACCOUNT_REFRESH_KEYS:JSON.stringify({fixture:Buffer.alloc(32,1).toString('base64url')}),PORT:'4327',ACCOUNT_BUILD_DIRECTORY:'/private/tmp/synthetic-build'};
function fixture(){const app={close:vi.fn(async()=>true)},network={health:()=>({status:'inactive'}),start:vi.fn(async()=>true),close:vi.fn(async()=>true)},signals=new EventEmitter(),report=vi.fn(),factory=vi.fn();mocks.prepare.mockResolvedValue(app);mocks.network.mockReturnValue(network);return {app,network,signals,report,factory};}
beforeEach(()=>vi.clearAllMocks());
it('prepares inertly and starts once explicitly, then closes idempotently',async()=>{
 const f=fixture(),r=await prepareAccountRuntime(env,fetch,f.factory,f.signals,f.report);expect(f.network.start).not.toHaveBeenCalled();expect(f.signals.listenerCount('SIGTERM')).toBe(0);
 expect(await r.start()).toBe(true);expect(await r.start()).toBe(true);expect(f.network.start).toHaveBeenCalledExactlyOnceWith(4327,'127.0.0.1');
 expect(await r.close()).toBe(true);expect(await r.close()).toBe(true);expect(f.network.close).toHaveBeenCalledTimes(1);expect(f.report).toHaveBeenCalledExactlyOnceWith(true);expect(f.signals.listenerCount('SIGTERM')).toBe(0);expect(await r.start()).toBe(false);
});
it('signals coalesce uncertain cleanup',async()=>{
 const f=fixture();f.network.close.mockResolvedValue(false);const r=await prepareAccountRuntime(env,fetch,f.factory,f.signals,f.report);await r.start();f.signals.emit('SIGTERM');f.signals.emit('SIGINT');expect(await r.close()).toBe(false);expect(f.network.close).toHaveBeenCalledTimes(1);expect(f.report).toHaveBeenCalledExactlyOnceWith(false);
});
it('failed startup closes, detaches and cannot restart',async()=>{
 const f=fixture();f.network.start.mockResolvedValue(false);const r=await prepareAccountRuntime(env,fetch,f.factory,f.signals,f.report);expect(await r.start()).toBe(false);expect(f.network.close).toHaveBeenCalledTimes(1);expect(f.signals.listenerCount('SIGTERM')).toBe(0);expect(await r.start()).toBe(false);
});
it('close before start prevents activation and malformed settings never prepare',async()=>{
 const f=fixture(),r=await prepareAccountRuntime(env,fetch,f.factory,f.signals,f.report);expect(await r.close()).toBe(true);expect(await r.start()).toBe(false);expect(f.network.start).not.toHaveBeenCalled();mocks.prepare.mockClear();await expect(prepareAccountRuntime({...env,PORT:'bad'},fetch,f.factory,f.signals,f.report)).rejects.toThrow('Account runtime settings unavailable');expect(mocks.prepare).not.toHaveBeenCalled();
});
it('closing during startup prevents late successful activation',async()=>{
 const f=fixture();let finish!:(value:boolean)=>void;f.network.start.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));const r=await prepareAccountRuntime(env,fetch,f.factory,f.signals,f.report);const started=r.start();await r.close();finish(true);expect(await started).toBe(false);expect(f.network.close).toHaveBeenCalledTimes(1);
});

it('signal-only shutdown prevents a later start without explicit close',async()=>{
 const f=fixture(),r=await prepareAccountRuntime(env,fetch,f.factory,f.signals,f.report);await r.start();f.signals.emit('SIGTERM');await vi.waitFor(()=>expect(f.report).toHaveBeenCalled());expect(await r.start()).toBe(false);expect(f.network.start).toHaveBeenCalledTimes(1);
});
