/** Local account UI state only. Never authorizes styling or server access. */
export type AccountRequest=
 |{method:'signIn'|'signUp';email:string;password:string}
 |{method:'recover';email:string}
 |{method:'social';provider:'google'|'apple'};
export type AccountReply={status:'signedIn';userId?:string}|{status:'confirmationRequired'|'redirecting'|'canceled'};
export interface AccountProvider{
 submit(request:AccountRequest,signal:AbortSignal):Promise<AccountReply>;
 signOut(signal:AbortSignal):Promise<void>;
}
export type AccountSnapshot=Readonly<{status:'signedOut'|'pending'|'signedIn'|'confirmationRequired'|'recoveryRequested'|'redirecting'|'error';message:string;userId:string|null}>;
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function input(value:AccountRequest):AccountRequest{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error();
 const keys=Object.keys(value).sort().join(',');
 if(value.method==='social'){
  if(keys!=='method,provider'||!['google','apple'].includes(value.provider))throw Error();
  return {method:'social',provider:value.provider};
 }
 if(!['signIn','signUp','recover'].includes(value.method)||typeof value.email!=='string')throw Error();
 const email=value.email.trim();if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error();
 if(value.method==='recover'){if(keys!=='email,method')throw Error();return{method:'recover',email};}
 if(keys!=='email,method,password'||typeof value.password!=='string'||value.password.length<1||value.password.length>4096)throw Error();
 return{method:value.method,email,password:value.password};
}
export function createAccountFlow(provider:AccountProvider,deadlineMs=15000){
 if(typeof provider?.submit!=='function'||typeof provider?.signOut!=='function'||!Number.isSafeInteger(deadlineMs)||deadlineMs<1||deadlineMs>30000)throw Error('Account configuration unavailable');
 let admitted=0;
 let generation=0,controller:AbortController|null=null;
 let state:AccountSnapshot=Object.freeze({status:'signedOut',message:'Sign in to use your stylist.',userId:null});
 const set=(status:AccountSnapshot['status'],message:string,userId:string|null=null)=>{state=Object.freeze({status,message,userId});};
 function invalidate(){generation++;controller?.abort();controller=null;}
 async function operation<T>(call:(signal:AbortSignal)=>Promise<T>):Promise<T>{
  if(admitted>=4)throw Error();
  admitted++;
  const current=new AbortController();controller=current;let timer:ReturnType<typeof setTimeout>|undefined;
  let abort!:()=>void;
  try{return await Promise.race([Promise.resolve().then(()=>{if(current.signal.aborted)throw Error();return call(current.signal);}).finally(()=>{admitted--;}),new Promise<never>((_,reject)=>{
   abort=()=>reject(Error());current.signal.addEventListener('abort',abort,{once:true});
   timer=setTimeout(()=>current.abort(),deadlineMs);
  })]);}finally{if(timer)clearTimeout(timer);current.signal.removeEventListener('abort',abort);if(controller===current)controller=null;}
 }
 return Object.freeze({
  snapshot:()=>state,
  cancel(){invalidate();set('signedOut','Sign-in canceled. Choose a method to try again.');},
  async submit(value:AccountRequest){
   invalidate();const version=generation;let request:AccountRequest;
   try{request=input(value);}catch{set('error','Check your account details and try again.');return;}
   set('pending','Please wait.');
   try{
    const reply=await operation(signal=>provider.submit(request,signal));
    if(version!==generation)return;
    if(request.method==='recover'){set('recoveryRequested','If this address can receive account recovery, instructions will be sent.');return;}
    if(!reply||typeof reply!=='object'||Array.isArray(reply))throw Error();
    if(reply.status==='signedIn'&&Object.keys(reply).join(',')==='status'){
     set('signedIn','You are signed in.');
    }else if(reply.status==='signedIn'&&Object.keys(reply).sort().join(',')==='status,userId'&&typeof reply.userId==='string'&&uuid.test(reply.userId)){
     set('signedIn','You are signed in.',reply.userId.toLowerCase());
    }else if(reply.status==='confirmationRequired'&&request.method==='signUp'&&Object.keys(reply).length===1){
     set('confirmationRequired','Check your email to confirm your account, then sign in.');
    }else if(reply.status==='redirecting'&&request.method==='social'&&Object.keys(reply).length===1){
     set('redirecting','Complete sign-in with your selected provider.');
    }else if(reply.status==='canceled'&&Object.keys(reply).length===1){set('signedOut','Sign-in canceled. Choose a method to try again.');}
    else throw Error();
   }catch{if(version===generation)set('error',request.method==='recover'?'Account recovery could not be requested. Please try again.':'Sign-in could not be completed. Try again or recover access.');}
  },
  async signOut(){
   invalidate();const version=generation;set('signedOut','You are signed out on this page.');
   try{await operation(signal=>provider.signOut(signal));if(version===generation)set('signedOut','You are signed out.');}
   catch{if(version===generation)set('signedOut','Local access is closed. Server sign-out is unconfirmed; retry sign-out.');}
  },
 });
}
