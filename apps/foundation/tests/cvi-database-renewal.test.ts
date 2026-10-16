import {it,expect} from 'vitest';
import {databaseBridgeFixture} from './support/cvi-database-bridge-fixture.ts';
import {fullStateFixture} from './support/cvi-full-state-fixture.ts';
import {createLocalSignedDatabaseBridge,claimOriginalDatabaseAdmission} from '../src/server/local-cvi-database-authority-bridge.ts';
import {witnessServiceDigest} from '../src/server/local-cvi-witness-service.ts';
const signal=()=>new AbortController().signal;
it('confirms and claims an original same-owner renewal admission with unchanged reduced projection',async()=>{const f=await databaseBridgeFixture('renew');try{
 expect(f.plan.kind).toBe('renew');expect(f.command.previous).toEqual(f.command.target);const b=f.make(),a=await b.admit(f.binding(),signal());expect(await b.confirm(a.binding,a.claimHash,signal())).toBe(true);expect(claimOriginalDatabaseAdmission(a,{authority:f.x.pin,database:f.identityPin,principal:f.principal,plan:f.plan},1000).transactionId).toBe('40');expect((await f.x.inspect()).pending).toBe(f.plan.id);
 }finally{await f.close();}},30000);
it.each(['role','generation','owner','boot','token','ttl','expired','deadline','projection','lease-shape','boolean'])('rejects malformed renewal %s before an authority claim',async mode=>{const f=await databaseBridgeFixture('renew');try{
 const p:any=structuredClone(f.plan),c:any=structuredClone(f.command),l=p.args.lease;
 if(mode==='role')p.actor.role='writer';if(mode==='generation')p.to.epochFloor++;if(mode==='owner'){c.previous.owner='f'.repeat(64);c.target={...c.previous};}if(mode==='boot')l.bootDigest='f'.repeat(64);if(mode==='token')p.args.token=l.token;if(mode==='ttl')p.args.ttl=8001;if(mode==='expired')p.now=l.expiresAt;if(mode==='deadline')c.expiresAt=l.expiresAt+1;if(mode==='projection')c.target={...c.target,head:'f'.repeat(64)};if(mode==='lease-shape')l.extra=true;if(mode==='boolean')l.generation=true;
 const {id,...body}=p;p.id=witnessServiceDigest(body);c.operationId=p.id.slice(0,32);const before=(await f.x.inspect()).requests.length;
 expect(()=>createLocalSignedDatabaseBridge(f.x.pin,f.identityPin,f.principal,p,f.approval,c,f.port,f.observe,()=>1000)).toThrow();expect((await f.x.inspect()).requests.length).toBe(before);
 }finally{await f.close();}},30000);
it('reconciles the complete renewed grant while preserving domain content and original claim',async()=>{const f=await fullStateFixture('renew');try{
 expect(f.states.target.history).toEqual(f.states.previous.history);expect(f.states.target.receipts).toEqual(f.states.previous.receipts);expect(f.states.target.grants[0][3]).not.toBe(f.states.previous.grants[0][3]);expect(f.states.target.grants[0][5]).toBeGreaterThan(f.states.previous.grants[0][5]);
 const proof=await f.port.claim(f.plan,'d'.repeat(64)),hash=witnessServiceDigest(proof.request),seen={snapshot:f.states.target,projection:f.command.target,operationId:f.command.operationId,transactionId:'40',claimHash:hash,consumed:true,protected:true};expect((await f.finalizer(hash,'40',async()=>seen).finalize(signal())).status).toBe('reconciled');expect((await f.x.inspect()).pending).toBeNull();
 }finally{await f.close();}},30000);
