import {mandatoryFixture} from './cvi-mandatory-fixture.ts';
import {fixtureKey} from './cvi-witness-service-fixture.ts';
import {historyCanonical} from '../../src/server/local-cvi-history-authority.ts';
import {witnessServiceDigest} from '../../src/server/local-cvi-witness-service.ts';
import {createLocalSignedDatabaseBridge} from '../../src/server/local-cvi-database-authority-bridge.ts';
import type {DatabaseBinding,DatabaseProofRequest} from '../../src/server/local-cvi-database-authority-bridge.ts';
export async function databaseBridgeFixture(){
 const x=await mandatoryFixture(),plan=await x.activation(),port=x.authorityPort('rotator'),approval=await port.advance(plan),key=fixtureKey();
 const identityPin={keyId:'fixture-key-database-transaction',publicKeyPem:key.pem};
 const previous={generation:0,fenced:true,owner:'0'.repeat(64),boot:'0'.repeat(64),head:'a'.repeat(64)},target={...previous,generation:1,fenced:false,owner:plan.args.owner,boot:plan.args.boot};
 const command={operationId:plan.id.slice(0,32),kind:'activate',previous,target,recordHash:null,expiresAt:3000};
 let current:DatabaseBinding={intent:command,connection:{principal:'fixture_rotator',transactionId:'40'}},time=1000,patch:Record<string,unknown>={},badSignature=false;
 const observe=async(r:DatabaseProofRequest):Promise<unknown>=>{const body={version:1,keyId:identityPin.keyId,...r,bindingDigest:witnessServiceDigest(current),issuedAt:time,expiresAt:time+1000,...patch};return {body,signature:badSignature?'0'.repeat(128):key.sign(historyCanonical(body))};};
 const make=(source=observe)=>createLocalSignedDatabaseBridge(x.pin,identityPin,'fixture_rotator',plan,approval,command,port,source,()=>time,30000);
 return {x,plan,port,approval,key,identityPin,command,observe,make,binding:()=>structuredClone(current),setBinding:(v:DatabaseBinding)=>{current=structuredClone(v);},setTime:(v:number)=>{time=v;},patchProof:(v:Record<string,unknown>)=>{patch=v;},badSignature:()=>{badSignature=true;},close:x.close};
}
