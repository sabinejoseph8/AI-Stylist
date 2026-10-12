import {createHash} from 'node:crypto';
import {expect,it,vi} from 'vitest';
import {createMediaReadHandler,type MediaReadPorts} from '../src/server/media-read.ts';
const owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const other='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const bytes=Uint8Array.from(Buffer.from('RIFFxxxxWEBPsynthetic'));
const checksum=createHash('sha256').update(bytes).digest('hex');
const origin='https://stylist.example';
const url=`${origin}/api/media/${id}`;
const record=()=>({id,ownerId:owner,key:`${owner}/${id}.webp`,checksum,state:'ready',deletionToken:null});
function setup(changes:Partial<MediaReadPorts>={},deadline=10000){
 const isCurrent=vi.fn(async()=>true);
 const ports={authorize:vi.fn(async()=>({ownerId:owner,isCurrent})),read:vi.fn(async()=>record()),
 download:vi.fn(async()=>({bytes:Uint8Array.from(bytes),contentType:'image/webp',checksum})),...changes};
 return {ports,isCurrent,handle:createMediaReadHandler(origin,ports,deadline)};
}
it('returns exact bytes only after current-session and ready-record checks',async()=>{
 const {ports,isCurrent,handle}=setup();const response=await handle(new Request(url));
 expect(response.status).toBe(200);expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
 expect(ports.read).toHaveBeenCalledTimes(2);expect(isCurrent).toHaveBeenCalledTimes(2);
 expect(ports.download).toHaveBeenCalledWith(`${owner}/${id}.webp`,expect.any(AbortSignal));
 expect(response.headers.get('cache-control')).toContain('no-store');expect(response.headers.get('vary')).toBe('Cookie, Authorization');
 expect(response.headers.get('cross-origin-resource-policy')).toBe('same-origin');expect(response.headers.get('x-content-type-options')).toBe('nosniff');
 expect(response.headers.has('location')).toBe(false);expect(response.headers.has('access-control-allow-origin')).toBe(false);
});
it('does not read data or Storage when authentication is unavailable',async()=>{
 const {ports,handle}=setup({authorize:async()=>null});expect((await handle(new Request(url))).status).toBe(404);
 expect(ports.read).not.toHaveBeenCalled();expect(ports.download).not.toHaveBeenCalled();
});
it('checks identity anew when the same URL is copied to another customer',async()=>{
 const current=vi.fn(async()=>true);let actor=owner;
 const {ports,handle}=setup({authorize:async()=>({ownerId:actor,isCurrent:current}),read:async(_id,who)=>who===owner?record():null});
 expect((await handle(new Request(url))).status).toBe(200);actor=other;
 expect((await handle(new Request(url))).status).toBe(404);expect(ports.download).toHaveBeenCalledTimes(1);
});
it('rejects foreign records even if an injected data port returns them',async()=>{
 const {ports,handle}=setup({authorize:async()=>({ownerId:other,isCurrent:async()=>true})});
 expect((await handle(new Request(url))).status).toBe(404);expect(ports.download).not.toHaveBeenCalled();
});
it('rejects URL credentials, wrong origin, unsafe path, methods, ranges and cross-site reads before auth',async()=>{
 const {ports,handle}=setup();
 for(const request of [new Request(url+'?token=unsafe'),new Request('https://other.example/api/media/'+id),new Request(origin+'/api/media/'+ '-'.repeat(36)),
 new Request(url,{method:'POST'}),new Request(url,{headers:{range:'bytes=0-2'}}),new Request(url,{headers:{origin:'https://other.example'}}),new Request(url,{headers:{'sec-fetch-site':'cross-site'}})])expect((await handle(request)).status).not.toBe(200);
 expect(ports.authorize).not.toHaveBeenCalled();
});
it('refuses staged, deleting, deleted, foreign-path and malformed metadata',async()=>{
 for(const patch of [{state:'staged'},{state:'deleting'},{state:'deleted'},{key:`${other}/${id}.webp`},{checksum:'bad'},{deletionToken:id},{extra:true}]){
  const {ports,handle}=setup({read:async()=>({...record(),...patch})});expect((await handle(new Request(url))).status).toBe(404);expect(ports.download).not.toHaveBeenCalled();
 }
});
it('holds incorrect checksums, MIME, image signatures and excessive bytes',async()=>{
 for(const patch of [{checksum:'0'.repeat(64)},{contentType:'image/png'},{bytes:Uint8Array.from(Buffer.from('not a real image'))},{bytes:new Uint8Array(10*1024*1024+1)}]){
  const {handle}=setup({download:async()=>({bytes,contentType:'image/webp',checksum,...patch})});expect((await handle(new Request(url))).status).toBe(404);
 }
});
it('supports ready legacy JPEG metadata without publishing a storage URL',async()=>{
 const legacy=Uint8Array.from([255,216,255,...Array(20).fill(0)]);const digest=createHash('sha256').update(legacy).digest('hex');
 const {handle}=setup({read:async()=>({...record(),key:`${owner}/legacy.jpg`,checksum:null}),download:async()=>({bytes:legacy,contentType:'image/jpeg',checksum:digest})});
 const response=await handle(new Request(url));expect(response.status).toBe(200);expect(response.headers.get('content-type')).toBe('image/jpeg');
});
it('refuses deletion or metadata changes while bytes are downloading',async()=>{
 let reads=0;const {handle}=setup({read:async()=>++reads===1?record():({...record(),state:'deleting',deletionToken:id})});
 expect((await handle(new Request(url))).status).toBe(404);
});
it('refuses session revocation before or during download',async()=>{
 const early=setup();early.isCurrent.mockResolvedValue(false);expect((await early.handle(new Request(url))).status).toBe(404);expect(early.ports.download).not.toHaveBeenCalled();
 const late=setup();late.isCurrent.mockResolvedValueOnce(true).mockResolvedValueOnce(false);expect((await late.handle(new Request(url))).status).toBe(404);
});
it('bounds a stalled authentication gate and aborts its signal',async()=>{
 let captured:AbortSignal|undefined;const {handle}=setup({authorize:async(_r,signal)=>{captured=signal;return await new Promise(()=>{});}},15);
 expect((await handle(new Request(url))).status).toBe(404);expect(captured?.aborted).toBe(true);
});
it('aborts an in-flight download when the request is canceled and discards late bytes',async()=>{
 let resolve!:(x:{bytes:Uint8Array;contentType:string;checksum:string})=>void;let signal:AbortSignal|undefined;
 let startedResolve!:()=>void;const started={promise:new Promise<void>(r=>{startedResolve=r;}),resolve:()=>startedResolve()};const {handle}=setup({download:async(_key,s)=>{signal=s;started.resolve();return await new Promise(r=>{resolve=r;});}});
 const controller=new AbortController();const response=handle(new Request(url,{signal:controller.signal}));await started.promise;controller.abort();
 expect((await response).status).toBe(404);expect(signal?.aborted).toBe(true);resolve({bytes,contentType:'image/webp',checksum});
});
it('copies verified bytes so a data port cannot mutate the returned body later',async()=>{
 const original=Uint8Array.from(bytes);const {handle}=setup({download:async()=>({bytes:original,contentType:'image/webp',checksum})});
 const response=await handle(new Request(url));original.fill(0);expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
});
it('redacts data and authentication failures with an uncached empty response',async()=>{
 const {handle}=setup({read:async()=>{throw Error('private details');}});const response=await handle(new Request(url));
 expect(response.status).toBe(404);expect(await response.text()).toBe('');expect(response.headers.get('cache-control')).toContain('no-store');
});
it('rejects invalid configuration and does not accept unverified identity strings',async()=>{
 const x=setup();expect(()=>createMediaReadHandler(origin+'/extra',x.ports)).toThrow();
 const {handle}=setup({authorize:async()=>({ownerId:'wrong',isCurrent:async()=>true})});expect((await handle(new Request(url))).status).toBe(404);
});

it('bounds simultaneous image requests and releases admission after cancellation',async()=>{
 const {ports,handle}=setup({authorize:async(_request,signal)=>await new Promise(resolve=>signal.addEventListener('abort',()=>resolve(null),{once:true}))});
 const controllers=Array.from({length:4},()=>new AbortController());
 const pending=controllers.map(c=>handle(new Request(url,{signal:c.signal})));
 const response=await handle(new Request(url));expect(response.status).toBe(429);expect(response.headers.get('retry-after')).toBe('1');
 for(const c of controllers)c.abort();await Promise.all(pending);
 ports.authorize=async()=>null;expect((await handle(new Request(url))).status).toBe(404);
});
