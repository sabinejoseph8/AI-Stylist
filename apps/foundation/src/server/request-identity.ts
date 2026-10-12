import type {VerifiedMediaAccess} from './media-read.ts';
export interface RequestIdentityVerifier {verify(token:string,signal:AbortSignal):Promise<VerifiedMediaAccess|null>}
const cookieName='__Host-stylist_access';
/** Cookie-only same-origin boundary; disconnected from HTTP routes and cookie issuance. */
export function createRequestIdentity(origin:string,verifier:RequestIdentityVerifier){
 const base=new URL(origin);
 if(base.protocol!=='https:'||base.origin!==origin||base.username||base.password||typeof verifier?.verify!=='function')throw Error('Account configuration unavailable');
 return async(request:Request,signal:AbortSignal):Promise<VerifiedMediaAccess|null>=>{
  try{
   const url=new URL(request.url);
   if(signal.aborted||request.signal.aborted||url.origin!==origin||url.username||url.password||url.hash||url.search||request.headers.has('authorization'))return null;
   if(request.headers.has('host')&&request.headers.get('host')!==base.host)return null;
   const site=request.headers.get('sec-fetch-site');if(site!==null&&site!=='same-origin'&&site!=='none')return null;
   const source=request.headers.get('origin');
   if(source!==null&&source!==origin)return null;
   if(!['GET','HEAD','OPTIONS'].includes(request.method)&&source!==origin)return null;
   const raw=request.headers.get('cookie');if(!raw||raw.length>18000)return null;
   let token:string|undefined;
   for(const part of raw.split(';')){
    const pair=part.trim();const split=pair.indexOf('=');
    if(split<1)return null;
    if(pair.slice(0,split)!==cookieName)continue;
    if(token!==undefined)return null;
    token=pair.slice(split+1);
   }
   if(!token||token.length>16384||!/^[-_A-Za-z0-9]+\.[-_A-Za-z0-9]+\.[-_A-Za-z0-9]+$/.test(token))return null;
   const result=await verifier.verify(token,signal);
   if(signal.aborted||request.signal.aborted)return null;
   return result;
  }catch{return null;}
 };
}
