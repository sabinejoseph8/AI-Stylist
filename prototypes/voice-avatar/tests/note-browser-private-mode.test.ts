import {it,expect,vi} from 'vitest';
import {NoteUpdateClient} from '../src/note-update-wire.ts';
import {PreparedBrowserNoteSession} from '../src/note-browser-session.ts';
const ready={version:1,type:'ready',sessionId:'fixture',simulation:false,liveEnabled:true};
it('requires readiness to match the explicitly selected browser mode',()=>{
 expect(new NoteUpdateClient().ready(ready)).toBe(false);expect(new NoteUpdateClient({privateTrial:true}).ready({...ready,simulation:true,liveEnabled:false})).toBe(false);expect(new NoteUpdateClient({privateTrial:true}).ready(ready)).toBe(true);
 for(const mismatch of [{...ready,simulation:true},{...ready,liveEnabled:false}])expect(new NoteUpdateClient({privateTrial:true}).ready(mismatch)).toBe(false);
});
it('starts no capture until explicit readiness and a user action, then stops on mode mismatch',async()=>{
 const socket={send:vi.fn(),close:vi.fn(),bufferedAmount:0},capture={start:vi.fn(async()=>true),stop:vi.fn()};
 const session=new PreparedBrowserNoteSession({privateTrial:true,socket,capture,changed:()=>{}});
 try{expect(session.status().message).toContain('private notebook connection');expect(await session.startTurn('t1')).toBe(false);expect(capture.start).not.toHaveBeenCalled();expect(session.receive(ready)).toBe(true);expect(session.status().message).toContain('Start turn');expect(await session.startTurn('t1')).toBe(true);expect(capture.start).toHaveBeenCalledOnce();expect(session.snapshot().liveEnabled).toBe(true);}finally{session.stop();}
 expect(capture.stop).toHaveBeenCalled();expect(session.snapshot().connection.notes).toBeNull();
});
it('rejects simulation readiness in a private browser before touching capture',()=>{
 const socket={send:vi.fn(),close:vi.fn(),bufferedAmount:0},capture={start:vi.fn(),stop:vi.fn()};const session=new PreparedBrowserNoteSession({privateTrial:true,socket,capture,changed:()=>{}});
 expect(session.receive({...ready,simulation:true,liveEnabled:false})).toBe(false);expect(session.snapshot().ended).toBe(true);expect(capture.start).not.toHaveBeenCalled();
});
it('refuses ambiguous browser mode before any side effect',()=>{const socket={send:vi.fn(),close:vi.fn(),bufferedAmount:0},capture={start:vi.fn(),stop:vi.fn()};expect(()=>new PreparedBrowserNoteSession({simulation:true,privateTrial:true,socket,capture,changed:()=>{}})).toThrow('disabled');expect(capture.start).not.toHaveBeenCalled();expect(socket.send).not.toHaveBeenCalled();});
