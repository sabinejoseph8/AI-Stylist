/** Signed contract composition with synthetic journal transitions, not a disk adapter. */
import {it,expect,vi} from 'vitest';
import {createLocalCviHistoryAuthority} from '../src/server/local-cvi-history-authority.ts';
import type {HistoryHead} from '../src/server/local-cvi-history-authority.ts';
import {createLocalCviEndpoint} from '../src/server/local-cvi-endpoint.ts';
import {createLocalCviStyling} from '../src/server/local-cvi-styling.ts';
import {authorityFixture} from './support/cvi-history-authority-fixture.ts';
import {fixtureRequest,credentialBinding} from './support/cvi-credential-process.ts';
function setup(mode='normal'){
 const f=authorityFixture(),original=f.port.exchange;let reads=0;
 f.port.exchange=async(r,s)=>{const result=await original(r,s);if(mode==='lost-reservation-ack'&&r.action==='advance')throw Error('fixture lost ack');
  if(r.action==='read'&&++reads===3&&mode==='forged-final')return {body:(result as any).body,signature:'0'.repeat(128)};return result;};
 const c=createLocalCviHistoryAuthority(f.pin,f.port,()=>1000);let localHead='a'.repeat(64),floor=0,proof:HistoryHead|null=null;
 const events:string[]=[];const draft=vi.fn(async()=>{events.push('draft');return 'Signed checked fixture.';});
 const flow=createLocalCviStyling({draft,check:async(text,s)=>({approved:true,text,revision:s.revision})},1000);
 const replay={storeId:f.pin.storeId,reserve:async(r:any)=>{const applied=await c.advance(proof!,'b'.repeat(64));if(!applied)throw Error();events.push('reserved');localHead=applied.head;floor=applied.epoch;return {...r,receipt:'fixture-receipt-'+'d'.repeat(32),status:'reserved'};},
  consume:async(r:any)=>{const applied=await c.advance(proof!,'c'.repeat(64));if(!applied)throw Error();events.push('spent');localHead=mode==='rollback-after-consume'?'a'.repeat(64):applied.head;floor=applied.epoch;return {...r,status:'spent'};}};
 const endpoint=createLocalCviEndpoint(credentialBinding(),flow,()=>1000,1500,replay,{check:async()=>{events.push('read');proof=await c.read(floor,localHead);return proof!==null;}});
 return {endpoint,f,c,draft,events,rollback:()=>{localHead='a'.repeat(64);}};
}
it('signed fresh-head gates surround reserve, draft, consumption and final output',async()=>{const s=setup(),r=await s.endpoint.handle(fixtureRequest());expect(s.events).toEqual(['read','reserved','draft']);expect(await r.text()).toContain('Signed checked fixture.');expect(s.events).toEqual(['read','reserved','draft','read','spent','read']);expect(s.f.head().epoch).toBe(2);});
it('independent authority ahead of local history prevents draft work',async()=>{const s=setup();s.f.set(2,'f'.repeat(64));expect((await s.endpoint.handle(fixtureRequest())).status).toBe(409);expect(s.draft).not.toHaveBeenCalled();});
it('local rollback after approval prevents speech handoff',async()=>{const s=setup(),r=await s.endpoint.handle(fixtureRequest());s.rollback();await expect(r.text()).rejects.toThrow('CVI delivery unavailable');expect(s.events).not.toContain('spent');});
it.each(['lost-reservation-ack','rollback-after-consume','forged-final'])('%s never releases unchecked speech or retries',async mode=>{const s=setup(mode),r=await s.endpoint.handle(fixtureRequest());if(mode==='lost-reservation-ack'){expect(r.status).toBe(409);expect(s.draft).not.toHaveBeenCalled();expect(s.f.head().epoch).toBe(1);}else{expect(r.status).toBe(200);await expect(r.text()).rejects.toThrow('CVI delivery unavailable');}expect(s.c.isHeld()).toBe(true);});
