import type {createAccountSecurity} from './account-security.ts';
import {createAccountSessions,type AccountSessionReply,type AccountSessionResult} from './account-session.ts';
export interface PasswordAccountRequest {readonly method:'signIn'|'signUp';readonly email:string;readonly password:string}
export interface PasswordAccountPort {password(input:PasswordAccountRequest,signal:AbortSignal):Promise<AccountSessionReply>}
/** Direct server interface only; its future HTTP caller must enforce origin, rate and request-body protections. */
export function createPasswordAccounts(security:ReturnType<typeof createAccountSecurity>,origin:string,port:PasswordAccountPort,deadlineMs=8000,shared?:ReturnType<typeof createAccountSessions>){
 if(typeof port?.password!=='function')throw Error('Password account unavailable');
 const sessions=shared??createAccountSessions(security,origin,deadlineMs);
 return Object.freeze({
  cleanupHeld:sessions.cleanupHeld,
  async submit(input:unknown,signal:AbortSignal):Promise<AccountSessionResult>{
   try{
    if(!input||typeof input!=='object'||Array.isArray(input))return {status:'unavailable'};
    const x=input as Record<string,unknown>;
    if(Object.keys(x).sort().join(',')!=='email,method,password'||typeof x.method!=='string'||!['signIn','signUp'].includes(x.method)||typeof x.email!=='string'||typeof x.password!=='string')return {status:'unavailable'};
    const email=x.email.trim();if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||x.password.length<1||x.password.length>4096)return {status:'unavailable'};
    const request=Object.freeze({method:x.method as PasswordAccountRequest['method'],email,password:x.password});
    return await sessions.run(scope=>port.password(request,scope),signal,{returnPath:'/',registration:request.method==='signUp'});
   }catch{return {status:'unavailable'};}
  },
 });
}
