/** Service-side synthetic projection; real independent transport/RBAC is unimplemented. */
import {it,expect,vi} from 'vitest';
import {createLocalCviEndpoint} from '../src/server/local-cvi-endpoint.ts';
import {createLocalCviStyling} from '../src/server/local-cvi-styling.ts';
import {createLocalCviHistoryAuthority} from '../src/server/local-cvi-history-authority.ts';
import type {HistoryHead} from '../src/server/local-cvi-history-authority.ts';
import {domainHistoryHash,projectDomainHistory} from '../src/server/local-cvi-domain-history.ts';
import type {DomainCommand} from '../src/server/local-cvi-domain-history.ts';
import {domainFixture,D} from './support/cvi-domain-history-fixture.ts';
import {credentialBinding,fixtureRequest} from './support/cvi-credential-process.ts';
async function setup(mode='normal'){
 const f=domainFixture();await f.rotate();const actor=mode==='observer'?f.observer:f.writer(),original=f.authority.connect(actor);
 const client=createLocalCviHistoryAuthority(f.pin,{exchange:async(r,s)=>{const reply=await original.exchange(r,s);if(mode==='lost-ack'&&r.action==='advance')throw Error('fixture lost ack');return reply;}},f.now);
 let floor=f.authority.snapshot().epoch,localHead=domainHistoryHash(f.authority.snapshot()),proof:HistoryHead|null=null;
 const draft=vi.fn(async()=> 'Domain checked fixture.'),flow=createLocalCviStyling({draft,check:async(text,s)=>({approved:true,text,revision:s.revision})},1000);
 async function apply(command:DomainCommand){const next=projectDomainHistory(f.authority.snapshot(),actor,command,f.now());if(!next||!proof)throw Error('Domain update unavailable');const result=await client.advance(proof,domainHistoryHash(next),command);if(!result)throw Error('Domain update unavailable');floor=result.epoch;localHead=result.head;}
 const replay={storeId:f.pin.storeId,reserve:async(r:any)=>{await apply({type:'reserve',requestDigest:r.requestDigest,receiptDigest:D(77)});return {...r,receipt:'fixture-receipt-'+'d'.repeat(32),status:'reserved'};},consume:async(r:any)=>{await apply({type:'consume',requestDigest:r.requestDigest,receiptDigest:mode==='wrong-receipt'?D(99):D(77)});return {...r,status:'spent'};}};
 const endpoint=createLocalCviEndpoint(credentialBinding(),flow,f.now,1500,replay,{check:async()=>{proof=await client.read(floor,localHead);return proof!==null;}});
 return {f,endpoint,client,draft};
}
it('actual endpoint reserves before draft and spends before text through validated signed commands',async()=>{const s=await setup(),r=await s.endpoint.handle(fixtureRequest());expect(r.status).toBe(200);expect(s.f.authority.snapshot().requests[0].state).toBe('reserved');expect(await r.text()).toContain('Domain checked fixture.');expect(s.f.authority.snapshot().requests[0].state).toBe('spent');});
it('observer cannot obtain a replay reservation even with a signed current read',async()=>{const s=await setup('observer');expect((await s.endpoint.handle(fixtureRequest())).status).toBe(409);expect(s.draft).not.toHaveBeenCalled();expect(s.f.authority.snapshot().requests).toHaveLength(0);});
it('credential retirement while waiting blocks old checked speech',async()=>{const s=await setup(),r=await s.endpoint.handle(fixtureRequest());await s.f.rotate(1,D(4),D(5));await expect(r.text()).rejects.toThrow('CVI delivery unavailable');expect(s.f.authority.snapshot().requests[0].state).toBe('reserved');});
it('wrong receipt cannot consume an approved reply or free its reservation',async()=>{const s=await setup('wrong-receipt'),r=await s.endpoint.handle(fixtureRequest());await expect(r.text()).rejects.toThrow('CVI delivery unavailable');expect(s.f.authority.snapshot().requests[0].state).toBe('reserved');});
it('lost mutation acknowledgment blocks draft and preserves request count',async()=>{const s=await setup('lost-ack');expect((await s.endpoint.handle(fixtureRequest())).status).toBe(409);expect(s.draft).not.toHaveBeenCalled();expect(s.f.authority.snapshot().requests).toHaveLength(1);expect(s.client.isHeld()).toBe(true);});
it('expired domain authority cannot release pending output',async()=>{const s=await setup(),r=await s.endpoint.handle(fixtureRequest());s.f.at(10000);await expect(r.text()).rejects.toThrow('CVI delivery unavailable');expect(s.f.authority.snapshot().requests[0].state).toBe('reserved');});
