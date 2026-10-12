import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { createPrototypeServer } from '../src/server.ts';
import type { RecoverySpokenService } from '../src/recovery-spoken-service.ts';
let server:Server;
afterEach(async()=>{server?.closeAllConnections();if(server)await new Promise<void>(resolve=>server.close(()=>resolve()));});
async function fixture(enabled=true){
 const service={heartbeat:vi.fn(),snapshot:vi.fn(()=>({state:'idle'})),start:vi.fn(),replace:vi.fn(),end:vi.fn(),connect:vi.fn(),turn:vi.fn(),confirmHeard:vi.fn()};
 server=createPrototypeServer(enabled?{recovery:service as unknown as RecoverySpokenService}:{});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const a=server.address();if(!a||typeof a==='string')throw Error();const base=`http://127.0.0.1:${a.port}`;
 const identity=await fetch(base+'/api/status');const cookie=identity.headers.get('set-cookie')!.split(';')[0]!;
 const post=(action:string,body:object={sessionId:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'},origin=base)=>fetch(base+'/api/recovery/'+action,{method:'POST',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
 return {base,cookie,service,post};
}
describe('private recovery routes, simulated services',()=>{
 it('is disabled by default and rejects ownerless requests',async()=>{
 const f=await fixture(false);expect((await f.post('start')).status).toBe(423);
 expect((await fetch(f.base+'/api/recovery/status')).status).toBe(403);
 });
 it('routes replacement only to the dedicated service after origin and body checks',async()=>{
 const f=await fixture();expect((await f.post('replace')).status).toBe(200);expect(f.service.replace).toHaveBeenCalledOnce();
 expect((await f.post('replace',undefined,'https://foreign.test')).status).toBe(403);
 expect((await f.post('replace',{sessionId:'x',rendererStopped:true})).status).toBe(400);
 expect(f.service.replace).toHaveBeenCalledOnce();expect((await f.post('unknown')).status).toBe(404);
 });
 it('does not expose a missing allowance or provider failure detail',async()=>{
 const f=await fixture();expect((await fetch(f.base+'/api/recovery/allowance',{headers:{Cookie:f.cookie}})).status).toBe(423);
 f.service.replace.mockRejectedValue(Error('private detail'));const response=await f.post('replace');expect(response.status).toBe(409);expect(await response.text()).not.toContain('private detail');
 });
});
