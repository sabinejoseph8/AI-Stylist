import type {createAccountSecurity} from './account-security.ts';
import type {createRefreshStore} from './refresh-store.ts';
import type {AccountRevocationPort} from './account-signout.ts';
import {createRefreshReconciliation,type RevocationAuthority} from './refresh-reconciliation.ts';
/** Disconnected port. The account sign-out owner supplies admission and deadline controls. */
export function createStoredSignOut(security:Pick<ReturnType<typeof createAccountSecurity>,'authorize'>,store:ReturnType<typeof createRefreshStore>,authority:RevocationAuthority,origin:string,revoke:(jwt:string,signal:AbortSignal)=>Promise<boolean>):AccountRevocationPort{
 if(typeof security?.authorize!=='function'||typeof store?.inspect!=='function'||typeof authority?.confirm!=='function'||typeof revoke!=='function'||new URL(origin).origin!==origin||!origin.startsWith('https://'))throw Error('Sign-out unavailable');
 const reconciliation=createRefreshReconciliation(store,authority);
 return Object.freeze({async revoke(request:Request,ownerId:string,signal:AbortSignal){
  try{
   const url=new URL(request.url);
   if(request.method!=='POST'||url.origin!==origin||url.pathname!=='/api/account/sign-out'||url.search||url.hash||request.headers.get('origin')!==origin||signal.aborted)return false;
   // Snapshot the same headers used for identity verification, before any asynchronous work.
   const headers=new Headers(request.headers),snapshot=new Request(request.url,{method:'POST',headers});
   const tokens=(headers.get('cookie')??'').split(';').map(p=>p.trim()).filter(p=>p.startsWith('__Host-stylist_access='));
   if(tokens.length!==1)return false;const jwt=tokens[0].slice('__Host-stylist_access='.length);
   const identity=await security.authorize(snapshot,signal);
   if(!identity?.sessionId||identity.ownerId!==ownerId||signal.aborted||!await identity.isCurrent(signal))return false;
   // Block ordinary refresh first where possible. Failure never suppresses the revocation attempt.
   try{
    const before=await store.inspect(ownerId,identity.sessionId,signal);
    if(before.status==='found'&&before.state==='ready'){
     const claim=await store.claim(ownerId,identity.sessionId,before.scope.generation,signal);
     if(claim.status==='claimed'){claim.clearSecret();await store.hold(claim.scope,claim.leaseId,signal);}
    }
   }catch{}
   if(signal.aborted)return false;
   try{await revoke(jwt,signal);}catch{}
   if(signal.aborted)return false;
   const current=await store.inspect(ownerId,identity.sessionId,signal);
   if(current.status==='unconfirmed')return false;
   // Even an empty local store needs independently confirmed primary Auth absence.
   const scope=current.status==='found'?{...current.scope,leaseId:current.leaseId}:{ownerId,sessionId:identity.sessionId,generation:1,leaseId:null};
   return await reconciliation.reconcile(scope,signal)==='confirmed';
  }catch{return false;}
 }});
}
