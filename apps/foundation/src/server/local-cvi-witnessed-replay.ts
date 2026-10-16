/** Disabled concrete local witnessed driver. No alternate process or raw writes. */
import {spawn} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import {fileURLToPath} from 'node:url';
import {createPublicKey} from 'node:crypto';
import {captureReplayWitness} from './local-cvi-replay-witness.ts';
import type {ReplayWitnessPin} from './local-cvi-replay-witness.ts';
import type {WitnessServicePin} from './local-cvi-witness-service.ts';
import type {AuthorityEvidence} from './local-cvi-mandatory-persistence.ts';
import type {OwnedReplayBackend} from './local-cvi-owned-replay.ts';
type Setup=Readonly<{nativeRoot:string;replayRoot:string;replayStoreId:string;physicalBindingDigest:string;applicationBindingDigest:string;applicationExpiresAt:number;witness:ReplayWitnessPin;authority:WitnessServicePin;readerPrincipal:string;ownerDigest:string}>;
const exact=(v:any,k:string[])=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...k].sort().join(',');
const int=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const hex=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
export function createLocalWitnessedReplayBackend(raw:Setup,read:(nonce:string,signal:AbortSignal)=>Promise<AuthorityEvidence>,clock=Date.now){
 if(!exact(raw,['nativeRoot','replayRoot','replayStoreId','physicalBindingDigest','applicationBindingDigest','applicationExpiresAt','witness','authority','readerPrincipal','ownerDigest'])||!hex(raw.physicalBindingDigest)||!hex(raw.applicationBindingDigest)||!hex(raw.readerPrincipal)||!hex(raw.ownerDigest)||!int(raw.applicationExpiresAt)||!exact(raw.authority,['authorityId','witnessId','storeId','policyDigest','keyId','publicKeyPem'])||!hex(raw.authority.policyDigest)||createPublicKey(raw.authority.publicKeyPem).asymmetricKeyType!=='ed25519'||typeof read!=='function'||typeof clock!=='function')throw Error('Captured witnessed replay configuration required');
 const c={...structuredClone(raw),witness:captureReplayWitness(raw.witness,raw.replayStoreId,raw.replayRoot,raw.nativeRoot)},proof=read;
 let held=false,busy=false,last=-1,stop:(()=>void)|undefined,closed:Promise<void>|undefined;
 const now=()=>{const at=clock();if(held||!int(at)||at<last||at>=c.applicationExpiresAt)throw Error('Witnessed replay held');last=at;return at;};
 const run=async(mode:'inspect'|'reserve'|'consume',rawRequest:any,external:AbortSignal,lease?:any,minimumRevision?:number)=>{
  if(held||busy||external.aborted)throw Error('Witnessed replay unavailable');busy=true;
  try{
   const wallStarted=performance.now(),at=now(),request=structuredClone(rawRequest),keys=mode==='inspect'?['storeId','bindingDigest','challenge','now']:mode==='reserve'?['storeId','bindingDigest','requestDigest','now']:['storeId','bindingDigest','requestDigest','now','receipt','status'];
   if(!exact(request,keys)||request.storeId!==c.replayStoreId||request.bindingDigest!==c.applicationBindingDigest||!int(request.now)||request.now>at||!hex(mode==='inspect'?request.challenge:request.requestDigest)||mode==='consume'&&(request.status!=='reserved'||typeof request.receipt!=='string'||!/^fixture-receipt-[a-f0-9]{32}$/.test(request.receipt)))throw Error();
   if(mode!=='inspect'&&(!int(minimumRevision)||!lease||lease.storeId!==c.authority.storeId||lease.policyDigest!==c.authority.policyDigest||!int(lease.expiresAt)||lease.expiresAt<=at))throw Error();
   const end=Math.min(c.applicationExpiresAt,mode==='inspect'?at+8000:lease.expiresAt,at+8000),abort=new AbortController(),signal=AbortSignal.any([external,abort.signal]);
   const input={mode,setup:c,request:{...request,bindingDigest:c.physicalBindingDigest},node:process.execPath,...(mode==='inspect'?{}:{lease:structuredClone(lease),minimumRevision})},encoded=JSON.stringify(input);
   if(Buffer.byteLength(encoded)>1048576||signal.aborted)throw Error();
   const child=spawn('python3',[fileURLToPath(new URL('../../../../tools/operations/local_cvi_owned_replay_port.py',import.meta.url))],{stdio:['pipe','pipe','pipe']});
   let buffer='',answer:any,failed=false,responding=false,frames=0;let exit!:()=>void;closed=new Promise<void>(r=>exit=r);
   const fail=()=>{if(failed)return;failed=true;held=true;abort.abort();child.kill('SIGKILL');};stop=fail;
   const timer=setTimeout(fail,end-at),onAbort=()=>fail();signal.addEventListener('abort',onAbort,{once:true});
   const live=()=>{if(failed||signal.aborted||performance.now()>=wallStarted+end-at||now()>=end)throw Error();};
   const write=(v:unknown)=>{live();const data=JSON.stringify(v);if(Buffer.byteLength(data)>1048576)throw Error();child.stdin.write(data+'\n');};
   const result=new Promise<any>((resolve,reject)=>{
    child.stdout.on('data',data=>{buffer+=data.toString();if(Buffer.byteLength(buffer)>1048576)return fail();let pos:number;
     while((pos=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,pos);buffer=buffer.slice(pos+1);try{
      live();if(++frames>64||answer!==undefined||responding)throw Error();const m=JSON.parse(line);
      if(exact(m,['stage','result'])&&m.stage==='result'){answer=m.result;continue;}
      if(exact(m,['stage'])&&m.stage==='clock'){write({now:now()});continue;}
      if(mode==='inspect'||!exact(m,['stage','nonce','current','minimumRevision'])||m.stage!=='owner-read'||!hex(m.nonce)||!int(m.minimumRevision)||m.minimumRevision<minimumRevision!)throw Error();
      responding=true;void Promise.resolve().then(()=>{live();return proof(m.nonce,signal);}).then(value=>{live();write(value);}).catch(fail).finally(()=>{responding=false;});
     }catch{fail();}}
    });
    child.stderr.resume();child.stdin.on('error',fail);child.on('error',fail);child.on('close',code=>{
     clearTimeout(timer);signal.removeEventListener('abort',onAbort);stop=undefined;exit();
     try{live();if(code!==0||buffer.length||answer===undefined||responding||!answer||answer.storeId!==c.replayStoreId||answer.bindingDigest!==c.physicalBindingDigest||answer.now!==request.now)throw Error();resolve({...answer,bindingDigest:c.applicationBindingDigest});}catch{held=true;reject(Error('Witnessed replay held'));}
    });
   });
   void result.catch(()=>{});
   try{live();child.stdin.write(encoded+'\n');return await result;}catch{fail();await closed;throw Error('Witnessed replay held');}
  }catch{held=true;throw Error('Witnessed replay unavailable');}finally{busy=false;}
 };
 const backend:OwnedReplayBackend={inspect:(r,s)=>run('inspect',r,s),mutate:(mode,lease,floor,r,s)=>run(mode,r,s,lease,floor)};
 return Object.freeze({...backend,isHeld:()=>held,async close(){held=true;stop?.();await closed;}});
}
