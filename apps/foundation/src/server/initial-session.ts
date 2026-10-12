import type {createIdentityVerifier} from './verified-identity.ts';
import type {createRefreshStore} from './refresh-store.ts';
import type {PasswordSessionStager} from './password-provider.ts';
/** Initial ownership preparation only. No provider call, credential configuration or route is installed. */
export function createInitialSessionStager(store:ReturnType<typeof createRefreshStore>,verifier:ReturnType<typeof createIdentityVerifier>,expiryPolicy:()=>number,revoke:(token:string,signal:AbortSignal)=>Promise<boolean>):PasswordSessionStager{
 if(typeof store?.adopt!=='function'||typeof verifier?.verify!=='function'||typeof expiryPolicy!=='function'||typeof revoke!=='function')throw Error('Session staging unavailable');
 return Object.freeze({async stage(input:Readonly<{accessToken:string;refreshSecret:string}>,signal:AbortSignal){
  const identity=await verifier.verify(input.accessToken,signal);
  if(!identity?.sessionId||signal.aborted)throw Error('Session staging unavailable');
  const expiresAt=expiryPolicy();if(!Number.isSafeInteger(expiresAt)||expiresAt<=Date.now())throw Error('Session staging unavailable');
  const scope=Object.freeze({ownerId:identity.ownerId,sessionId:identity.sessionId,generation:1,expiresAt});
  let secret:string|null=input.refreshSecret,adoption:Promise<boolean>|undefined,cleanup:Promise<boolean>|undefined,disposed=false,owned=false;
  return Object.freeze({accessToken:input.accessToken,
   adopt(s:AbortSignal){
    if(disposed||s.aborted)return Promise.resolve(false);
    if(!adoption)adoption=(async()=>{
     if(!await identity.isCurrent(s)||s.aborted)return false;
     const before=await store.inspect(scope.ownerId,scope.sessionId,s);
     if(before.status!=='absent'||s.aborted)return false;
     const value=secret;secret=null;if(value===null)return false;
     owned=await store.adopt(value,scope,s)==='confirmed';return owned;
    })().catch(()=>false);
    return adoption;
   },
   discard(s:AbortSignal){
    if(cleanup)return cleanup;disposed=true;
    cleanup=(async()=>{
     if(adoption)await adoption;secret=null;if(s.aborted)return false;
     let lease:string|undefined;
     if(owned){try{
      const current=await store.inspect(scope.ownerId,scope.sessionId,s);
      if(current.status==='found'&&current.scope.generation===1&&current.state==='ready'){
       const claim=await store.claim(scope.ownerId,scope.sessionId,1,s);
       if(claim.status==='claimed'){claim.clearSecret();lease=claim.leaseId;await store.hold(claim.scope,lease,s);}
      }
     }catch{/* Still attempt remote cleanup; local uncertainty is retained. */}}
     if(s.aborted||await revoke(input.accessToken,s)!==true||s.aborted)return false;
     const current=await store.inspect(scope.ownerId,scope.sessionId,s);
     if(current.status==='absent')return true;
     // Lost adoption/claim acknowledgment never grants deletion authority.
     if(!owned||lease===undefined||current.status!=='found'||current.scope.generation!==1||current.leaseId!==lease)return false;
     return await store.remove(current.scope,lease,true,s)==='confirmed';
    })().catch(()=>false);return cleanup;
   },
  });
 }});
}
