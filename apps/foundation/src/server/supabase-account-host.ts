import {createAccountSessionStatus} from './account-session-status.ts';
import {createAccountResourceIdentity} from './account-resource-identity.ts';
import {createAuthKeys} from './auth-keys.ts';
import {createAuthSessionAuthority} from './auth-session.ts';
import {createIdentityVerifier} from './verified-identity.ts';
import {createRequestIdentity,createRefreshRequestIdentity} from './request-identity.ts';
import {createAccountCookies} from './account-cookie.ts';
import {createAccountCallbacks} from './account-callback.ts';
import {createSupabaseRpc} from './supabase-rpc.ts';
import {createAuthSessionPresence} from './auth-session-presence.ts';
import {createRefreshEnvelopes} from './refresh-envelope.ts';
import {createRefreshStore} from './refresh-store.ts';
import {createPasswordProviderHttp} from './password-provider-http.ts';
import {createRecoveryProviderHttp} from './recovery-provider-http.ts';
import {createRefreshProviderHttp} from './refresh-provider-http.ts';
import {createVerifiedRevocation} from './verified-revocation.ts';
import {createInitialSessionStager} from './initial-session.ts';
import {createPasswordProvider} from './password-provider.ts';
import {createOAuthProvider} from './oauth-provider.ts';
import {createRecoveryProvider,createRecoveryTokenProvider} from './recovery-provider.ts';
import {createRefreshProvider} from './refresh-provider.ts';
import {createRefreshRotation} from './refresh-rotation.ts';
import {createStoredRefreshPort} from './refresh-port.ts';
import {createStoredSignOut} from './stored-signout.ts';
import {createAccountComposition} from './account-composition.ts';
import {createAccountHost} from './account-host.ts';
export interface SupabaseAccountHostOptions {
 appOrigin:string;projectUrl:string;serviceKey:string;fetch:typeof fetch;
 refreshKeyring:ReadonlyMap<string,Uint8Array>;activeRefreshKeyId:string;
 initialExpiry?:()=>number;rotatedExpiry?:(accessToken:string)=>number;
}
/** Explicit server composition only. No environment, listener, credentials generation or customer activation.
 * Defaults implement the approved fixed seven-day application sign-in lifetime. Shorter injected experiment policies remain supported. */
export function createSupabaseAccountHost(options:SupabaseAccountHostOptions){
 if(!options||(options.initialExpiry!==undefined&&typeof options.initialExpiry!=='function')||(options.rotatedExpiry!==undefined&&typeof options.rotatedExpiry!=='function'))throw Error('Account expiry policy required');
 const initialExpiry=()=>Math.min(options.initialExpiry?.()??Date.now()+604800000,Date.now()+604800000);
 const rotatedExpiry=(token:string)=>Math.min(options.rotatedExpiry?.(token)??Date.now()+604800000,Date.now()+604800000);
 const rpc=createSupabaseRpc(options.projectUrl,options.serviceKey,options.fetch);
 const verifier=createIdentityVerifier(options.projectUrl,createAuthKeys(options.projectUrl,options.fetch),createAuthSessionAuthority(rpc));
 const security=Object.freeze({authorize:createRequestIdentity(options.appOrigin,verifier),authorizeRefresh:createRefreshRequestIdentity(options.appOrigin,{verify:verifier.verifyRefresh}),cookies:createAccountCookies(verifier),callbacks:createAccountCallbacks(options.appOrigin)});
 const presence=createAuthSessionPresence(rpc);
 const store=createRefreshStore(rpc,createRefreshEnvelopes(options.refreshKeyring,options.activeRefreshKeyId));
 const passwordHttp=createPasswordProviderHttp(options.projectUrl,options.serviceKey,options.fetch);
 const recoveryHttp=createRecoveryProviderHttp(options.projectUrl,options.appOrigin,options.serviceKey,options.fetch);
 const refreshHttp=createRefreshProviderHttp(options.projectUrl,options.serviceKey,options.fetch);
 const revoke=createVerifiedRevocation(verifier,presence,passwordHttp.revoke);
 const scopedRevoke=(jwt:string,_scope:'local',signal:AbortSignal)=>revoke(jwt,signal);
 const stager=createInitialSessionStager(store,verifier,initialExpiry,revoke);
 const rotation=createRefreshRotation(store,createRefreshProvider({refresh:refreshHttp.refresh,revoke:async(jwt,_scope,signal)=>({status:await revoke(jwt,signal)?'accepted':'unconfirmed'})},rotatedExpiry));
 const recoveryOperations={exchange:recoveryHttp.exchange,updatePassword:recoveryHttp.updatePassword,revoke:scopedRevoke};
 const authorizeResource=createAccountResourceIdentity(security.authorize,store);
 const accounts=createAccountComposition(options.appOrigin,options.projectUrl,security,{
  password:createPasswordProvider({password:passwordHttp.password,revoke:scopedRevoke},stager),
  exchange:createOAuthProvider({exchange:passwordHttp.exchange,revoke:scopedRevoke},stager),
  refresh:createStoredRefreshPort(security,store,rotation,options.appOrigin),
  signOut:createStoredSignOut(security,store,presence,options.appOrigin,revoke),
  recovery:createRecoveryProvider(recoveryOperations,verifier,presence),
  tokenRecovery:createRecoveryTokenProvider({...recoveryOperations,verifyRecoveryToken:recoveryHttp.verifyRecoveryToken},verifier,presence),
  recoveryRequest:{request:recoveryHttp.request},
  sessionStatus:{handle:createAccountSessionStatus(options.appOrigin,authorizeResource)},
 });
 return Object.freeze({...createAccountHost(options.appOrigin,accounts,rpc),authorizeResource});
}
