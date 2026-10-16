/** Signed gateway + actual disposable transaction backend. No hosted account. */
import {it,expect,vi} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {generateKeyPairSync,sign} from 'node:crypto';
import {createLocalCviAckGateway,createLocalCviSignedTransactionPort,hostedPrincipalDigest} from '../src/server/local-cvi-hosted-proposal.ts';
import {createLocalCviTransactionAdapter} from '../src/server/local-cvi-transaction.ts';
import type {TransactionProjection} from '../src/server/local-cvi-transaction.ts';
import type {DomainActor} from '../src/server/local-cvi-domain-history.ts';
import {createLocalCviEndpoint} from '../src/server/local-cvi-endpoint.ts';
import {createLocalCviStyling} from '../src/server/local-cvi-styling.ts';
import {domainFixture,D} from './support/cvi-domain-history-fixture.ts';
import {transactionCall,transactionPort} from './support/cvi-transaction-process.ts';
import {credentialBinding,fixtureRequest} from './support/cvi-credential-process.ts';
const rotation={type:'rotate' as const,previous:0,bindingDigest:D(2),bootDigest:D(3)};
async function setup(){const root=await mkdtemp(join(tmpdir(),'stylist-hosted-ack-')),f=domainFixture(),policy=await transactionCall(root,'prepare',f.rotator,{snapshot:f.initial}) as any,key=generateKeyPairSync('ed25519');
 function make(actor:DomainActor,mode='normal'){
  const pin={authorityId:'fixture-authority-hosted',storeId:policy.storeId,policyDigest:policy.policyDigest,principalDigest:hostedPrincipalDigest(actor),keyId:'fixture-key-ack',publicKeyPem:key.publicKey.export({type:'spki',format:'pem'}).toString()};let commits=0;
  const backend=transactionPort(root,actor),gateway=createLocalCviAckGateway(pin,actor,backend,body=>{if(mode==='signer-down'&&commits>0)throw Error('fixture unavailable');return sign(null,Buffer.from(body),key.privateKey).toString('hex');},()=>1000,5000);
  const wire={exchange:async(r:any,s:AbortSignal)=>{if(r.action==='commit')commits++;const reply=await gateway.exchange(r,s) as any;return mode==='tampered-commit'&&r.action==='commit'?{...reply,signature:'0'.repeat(128)}:reply;}};
  return createLocalCviTransactionAdapter(actor,policy.policyDigest,createLocalCviSignedTransactionPort(pin,wire,()=>1000,5000),0,()=>1000,5000);
 }
 return {root,f,make,close:()=>rm(root,{recursive:true,force:true})};}
it('SQLite commit precedes a valid signed acknowledgment accepted by the client',async()=>{const x=await setup();try{const a=x.make(x.f.rotator),p=await a.project();expect((await a.commit(p!,rotation))?.epoch).toBe(1);expect((await transactionCall(x.root,'inspect',x.f.rotator) as any).snapshot.epoch).toBe(1);}finally{await x.close();}},20000);
it('signer failure after SQLite commit preserves history with no client success',async()=>{const x=await setup();try{const a=x.make(x.f.rotator,'signer-down'),p=await a.project();expect(await a.commit(p!,rotation)).toBeNull();expect(a.isHeld()).toBe(true);expect((await transactionCall(x.root,'inspect',x.f.rotator) as any).snapshot.epoch).toBe(1);}finally{await x.close();}},20000);
async function endpointSetup(mode:string){const x=await setup(),rotator=x.make(x.f.rotator),r=await rotator.project();await rotator.commit(r!,rotation);const adapter=x.make(x.f.writer(),mode);let p:TransactionProjection|null=null;
 const draft=vi.fn(async()=> 'Signed persistent fixture.'),flow=createLocalCviStyling({draft,check:async(text,s)=>({approved:true,text,revision:s.revision})},1000);
 const replay={storeId:x.f.initial.storeId,reserve:async(i:any)=>{if(!p||!await adapter.commit(p,{type:'reserve',requestDigest:i.requestDigest,receiptDigest:D(77)}))throw Error();return {...i,receipt:'fixture-receipt-'+'d'.repeat(32),status:'reserved'};},consume:async(i:any)=>{if(!p||!await adapter.commit(p,{type:'consume',requestDigest:i.requestDigest,receiptDigest:D(77)}))throw Error();return {...i,status:'spent'};}};
 return {...x,draft,endpoint:createLocalCviEndpoint(credentialBinding(),flow,()=>1000,8000,replay,{check:async()=>{p=await adapter.project();return p!==null;}})};
}
it('endpoint requires signed durable reserve and consume before text delivery',async()=>{const x=await endpointSetup('normal');try{const response=await x.endpoint.handle(fixtureRequest());expect(response.status).toBe(200);expect((await transactionCall(x.root,'inspect',x.f.rotator) as any).snapshot.requests[0].state).toBe('reserved');expect(await response.text()).toContain('Signed persistent fixture.');expect((await transactionCall(x.root,'inspect',x.f.rotator) as any).snapshot.requests[0].state).toBe('spent');}finally{await x.close();}},20000);
it('tampered post-commit signature blocks draft while durable reservation stays held',async()=>{const x=await endpointSetup('tampered-commit');try{expect((await x.endpoint.handle(fixtureRequest())).status).toBe(409);expect(x.draft).not.toHaveBeenCalled();expect((await transactionCall(x.root,'inspect',x.f.rotator) as any).snapshot.requests[0].state).toBe('reserved');}finally{await x.close();}},20000);
