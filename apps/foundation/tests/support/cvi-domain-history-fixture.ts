/** Public metadata and ephemeral TEST signing key only. No persistence or provider. */
import {generateKeyPairSync,sign} from 'node:crypto';
import {createDomainHistory,createLocalCviDomainAuthority,projectDomainHistory,domainHistoryHash} from '../../src/server/local-cvi-domain-history.ts';
import type {DomainActor,DomainCommand} from '../../src/server/local-cvi-domain-history.ts';
import {createLocalCviHistoryAuthority} from '../../src/server/local-cvi-history-authority.ts';
import type {HistoryPin,HistoryHead,HistoryAuthorityPort} from '../../src/server/local-cvi-history-authority.ts';
export const D=(n:number)=>n.toString(16).padStart(64,'0');
export function domainFixture(requestLimit=3,generationLimit=3){
 const key=generateKeyPairSync('ed25519'),pin:HistoryPin={authorityId:'fixture-authority-domain',storeId:'00000000-0000-4000-8000-000000000001',kind:'replay',keyId:'fixture-key-domain',publicKeyPem:key.publicKey.export({type:'spki',format:'pem'}).toString()};
 let now=1000;const initial=createDomainHistory({storeId:pin.storeId,scopeDigest:D(1),expiresAt:10000,now,requestLimit,generationLimit});
 const authority=createLocalCviDomainAuthority(initial,pin,body=>sign(null,Buffer.from(body),key.privateKey).toString('hex'),()=>now);
 const observer:DomainActor={principalId:'fixture-principal-observer',storeId:pin.storeId,scopeDigest:D(1),role:'observer'};
 const rotator:DomainActor={...observer,principalId:'fixture-principal-rotator',role:'rotator'};
 const writer=(generation=1,bindingDigest=D(2),bootDigest=D(3)):DomainActor=>({...observer,principalId:'fixture-principal-writer',role:'replay-writer',generation,bindingDigest,bootDigest});
 const client=(actor:DomainActor,port?:HistoryAuthorityPort)=>createLocalCviHistoryAuthority(pin,port??authority.connect(actor),()=>now,1000);
 const apply=async(actor:DomainActor,command:DomainCommand)=>{
  const c=client(actor),before=authority.snapshot(),proof=await c.read(before.epoch,domainHistoryHash(before)),next=projectDomainHistory(before,actor,command,now);
  if(!proof||!next)return null;return c.advance(proof,domainHistoryHash(next),command);
 };
 const rotate=(previous=0,bindingDigest=D(2),bootDigest=D(3))=>apply(rotator,{type:'rotate',previous,bindingDigest,bootDigest});
 return {pin,authority,initial,observer,rotator,writer,client,apply,rotate,now:()=>now,at:(n:number)=>{now=n;}};
}
export const reserve=(n=1):DomainCommand=>({type:'reserve',requestDigest:D(100+n),receiptDigest:D(200+n)});
export const consume=(n=1):DomainCommand=>({type:'consume',requestDigest:D(100+n),receiptDigest:D(200+n)});
