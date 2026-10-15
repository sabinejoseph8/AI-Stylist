import {createHash,randomBytes} from 'node:crypto';
import type {createTokenRecoveryOwner} from './account-recovery.ts';
const cookieName='__Host-stylist_recovery_confirm';
const attributes='Path=/; Secure; HttpOnly; SameSite=Strict';
const opaque=/^[A-Za-z0-9_-]{43}$/;
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
/** Receiving-browser binding. Landing never verifies an email token or grants account access.
 * A host must render the confirmation nonce in its no-store, no-referrer page and redact the landing URL. */
export function createRecoveryConfirmation(origin:string,owner:Pick<ReturnType<typeof createTokenRecoveryOwner>,'confirm'>){
 const base=new URL(origin);
 if(base.protocol!=='https:'||base.origin!==origin||typeof owner?.confirm!=='function')throw Error('Recovery unavailable');
 const entries=new Map<string,{proof:string;nonce:string;expires:number}>();
 const active=new Map<string,AbortController>();
 let closed=false;
 const clear=()=>`${cookieName}=; ${attributes}; Max-Age=0`;
 function sweep(){for(const [key,value] of entries)if(value.expires<=Date.now())entries.delete(key);}
 function cookie(request:Request){
  const raw=request.headers.get('cookie');if(!raw||raw.length>18000)return null;
  let token:string|undefined;
  for(const part of raw.split(';')){const pair=part.trim(),split=pair.indexOf('=');if(split<1)return null;if(pair.slice(0,split)===cookieName){if(token!==undefined)return null;token=pair.slice(split+1);}}
  return token&&opaque.test(token)?hash(token):null;
 }
 function destination(request:Request,path:string){
  const url=new URL(request.url);
  return url.origin===origin&&url.pathname===path&&!url.hash&&!request.headers.has('authorization')&&(!request.headers.has('host')||request.headers.get('host')===base.host);
 }
 return Object.freeze({
  clear,
  close(){closed=true;entries.clear();for(const controller of active.values())controller.abort();},
  /** Accept only the fixed email landing URL; an email scanner cannot consume provider proof here. */
  begin(request:Request){
   sweep();
   if(closed||request.signal.aborted||request.method!=='GET'||!destination(request,'/account/recovery'))return null;
   const query=new URL(request.url).searchParams;
   if([...query.keys()].join(',')!=='token_hash')return null;
   const proof=query.get('token_hash');if(!proof||!/^[-_A-Za-z0-9]{1,256}$/.test(proof))return null;
   const previous=cookie(request);if(previous){entries.delete(previous);active.get(previous)?.abort();}
   if(entries.size>=128)return null;
   const token=randomBytes(32).toString('base64url'),nonce=randomBytes(32).toString('base64url');
   entries.set(hash(token),{proof,nonce:hash(nonce),expires:Date.now()+300000});
   return Object.freeze({confirmation:nonce,setCookie:`${cookieName}=${token}; ${attributes}; Max-Age=300`});
  },
  /** Call only after a bounded HTTP body reader. Claim before awaiting provider verification. */
  async confirm(request:Request,input:unknown,signal:AbortSignal){
   sweep();const unavailable={status:'unavailable' as const};
   const site=request.headers.get('sec-fetch-site'),url=new URL(request.url);
   if(closed||signal.aborted||request.signal.aborted||request.method!=='POST'||!destination(request,'/api/account/recovery-confirm')||url.search||request.headers.get('origin')!==origin||(site!==null&&site!=='same-origin'&&site!=='none'))return unavailable;
   if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).join(',')!=='confirmation')return unavailable;
   const nonce=(input as {confirmation:unknown}).confirmation;
   if(typeof nonce!=='string'||!opaque.test(nonce))return unavailable;
   const key=cookie(request),entry=key?entries.get(key):undefined;
   if(!key||!entry||entry.nonce!==hash(nonce))return unavailable;
   entries.delete(key);
   const controller=new AbortController();active.set(key,controller);
   const scope=AbortSignal.any([signal,request.signal,controller.signal]);
   try{
    const result=await owner.confirm(entry.proof,scope);
    if(closed||scope.aborted||Date.now()>=entry.expires){
     if(result.status==='resetRequired')try{await result.discard();}catch{}
     return unavailable;
    }
    return result;
   }finally{if(active.get(key)===controller)active.delete(key);}
  }
 });
}
