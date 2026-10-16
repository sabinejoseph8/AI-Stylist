import {it,expect} from 'vitest';
import {databaseBridgeFixture} from './support/cvi-database-bridge-fixture.ts';
import {claimOriginalDatabaseAdmission,createLocalSignedDatabaseBridge} from '../src/server/local-cvi-database-authority-bridge.ts';
const signal=()=>new AbortController().signal;
const scope=(f:Awaited<ReturnType<typeof databaseBridgeFixture>>)=>({authority:f.x.pin,database:f.identityPin,principal:f.principal,plan:f.plan});
it('retains only the original confirmed transaction admission, once, without new reads',async()=>{const f=await databaseBridgeFixture();try{
 const b=f.make(),r=await b.admit(f.binding(),signal());expect(()=>claimOriginalDatabaseAdmission(r,scope(f),1000)).toThrow();await b.confirm(r.binding,r.claimHash,signal());const before=(await f.x.inspect()).requests.length;
 const c=claimOriginalDatabaseAdmission(r,scope(f),1000);expect(c).toEqual({operationId:f.command.operationId,transactionId:'40',claimHash:r.claimHash});expect(Object.isFrozen(c)).toBe(true);expect((await f.x.inspect()).requests.length).toBe(before);expect(()=>claimOriginalDatabaseAdmission(r,scope(f),1000)).toThrow();
 }finally{await f.close();}},30000);
it('JSON copies and reconstructed admissions cannot claim the original transaction',async()=>{const f=await databaseBridgeFixture();try{
 const b=f.make(),r=await b.admit(f.binding(),signal());await b.confirm(r.binding,r.claimHash,signal());for(const copy of [structuredClone(r),JSON.parse(JSON.stringify(r)),{binding:r.binding,claimHash:r.claimHash}])expect(()=>claimOriginalDatabaseAdmission(copy,scope(f),1000)).toThrow();expect(claimOriginalDatabaseAdmission(r,scope(f),1000).claimHash).toBe(r.claimHash);
 }finally{await f.close();}},30000);
it.each(['transaction','claim','extra','undefined'])('refuses an altered original %s result',async mode=>{const f=await databaseBridgeFixture();try{
 const b=f.make(),r:any=await b.admit(f.binding(),signal());await b.confirm(r.binding,r.claimHash,signal());if(mode==='transaction')r.binding.connection.transactionId='41';if(mode==='claim')r.claimHash='0'.repeat(64);if(mode==='extra')r.resume=true;if(mode==='undefined')r.extra=undefined;expect(()=>claimOriginalDatabaseAdmission(r,scope(f),1000)).toThrow();
 }finally{await f.close();}},30000);
it.each(['principal','plan','authority','database','extra'])('refuses a substituted expected %s context',async mode=>{const f=await databaseBridgeFixture();try{
 const b=f.make(),r=await b.admit(f.binding(),signal());await b.confirm(r.binding,r.claimHash,signal());const wrong:any=structuredClone(scope(f));if(mode==='principal')wrong.principal='fixture_writer';if(mode==='plan')wrong.plan.id='0'.repeat(64);if(mode==='authority')wrong.authority.keyId='fixture-key-other';if(mode==='database')wrong.database.publicKeyPem=f.x.pin.publicKeyPem;if(mode==='extra')wrong.resume=true;expect(()=>claimOriginalDatabaseAdmission(r,wrong,1000)).toThrow();expect(claimOriginalDatabaseAdmission(r,scope(f),1000)).toBeDefined();
 }finally{await f.close();}},30000);
it.each(['admit','confirm'])('cancellation of the %s operation invalidates its retained admission',async mode=>{const f=await databaseBridgeFixture();try{
 const b=f.make(),a=new AbortController(),c=new AbortController(),r=await b.admit(f.binding(),a.signal);await b.confirm(r.binding,r.claimHash,c.signal);(mode==='admit'?a:c).abort();expect(()=>claimOriginalDatabaseAdmission(r,scope(f),1000)).toThrow();
 }finally{await f.close();}},30000);
it.each([999,2000])('retained admission refuses clock/expiry boundary %s',async at=>{const f=await databaseBridgeFixture();try{
 const b=f.make(),r=await b.admit(f.binding(),signal());await b.confirm(r.binding,r.claimHash,signal());f.setTime(at);expect(()=>claimOriginalDatabaseAdmission(r,scope(f),at)).toThrow();
 }finally{await f.close();}},30000);
it('caller time cannot hide an expired trusted bridge clock',async()=>{const f=await databaseBridgeFixture();try{
 const b=f.make(),r=await b.admit(f.binding(),signal());await b.confirm(r.binding,r.claimHash,signal());f.setTime(2000);expect(()=>claimOriginalDatabaseAdmission(r,scope(f),1000)).toThrow();
 }finally{await f.close();}},30000);
it('failed confirmation leaves no claimable transaction',async()=>{const f=await databaseBridgeFixture();try{
 const b=f.make(),r=await b.admit(f.binding(),signal());await expect(b.confirm(r.binding,'0'.repeat(64),signal())).rejects.toThrow();expect(()=>claimOriginalDatabaseAdmission(r,scope(f),1000)).toThrow();
 }finally{await f.close();}},30000);
it('the captured SQL operation must be the original native plan operation',async()=>{const f=await databaseBridgeFixture();try{
 const before=(await f.x.inspect()).requests.length;expect(()=>createLocalSignedDatabaseBridge(f.x.pin,f.identityPin,f.principal,f.plan,f.approval,{...f.command,operationId:'0'.repeat(32)},f.port,f.observe,()=>1000)).toThrow();expect((await f.x.inspect()).requests.length).toBe(before);
 }finally{await f.close();}},30000);
it('a reentrant getter cannot claim the same original admission twice',async()=>{const f=await databaseBridgeFixture();try{
 const b=f.make(),r=await b.admit(f.binding(),signal());await b.confirm(r.binding,r.claimHash,signal());const originalBinding=r.binding;let entered=false,inner:any;
 Object.defineProperty(r,'binding',{enumerable:true,get(){if(!entered){entered=true;try{inner=claimOriginalDatabaseAdmission(r,scope(f),1000);}catch{inner='refused';}}return originalBinding;}});
 expect(claimOriginalDatabaseAdmission(r,scope(f),1000).transactionId).toBe('40');expect(inner).toBe('refused');expect(()=>claimOriginalDatabaseAdmission(r,scope(f),1000)).toThrow();
 }finally{await f.close();}},30000);
it('cancellation during a result getter cannot release a retained claim',async()=>{const f=await databaseBridgeFixture();try{
 const b=f.make(),c=new AbortController(),r=await b.admit(f.binding(),c.signal);await b.confirm(r.binding,r.claimHash,signal());const originalBinding=r.binding;
 Object.defineProperty(r,'binding',{enumerable:true,get(){c.abort();return originalBinding;}});expect(()=>claimOriginalDatabaseAdmission(r,scope(f),1000)).toThrow();
 }finally{await f.close();}},30000);
