import type {RefreshScope} from './refresh-envelope.ts';
import type {createRefreshStore} from './refresh-store.ts';
import type {PendingAccountSession} from './account-session.ts';
export interface RefreshRotationProvider {
 /** Trusted adapter only. Revoke must cover this entire provider session, including all rotated tokens. */
 rotate(secret:string,signal:AbortSignal):Promise<{accessToken:string;refreshSecret:string;expiresAt:number;revoke(signal:AbortSignal):Promise<boolean>}>;
}
/** Local preparation. Scope must come from verified server identity and inspected ownership, never request JSON. */
export function createRefreshRotation(store:ReturnType<typeof createRefreshStore>,provider:RefreshRotationProvider){
 return Object.freeze({async stage(scope:RefreshScope,signal:AbortSignal):Promise<PendingAccountSession>{
  const unavailable=()=>Error('Account refresh unavailable');
  const claim=await store.claim(scope.ownerId,scope.sessionId,scope.generation,signal);
  if(claim.status!=='claimed')throw unavailable();
  // A canceled/ambiguous provider call leaves its durable claim blocked. Never reclaim automatically.
  let rotated:Awaited<ReturnType<RefreshRotationProvider['rotate']>>;
  try{
   if(signal.aborted)throw unavailable();
   const secret=claim.readSecret();if(secret===null)throw unavailable();
   rotated=await provider.rotate(secret,signal);
  }catch{claim.clearSecret();throw unavailable();}
  claim.clearSecret();
  if(!rotated||typeof rotated.revoke!=='function')throw unavailable();
  let adoption:Promise<boolean>|undefined,discarding:Promise<boolean>|undefined,disposed=false;
  let secret:string|null=rotated.refreshSecret;
  const discard=(cleanup:AbortSignal)=>{
   if(discarding)return discarding;disposed=true;
   discarding=(async()=>{
    // Never remove a record while a previously started adoption can still write it.
    if(adoption)await adoption;
    secret=null;
    try{
     if(await rotated.revoke(cleanup)!==true)return false;
     const current=await store.inspect(scope.ownerId,scope.sessionId,cleanup);
     if(current.status==='absent')return true;
     if(current.status!=='found')return false;
     const ownClaim=current.scope.generation===scope.generation&&current.leaseId===claim.leaseId;
     const ownAdoption=current.scope.generation===scope.generation+1&&current.state==='ready'&&current.leaseId===null;
     if(!ownClaim&&!ownAdoption)return false;
     return await store.remove(current.scope,current.leaseId,true,cleanup)==='confirmed';
    }catch{return false;}
   })();return discarding;
  };
  return Object.freeze({accessToken:rotated.accessToken,
   adopt(adoptSignal:AbortSignal){
    if(disposed||adoptSignal.aborted)return Promise.resolve(false);
    if(!adoption){const value=secret;secret=null;adoption=(async()=>typeof value==='string'&&await store.finish(value,claim.scope,claim.leaseId,rotated.expiresAt,adoptSignal)==='confirmed')();}
    return adoption;
   },discard,
  });
 }});
}
