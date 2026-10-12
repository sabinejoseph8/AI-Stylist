import {expect,it,vi} from 'vitest';
import {startAccountHttps} from '../src/server/account-https-main.ts';
import {EventEmitter} from 'node:events';
it('refuses missing, relative and non-file TLS material without provider calls or signal wiring',async()=>{
 const send=vi.fn<typeof fetch>(),signals=new EventEmitter(),report=vi.fn();
 for(const env of [{},{ACCOUNT_TLS_KEY_FILE:'relative'},{ACCOUNT_TLS_KEY_FILE:'/private/tmp'}])await expect(startAccountHttps(env,send,signals,report)).rejects.toThrow('Account HTTPS startup unavailable');
 expect(send).not.toHaveBeenCalled();expect(report).not.toHaveBeenCalled();expect(signals.listenerCount('SIGTERM')).toBe(0);
});

it('starts the actual TLS entry, serves the fixed host and closes on a signal',async()=>{
 const {mkdtemp,mkdir,writeFile,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path'),{execFileSync}=await import('node:child_process'),{createServer}=await import('node:http'),{get}=await import('node:https');
 const root=await mkdtemp(join(tmpdir(),'stylist-https-entry-'));let runtime:Awaited<ReturnType<typeof startAccountHttps>>|undefined;
 const probe=createServer();await new Promise<void>(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=(probe.address() as {port:number}).port;await new Promise<void>(resolve=>probe.close(()=>resolve()));
 try{
  await mkdir(join(root,'assets'));await writeFile(join(root,'account.html'),'<meta name="stylist-project-origin" content="">');await writeFile(join(root,'assets','account-123.js'),'export {};');
  execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',join(root,'key.pem'),'-out',join(root,'cert.pem'),'-days','1','-subj','/CN=stylist.test'],{stdio:'ignore'});
  const env={ACCOUNT_APP_ORIGIN:'https://stylist.test',SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_SECRET_KEY:'synthetic-service-key-only',ACCOUNT_REFRESH_ACTIVE_KEY_ID:'fixture',ACCOUNT_REFRESH_KEYS:JSON.stringify({fixture:Buffer.alloc(32,1).toString('base64url')}),PORT:String(port),ACCOUNT_BUILD_DIRECTORY:root,ACCOUNT_TLS_KEY_FILE:join(root,'key.pem'),ACCOUNT_TLS_CERT_FILE:join(root,'cert.pem')},signals=new EventEmitter(),report=vi.fn();
  runtime=await startAccountHttps(env,async()=>Response.json(0),signals,report);
  const status=await new Promise<number>((resolve,reject)=>{get({hostname:'127.0.0.1',port,path:'/account',headers:{host:'stylist.test'},rejectUnauthorized:false},response=>{response.resume();response.on('end',()=>resolve(response.statusCode!));}).on('error',reject);});expect(status).toBe(200);
  signals.emit('SIGTERM');expect(await runtime.close()).toBe(true);expect(report).toHaveBeenCalledExactlyOnceWith(true);expect(signals.listenerCount('SIGINT')).toBe(0);
 }finally{await runtime?.close();await rm(root,{recursive:true,force:true});}
});
