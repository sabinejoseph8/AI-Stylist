/** Fresh durable replay snapshot only. Not an all-writer lock or resume proof. */
import {randomBytes} from 'node:crypto';
export type ReplayInspectionRequest=Readonly<{storeId:string;bindingDigest:string;challenge:string;now:number}>;
export interface ReplayInspectionPort {storeId:string;inspect?(input:ReplayInspectionRequest,signal:AbortSignal):Promise<unknown>}
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const int=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const hex=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
export function createLocalReplayInspector(port:ReplayInspectionPort,bindingDigest:string,expiresAt:number,clock=Date.now){
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(port?.storeId)||typeof port.inspect!=='function'||!hex(bindingDigest)||!int(expiresAt)||typeof clock!=='function')throw Error('Replay inspection required');
 const storeId=port.storeId,inspect=port.inspect.bind(port);let held=false,last=-1,floor=0,limit:number|undefined,attempts=0;
 return Object.freeze({isHeld:()=>held,async idle(external:AbortSignal){
  if(held||external.aborted||attempts++>=256)return false;
  const abort=new AbortController(),signal=AbortSignal.any([external,abort.signal]);let timer:ReturnType<typeof setTimeout>|undefined,onAbort:(()=>void)|undefined;
  try{
   const now=clock();if(!int(now)||now<last||now>=expiresAt)throw Error();last=now;
   const until=Math.min(expiresAt,now+8000),request=Object.freeze({storeId,bindingDigest,challenge:randomBytes(32).toString('hex'),now});
   const canceled=new Promise<never>((_,reject)=>{onAbort=()=>reject(Error());signal.addEventListener('abort',onAbort,{once:true});timer=setTimeout(()=>abort.abort(),until-now);});void canceled.catch(()=>{});
   const raw=structuredClone(await Promise.race([Promise.resolve().then(()=>{if(signal.aborted)throw Error();return inspect(request,signal);}),canceled])),at=clock();
   if(signal.aborted||held||!int(at)||at<last||at>=until||!exact(raw,['storeId','bindingDigest','challenge','now','clock','expiresAt','limit','recordCount','pendingCount','spentCount','journalDigest','status','permissions'])||Object.entries(request).some(([k,v])=>raw[k]!==v)||raw.clock!==now||!int(raw.expiresAt)||raw.expiresAt<expiresAt||!int(raw.limit)||raw.limit<1||raw.limit>64||limit!==undefined&&raw.limit!==limit||!int(raw.recordCount)||raw.recordCount<floor||raw.recordCount>raw.limit||!int(raw.pendingCount)||raw.pendingCount>1||!int(raw.spentCount)||raw.pendingCount+raw.spentCount!==raw.recordCount||!hex(raw.journalDigest)||!exact(raw.permissions,['write','activate','renew','sign','resume'])||Object.values(raw.permissions).some(v=>v!==false)||raw.status!==(raw.pendingCount?'replay-pending':raw.recordCount>=raw.limit?'replay-exhausted':'replay-idle'))throw Error();
   last=at;floor=raw.recordCount;limit=raw.limit;if(raw.status!=='replay-idle'){held=true;return false;}return true;
  }catch{held=true;abort.abort();return false;}finally{if(timer)clearTimeout(timer);if(onAbort)signal.removeEventListener('abort',onAbort);}
 }});
}
