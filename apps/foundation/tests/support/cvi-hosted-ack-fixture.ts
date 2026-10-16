import {generateKeyPairSync,sign} from 'node:crypto';
import {createLocalCviAckGateway,createLocalCviSignedTransactionPort,hostedPrincipalDigest} from '../../src/server/local-cvi-hosted-proposal.ts';
import type {HostedAckPin,HostedAckWire} from '../../src/server/local-cvi-hosted-proposal.ts';
import {createLocalCviTransactionAdapter} from '../../src/server/local-cvi-transaction.ts';
import {domainPolicyHash,domainHistoryHash,projectDomainHistory} from '../../src/server/local-cvi-domain-history.ts';
import {domainFixture,D} from './cvi-domain-history-fixture.ts';
import type {DomainActor} from '../../src/server/local-cvi-domain-history.ts';
export function hostedAckFixture(actor?:DomainActor){
 const f=domainFixture(),key=generateKeyPairSync('ed25519'),grant=actor??f.rotator;let state=f.initial,token=0;
 const policy=domainPolicyHash(state),pin:HostedAckPin={authorityId:'fixture-authority-hosted-proposal',storeId:state.storeId,policyDigest:policy,principalDigest:hostedPrincipalDigest(grant),keyId:'fixture-key-ack',publicKeyPem:key.publicKey.export({type:'spki',format:'pem'}).toString()};
 const events:string[]=[];
 const backend={project:async()=>{events.push('backend-project');return {status:'projected',storeId:state.storeId,policyDigest:policy,epoch:state.epoch,head:domainHistoryHash(state),at:1000,expiresAt:2000,token:D(++token+300),snapshot:state};},
 commit:async(r:any)=>{events.push('backend-commit');const next=projectDomainHistory(state,grant,r.command,1000);if(!next)return {status:'denied'};const previous=state;state=next;return {status:'committed',storeId:state.storeId,policyDigest:policy,previousEpoch:previous.epoch,previousHead:domainHistoryHash(previous),epoch:state.epoch,head:domainHistoryHash(state),at:1000};}};
 const signer=(body:string)=>{events.push('sign');return sign(null,Buffer.from(body),key.privateKey).toString('hex');};
 const gateway=createLocalCviAckGateway(pin,grant,backend,signer,()=>1000,500);
 let wire:HostedAckWire=gateway;
 const port=()=>createLocalCviSignedTransactionPort(pin,wire,()=>1000,500);
 const adapter=()=>createLocalCviTransactionAdapter(grant,policy,port(),0,()=>1000,500);
 return {f,grant,pin,gateway,backend,events,signer,port,adapter,setWire:(x:HostedAckWire)=>{wire=x;},snapshot:()=>state};
}
