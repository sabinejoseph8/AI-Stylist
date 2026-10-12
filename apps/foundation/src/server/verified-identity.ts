import {jwtVerify,type JWTVerifyGetKey} from 'jose';
import type {VerifiedMediaAccess} from './media-read.ts';
export interface ActiveAuthSession {active(ownerId:string,sessionId:string,signal:AbortSignal):Promise<boolean>}
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
/** Prepared cryptographic gate. Key resolver and authoritative session lookup are injected; no routes or credentials. */
export function createIdentityVerifier(projectUrl:string,keys:JWTVerifyGetKey,sessions:ActiveAuthSession,deadlineMs=8000){
 let issuer:string;
 try{const u=new URL(projectUrl);if(u.protocol!=='https:'||!/^([a-z0-9-]+)\.supabase\.co$/.test(u.hostname)||u.port||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw Error();issuer=u.origin+'/auth/v1';}
 catch{throw Error('Identity configuration unavailable');}
 if(typeof keys!=='function'||typeof sessions?.active!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Identity configuration unavailable');
 let admitted=0;
 async function bounded<T>(external:AbortSignal,work:(signal:AbortSignal)=>Promise<T>):Promise<T>{
  if(external.aborted||admitted>=4)throw Error();admitted++;
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;let abort!:()=>void;
  const relay=()=>controller.abort();external.addEventListener('abort',relay,{once:true});
  try{return await Promise.race([Promise.resolve().then(()=>{if(controller.signal.aborted)throw Error();return work(controller.signal);}).finally(()=>{admitted--;}),new Promise<never>((_,reject)=>{
   abort=()=>reject(Error());controller.signal.addEventListener('abort',abort,{once:true});timer=setTimeout(()=>controller.abort(),deadlineMs);
  })]);}finally{if(timer)clearTimeout(timer);external.removeEventListener('abort',relay);controller.signal.removeEventListener('abort',abort);}
 }
 async function verify(token:string,signal:AbortSignal,recovery=false):Promise<(VerifiedMediaAccess&{expiresAt?:number})|null>{
  if(typeof token!=='string'||token.length>16384||!/^[-_A-Za-z0-9]+\.[-_A-Za-z0-9]+\.[-_A-Za-z0-9]+$/.test(token))return null;
  try{return await bounded(signal,async scope=>{
   const {payload,protectedHeader}=await jwtVerify(token,keys,{issuer,audience:'authenticated',algorithms:['ES256','RS256'],requiredClaims:['exp','iat','sub','session_id','role']});
   if(scope.aborted||typeof protectedHeader.kid!=='string'||protectedHeader.kid.length<1||protectedHeader.kid.length>128||
    typeof payload.sub!=='string'||!uuid.test(payload.sub)||typeof payload.session_id!=='string'||!uuid.test(payload.session_id)||
    payload.role!=='authenticated'||payload.is_anonymous!==false||!Number.isSafeInteger(payload.exp)||!Number.isSafeInteger(payload.iat)||
    (payload.iat as number)>Date.now()/1000+30)throw Error();
   let recoveryExpiry:number|undefined;
   if(recovery){
    const methods=payload.amr,now=Math.floor(Date.now()/1000);
    if(!Array.isArray(methods)||methods.length<1||methods.length>16)throw Error();
    let recovered:number|undefined;
    for(const item of methods){
     if(!item||typeof item!=='object'||typeof item.method!=='string'||!Number.isSafeInteger(item.timestamp)||item.timestamp<0||item.timestamp>now+30||item.timestamp>(payload.iat as number)+30)throw Error();
     if(item.method==='recovery')recovered=Math.max(recovered??0,item.timestamp);
    }
    if(recovered===undefined||recovered<=now-300)throw Error();
    recoveryExpiry=Math.min(payload.exp as number,recovered+300)*1000;
   }
   const owner=payload.sub.toLowerCase(),session=payload.session_id.toLowerCase(),expires=payload.exp as number;
   const current=async(check:AbortSignal)=>{
    if(check.aborted||Date.now()/1000>=expires||(recoveryExpiry!==undefined&&Date.now()>=recoveryExpiry))return false;
    const active=await sessions.active(owner,session,check);
    return active===true&&!check.aborted&&Date.now()/1000<expires&&(recoveryExpiry===undefined||Date.now()<recoveryExpiry);
   };
   if(!await current(scope))throw Error();
   return Object.freeze({ownerId:owner,sessionId:session,...(recoveryExpiry===undefined?{}:{expiresAt:recoveryExpiry}),async isCurrent(check:AbortSignal){try{return await bounded(check,current);}catch{return false;}}});
  });}catch{return null;}
 }
 return Object.freeze({verify:(token:string,signal:AbortSignal)=>verify(token,signal),verifyRecovery:(token:string,signal:AbortSignal)=>verify(token,signal,true)});
}
