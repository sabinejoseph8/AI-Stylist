/** Reference transitions are generated separately; no signing handoff is reconstructed. */
import {mandatoryFixture,mandatoryCall} from './cvi-mandatory-fixture.ts';
import {fixtureKey} from './cvi-witness-service-fixture.ts';
import {createLocalSignedDatabaseBridge} from '../../src/server/local-cvi-database-authority-bridge.ts';
import {fullStateMetadata,fullStateProjection,assertCommittedFullState,createLocalFullStateReconciler} from '../../src/server/local-cvi-full-state-reconciliation.ts';
import {historyCanonical} from '../../src/server/local-cvi-history-authority.ts';
import {witnessServiceDigest} from '../../src/server/local-cvi-witness-service.ts';
export async function continuousFullStateFixture(){
 const reference=await mandatoryFixture(),references:any[]=[];
 const capture=async(p:any)=>{const states=await mandatoryCall({root:reference.root,config:reference.config,mode:'plan-full',actor:p.actor,kind:p.kind,args:p.args});references.push(states);return states;};
 const run=async(p:any)=>reference.adapter(p.actor.role).execute(p,new AbortController().signal) as Promise<any>;
 try{
  const activate=await reference.activation();await capture(activate);const lease=await run(activate);
  const commit=await reference.commitPlan(lease);await capture(commit);await run(commit);
  const claim=await reference.claimPlan(lease);await capture(claim);const originalRecord=await run(claim);
  const fence=await reference.fencing(lease.generation);await capture(fence);const barrier=await run(fence);
  const release=await reference.releasePlan(barrier,originalRecord);await capture(release);
 }finally{await reference.close();}
 const x=await mandatoryFixture(fullStateMetadata(references[0].previous));let index=-1;
 const key=fixtureKey(),identityPin={keyId:'fixture-key-continuous-database',publicKeyPem:key.pem};
 const phase=async(next:number)=>{
  if(next!==index+1||next<0||next>=references.length)throw Error('Continuous phase unavailable');
  const states=structuredClone(references[next]),plan=states.intent,current=await x.inspect();
  if(current.pending!==null||historyCanonical(current.current)!==historyCanonical(plan.from))throw Error('Continuous baseline unavailable');
  x.registerReferencePlan(plan);const port=x.authorityPort(plan.actor.role),approval=await port.advance(plan);
  const principal='fixture_'+plan.actor.role,command={operationId:plan.id.slice(0,32),kind:plan.kind,previous:fullStateProjection(states.previous),target:fullStateProjection(states.target),recordHash:plan.kind==='release'?witnessServiceDigest(plan.args.record):null,expiresAt:3000};
  index=next;
  const makeBridge=(source:any)=>createLocalSignedDatabaseBridge(x.pin,identityPin,principal,plan,approval,command,port,source,()=>1000,30000);
  const finalizer=(hash:string,tx:string,observe:()=>Promise<any>)=>{
   const checked=async()=>assertCommittedFullState(await observe(),plan,states.target,command,hash,tx);
   x.setRecoverySources({database:async b=>{await checked();return x.sourceProof('database',b,'target-committed');},fence:async b=>{await checked();return x.sourceProof('fence',b,'writers-fenced');}});
   return createLocalFullStateReconciler(x.pin,plan,states.target,command,hash,tx,async()=>port.reconcile(plan),async nonce=>port.read(nonce),()=>1000);
  };
  return {x,key,identityPin,states,plan,port,principal,command,approval,makeBridge,finalizer,metadata:fullStateMetadata(states.target),close:x.close};
 };
 const verifyCurrent=async(observed:any)=>{const current=await x.inspect(),last=current.operations[current.operations.length-1];if(!observed||!last||last.status!=='reconciled'||observed.operationId!==last.id.slice(0,32)||current.pending!==null||observed.consumed!==true||observed.protected!==true||historyCanonical(fullStateMetadata(observed.snapshot))!==historyCanonical(current.current)||historyCanonical(fullStateProjection(observed.snapshot))!==historyCanonical(observed.projection))throw Error('Continuous current state unavailable');return true;};
 return {x,references,phase,verifyCurrent,close:x.close};
}
