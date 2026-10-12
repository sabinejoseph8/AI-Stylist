import {it,expect,vi} from 'vitest';
import {createServer,get,type RequestListener} from 'node:http';
import {connect} from 'node:net';
import {createAccountNetwork} from '../src/server/account-network.ts';
function app(){return {handle:vi.fn((_q,r)=>{r.end('account');}),start:vi.fn(async()=>true),close:vi.fn(async()=>true)};}
it('starts only explicitly, listens once, delivers requests and closes idempotently',async()=>{
 const application=app(),factory=vi.fn((listener:RequestListener)=>createServer(listener)),network=createAccountNetwork(application,factory);
 expect(network.health().status).toBe('inactive');expect(factory).not.toHaveBeenCalled();expect(application.start).not.toHaveBeenCalled();
 expect(await network.start(0,'127.0.0.1')).toBe(true);expect(await network.start(0,'127.0.0.1')).toBe(true);expect(factory).toHaveBeenCalledOnce();
 const body=await new Promise<string>((resolve,reject)=>{get('http://127.0.0.1:'+network.health().port,res=>{let text='';res.on('data',chunk=>text+=chunk);res.on('end',()=>resolve(text));}).on('error',reject);});expect(body).toBe('account');
 expect(await network.close()).toBe(true);expect(await network.close()).toBe(true);expect(network.health().status).toBe('closed');expect(await network.start(0,'127.0.0.1')).toBe(false);
});
it('refuses maintenance failure and invalid bind parameters before sockets',async()=>{
 const application=app(),factory=vi.fn((listener:RequestListener)=>createServer(listener)),network=createAccountNetwork(application,factory);expect(await network.start(-1,'127.0.0.1')).toBe(false);expect(await network.start(0,'foreign.test')).toBe(false);expect(application.start).not.toHaveBeenCalled();application.start.mockResolvedValue(false);expect(await network.start(0,'127.0.0.1')).toBe(false);expect(factory).not.toHaveBeenCalled();expect(application.close).toHaveBeenCalled();expect(await network.close()).toBe(true);
});
it('refuses a busy port and cleans the application',async()=>{
 const blocker=createServer();await new Promise<void>(resolve=>blocker.listen(0,'127.0.0.1',resolve));const address=blocker.address() as {port:number};const application=app(),network=createAccountNetwork(application,createServer);
 try{expect(await network.start(address.port,'127.0.0.1')).toBe(false);expect(network.health().status).toBe('failed');expect(application.close).toHaveBeenCalled();await network.close();}finally{await new Promise<void>(resolve=>blocker.close(()=>resolve()));}
});
it('bounds shutdown and destroys a connection that remains open',async()=>{
 let started!:()=>void;const handling=new Promise<void>(resolve=>started=resolve);const application=app();application.handle.mockImplementation(()=>{started();});
 const network=createAccountNetwork(application,createServer,30);await network.start(0,'127.0.0.1');const socket=connect(network.health().port!,'127.0.0.1');socket.on('error',()=>{});await new Promise<void>(resolve=>socket.once('connect',resolve));const closed=new Promise<void>(resolve=>socket.once('close',()=>resolve()));socket.write('GET / HTTP/1.1\r\nHost: fixture\r\n\r\n');await handling;
 expect(await network.close()).toBe(false);await closed;expect(network.health().status).toBe('closed');expect(await network.close()).toBe(false);
});
it('prevents late startup after shutdown and after a startup deadline',async()=>{
 for(const stopEarly of [true,false]){let release!:(value:boolean)=>void;const application={...app(),start:vi.fn(()=>new Promise<boolean>(resolve=>release=resolve))};const factory=vi.fn((listener:RequestListener)=>createServer(listener)),network=createAccountNetwork(application,factory,10);const start=network.start(0,'127.0.0.1');if(stopEarly)expect(await network.close()).toBe(false);expect(await start).toBe(false);release(true);await new Promise(resolve=>setTimeout(resolve,0));expect(factory).not.toHaveBeenCalled();await network.close();}
});
it('contains rejected delivery errors and preserves uncertain application cleanup',async()=>{
 const application={...app(),handle:vi.fn(async()=>{throw Error('private failure');}),close:vi.fn(async()=>false)};const network=createAccountNetwork(application,createServer);await network.start(0,'127.0.0.1');
 try{const reply=await new Promise<{status:number;body:string}>((resolve,reject)=>{get('http://127.0.0.1:'+network.health().port,res=>{let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>resolve({status:res.statusCode!,body}));}).on('error',reject);});expect(reply).toEqual({status:503,body:''});}finally{expect(await network.close()).toBe(false);}
});

it('bounds cleanup after a runtime listener error',async()=>{
 const application=app();let server!:ReturnType<typeof createServer>;const network=createAccountNetwork(application,listener=>server=createServer(listener));await network.start(0,'127.0.0.1');server.emit('error',Error('synthetic listener failure'));expect(network.health().status).toBe('closed');expect(await network.close()).toBe(true);expect(application.close).toHaveBeenCalledOnce();
});
