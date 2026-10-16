import {createHash} from 'node:crypto';
import {historyRequestHash,historyCanonical} from './local-cvi-history-authority.ts';
import type {HistoryRequest,HistoryAuthorityPort,HistoryPin} from './local-cvi-history-authority.ts';
export type DomainCommand=
 |Readonly<{type:'reserve';requestDigest:string;receiptDigest:string}>
 |Readonly<{type:'consume';requestDigest:string;receiptDigest:string}>
 |Readonly<{type:'rotate';previous:number;bindingDigest:string;bootDigest:string}>;
export type DomainActor=Readonly<{principalId:string;storeId:string;scopeDigest:string;role:'observer'|'rotator'|'replay-writer';generation?:number;bindingDigest?:string;bootDigest?:string}>;
type Credential=Readonly<{generation:number;bindingDigest:string;bootDigest:string;active:boolean}>;
type Reservation=Readonly<{principalId:string;requestDigest:string;receiptDigest:string;generation:number;state:'reserved'|'spent';at:number;spentAt:number|null}>;
export type DomainHistory=Readonly<{version:1;storeId:string;scopeDigest:string;expiresAt:number;clock:number;epoch:number;requestLimit:number;generationLimit:number;credentials:readonly Credential[];requests:readonly Reservation[]}>;
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const digest=(x:unknown):x is string=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const integer=(x:unknown):x is number=>Number.isSafeInteger(x)&&Number(x)>=0;
const uuid=(x:unknown):x is string=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(x);
function canonical(v:unknown):string{
 if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
 if(v&&typeof v==='object')return '{'+Object.entries(v).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,x])=>JSON.stringify(k)+':'+canonical(x)).join(',')+'}';
 return JSON.stringify(v);
}
export const domainHistoryHash=(s:DomainHistory)=>createHash('sha256').update(canonical(s)).digest('hex');
function freeze(s:DomainHistory):DomainHistory{return Object.freeze({...s,credentials:Object.freeze(s.credentials.map(x=>Object.freeze({...x}))),requests:Object.freeze(s.requests.map(x=>Object.freeze({...x})))});}
export function createDomainHistory(config:{storeId:string;scopeDigest:string;expiresAt:number;now:number;requestLimit:number;generationLimit:number}):DomainHistory{
 if(!uuid(config.storeId)||!digest(config.scopeDigest)||!integer(config.now)||!integer(config.expiresAt)||config.now>=config.expiresAt||
  !integer(config.requestLimit)||config.requestLimit<1||config.requestLimit>64||!integer(config.generationLimit)||config.generationLimit<1||config.generationLimit>16)throw Error('Local domain history unavailable');
 return freeze({version:1,storeId:config.storeId,scopeDigest:config.scopeDigest,expiresAt:config.expiresAt,clock:config.now,epoch:0,requestLimit:config.requestLimit,generationLimit:config.generationLimit,credentials:[],requests:[]});
}
function validState(s:DomainHistory):boolean{
 if(!exact(s,['version','storeId','scopeDigest','expiresAt','clock','epoch','requestLimit','generationLimit','credentials','requests'])||s.version!==1||!uuid(s.storeId)||!digest(s.scopeDigest)||
  !integer(s.expiresAt)||!integer(s.clock)||s.clock>=s.expiresAt||!integer(s.epoch)||!integer(s.requestLimit)||s.requestLimit<1||s.requestLimit>64||
  !integer(s.generationLimit)||s.generationLimit<1||s.generationLimit>16||!Array.isArray(s.credentials)||!Array.isArray(s.requests)||s.credentials.length>s.generationLimit||s.requests.length>s.requestLimit)return false;
 const bindings=new Set<string>(),boots=new Set<string>(),ids=new Set<string>(),receipts=new Set<string>();let unresolved=0,last=0;
 for(const [i,c] of s.credentials.entries()){
  if(!exact(c,['generation','bindingDigest','bootDigest','active'])||c.generation!==i+1||!digest(c.bindingDigest)||!digest(c.bootDigest)||bindings.has(c.bindingDigest)||boots.has(c.bootDigest)||c.active!==(i===s.credentials.length-1))return false;
  bindings.add(c.bindingDigest);boots.add(c.bootDigest);
 }
 for(const r of s.requests){
  if(!exact(r,['principalId','requestDigest','receiptDigest','generation','state','at','spentAt'])||typeof r.principalId!=='string'||!/^fixture-principal-[a-z0-9-]{1,40}$/.test(r.principalId)||!digest(r.requestDigest)||!digest(r.receiptDigest)||ids.has(r.requestDigest)||receipts.has(r.receiptDigest)||
   !integer(r.generation)||r.generation<1||r.generation>s.credentials.length||!integer(r.at)||r.at<last||r.at>s.clock)return false;
  if(r.state==='reserved'){unresolved++;if(r.spentAt!==null)return false;last=r.at;}
  else if(r.state==='spent'){if(!integer(r.spentAt)||r.spentAt<r.at||r.spentAt>s.clock)return false;last=r.spentAt;}else return false;
  ids.add(r.requestDigest);receipts.add(r.receiptDigest);
 }
 return unresolved<=1&&(!unresolved||s.requests.at(-1)?.state==='reserved')&&s.epoch===s.credentials.length+s.requests.reduce((n,r)=>n+(r.state==='spent'?2:1),0);
}
function actorValid(s:DomainHistory,a:DomainActor):boolean{
 if(!a||!/^fixture-principal-[a-z0-9-]{1,40}$/.test(a.principalId)||a.storeId!==s.storeId||a.scopeDigest!==s.scopeDigest)return false;
 if(a.role==='observer'||a.role==='rotator')return exact(a,['principalId','storeId','scopeDigest','role']);
 const current=s.credentials.at(-1);
 return a.role==='replay-writer'&&exact(a,['principalId','storeId','scopeDigest','role','generation','bindingDigest','bootDigest'])&&!!current&&
  a.generation===current.generation&&a.bindingDigest===current.bindingDigest&&a.bootDigest===current.bootDigest;
}
/** Pure proposal validation. No arbitrary state/hash replacement or restoration API. */
export function projectDomainHistory(s:DomainHistory,actor:DomainActor,command:unknown,now:number):DomainHistory|null{
 try{
  if(!validState(s)||!actorValid(s,actor)||!integer(now)||now<s.clock||now>=s.expiresAt||s.epoch>=Number.MAX_SAFE_INTEGER||!command||typeof command!=='object')return null;
  const c=command as Record<string,unknown>;let credentials=s.credentials,requests=s.requests;
  if(c.type==='rotate'){
   if(actor.role!=='rotator'||!exact(c,['type','previous','bindingDigest','bootDigest'])||c.previous!==credentials.length||!integer(c.previous)||
    credentials.length>=s.generationLimit||!digest(c.bindingDigest)||!digest(c.bootDigest)||credentials.some(x=>x.bindingDigest===c.bindingDigest||x.bootDigest===c.bootDigest))return null;
   credentials=[...credentials.map(x=>({...x,active:false})),{generation:credentials.length+1,bindingDigest:c.bindingDigest,bootDigest:c.bootDigest,active:true}];
  }else if(c.type==='reserve'){
   if(actor.role!=='replay-writer'||!exact(c,['type','requestDigest','receiptDigest'])||!digest(c.requestDigest)||!digest(c.receiptDigest)||requests.length>=s.requestLimit||
    requests.some(x=>x.state==='reserved'||x.requestDigest===c.requestDigest||x.receiptDigest===c.receiptDigest))return null;
   requests=[...requests,{principalId:actor.principalId,requestDigest:c.requestDigest,receiptDigest:c.receiptDigest,generation:actor.generation!,state:'reserved',at:now,spentAt:null}];
  }else if(c.type==='consume'){
   if(actor.role!=='replay-writer'||!exact(c,['type','requestDigest','receiptDigest'])||!digest(c.requestDigest)||!digest(c.receiptDigest))return null;
   const index=requests.findIndex(x=>x.principalId===actor.principalId&&x.requestDigest===c.requestDigest&&x.receiptDigest===c.receiptDigest&&x.generation===actor.generation&&x.state==='reserved');
   if(index<0)return null;requests=requests.map((r,i)=>i===index?{...r,state:'spent',spentAt:now}:r);
  }else return null;
  const result=freeze({...s,credentials,requests,clock:now,epoch:s.epoch+1});return validState(result)?result:null;
 }catch{return null;}
}
/** Synthetic backend/role model. connect() is trusted setup, never request input.
 * Signer and clock are injected TEST dependencies, not independently hosted services. */
