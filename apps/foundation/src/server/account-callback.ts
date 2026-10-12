import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
export type AccountPurpose='google'|'apple'|'recovery';
const opaque=/^[A-Za-z0-9_-]{43}$/;
const paths=new Set(['/','/wardrobe','/saved-looks','/profile']);
const hash=(value:string)=>createHash('sha256').update(value).digest();
interface Pending {purpose:AccountPurpose;binding:Buffer;verifier:string;returnPath:string;expires:number}
/** Prepared, process-local callback transaction store. No provider or HTTP route is activated. */
export function createAccountCallbacks(origin:string){
 const base=new URL(origin);
 if(base.protocol!=='https:'||base.origin!==origin||base.username||base.password)throw Error('Callback configuration unavailable');
 const pending=new Map<string,Pending>();
 function purge(){for(const [state,item] of pending)if(item.expires<=Date.now())pending.delete(state);}
 function consume(state:string,binding:string,purpose:AccountPurpose){
  purge();if(!opaque.test(state)||!opaque.test(binding))return null;
  const item=pending.get(state);
  if(!item||item.purpose!==purpose||!timingSafeEqual(item.binding,hash(binding)))return null;
  pending.delete(state);return Object.freeze({purpose:item.purpose,verifier:item.verifier,returnPath:item.returnPath});
 }
 return Object.freeze({
  begin(purpose:AccountPurpose,returnPath='/'){
   if(!['google','apple','recovery'].includes(purpose)||!paths.has(returnPath))throw Error('Account request unavailable');
   purge();if(pending.size>=128)throw Error('Account request unavailable');
   const state=randomBytes(32).toString('base64url'),binding=randomBytes(32).toString('base64url'),verifier=randomBytes(32).toString('base64url');
   pending.set(state,{purpose,binding:hash(binding),verifier,returnPath:purpose==='recovery'?'/account/reset':returnPath,expires:Date.now()+300000});
   return Object.freeze({state,challenge:hash(verifier).toString('base64url'),challengeMethod:'S256' as const,
    callbackUrl:origin+'/auth/callback/'+purpose+'?flow='+state,
    cookie:`__Host-stylist_flow=${binding}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=300`});
  },
  consume,
  fromRequest(request:Request,purpose:AccountPurpose){
   try{
    const url=new URL(request.url);
    if(!['google','apple','recovery'].includes(purpose)||request.signal.aborted||request.method!=='GET'||url.origin!==origin||url.pathname!=='/auth/callback/'+purpose||url.hash||url.username||url.password||request.headers.has('authorization'))return null;
    if(request.headers.has('host')&&request.headers.get('host')!==base.host)return null;
    const mode=request.headers.get('sec-fetch-mode'),destination=request.headers.get('sec-fetch-dest');
    if((mode!==null&&mode!=='navigate')||(destination!==null&&destination!=='document'))return null;
    const fields=Array.from(url.searchParams.keys());
    if(fields.length!==2||fields.filter(key=>key==='flow').length!==1||fields.filter(key=>key==='code').length!==1)return null;
    const state=url.searchParams.get('flow')!,code=url.searchParams.get('code')!;
    if(!opaque.test(state)||!/^[-._~A-Za-z0-9]{1,2048}$/.test(code))return null;
    const raw=request.headers.get('cookie');if(!raw||raw.length>18000)return null;
    let binding:string|undefined;
    for(const part of raw.split(';')){
     const pair=part.trim(),split=pair.indexOf('=');if(split<1)return null;
     if(pair.slice(0,split)!=='__Host-stylist_flow')continue;
     if(binding!==undefined)return null;binding=pair.slice(split+1);
    }
    if(!binding)return null;
    const transaction=consume(state,binding,purpose);
    return transaction?Object.freeze({...transaction,code}):null;
   }catch{return null;}
  },
  clear(){return '__Host-stylist_flow=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0';},
 });
}
