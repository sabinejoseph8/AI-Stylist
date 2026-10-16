/** Test-only parent: ephemeral private keys never cross the JSON-lines pipe. */
import {fullStateFixture} from './cvi-full-state-fixture.ts';
import {createInterface} from 'node:readline';
import {databaseBridgeFixture} from './cvi-database-bridge-fixture.ts';
import {historyCanonical} from '../../src/server/local-cvi-history-authority.ts';
import {witnessServiceDigest} from '../../src/server/local-cvi-witness-service.ts';
const full=process.argv.includes('--full-state'),f:any=full?await fullStateFixture():await databaseBridgeFixture(),lines=createInterface({input:process.stdin,crlfDelay:Infinity}),iterator=lines[Symbol.asyncIterator]();
const receive=async()=>{const n=await iterator.next();if(n.done)throw Error();return JSON.parse(n.value);};
const send=(x:unknown)=>process.stdout.write(JSON.stringify(x)+'\n');
let mode='normal',oldProof:any,lastGrant:any,lastBinding:any,finalizer:any;
const source=async(request:any)=>{
 send({stage:'observe',request});const observed=await receive();
 const body={version:1,keyId:f.identityPin.keyId,...request,bindingDigest:witnessServiceDigest(observed.binding),issuedAt:1000,expiresAt:2000};
 const proof={body,signature:f.key.sign(historyCanonical(body))};
 if(mode==='bad-proof')proof.signature='0'.repeat(128);
 if(mode==='replayed-proof'&&oldProof)return oldProof;oldProof=proof;return proof;
};
const originalClaim=f.port.claim;
f.port.claim=async(...args:any[])=>{const e=await originalClaim(...args);if(mode==='lost-claim')throw Error('Lost');if(mode==='bad-claim')return {...e,reply:{...(e.reply as any),signature:'0'.repeat(128)}};return e;};
const make=()=>full?f.makeBridge(source):f.make(source);let bridge=make();
try{
 while(true){const x=await receive();try{
  if(x.method==='prepare'){send({stage:'result',result:{command:f.command,...(full?{states:f.states,targetDigest:witnessServiceDigest(f.metadata)}:{})}});}
  else if(x.method==='mode'){mode=x.mode;send({stage:'result',result:true});}
  else if(x.method==='admit'){lastBinding=x.binding;lastGrant=await bridge.admit(x.binding,new AbortController().signal);send({stage:'result',result:lastGrant});}
  else if(x.method==='confirm'){send({stage:'result',result:await bridge.confirm(x.binding,x.claimHash,new AbortController().signal)});}
  else if(x.method==='fresh-bridge'){bridge=make();mode='normal';send({stage:'result',result:true});}
  else if(x.method==='finalize'&&full){
   if(!lastGrant||!lastBinding)throw Error();
   finalizer??=f.finalizer(lastGrant.claimHash,lastBinding.connection.transactionId,async()=>{send({stage:'committed'});return (await receive()).observed;});
   const result=await finalizer.finalize(new AbortController().signal);if(mode==='lost-reconcile')throw Error('Lost finalized reply');send({stage:'result',result});
  }
  else if(x.method==='inspect'){const s=await f.x.inspect();send({stage:'result',result:{requests:s.requests.length,operations:s.operations.length,pending:s.pending,claimed:s.requests.some((r:any)=>r.id===witnessServiceDigest({execution:f.plan.id,revision:1,owner:f.plan.actor.principalDigest}))}});}
  else if(x.method==='close'){send({stage:'result',result:true});break;}
  else throw Error();
 }catch{send({stage:'held'});}}
}catch{process.exitCode=2;}finally{lines.close();await f.close();}
