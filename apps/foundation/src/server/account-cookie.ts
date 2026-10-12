import type {RequestIdentityVerifier} from './request-identity.ts';
const name='__Host-stylist_access';
const attributes='Path=/; Secure; HttpOnly; SameSite=Strict';
/** Prepared session-cookie issuer. A real route must first satisfy its origin/CSRF boundary. */
export function createAccountCookies(verifier:RequestIdentityVerifier){
 if(typeof verifier?.verify!=='function')throw Error('Account configuration unavailable');
 return Object.freeze({
  clear(){return `${name}=; ${attributes}; Max-Age=0`;},
  async issue(token:string,signal:AbortSignal,expiresAt?:number):Promise<string|null>{
   if(signal.aborted||typeof token!=='string'||token.length>3800||!/^[-_A-Za-z0-9]+\.[-_A-Za-z0-9]+\.[-_A-Za-z0-9]+$/.test(token))return null;
   try{
    const identity=await verifier.verify(token,signal);
    if(!identity||signal.aborted||!await identity.isCurrent(signal)||signal.aborted)return null;
    if(expiresAt!==undefined){
     const remaining=Math.floor((expiresAt-Date.now())/1000);
     if(!Number.isSafeInteger(expiresAt)||remaining<1||remaining>604800||signal.aborted)return null;
     return `${name}=${token}; ${attributes}; Max-Age=${remaining}; Expires=${new Date(expiresAt).toUTCString()}`;
    }
    return `${name}=${token}; ${attributes}`;
   }catch{return null;}
  },
 });
}
