/** Disconnected durable-receipt signer contract. No URL, real key or app route.
 * The port must atomically claim an authoritative committed record before return.
 * Claimed records are never refunded, even if signing/delivery subsequently fails.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {historyCanonical} from './local-cvi-history-authority.ts';
import type {HostedAckPin} from './local-cvi-hosted-proposal.ts';
export interface CommittedReceiptPort {claim(receiptId:string,signal:AbortSignal):Promise<unknown>}
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const integer=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const digest=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const hash=(v:Record<string,unknown>)=>createHash('sha256').update(historyCanonical(v)).digest('hex');
export function createLocalCviReceiptSigner(pin:HostedAckPin,port:CommittedReceiptPort,sign:(message:string)=>Promise<string>|string,minimumEpoch:number,clock=Date.now,deadlineMs=1000){
 const captured=Object.freeze({...pin}),key=createPublicKey(captured.publicKeyPem);
 if(!integer(minimumEpoch)||!/^fixture-authority-[a-z0-9-]{1,40}$/.test(pin.authorityId)||!/^[a-f0-9-]{36}$/.test(pin.storeId)||!digest(pin.policyDigest)||!digest(pin.principalDigest)||!/^fixture-key-[a-z0-9-]{1,40}$/.test(pin.keyId)||key.asymmetricKeyType!=='ed25519'||typeof port?.claim!=='function'||typeof sign!=='function'||!integer(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Receipt signer configuration unavailable');
 let busy=false,held=false,lastTime=-1;
 const now=()=>{const at=clock();if(!integer(at)||at<lastTime)throw Error();lastTime=at;return at;};
 return Object.freeze({isHeld:()=>held,async acknowledge(receiptId:string,external:AbortSignal):Promise<unknown>{
  if(held||busy||external.aborted)throw Error('Receipt signer unavailable');busy=true;
  const controller=new AbortController(),signal=AbortSignal.any([external,controller.signal]);let timer:ReturnType<typeof setTimeout>|undefined,onAbort:(()=>void)|undefined;
  try{
   if(!digest(receiptId))throw Error();const started=now();if(!integer(started+deadlineMs))throw Error();
   const canceled=new Promise<never>((_,reject)=>{onAbort=()=>reject(Error());signal.addEventListener('abort',onAbort,{once:true});timer=setTimeout(()=>controller.abort(),deadlineMs);});
   const work=async()=>{
    const raw=await port.claim(receiptId,signal),at=now();
    if(signal.aborted||at>=started+deadlineMs||!exact(raw,['request','body']))throw Error();
    const record=structuredClone(raw),r=record.request,b=record.body;
    if(!exact(r,['version','authorityId','storeId','policyDigest','principalDigest','action','challenge','issuedAt','expiresAt','input'])||!exact(b,['version','authorityId','storeId','policyDigest','principalDigest','keyId','action','challenge','requestHash','result'])||
       r.version!==1||r.action!=='commit'||!digest(r.challenge)||!integer(r.issuedAt)||!integer(r.expiresAt)||r.issuedAt>at||at>=r.expiresAt||r.expiresAt-r.issuedAt>8000||hash(r)!==receiptId||Buffer.byteLength(historyCanonical(record))>65536)throw Error();
    for(const field of ['authorityId','storeId','policyDigest','principalDigest'] as const)if(r[field]!==captured[field]||b[field]!==captured[field])throw Error();
    if(b.version!==1||b.keyId!==captured.keyId||b.action!=='commit'||b.challenge!==r.challenge||b.requestHash!==receiptId||!exact(r.input,['projection','command'])||!exact(r.input.projection,['storeId','policyDigest','epoch','head','at','expiresAt','token']))throw Error();
    const p=r.input.projection,result=b.result;
    if(p.storeId!==captured.storeId||p.policyDigest!==captured.policyDigest||!integer(p.epoch)||p.epoch<minimumEpoch||!integer(p.epoch+1)||!digest(p.head)||!digest(p.token)||!integer(p.at)||!integer(p.expiresAt)||p.at>at||at>=p.expiresAt||
       !exact(result,['status','storeId','policyDigest','previousEpoch','previousHead','epoch','head','at'])||result.status!=='committed'||result.storeId!==captured.storeId||result.policyDigest!==captured.policyDigest||result.previousEpoch!==p.epoch||result.previousHead!==p.head||result.epoch!==p.epoch+1||!digest(result.head)||!integer(result.at)||result.at<p.at||result.at<r.issuedAt||result.at>at||result.at>=p.expiresAt)throw Error();
    // Only this authoritative stored body reaches the signer, never caller input.
    const message=historyCanonical(b),signature=await sign(message),finished=now();
    if(signal.aborted||finished>=started+deadlineMs||finished>=r.expiresAt||finished>=p.expiresAt||typeof signature!=='string'||!/^[a-f0-9]{128}$/.test(signature)||!verify(null,Buffer.from(message),key,Buffer.from(signature,'hex')))throw Error();
    return {body:b,signature};
   };
   return await Promise.race([work(),canceled]);
  }catch{held=true;controller.abort();throw Error('Receipt signer unavailable');}
  finally{if(timer)clearTimeout(timer);if(onAbort)signal.removeEventListener('abort',onAbort);busy=false;}
 }});
}
