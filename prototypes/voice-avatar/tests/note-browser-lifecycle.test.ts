import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {bindSimulatedNoteLifecycle} from '../src/note-browser-lifecycle.ts';
import {PreparedBrowserNoteSession} from '../src/note-browser-session.ts';
const ready={version:1,type:'ready',sessionId:'s1',simulation:true,liveEnabled:false};
function setup(hidden=false){
 const socket=Object.assign(new EventTarget(),{send:vi.fn(),close:vi.fn(),bufferedAmount:0});
 const page=new EventTarget(),visibility=Object.assign(new EventTarget(),{hidden});
 const capture={start:vi.fn(async()=>true),stop:vi.fn()},changed=vi.fn(),status=vi.fn();
 const session=new PreparedBrowserNoteSession({simulation:true,socket,capture,changed});
 const bind=()=>bindSimulatedNoteLifecycle({simulation:true,session,socket,page,visibility,status});
 const message=(value:unknown)=>socket.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(value)}));
 return{socket,page,visibility,capture,changed,status,session,bind,message};
}
beforeEach(()=>vi.useFakeTimers());afterEach(()=>vi.useRealTimers());
describe('disabled notebook browser lifecycle binding',()=>{
 it('requires explicit simulation before registering listeners',()=>{const s=setup();const add=vi.spyOn(s.socket,'addEventListener');expect(()=>bindSimulatedNoteLifecycle({...s,simulation:false})).toThrow('disabled');expect(add).not.toHaveBeenCalled();s.session.stop();});
 it('forwards validated text and refreshes status without duplicate messages',()=>{const s=setup(),binding=s.bind();expect(s.status.mock.lastCall![0].state).toBe('connecting');s.message(ready);expect(s.status.mock.lastCall![0].state).toBe('ready');vi.advanceTimersByTime(200);expect(s.status).toHaveBeenCalledTimes(2);binding.dispose();expect(s.socket.close).toHaveBeenCalledTimes(1);expect(vi.getTimerCount()).toBe(0);});
 it('observes async permission and stops on a hidden page',async()=>{const s=setup(),binding=s.bind();s.message(ready);const pending=s.session.startTurn('t1');binding.refresh();expect(s.status.mock.lastCall![0].state).toBe('requesting-device');await pending;vi.advanceTimersByTime(50);expect(s.status.mock.lastCall![0].state).toBe('waiting-turn');s.message({version:1,type:'accepted',sessionId:'s1',sequence:1});expect(s.status.mock.lastCall![0].state).toBe('capturing');s.visibility.hidden=true;s.visibility.dispatchEvent(new Event('visibilitychange'));expect(s.session.snapshot().ended).toBe(true);expect(s.capture.stop).toHaveBeenCalled();expect(s.status.mock.lastCall![0].message).toContain('page was hidden');expect(vi.getTimerCount()).toBe(0);});
 it.each(['close','error'])('clears on socket %s and ignores late events',type=>{const s=setup();s.bind();s.message(ready);s.socket.dispatchEvent(new Event(type));const calls=s.status.mock.calls.length;s.message(ready);s.socket.dispatchEvent(new Event('close'));expect(s.status).toHaveBeenCalledTimes(calls);expect(s.session.snapshot().connection.notes).toBeNull();expect(s.socket.close).toHaveBeenCalledTimes(1);expect(vi.getTimerCount()).toBe(0);});
 it.each([new ArrayBuffer(8),'not-json','x'.repeat(12001)])('holds malformed or binary input without displaying it',data=>{const s=setup();s.bind();s.socket.dispatchEvent(new MessageEvent('message',{data}));expect(s.session.snapshot().ended).toBe(true);expect(s.status.mock.lastCall![0].state).toBe('ended');expect(vi.getTimerCount()).toBe(0);});
 it('stops immediately if the page is already hidden',()=>{const s=setup(true);s.bind();expect(s.session.snapshot().ended).toBe(true);expect(s.capture.start).not.toHaveBeenCalled();expect(vi.getTimerCount()).toBe(0);});
 it('handles pagehide and removes all listeners on dispose',()=>{const s=setup();const removed=vi.spyOn(s.socket,'removeEventListener'),binding=s.bind();s.page.dispatchEvent(new Event('pagehide'));binding.dispose();expect(removed).toHaveBeenCalledTimes(3);expect(s.socket.close).toHaveBeenCalledTimes(1);expect(vi.getTimerCount()).toBe(0);});
 it('reports internal timeout and removes its status timer',()=>{const s=setup();s.bind();vi.advanceTimersByTime(5100);expect(s.status.mock.lastCall![0].message).toContain('connection ended');expect(vi.getTimerCount()).toBe(0);});
 it('stops on display failure without exposing exception contents',()=>{const s=setup();s.status.mockImplementation(()=>{throw Error('private sentinel');});s.bind();expect(s.session.snapshot().ended).toBe(true);expect(s.socket.close).toHaveBeenCalledTimes(1);expect(vi.getTimerCount()).toBe(0);expect(JSON.stringify(s.session.status())).not.toContain('sentinel');});
 it('cleans up partially registered listeners if binding fails',()=>{const s=setup();const remove=vi.spyOn(s.socket,'removeEventListener');vi.spyOn(s.page,'addEventListener').mockImplementation(()=>{throw Error('private sentinel');});expect(s.bind).toThrow('Notebook lifecycle setup failed.');expect(remove).toHaveBeenCalledTimes(3);expect(s.session.snapshot().ended).toBe(true);expect(vi.getTimerCount()).toBe(0);});
});
