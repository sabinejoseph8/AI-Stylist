import {freshStartup} from './cvi-startup-fixture.ts';
import {continuousFullStateFixture} from './cvi-continuous-full-state-fixture.ts';
/** Test-only parent: ephemeral private keys never cross the JSON-lines pipe. */
import {fullStateFixture} from './cvi-full-state-fixture.ts';
import {createInterface} from 'node:readline';
import {databaseBridgeFixture} from './cvi-database-bridge-fixture.ts';
import {historyCanonical} from '../../src/server/local-cvi-history-authority.ts';
import {witnessServiceDigest} from '../../src/server/local-cvi-witness-service.ts';
const full=process.argv.includes('--full-state'),sequence=process.argv.includes('--continuous')?await continuousFullStateFixture():null;
let f:any=sequence?await sequence.phase(0):(full?await fullStateFixture(process.argv.find(v=>v.startsWith('--stage='))?.slice(8)??'activate'):await databaseBridgeFixture());
const lines=createInterface({input:process.stdin,crlfDelay:Infinity}),iterator=lines[Symbol.asyncIterator]();
const receive=async()=>{const n=await iterator.next();if(n.done)throw Error();return JSON.parse(n.value);};
const send=(x:unknown)=>process.stdout.write(JSON.stringify(x)+'\n');
let mode='normal',oldProof:any,lastGrant:any,lastBinding:any,finalizer:any,finalized=false,checkpoint:any,startupMinimum=0;
const source=async(request:any)=>{
 send({stage:'observe',request});const observed=await receive();
 const body={version:1,keyId:f.identityPin.keyId,...request,bindingDigest:witnessServiceDigest(observed.binding),issuedAt:1000,expiresAt:2000};
 const proof={body,signature:f.key.sign(historyCanonical(body))};
 if(mode==='bad-proof')proof.signature='0'.repeat(128);
 if(mode==='replayed-proof'&&oldProof)return oldProof;oldProof=proof;return proof;
};
const configure=()=>{const originalClaim=f.port.claim;f.port.claim=async(...args:any[])=>{const e=await originalClaim(...args);if(mode==='lost-claim')throw Error('Lost');if(mode==='bad-claim')return {...e,reply:{...(e.reply as any),signature:'0'.repeat(128)}};return e;};};configure();
const make=()=>full?f.makeBridge(source):f.make(source);let bridge=make();
try{
 while(true){const x=await receive();try{
  if(x.method==='prepare'){send({stage:'result',result:{principal:f.principal,command:f.command,...(full?{states:f.states,targetDigest:witnessServiceDigest(f.metadata)}:{})}});}
  else if(x.method==='mode'){mode=x.mode;send({stage:'result',result:true});}
  else if(x.method==='admit'){lastBinding=x.binding;lastGrant=await bridge.admit(x.binding,new AbortController().signal);send({stage:'result',result:lastGrant});}
  else if(x.method==='confirm'){send({stage:'result',result:await bridge.confirm(x.binding,x.claimHash,new AbortController().signal)});}
  else if(x.method==='fresh-bridge'){bridge=make();mode='normal';send({stage:'result',result:true});}
  else if(x.method==='finalize'&&full){
   if(!lastGrant||!lastBinding)throw Error();
   finalizer??=f.finalizer(lastGrant.claimHash,lastBinding.connection.transactionId,async()=>{send({stage:'committed'});return (await receive()).observed;});
   const result=await finalizer.finalize(new AbortController().signal);if(mode==='lost-reconcile')throw Error('Lost finalized reply');finalized=true;startupMinimum=Math.max(startupMinimum,f.approval.reply.body.result.revision+1);send({stage:'result',result});
  }
  else if(x.method==='next'&&sequence){if(!finalized)throw Error();f=await sequence.phase(x.index);configure();bridge=make();oldProof=lastGrant=lastBinding=finalizer=undefined;finalized=false;send({stage:'result',result:true});}
  else if(x.method==='startup'&&sequence){
   const registry=sequence.startupRegistry(),known=structuredClone(registry),pin={authority:f.x.pin,database:f.identityPin,readerPrincipal:f.x.actors.find((a:any)=>a.role==='observer').principalDigest,registryDigest:witnessServiceDigest(registry),minimumRevision:startupMinimum};
   if(x.mode==='missing-registry')known.entries=[];if(x.mode==='stale-registry'){known.entries=known.entries.slice(0,1);pin.registryDigest=witnessServiceDigest(known);}
   if(x.mode==='lost-minimum')pin.minimumRevision=0;
   const ports={authority:async(nonce:string)=>{if(x.mode==='authority-unavailable')throw Error();return f.port.read(nonce);},database:async(nonce:string)=>{
    send({stage:'committed'});const observed=(await receive()).observed,body={version:1,keyId:f.identityPin.keyId,storeId:f.x.pin.storeId,policyDigest:f.x.pin.policyDigest,nonce,issuedAt:1000,expiresAt:2000,checkpoint:observed};
    return {body,signature:x.mode==='bad-signature'?'0'.repeat(128):f.key.sign(historyCanonical(body))};
   }};
   send({stage:'result',result:await freshStartup(pin,known,ports)});
  }
  else if(x.method==='verify-current'&&sequence){send({stage:'committed'});const seen=(await receive()).observed;send({stage:'result',result:await sequence.verifyCurrent(seen)});}
  else if(x.method==='checkpoint-authority'&&sequence){checkpoint=await f.x.authoritySnapshot();send({stage:'result',result:true});}
  else if(x.method==='restore-authority'&&sequence){if(!checkpoint)throw Error();await f.x.authorityRestore(checkpoint);send({stage:'result',result:true});}
  else if(x.method==='inspect'){const s=await f.x.inspect();send({stage:'result',result:{requests:s.requests.length,operations:s.operations.length,pending:s.pending,claimed:s.requests.some((r:any)=>r.id===witnessServiceDigest({execution:f.plan.id,revision:s.operations.find((o:any)=>o.id===f.plan.id)?.revision,owner:f.plan.actor.principalDigest}))}});}
  else if(x.method==='close'){send({stage:'result',result:true});break;}
  else throw Error();
 }catch{send({stage:'held'});}}
}catch{process.exitCode=2;}finally{lines.close();await f.close();}
