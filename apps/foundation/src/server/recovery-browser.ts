import {createHash,randomBytes} from 'node:crypto';
import type {RecoveryGrant} from './account-recovery.ts';
const name='__Host-stylist_reset',attributes='Path=/; Secure; HttpOnly; SameSite=Strict';
const opaque=/^[A-Za-z0-9_-]{43}$/;
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
/** Process-local delivery only. A trusted caller installs a provider-verified grant, never browser JSON. */
export function createRecoveryBrowser(origin:string,cleanupDeadlineMs=8000){
 const base=new URL(origin);if(base.protocol!=='https:'||base.origin!==origin||!Number.isSafeInteger(cleanupDeadlineMs)||cleanupDeadlineMs<1||cleanupDeadlineMs>8000)throw Error('Recovery unavailable');
 const entries=new Map<string,{grant:RecoveryGrant;expires:number}>();
 let held=false,closed=false;let closure:Promise<boolean>|undefined;
 const active=new Set<RecoveryGrant>(),resetControllers=new Map<RecoveryGrant,AbortController>();
 const cleanups=new WeakMap<RecoveryGrant,Promise<boolean>>();
 const clear=()=>`${name}=; ${attributes}; Max-Age=0`;
 function discard(grant:RecoveryGrant){
  const old=cleanups.get(grant);if(old)return old;
  resetControllers.get(grant)?.abort();let timer:ReturnType<typeof setTimeout>|undefined;
  const work=Promise.race([Promise.resolve().then(()=>grant.discard()).then(ok=>ok===true),new Promise<boolean>(resolve=>{timer=setTimeout(()=>resolve(false),cleanupDeadlineMs);})]).catch(()=>false).then(ok=>{active.delete(grant);if(!ok)held=true;return ok;}).finally(()=>{if(timer)clearTimeout(timer);});cleanups.set(grant,work);return work;
 }
 function sweep(){const work:Promise<boolean>[]=[];for(const [key,item] of entries)if(item.expires<=Date.now()){entries.delete(key);work.push(discard(item.grant));}return work;}
 return Object.freeze({
  clear,cleanupHeld:()=>held,
  async expire(){const results=await Promise.all(sweep());return results.every(Boolean)&&!held;},
  close(){if(closure)return closure;closed=true;entries.clear();closure=Promise.all(Array.from(active,discard)).then(results=>results.every(Boolean)&&!held);return closure;},
  install(grant:RecoveryGrant){
   sweep();if(closed||held||active.size>=128||!grant||grant.status!=='resetRequired'||typeof grant.reset!=='function'||typeof grant.discard!=='function'||!Number.isSafeInteger(grant.expiresAt)||grant.expiresAt<=Date.now()||cleanups.has(grant)||active.has(grant))throw Error('Recovery unavailable');
   const token=randomBytes(32).toString('base64url'),key=hash(token),expires=Math.min(grant.expiresAt,Date.now()+300000);entries.set(key,{grant,expires});active.add(grant);
   return Object.freeze({setCookie:`${name}=${token}; ${attributes}; Max-Age=${Math.max(1,Math.floor((expires-Date.now())/1000))}`,
    discard(){entries.delete(key);return discard(grant);}});
  },
  /** Readiness is presentation metadata only; submit still independently consumes authority. */
  async readiness(request:Request,signal:AbortSignal):Promise<Readonly<{status:'resetReady';expiresAt:number}>|Readonly<{status:'unavailable'}>>{
   const unavailable={status:'unavailable' as const};
   try{
    const url=new URL(request.url),site=request.headers.get('sec-fetch-site');
    if(closed||held||signal.aborted||request.signal.aborted||request.method!=='POST'||url.origin!==origin||url.pathname!=='/api/account/reset-ready'||url.search||url.hash||request.headers.get('origin')!==origin||request.headers.has('authorization')||(request.headers.has('host')&&request.headers.get('host')!==base.host)||(site!==null&&site!=='same-origin'&&site!=='none'))return unavailable;
    const raw=request.headers.get('cookie');if(!raw||raw.length>18000)return unavailable;let token:string|undefined;
    for(const part of raw.split(';')){const pair=part.trim(),split=pair.indexOf('=');if(split<1)return unavailable;if(pair.slice(0,split)===name){if(token!==undefined)return unavailable;token=pair.slice(split+1);}}
    if(!token||!opaque.test(token))return unavailable;
    const key=hash(token),item=entries.get(key);if(!item)return unavailable;
    if(item.expires<=Date.now()){entries.delete(key);await discard(item.grant);return unavailable;}
    return Object.freeze({status:'resetReady' as const,expiresAt:item.expires});
   }catch{return unavailable;}
  },
  async submit(request:Request,input:unknown,signal:AbortSignal){
   const unavailable=Object.freeze({status:'unavailable' as const,setCookie:null});
   try{
    const url=new URL(request.url),site=request.headers.get('sec-fetch-site');
    if(closed||held||signal.aborted||request.signal.aborted||request.method!=='POST'||url.origin!==origin||url.pathname!=='/api/account/reset'||url.search||url.hash||request.headers.get('origin')!==origin||request.headers.has('authorization')||(request.headers.has('host')&&request.headers.get('host')!==base.host)||(site!==null&&site!=='same-origin'&&site!=='none'))return unavailable;
    if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).sort().join(',')!=='confirmation,password')return unavailable;
    const x=input as Record<string,unknown>;if(typeof x.password!=='string'||x.password.length<1||x.password.length>4096||x.password!==x.confirmation)return unavailable;
    const raw=request.headers.get('cookie');if(!raw||raw.length>18000)return unavailable;let token:string|undefined;
    for(const part of raw.split(';')){const pair=part.trim(),split=pair.indexOf('=');if(split<1)return unavailable;if(pair.slice(0,split)===name){if(token!==undefined)return unavailable;token=pair.slice(split+1);}}
    if(!token||!opaque.test(token))return unavailable;
    const key=hash(token),item=entries.get(key);if(!item)return unavailable;
    entries.delete(key); // Claim atomically before asynchronous reset.
    if(item.expires<=Date.now()){await discard(item.grant);return {status:'unavailable' as const,setCookie:clear()};}
    const controller=new AbortController(),stop=()=>controller.abort();signal.addEventListener('abort',stop,{once:true});request.signal.addEventListener('abort',stop,{once:true});resetControllers.set(item.grant,controller);
    try{const result=await item.grant.reset(x.password,controller.signal);resetControllers.delete(item.grant);const cleaned=await discard(item.grant);return {status:result.status==='resetComplete'&&cleaned&&!controller.signal.aborted?'resetComplete' as const:'unconfirmed' as const,setCookie:clear()};}
    catch{await discard(item.grant);return {status:'unconfirmed' as const,setCookie:clear()};}
    finally{resetControllers.delete(item.grant);signal.removeEventListener('abort',stop);request.signal.removeEventListener('abort',stop);}
   }catch{return unavailable;}
  },
 });
}
