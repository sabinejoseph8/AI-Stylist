import type {AccountPurpose} from './account-callback.ts';
import type {createAccountSecurity} from './account-security.ts';
import {createAccountSessions,type PendingAccountSession,type AccountSessionResult} from './account-session.ts';
export type {PendingAccountSession} from './account-session.ts';
type Security=ReturnType<typeof createAccountSecurity>;
export interface AccountExchangePort {
 exchange(input:Readonly<{purpose:'google'|'apple';code:string;verifier:string}>,signal:AbortSignal):Promise<PendingAccountSession|Readonly<{status:'notCreated'}>>;
}
export type AccountExchangeResult=AccountSessionResult|Readonly<{status:'canceled'|'recoveryRequired'}>;
/** Disconnected callback orchestration. Recovery has a separate authorization path. */
export function createAccountExchange(security:Security,appOrigin:string,port:AccountExchangePort,deadlineMs=8000,shared?:ReturnType<typeof createAccountSessions>){
 if(typeof port?.exchange!=='function')throw Error('Account exchange unavailable');
 const sessions=shared??createAccountSessions(security,appOrigin,deadlineMs);
 return Object.freeze({
  cleanupHeld:sessions.cleanupHeld,
  async complete(request:Request,purpose:AccountPurpose,external:AbortSignal):Promise<AccountExchangeResult>{
   if(external.aborted||request.signal.aborted)return {status:'unavailable'};
   const unavailable=sessions.availability();if(unavailable)return {status:unavailable};
   if(purpose==='recovery')return {status:'recoveryRequired'};
   const callback=security.callbacks.fromRequest(request,purpose);
   if(!callback)return {status:'unavailable'};
   if(callback.status==='canceled')return {status:'canceled'};
   if(callback.purpose==='recovery')return {status:'recoveryRequired'};
   const selected=callback.purpose;
   return sessions.run(signal=>port.exchange({purpose:selected,code:callback.code,verifier:callback.verifier},signal),external,
    {returnPath:callback.returnPath,clearFlow:true},request.signal);
  },
 });
}
