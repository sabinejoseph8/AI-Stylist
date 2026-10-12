import {createHash,randomBytes} from 'node:crypto';
import type {RecoveryGrant} from './account-recovery.ts';
const name='__Host-stylist_reset',attributes='Path=/; Secure; HttpOnly; SameSite=Strict';
const opaque=/^[A-Za-z0-9_-]{43}$/;
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
/** Process-local delivery only. A trusted caller installs a provider-verified grant, never browser JSON. */
export function createRecoveryBrowser(origin:string){
 const base=new URL(origin);if(base.protocol!=='https:'||base.origin!==origin)throw Error('Recovery unavailable');
 const entries=new Map<string,{grant:RecoveryGrant;expires:number}>();
 let held=false;
 const cleanups=new WeakMap<RecoveryGrant,Promise<boolean>>();
 const clear=()=>`${name}=; ${attributes}; Max-Age=0`;
 function discard(grant:RecoveryGrant){
  const old=cleanups.get(grant);if(old)return old;
  const work=Promise.resolve().then(()=>grant.discard()).then(ok=>{if(ok!==true)held=true;return ok===true;}).catch(()=>{held=true;return false;});cleanups.set(grant,work);return work;
 }
 function sweep(){for(const [key,item] of entries)if(item.expires<=Date.now()){entries.delete(key);void discard(item.grant);}}
 return Object.freeze({
  clear,cleanupHeld:()=>held,
  install(grant:RecoveryGrant){
   sweep();if(held||entries.size>=128||!grant||grant.status!=='resetRequired'||typeof grant.reset!=='function'||typeof grant.discard!=='function'||!Number.isSafeInteger(grant.expiresAt)||grant.expiresAt<=Date.now()||cleanups.has(grant)||Array.from(entries.values()).some(x=>x.grant===grant))throw Error('Recovery unavailable');
   const token=randomBytes(32).toString('base64url'),key=hash(token),expires=Math.min(grant.expiresAt,Date.now()+300000);entries.set(key,{grant,expires});
   return Object.freeze({setCookie:`${name}=${token}; ${attributes}; Max-Age=${Math.max(1,Math.floor((expires-Date.now())/1000))}`,
    discard(){entries.delete(key);return discard(grant);}});
  },
  async submit(request:Request,input:unknown,signal:AbortSignal){
   const unavailable=Object.freeze({status:'unavailable' as const,setCookie:null});
   try{
    const url=new URL(request.url),site=request.headers.get('sec-fetch-site');
    if(held||signal.aborted||request.signal.aborted||request.method!=='POST'||url.origin!==origin||url.pathname!=='/api/account/reset'||url.search||url.hash||request.headers.get('origin')!==origin||request.headers.has('authorization')||(request.headers.has('host')&&request.headers.get('host')!==base.host)||(site!==null&&site!=='same-origin'&&site!=='none'))return unavailable;
    if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).sort().join(',')!=='confirmation,password')return unavailable;
    const x=input as Record<string,unknown>;if(typeof x.password!=='string'||x.password.length<1||x.password.length>4096||x.password!==x.confirmation)return unavailable;
    const raw=request.headers.get('cookie');if(!raw||raw.length>18000)return unavailable;let token:string|undefined;
    for(const part of raw.split(';')){const pair=part.trim(),split=pair.indexOf('=');if(split<1)return unavailable;if(pair.slice(0,split)===name){if(token!==undefined)return unavailable;token=pair.slice(split+1);}}
    if(!token||!opaque.test(token))return unavailable;
    const key=hash(token),item=entries.get(key);if(!item)return unavailable;
    entries.delete(key); // Claim atomically before asynchronous reset.
    if(item.expires<=Date.now()){await discard(item.grant);return {status:'unavailable' as const,setCookie:clear()};}
    const controller=new AbortController(),stop=()=>controller.abort();signal.addEventListener('abort',stop,{once:true});request.signal.addEventListener('abort',stop,{once:true});
    try{const result=await item.grant.reset(x.password,controller.signal);const cleaned=await discard(item.grant);return {status:result.status==='resetComplete'&&cleaned&&!controller.signal.aborted?'resetComplete' as const:'unconfirmed' as const,setCookie:clear()};}
    catch{await discard(item.grant);return {status:'unconfirmed' as const,setCookie:clear()};}
    finally{signal.removeEventListener('abort',stop);request.signal.removeEventListener('abort',stop);}
   }catch{return unavailable;}
  },
 });
}
