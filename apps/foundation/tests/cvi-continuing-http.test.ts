import {it,expect,vi} from 'vitest';
import {continuingHttpFixture} from './support/cvi-continuing-http-fixture.ts';
const signal=()=>new AbortController().signal;
it('complete transcript/notebook/HTTP exchanges preserve notes and replay across signed renewal',async()=>{const x=await continuingHttpFixture();try{
 expect((await x.say('Long sleeves')).status).toBe('applied');const first=x.http('Long sleeves'),r=await x.wire.handle(first);expect(r.status).toBe(200);expect(await r.text()).toContain('Long sleeves');
 const notes=structuredClone(x.context.flow.snapshot().notes),before=await x.records();expect(before).toHaveLength(2);
 x.at(1500);expect(await x.wire.continue(x.continuation,signal())).toBe(true);expect(x.context.flow.snapshot().notes).toEqual(notes);expect(x.context.flow.snapshot().context?.nativeRevision).toBe(6);expect(await x.records()).toEqual(before);
 x.at(9250);expect((await x.say('Prefer loose sleeves')).status).toBe('applied');const next=await x.wire.handle(x.http('Prefer loose sleeves','Earlier synthetic reply'));expect(next.status).toBe(200);expect(await next.text()).toContain('Prefer loose sleeves');
 expect(await x.records()).toHaveLength(4);expect((await x.records()).every((v:any)=>v.status==='spent')).toBe(true);expect(x.wire.isHeld()).toBe(false);
 expect((await x.wire.handle(x.http('Long sleeves'))).status).toBe(409);expect(await x.records()).toHaveLength(4);
 }finally{await x.close();}},60000);
it('HTTP work during adoption is refused before admission and can be sent afterward',async()=>{const x=await continuingHttpFixture();try{
 await x.say('Long sleeves');const execute=x.ports.execute.getMockImplementation()!;let release!:()=>void;
 x.ports.execute.mockImplementationOnce(async(p,s)=>{await new Promise<void>(r=>release=r);return execute(p,s);});x.at(1500);
 const transition=x.wire.continue(x.continuation,signal());await vi.waitFor(()=>expect(release).toBeTypeOf('function'),{timeout:5000});
 expect((await x.wire.handle(x.http('Long sleeves'))).status).toBe(409);expect(await x.records()).toHaveLength(0);expect(x.wire.isHeld()).toBe(false);
 release();expect(await transition).toBe(true);const r=await x.wire.handle(x.http('Long sleeves'));expect(r.status).toBe(200);await r.text();expect(await x.records()).toHaveLength(2);
 }finally{await x.close();}},60000);
it('a newer transcript queued during adoption uses the new native pin without erasing notes',async()=>{const x=await continuingHttpFixture();try{
 await x.say('Long sleeves');const execute=x.ports.execute.getMockImplementation()!;let release!:()=>void;
 x.ports.execute.mockImplementationOnce(async(p,s)=>{await new Promise<void>(r=>release=r);return execute(p,s);});x.at(1500);
 const transition=x.wire.continue(x.continuation,signal());await vi.waitFor(()=>expect(release).toBeTypeOf('function'),{timeout:5000});const incoming=x.say('Loose sleeves');release();
 expect(await transition).toBe(true);expect((await incoming).status).toBe('applied');expect(x.context.flow.snapshot().notes.coverage.text).toBe('Loose sleeves');expect(x.context.flow.isOpen()).toBe(true);
 const r=await x.wire.handle(x.http('Loose sleeves'));expect(r.status).toBe(200);expect(await r.text()).toContain('Loose sleeves');expect(await x.records()).toHaveLength(2);
 }finally{await x.close();}},60000);
it('an old context pin queued during adoption refuses without closing newer input',async()=>{const x=await continuingHttpFixture();try{
 await x.say('Long sleeves');const old={storeId:x.f.x.pin.storeId,generation:x.f.nativeLease().generation,ownerDigest:x.f.nativeLease().ownerDigest,bootDigest:x.f.nativeLease().bootDigest,expiresAt:9000,minimumRevision:4};
 const execute=x.ports.execute.getMockImplementation()!;let release!:()=>void;x.ports.execute.mockImplementationOnce(async(p,s)=>{await new Promise<void>(r=>release=r);return execute(p,s);});x.at(1500);
 const transition=x.wire.continue(x.continuation,signal());await vi.waitFor(()=>expect(release).toBeTypeOf('function'),{timeout:5000});const stale=x.context.checkpoint.inspectOwnerFresh(old,signal()).catch(()=>null);release();
 expect(await transition).toBe(true);expect(await stale).toBeNull();expect(x.context.flow.snapshot().notes.coverage.text).toBe('Long sleeves');expect(x.context.flow.isOpen()).toBe(true);
 }finally{await x.close();}},60000);
