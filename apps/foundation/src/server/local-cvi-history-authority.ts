import {createHash,createPublicKey,randomBytes,verify} from 'node:crypto';
export type HistoryKind='replay'|'credentials';
export type HistoryHead=Readonly<{epoch:number;head:string}>;
export type HistoryRequest=Readonly<{version:1;action:'read'|'advance';authorityId:string;storeId:string;kind:HistoryKind;challenge:string;issuedAt:number;expiresAt:number;minimumEpoch:number;expectedEpoch?:number;expectedHead?:string;nextHead?:string}>;
export interface HistoryAuthorityPort {exchange(request:HistoryRequest,signal:AbortSignal):Promise<unknown>}
export type HistoryPin=Readonly<{authorityId:string;storeId:string;kind:HistoryKind;keyId:string;publicKeyPem:string}>;
export const historyCanonical=(value:Record<string,unknown>)=>JSON.stringify(Object.fromEntries(Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0)));
export const historyRequestHash=(request:HistoryRequest)=>createHash('sha256').update(historyCanonical(request)).digest('hex');
const digest=(x:unknown):x is string=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const integer=(x:unknown):x is number=>Number.isSafeInteger(x)&&Number(x)>=0;
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
/** Disconnected signed authority contract. Signature freshness is not proof of
 * independent storage, linearizability, privileged isolation or provider cleanup. */
export function createLocalCviHistoryAuthority(pin:HistoryPin,port:HistoryAuthorityPort,clock=Date.now,deadlineMs=1000){
 const key=createPublicKey(pin.publicKeyPem);
 if(key.asymmetricKeyType!=='ed25519'||!/^fixture-authority-[a-z0-9-]{1,40}$/.test(pin.authorityId)||
  !/^[a-f0-9-]{36}$/.test(pin.storeId)||!['replay','credentials'].includes(pin.kind)||!/^fixture-key-[a-z0-9-]{1,40}$/.test(pin.keyId)||
  typeof port?.exchange!=='function'||!Number.isInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Local history authority configuration unavailable');
 const captured=Object.freeze({...pin});
 let held=false,busy=false,lastTime=-1,known:HistoryHead|undefined,issued=0;
 const permits=new WeakMap<object,number>();
 const hold=()=>{held=true;return null;};
 const time=()=>{const n=clock();if(!integer(n)||n<lastTime)throw Error();lastTime=n;return n;};
 async function exchange(action:'read'|'advance',minimumEpoch:number,expected?:HistoryHead,nextHead?:string):Promise<HistoryHead|null>{
  if(held||busy)return null;
  busy=true;const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  try{
   const at=time();if(!integer(at+deadlineMs)||!integer(minimumEpoch)||issued>=128)return hold();
   const request:HistoryRequest=Object.freeze({version:1,action,authorityId:captured.authorityId,storeId:captured.storeId,kind:captured.kind,
    challenge:randomBytes(32).toString('hex'),issuedAt:at,expiresAt:at+deadlineMs,minimumEpoch,
    ...(action==='advance'?{expectedEpoch:expected!.epoch,expectedHead:expected!.head,nextHead:nextHead!}:{})});
   const raw=await Promise.race([Promise.resolve().then(()=>port.exchange(request,controller.signal)),new Promise<never>((_,reject)=>{
    timer=setTimeout(()=>{controller.abort();reject(Error());},deadlineMs);
   })]);
   if(controller.signal.aborted||held||time()>=request.expiresAt||!exact(raw,['body','signature'])||typeof raw.signature!=='string'||!/^[a-f0-9]{128}$/.test(raw.signature)||
    !exact(raw.body,['version','authorityId','storeId','kind','keyId','challenge','requestHash','epoch','head','state','result']))return hold();
   const b=raw.body;
   if(b.version!==1||b.authorityId!==captured.authorityId||b.storeId!==captured.storeId||b.kind!==captured.kind||b.keyId!==captured.keyId||
    b.challenge!==request.challenge||b.requestHash!==historyRequestHash(request)||!integer(b.epoch)||b.epoch<minimumEpoch||!digest(b.head)||
    b.state!=='active'||b.result!==(action==='read'?'read':'applied')||!verify(null,Buffer.from(historyCanonical(b)),key,Buffer.from(raw.signature,'hex')))return hold();
   if(known&&(b.epoch<known.epoch||(b.epoch===known.epoch&&b.head!==known.head)))return hold();
   if(action==='advance'&&(b.epoch!==expected!.epoch+1||b.head!==nextHead))return hold();
   const result=Object.freeze({epoch:b.epoch,head:b.head});known=result;issued++;permits.set(result,request.expiresAt);return result;
  }catch{controller.abort();return hold();}finally{if(timer)clearTimeout(timer);busy=false;}
 }
 return Object.freeze({
  isHeld:()=>held,
  async read(minimumEpoch:number,expectedHead?:string):Promise<HistoryHead|null>{
   if(expectedHead!==undefined&&!digest(expectedHead))return hold();
   const result=await exchange('read',minimumEpoch);
   if(result&&expectedHead!==undefined&&result.head!==expectedHead)return hold();return result;
  },
  async advance(expected:HistoryHead,nextHead:string):Promise<HistoryHead|null>{
   if(held||busy)return null;
   try{
    const expires=permits.get(expected);permits.delete(expected);
    if(expires===undefined||time()>=expires||!digest(nextHead)||nextHead===expected.head||!integer(expected.epoch)||expected.epoch>=Number.MAX_SAFE_INTEGER)return hold();
   }catch{return hold();}
   return exchange('advance',expected.epoch,expected,nextHead);
  },
 });
}
