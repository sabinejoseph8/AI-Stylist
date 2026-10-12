import {it,expect,vi} from 'vitest';
import {EventEmitter} from 'node:events';
import {createServer,get} from 'node:http';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {prepareAccountRuntime} from '../src/server/account-runtime.ts';
it('composes actual build, host, maintenance, network and signal cleanup explicitly',async()=>{
 const root=await mkdtemp(join(tmpdir(),'stylist-runtime-'));let runtime:Awaited<ReturnType<typeof prepareAccountRuntime>>|undefined;
 const probe=createServer();await new Promise<void>(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=(probe.address() as {port:number}).port;await new Promise<void>(resolve=>probe.close(()=>resolve()));
 try{
  await mkdir(join(root,'assets'));await writeFile(join(root,'account.html'),'<meta name="stylist-project-origin" content="">');await writeFile(join(root,'assets','account-123.js'),'export {};');
  const send=vi.fn(async()=>Response.json(0)),signals=new EventEmitter(),report=vi.fn();
  const env={ACCOUNT_APP_ORIGIN:'https://stylist.test',SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_SECRET_KEY:'synthetic-server-key-only',ACCOUNT_REFRESH_ACTIVE_KEY_ID:'fixture',ACCOUNT_REFRESH_KEYS:JSON.stringify({fixture:Buffer.alloc(32,1).toString('base64url')}),PORT:String(port),ACCOUNT_BUILD_DIRECTORY:root};
  // HTTP is confined to this loopback rehearsal; it does not establish a production proxy trust policy.
  runtime=await prepareAccountRuntime(env,send,createServer,signals,report);expect(send).not.toHaveBeenCalled();expect(runtime.health().status).toBe('inactive');
  expect(await runtime.start()).toBe(true);expect(send).toHaveBeenCalledTimes(1);
  const reply=await new Promise<{status:number;body:string}>((resolve,reject)=>{get({hostname:'127.0.0.1',port,path:'/account',headers:{host:'stylist.test'}},response=>{let body='';response.on('data',chunk=>body+=chunk);response.on('end',()=>resolve({status:response.statusCode!,body}));}).on('error',reject);});
  expect(reply.status).toBe(200);expect(reply.body).toContain('https://fixture.supabase.co');
  signals.emit('SIGTERM');expect(await runtime.close()).toBe(true);expect(runtime.health().status).toBe('closed');expect(report).toHaveBeenCalledExactlyOnceWith(true);expect(signals.listenerCount('SIGINT')).toBe(0);
 }finally{await runtime?.close();await rm(root,{recursive:true,force:true});}
});