export function createLocalCviDomainAuthority(initial:DomainHistory,pin:Omit<HistoryPin,'publicKeyPem'>,sign:(message:string)=>string,clock=Date.now){
 if(typeof sign!=='function'||!['replay','credentials'].includes(pin.kind)||!validState(initial)||pin.storeId!==initial.storeId||!/^fixture-authority-[a-z0-9-]{1,40}$/.test(pin.authorityId)||!/^fixture-key-[a-z0-9-]{1,40}$/.test(pin.keyId))throw Error('Local domain authority unavailable');
 pin=Object.freeze({...pin});
 let state=freeze(initial),lastClock=initial.clock;
 return Object.freeze({snapshot:()=>state,connect(actor:DomainActor):HistoryAuthorityPort{
  const grant=Object.freeze({...actor});
  return Object.freeze({async exchange(r:HistoryRequest,signal:AbortSignal){
   let result='held';let observed:number;
   try{
    observed=clock();if(!integer(observed)||observed<lastClock||observed>=state.expiresAt||signal.aborted)throw Error();lastClock=observed;
    if(!exact(r,r.action==='read'?['version','action','authorityId','storeId','kind','challenge','issuedAt','expiresAt','minimumEpoch']:
     ['version','action','authorityId','storeId','kind','challenge','issuedAt','expiresAt','minimumEpoch','expectedEpoch','expectedHead','nextHead','command'])||r.version!==1||
     r.authorityId!==pin.authorityId||r.storeId!==pin.storeId||r.kind!==pin.kind||!digest(r.challenge)||!integer(r.issuedAt)||!integer(r.expiresAt)||r.expiresAt-r.issuedAt>8000||
     r.issuedAt>observed||observed>=r.expiresAt||!integer(r.minimumEpoch)||r.minimumEpoch>state.epoch||!actorValid(state,grant))throw Error();
    if(r.action==='read')result='read';
    else if(r.action==='advance'){
     if(r.expectedEpoch!==state.epoch||r.expectedHead!==domainHistoryHash(state))result='conflict';
     else{
      const proposed=projectDomainHistory(state,grant,r.command,observed);
      if(proposed&&r.nextHead===domainHistoryHash(proposed)){state=proposed;result='applied';}
     }
    }
   }catch{}
   const body={version:1,authorityId:pin.authorityId,storeId:pin.storeId,kind:pin.kind,keyId:pin.keyId,challenge:r.challenge,
    requestHash:historyRequestHash(r),epoch:state.epoch,head:domainHistoryHash(state),state:'active',result};
   return {body,signature:sign(historyCanonical(body))};
  }});
 }});
}
