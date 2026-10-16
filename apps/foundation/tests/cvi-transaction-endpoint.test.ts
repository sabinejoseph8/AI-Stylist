/** Actual endpoint + contract wrapper + fresh SQLite processes, all synthetic. */
import {it,expect,vi} from 'vitest';
import {mkdtemp,rm,unlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createLocalCviEndpoint} from '../src/server/local-cvi-endpoint.ts';
import {createLocalCviStyling} from '../src/server/local-cvi-styling.ts';
import {createLocalCviTransactionAdapter} from '../src/server/local-cvi-transaction.ts';
import type {TransactionProjection} from '../src/server/local-cvi-transaction.ts';
import {domainFixture,D} from './support/cvi-domain-history-fixture.ts';
import {transactionCall,transactionPort} from './support/cvi-transaction-process.ts';
import {credentialBinding,fixtureRequest} from './support/cvi-credential-process.ts';
async function setup(lostAck=false){const root=await mkdtemp(join(tmpdir(),'stylist-cvi-tx-endpoint-')),f=domainFixture(),pin=await transactionCall(root,'prepare',f.rotator,{snapshot:f.initial}) as any;
 const rotator=createLocalCviTransactionAdapter(f.rotator,pin.policyDigest,transactionPort(root,f.rotator),0,()=>1000,5000),p=await rotator.project();await rotator.commit(p!,{type:'rotate',previous:0,bindingDigest:D(2),bootDigest:D(3)});
 const port=transactionPort(root,f.writer()),base=port.commit;port.commit=async r=>{const reply=await base(r);if(lostAck)throw Error('fixture lost ack');return reply;};
 const adapter=createLocalCviTransactionAdapter(f.writer(),pin.policyDigest,port,1,()=>1000,5000);let projection:TransactionProjection|null=null;
 const draft=vi.fn(async()=> 'Transaction checked fixture.'),flow=createLocalCviStyling({draft,check:async(text,s)=>({approved:true,text,revision:s.revision})},1000);
 const replay={storeId:pin.storeId,reserve:async(r:any)=>{if(!projection||!await adapter.commit(projection,{type:'reserve',requestDigest:r.requestDigest,receiptDigest:D(77)}))throw Error();return {...r,receipt:'fixture-receipt-'+'d'.repeat(32),status:'reserved'};},consume:async(r:any)=>{if(!projection||!await adapter.commit(projection,{type:'consume',requestDigest:r.requestDigest,receiptDigest:D(77)}))throw Error();return {...r,status:'spent'};}};
 const endpoint=createLocalCviEndpoint(credentialBinding(),flow,()=>1000,8000,replay,{check:async()=>{projection=await adapter.project();return projection!==null;}});
 return {root,f,endpoint,draft,close:()=>rm(root,{recursive:true,force:true})};}
it('durably reserves before draft and consumes before response handoff',async()=>{const s=await setup();try{const r=await s.endpoint.handle(fixtureRequest());expect(r.status).toBe(200);expect((await transactionCall(s.root,'inspect',s.f.rotator) as any).snapshot.requests[0].state).toBe('reserved');expect(await r.text()).toContain('Transaction checked fixture.');expect((await transactionCall(s.root,'inspect',s.f.rotator) as any).snapshot.requests[0].state).toBe('spent');}finally{await s.close();}},20000);
it('lost durable reservation acknowledgment prevents draft and preserves held record',async()=>{const s=await setup(true);try{expect((await s.endpoint.handle(fixtureRequest())).status).toBe(409);expect(s.draft).not.toHaveBeenCalled();expect((await transactionCall(s.root,'inspect',s.f.rotator) as any).snapshot.requests[0].state).toBe('reserved');}finally{await s.close();}},20000);
it('credential retirement committed by another connection blocks waiting speech',async()=>{const s=await setup();try{const r=await s.endpoint.handle(fixtureRequest());const p=await transactionCall(s.root,'project',s.f.rotator) as any;const {status,snapshot,...permit}=p;const raw=await transactionCall(s.root,'commit',s.f.rotator,{request:{projection:permit,command:{type:'rotate',previous:1,bindingDigest:D(4),bootDigest:D(5)}}}) as any;expect(raw.status).toBe('committed');await expect(r.text()).rejects.toThrow('CVI delivery unavailable');expect((await transactionCall(s.root,'inspect',s.f.rotator) as any).snapshot.requests[0].state).toBe('reserved');}finally{await s.close();}},20000);
it('database disappearance after approval prevents delivery and does not recreate it',async()=>{const s=await setup();try{const r=await s.endpoint.handle(fixtureRequest());await unlink(join(s.root,'history.sqlite'));await expect(r.text()).rejects.toThrow('CVI delivery unavailable');}finally{await s.close();}},20000);