it('a prepared HTTP response blocks renewal and keeps its original reservation',async()=>{const x=await continuingHttpFixture();try{
 await x.say('Long sleeves');const r=await x.wire.handle(x.http('Long sleeves'));expect(r.status).toBe(200);const before=await x.records();x.at(1500);
 expect(await x.wire.continue(x.continuation,signal())).toBe(false);expect(x.ports.execute).not.toHaveBeenCalled();expect(await x.records()).toEqual(before);await r.body!.cancel();expect(x.wire.isHeld()).toBe(true);
 }finally{await x.close();}},60000);
it('pending extraction finishes against the adopted pin and retains its original customer input',async()=>{const x=await continuingHttpFixture();try{
 await x.say('Long sleeves');let finish!:(v:any)=>void;x.extract.mockImplementationOnce(async()=>new Promise(r=>finish=r));const incoming=x.say('Loose sleeves');await vi.waitFor(()=>expect(finish).toBeTypeOf('function'),{timeout:5000});
 x.at(1500);expect(await x.wire.continue(x.continuation,signal())).toBe(true);expect(x.context.flow.isOpen()).toBe(true);expect(x.context.flow.available()).toBe(false);
 finish([{field:'style',value:'Loose sleeves'}]);expect((await incoming).status).toBe('applied');expect(x.context.flow.snapshot().notes.coverage.text).toBe('Loose sleeves');
 const r=await x.wire.handle(x.http('Loose sleeves'));expect(r.status).toBe(200);await r.text();
 }finally{await x.close();}},60000);
it('Clear during adoption removes prior input immediately and keeps the session empty',async()=>{const x=await continuingHttpFixture();try{
 await x.say('Long sleeves');const execute=x.ports.execute.getMockImplementation()!;let release!:()=>void;x.ports.execute.mockImplementationOnce(async(p,s)=>{await new Promise<void>(r=>release=r);return execute(p,s);});x.at(1500);
 const transition=x.wire.continue(x.continuation,signal());await vi.waitFor(()=>expect(release).toBeTypeOf('function'),{timeout:5000});const clearing=x.context.clear(x.request(),signal());expect(await clearing).toBe(true);expect(x.transcript.currentInput()).toBeNull();release();
 expect(await transition).toBe(true);expect(x.transcript.currentInput()).toBeNull();expect(Object.values(x.context.flow.snapshot().notes).every(n=>n.text==='')).toBe(true);
 expect((await x.wire.handle(x.http('Long sleeves'))).status).toBe(409);expect(await x.records()).toHaveLength(0);
 }finally{await x.close();}},60000);
it('account revocation after commit prevents notebook adoption and holds HTTP output',async()=>{const x=await continuingHttpFixture();try{
 await x.say('Long sleeves');const execute=x.ports.execute.getMockImplementation()!;x.ports.execute.mockImplementationOnce(async(p,s)=>{const r=await execute(p,s);x.revoke();return r;});x.at(1500);
 expect(await x.wire.continue(x.continuation,signal())).toBe(false);expect(x.wire.isHeld()).toBe(true);expect((await x.f.x.inspect()).revision).toBe(6);
 expect((await x.wire.handle(x.http('Long sleeves'))).status).toBe(410);expect(await x.records()).toHaveLength(0);
 }finally{await x.close();}},60000);
it('post-commit expiry releases queued work as refused without restoring cleared input',async()=>{const x=await continuingHttpFixture();try{
 await x.say('Long sleeves');const execute=x.ports.execute.getMockImplementation()!;let release!:()=>void;x.ports.execute.mockImplementationOnce(async(p,s)=>{await new Promise<void>(r=>release=r);const r=await execute(p,s);x.at(9000);return r;});x.at(1500);
 const transition=x.wire.continue(x.continuation,signal());await vi.waitFor(()=>expect(release).toBeTypeOf('function'),{timeout:5000});const incoming=x.say('Loose sleeves');release();
 expect(await transition).toBe(false);expect((await incoming).status).not.toBe('applied');expect(x.wire.isHeld()).toBe(true);expect(x.transcript.currentInput()).toBeNull();expect(Object.values(x.context.flow.snapshot().notes).every(n=>n.text==='')).toBe(true);expect((await x.f.x.inspect()).revision).toBe(6);
 }finally{await x.close();}},60000);
