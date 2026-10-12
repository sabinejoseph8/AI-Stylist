/** Browser presentation only. A server must independently verify every recovery request. */
export interface ResetProvider {reset(password:string,signal:AbortSignal):Promise<{status:'resetComplete'|'unconfirmed'}>}
export type ResetSnapshot=Readonly<{status:'ready'|'pending'|'complete'|'expired'|'canceled'|'error'|'unconfirmed';message:string}>;
export function createRecoveryFlow(provider:ResetProvider,expiresAt:number,deadlineMs=15000){
 if(typeof provider?.reset!=='function'||!Number.isSafeInteger(expiresAt)||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>30000)throw Error('Recovery unavailable');
 let used=false,version=0,controller:AbortController|undefined;
 let state:ResetSnapshot=Object.freeze({status:expiresAt>Date.now()?'ready':'expired',message:'Choose a new password. This does not sign you in.'});
 const set=(status:ResetSnapshot['status'],message:string)=>{state=Object.freeze({status,message});};
 return Object.freeze({
  snapshot(){if(!used&&Date.now()>=expiresAt)set('expired','This reset permission has expired. Request a new recovery email.');return state;},
  cancel(){used=true;version++;controller?.abort();set('canceled','Reset canceled. Request recovery again to start over.');},
  async submit(password:unknown,confirmation:unknown){
   if(used)return;
   if(Date.now()>=expiresAt){set('expired','This reset permission has expired. Request a new recovery email.');return;}
   if(typeof password!=='string'||password.length<1||password.length>4096||password!==confirmation){set('error','Enter matching passwords.');return;}
   used=true;const current=++version;controller=new AbortController();const scope=controller;
   set('pending','Updating your password.');let timer:ReturnType<typeof setTimeout>|undefined;let abort!:()=>void;
   try{
    const result=await Promise.race([Promise.resolve().then(()=>{if(scope.signal.aborted)throw Error();return provider.reset(password,scope.signal);}),new Promise<never>((_,reject)=>{abort=()=>reject(Error());scope.signal.addEventListener('abort',abort,{once:true});timer=setTimeout(()=>scope.abort(),deadlineMs);})]);
    if(current!==version)return;
    if(result&&Object.keys(result).length===1&&result.status==='resetComplete')set('complete','Password updated. Sign in to use your stylist.');
    else set('unconfirmed','Password update is unconfirmed. Recover access again before retrying.');
   }catch{if(current===version)set('unconfirmed','Password update is unconfirmed. Recover access again before retrying.');}
   finally{if(timer)clearTimeout(timer);scope.signal.removeEventListener('abort',abort);}
  },
 });
}
