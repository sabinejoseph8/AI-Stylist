import {createAuthKeys} from './auth-keys.ts';
import {createAuthSessionAuthority,type AuthSessionRpc} from './auth-session.ts';
import {createIdentityVerifier} from './verified-identity.ts';
import {createRequestIdentity} from './request-identity.ts';
import {createAccountCookies} from './account-cookie.ts';
import {createAccountCallbacks} from './account-callback.ts';
/** Prepared composition only. Callers must supply trusted project config and server-only RPC. */
export function createAccountSecurity(options:{appOrigin:string;projectUrl:string;fetch:typeof fetch;rpc:AuthSessionRpc}){
 const keys=createAuthKeys(options.projectUrl,options.fetch);
 const sessions=createAuthSessionAuthority(options.rpc);
 const verifier=createIdentityVerifier(options.projectUrl,keys,sessions);
 return Object.freeze({
  authorize:createRequestIdentity(options.appOrigin,verifier),
  cookies:createAccountCookies(verifier),
  callbacks:createAccountCallbacks(options.appOrigin),
 });
}
