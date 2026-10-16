/** Same durable journal and signature contract; transport reuses one process. */
import {it,expect} from 'vitest';
import {residentWitnessTransport} from './support/cvi-resident-witness.ts';
import {witnessServiceFixture,serviceCall} from './support/cvi-witness-service-fixture.ts';
import {verifyLocalWitnessReply} from '../src/server/local-cvi-witness-service.ts';
const signal=()=>new AbortController().signal;
it('resident signed reads reload the journal and survive inspection by a fresh process',async()=>{
 const transport=residentWitnessTransport(),f=await witnessServiceFixture(transport.call);try{
  for(let i=0;i<2;i++){const e=f.envelope('observer','read'),reply=await f.make().handle(e,signal());expect((verifyLocalWitnessReply(f.pin,e.request,reply,1000) as any).status).toBe('read');}
  expect(transport.stats()).toEqual({calls:5,processStarts:1});await transport.close();
  const actor=f.grants.find(a=>a.role==='observer')!,state=await serviceCall({root:f.root,pin:f.storePin,actor:{principalDigest:actor.principalDigest,role:actor.role},mode:'inspect',args:{},now:1000});
  expect(state.current).toEqual(f.initial);expect(state.requests).toHaveLength(2);expect(state.requests.every((r:any)=>r.state==='used')).toBe(true);
 }finally{await transport.close();await f.close();}
},20000);
it('worker loss holds unknown work with no restart, refund or fresh-process fallback',async()=>{
 const transport=residentWitnessTransport(),f=await witnessServiceFixture(transport.call);try{
  f.setCrash('ledger','admit');const e=f.envelope('observer','read');await expect(f.make().handle(e,signal())).rejects.toThrow();
  await expect(transport.call({mode:'inspect'})).rejects.toThrow();expect(transport.stats().processStarts).toBe(1);
  const actor=f.grants.find(a=>a.role==='observer')!;await expect(serviceCall({root:f.root,pin:f.storePin,actor:{principalDigest:actor.principalDigest,role:actor.role},mode:'inspect',args:{},now:1000})).rejects.toThrow();
 }finally{await transport.close();await f.close();}
},20000);
it('resident transport serializes frames without reusing signed challenges',async()=>{
 const transport=residentWitnessTransport(),f=await witnessServiceFixture(transport.call);try{
  const first=f.envelope('observer','read'),second=f.envelope('observer','read'),[a,b]=await Promise.all([f.make().handle(first,signal()),f.make().handle(second,signal())]);
  expect(first.request.challenge).not.toBe(second.request.challenge);expect((verifyLocalWitnessReply(f.pin,first.request,a,1000) as any).status).toBe('read');expect((verifyLocalWitnessReply(f.pin,second.request,b,1000) as any).status).toBe('read');
 }finally{await transport.close();await f.close();}
},20000);