it('an unauthorized app request cannot start continuation or erase authorized notes',async()=>{const x=await continuingHttpFixture();try{
 await x.say('Long sleeves');const foreign=x.makeWire(new Request('https://app.example.test/notebook',{headers:{authorization:'Bearer other'}}));x.at(1500);
 expect(await foreign.continue(x.continuation,signal())).toBe(false);expect(x.ports.execute).not.toHaveBeenCalled();expect(x.context.flow.snapshot().notes.coverage.text).toBe('Long sleeves');expect(x.wire.isHeld()).toBe(false);
 expect(await x.wire.continue(x.continuation,signal())).toBe(true);
 }finally{await x.close();}},60000);
it('bounded waiting reads cannot starve adoption or close the updated notebook',async()=>{const x=await continuingHttpFixture();try{
 await x.say('Long sleeves');const l=x.f.nativeLease(),old={storeId:l.storeId,generation:l.generation,ownerDigest:l.ownerDigest,bootDigest:l.bootDigest,expiresAt:l.expiresAt,minimumRevision:4};
 const execute=x.ports.execute.getMockImplementation()!;let release!:()=>void;x.ports.execute.mockImplementationOnce(async(p,s)=>{await new Promise<void>(r=>release=r);return execute(p,s);});x.at(1500);
 const transition=x.wire.continue(x.continuation,signal());await vi.waitFor(()=>expect(release).toBeTypeOf('function'),{timeout:5000});
 const waiting=Array.from({length:7},()=>x.context.checkpoint.inspectOwnerFresh(old,signal()).catch(()=>null));await expect(x.context.checkpoint.inspectOwnerFresh(old,signal())).rejects.toThrow();release();
 expect(await transition).toBe(true);expect((await Promise.all(waiting)).every(v=>v===null)).toBe(true);expect(x.context.flow.isOpen()).toBe(true);expect(x.context.flow.snapshot().notes.coverage.text).toBe('Long sleeves');
 }finally{await x.close();}},60000);
it('End during adoption clears immediately and a later commit cannot reopen the session',async()=>{const x=await continuingHttpFixture();try{
 await x.say('Long sleeves');const execute=x.ports.execute.getMockImplementation()!;let release!:()=>void;x.ports.execute.mockImplementationOnce(async(p,s)=>{await new Promise<void>(r=>release=r);return execute(p,s);});x.at(1500);
 const transition=x.wire.continue(x.continuation,signal());await vi.waitFor(()=>expect(release).toBeTypeOf('function'),{timeout:5000});expect(await x.context.end(x.request(),signal())).toBe(true);
 expect(x.context.flow.isOpen()).toBe(false);expect(x.transcript.currentInput()).toBeNull();expect(Object.values(x.context.flow.snapshot().notes).every(n=>n.text==='')).toBe(true);release();
 expect(await transition).toBe(false);expect(x.wire.isHeld()).toBe(true);expect((await x.f.x.inspect()).revision).toBe(6);expect(await x.records()).toHaveLength(0);
 }finally{await x.close();}},60000);
it('four waiting ordinary commands cannot block immediate authenticated Clear',async()=>{const x=await continuingHttpFixture();try{
 await x.say('Long sleeves');const execute=x.ports.execute.getMockImplementation()!;let release!:()=>void;x.ports.execute.mockImplementationOnce(async(p,s)=>{await new Promise<void>(r=>release=r);return execute(p,s);});x.at(1500);
 const transition=x.wire.continue(x.continuation,signal());await vi.waitFor(()=>expect(release).toBeTypeOf('function'),{timeout:5000});
 const waiting=Array.from({length:4},()=>x.context.snapshot(x.request(),signal()));await new Promise(r=>setTimeout(r,20));expect(await x.context.clear(x.request(),signal())).toBe(true);
 expect(x.transcript.currentInput()).toBeNull();expect(Object.values(x.context.flow.snapshot().notes).every(n=>n.text==='')).toBe(true);release();
 expect(await transition).toBe(true);await Promise.all(waiting);expect(x.context.flow.isOpen()).toBe(true);expect(Object.values(x.context.flow.snapshot().notes).every(n=>n.text==='')).toBe(true);
 }finally{await x.close();}},60000);
