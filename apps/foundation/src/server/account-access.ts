import type {createAccountSecurity} from './account-security.ts';
import {createAccountRefresh,type AccountRefreshPort} from './account-refresh.ts';
import {createAccountSessions} from './account-session.ts';
import {createAccountExchange,type AccountExchangePort} from './account-exchange.ts';
import {createPasswordAccounts,type PasswordAccountPort} from './password-account.ts';
/** One server owner shares admission and uncertain-cleanup holds across account methods. No routes installed. */
export function createAccountAccess(security:ReturnType<typeof createAccountSecurity>,origin:string,port:AccountExchangePort&PasswordAccountPort&Partial<AccountRefreshPort>,deadlineMs=8000){
 const sessions=createAccountSessions(security,origin,deadlineMs);
 return Object.freeze({
  callback:createAccountExchange(security,origin,port,deadlineMs,sessions),
  password:createPasswordAccounts(security,origin,port,deadlineMs,sessions),
  refresh:typeof port.refresh==='function'?createAccountRefresh(security,origin,{refresh:port.refresh.bind(port)},deadlineMs,sessions):null,
  cleanupHeld:sessions.cleanupHeld,
 });
}
