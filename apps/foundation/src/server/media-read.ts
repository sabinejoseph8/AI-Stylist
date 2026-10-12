import {createHash} from 'node:crypto';

export interface VerifiedMediaAccess {
 readonly ownerId:string;
 /** Verified server-only session identifier when supplied by the cryptographic gate. */
 readonly sessionId?:string;
 /** Must check the current authenticated session, including sign-out/revocation. */
 isCurrent(signal:AbortSignal):Promise<boolean>;
}
export interface MediaReadPorts {
 /** Trusted server gate only. Do not derive identity from URL/body owner fields. */
 authorize(request:Request,signal:AbortSignal):Promise<VerifiedMediaAccess|null>;
 read(id:string,ownerId:string,signal:AbortSignal):Promise<unknown>;
 download(key:string,signal:AbortSignal):Promise<Readonly<{bytes:Uint8Array;contentType:string;checksum:string}>>;
}
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const hash=/^[a-f0-9]{64}$/;
const headers={
 'cache-control':'private, no-store, max-age=0',pragma:'no-cache',
 'x-content-type-options':'nosniff','referrer-policy':'no-referrer',
 'cross-origin-resource-policy':'same-origin',
 'content-security-policy':"default-src 'none'; sandbox",
 vary:'Cookie, Authorization',
};
function unavailable(status=404){return new Response(null,{status,headers});}
function ready(value:unknown,id:string,owner:string){
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const x=value as Record<string,unknown>;
 if(Object.keys(x).sort().join(',')!=='checksum,deletionToken,id,key,ownerId,state'||x.id!==id||x.ownerId!==owner||x.state!=='ready'||x.deletionToken!==null||
  typeof x.key!=='string'||!new RegExp(`^${owner}/[A-Za-z0-9_-]{1,128}\\.(webp|png|jpg|jpeg)$`).test(x.key)||
  (x.checksum!==null&&(typeof x.checksum!=='string'||!hash.test(x.checksum)||x.key!==`${owner}/${id}.webp`)))return null;
 return {key:x.key,checksum:x.checksum as string|null};
}
function signature(bytes:Uint8Array,type:string){
 const x=Buffer.from(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(type==='image/webp')return x.toString('ascii',0,4)==='RIFF'&&x.toString('ascii',8,12)==='WEBP';
 if(type==='image/png')return x.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 return type==='image/jpeg'&&x[0]===255&&x[1]===216&&x[2]===255;
}
/** Local-only interface preparation. No application route installs this handler. */
export function createMediaReadHandler(origin:string,ports:MediaReadPorts,deadlineMs=10000){
 const base=new URL(origin);
 if(!['https:','http:'].includes(base.protocol)||base.origin!==origin||base.username||base.password||
  !Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>10000||
  typeof ports?.authorize!=='function'||typeof ports?.read!=='function'||typeof ports?.download!=='function')throw Error('Media configuration unavailable');
 let active=0;
 return async function handle(request:Request):Promise<Response>{
  const url=new URL(request.url);
  if(url.origin!==origin||url.search||url.hash||!/^\/api\/media\/[a-f0-9-]{36}$/.test(url.pathname))return unavailable();
  if(request.method!=='GET')return unavailable(405);
  if(request.headers.has('range'))return unavailable(416);
  if((request.headers.has('origin')&&request.headers.get('origin')!==origin)||request.headers.get('sec-fetch-site')==='cross-site')return unavailable(403);
  const id=url.pathname.slice('/api/media/'.length);if(!uuid.test(id))return unavailable();
  if(active>=4)return new Response(null,{status:429,headers:{...headers,'retry-after':'1'}});
  active++;
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;
  let abort=()=>{};
  const stop=new Promise<never>((_,reject)=>{
   abort=()=>{controller.abort();reject(Error('aborted'));};
   timer=setTimeout(abort,deadlineMs);request.signal.addEventListener('abort',abort,{once:true});
  });
  const wait=<T>(value:Promise<T>)=>Promise.race([value,stop]);
  try{
   if(request.signal.aborted)return unavailable();
   const access=await wait(ports.authorize(request,controller.signal));
   if(!access||typeof access.ownerId!=='string'||!uuid.test(access.ownerId)||typeof access.isCurrent!=='function')return unavailable();
   const owner=access.ownerId;
   if(!await wait(access.isCurrent(controller.signal)))return unavailable();
   const asset=ready(await wait(ports.read(id,owner,controller.signal)),id,owner);
   if(!asset)return unavailable();
   const image=await wait(ports.download(asset.key,controller.signal));
   if(!(image?.bytes instanceof Uint8Array)||image.bytes.byteLength<12||image.bytes.byteLength>10*1024*1024||
    !['image/webp','image/jpeg','image/png'].includes(image.contentType)||typeof image.checksum!=='string'||!hash.test(image.checksum))return unavailable();
   // Copy once before validation, so an injected adapter cannot mutate the response later.
   const bytes=Uint8Array.from(image.bytes);
   const computed=createHash('sha256').update(bytes).digest('hex');
   const extension=asset.key.slice(asset.key.lastIndexOf('.')+1);
   const expected=extension==='jpg'||extension==='jpeg'?'image/jpeg':`image/${extension}`;
   if(image.contentType!==expected||!signature(bytes,image.contentType)||computed!==image.checksum||
    (asset.checksum!==null&&computed!==asset.checksum))return unavailable();
   // Refuse stale deletion/state changes and session revocation during download.
   const current=ready(await wait(ports.read(id,owner,controller.signal)),id,owner);
   if(!current||current.key!==asset.key||current.checksum!==asset.checksum||!await wait(access.isCurrent(controller.signal))||controller.signal.aborted)return unavailable();
   return new Response(bytes.buffer,{status:200,headers:{...headers,'content-type':image.contentType,
    'content-length':String(bytes.byteLength),'content-disposition':'inline; filename="wardrobe-image"'}});
  }catch{return unavailable();}
  finally{clearTimeout(timer!);request.signal.removeEventListener('abort',abort);controller.abort();active--;}
 };
}
