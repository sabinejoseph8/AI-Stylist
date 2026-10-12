import type {VerifiedMediaAccess} from './media-read.ts';
import type {createRefreshStore} from './refresh-store.ts';
/** Customer-resource gate. Account bootstrap and refresh use their separate boundaries. */
export function createAccountResourceIdentity(authorize:(request:Request,signal:AbortSignal)=>Promise<VerifiedMediaAccess|null>,store:Pick<ReturnType<typeof createRefreshStore>,'inspect'>){
 if(typeof authorize!=='function'||typeof store?.inspect!=='function')throw Error('Account resource identity unavailable');
 return async(request:Request,signal:AbortSignal):Promise<VerifiedMediaAccess|null>=>{
  try{
   const identity=await authorize(request,signal);
   if(!identity?.sessionId||signal.aborted||request.signal.aborted)return null;
   const owner=identity.ownerId,session=identity.sessionId;
   const first=await store.inspect(owner,session,signal);
   if(first.status!=='found'||first.state!=='ready'||first.scope.ownerId!==owner||first.scope.sessionId!==session||first.scope.expiresAt<=Date.now()||signal.aborted)return null;
   const deadline=first.scope.expiresAt;
   const current=async(check:AbortSignal)=>{
    if(check.aborted||request.signal.aborted||Date.now()>=deadline||!await identity.isCurrent(check))return false;
    const record=await store.inspect(owner,session,check);
    return !check.aborted&&!request.signal.aborted&&Date.now()<deadline&&record.status==='found'&&record.state==='ready'&&record.scope.ownerId===owner&&record.scope.sessionId===session&&record.scope.expiresAt===deadline;
   };
   if(!await current(signal))return null;
   return Object.freeze({ownerId:owner,sessionId:session,async isCurrent(check:AbortSignal){try{return await current(check);}catch{return false;}}});
  }catch{return null;}
 };
}
