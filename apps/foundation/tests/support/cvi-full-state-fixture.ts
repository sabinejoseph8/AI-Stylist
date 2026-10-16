import {databaseBridgeFixture} from './cvi-database-bridge-fixture.ts';
import {mandatoryCall} from './cvi-mandatory-fixture.ts';
import {createLocalSignedDatabaseBridge} from '../../src/server/local-cvi-database-authority-bridge.ts';
import {fullStateMetadata,fullStateProjection,assertCommittedFullState,createLocalFullStateReconciler} from '../../src/server/local-cvi-full-state-reconciliation.ts';
export async function fullStateFixture(stage='activate'){
 const f=await databaseBridgeFixture(stage);
 const states=await mandatoryCall({root:f.x.root,config:f.x.config,mode:'plan-full',actor:f.plan.actor,kind:f.plan.kind,args:f.plan.args});
 if(JSON.stringify(states.intent)!==JSON.stringify(f.plan))throw Error('Fixture full plan mismatch');
 const command={...f.command,previous:fullStateProjection(states.previous),target:fullStateProjection(states.target)};
 const makeBridge=(source:any)=>createLocalSignedDatabaseBridge(f.x.pin,f.identityPin,f.principal,f.plan,f.approval,command,f.port,source,()=>1000,30000);
 const finalizer=(hash:string,tx:string,observe:()=>Promise<unknown>,patch:Record<string,unknown>={})=>{
  const checked=async()=>{const seen:any=await observe();assertCommittedFullState(seen,f.plan,states.target,command,hash,tx);if(seen.transactionId!==tx)throw Error();return seen;};
  f.x.setRecoverySources({database:async b=>{await checked();return f.x.sourceProof('database',b,'target-committed');},fence:async b=>{await checked();return f.x.sourceProof('fence',b,'writers-fenced');},...patch});
  const port=f.x.authorityPort(f.plan.actor.role);return createLocalFullStateReconciler(f.x.pin,f.plan,states.target,command,hash,tx,async()=>port.reconcile(f.plan),async nonce=>port.read(nonce),()=>1000);
 };
 return {...f,states,command,makeBridge,finalizer,metadata:fullStateMetadata(states.target)};
}
