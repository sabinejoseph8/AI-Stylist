// Test-only composition. Receives a disposable container name, never a credential.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {createRefreshEnvelopes} from '../src/server/refresh-envelope.ts';
import {createRefreshStore} from '../src/server/refresh-store.ts';
const container=process.argv[2];
assert.match(container??'',/^stylist-refresh-[a-f0-9]{10}$/);
const owner='11111111-1111-4111-8111-111111111111',session='22222222-2222-4222-8222-222222222222';
const key=randomBytes(32),keyring=new Map([['fixture',key]]),codec=createRefreshEnvelopes(keyring,'fixture');
const scope={ownerId:owner,sessionId:session,generation:1,expiresAt:Date.now()+600000};
const signal=()=>new AbortController().signal;
function execute(args,input=''){
 return new Promise((resolve,reject)=>{
  const child=spawn('docker',args,{stdio:['pipe','pipe','pipe']});let out='',size=0;
  const timer=setTimeout(()=>{child.kill();reject(Error('Rehearsal command timed out'));},15000);
  child.on('error',()=>{clearTimeout(timer);reject(Error('Rehearsal command unavailable'));});
  child.stdout.on('data',chunk=>{size+=chunk.length;if(size>65536){child.kill();reject(Error('Rehearsal output limit'));}out+=chunk;});
  child.stderr.resume();child.on('close',code=>{clearTimeout(timer);code===0?resolve(out.trim()):reject(Error('Rehearsal command failed'));});child.stdin.end(input);
 });
}
const signatures={
 stylist_adopt_refresh:[['p_owner','uuid'],['p_session','uuid'],['p_expiry','bigint'],['p_envelope','jsonb']],
 stylist_inspect_refresh:[['p_owner','uuid'],['p_session','uuid']],
 stylist_claim_refresh:[['p_owner','uuid'],['p_session','uuid'],['p_generation','bigint']],
 stylist_finish_refresh:[['p_owner','uuid'],['p_session','uuid'],['p_generation','bigint'],['p_lease','uuid'],['p_expiry','bigint'],['p_envelope','jsonb']],
 stylist_hold_refresh:[['p_owner','uuid'],['p_session','uuid'],['p_generation','bigint'],['p_lease','uuid']],
 stylist_remove_refresh:[['p_owner','uuid'],['p_session','uuid'],['p_generation','bigint'],['p_lease','uuid'],['p_revoked','boolean']],
};
let loseNext=null;
const rpc={async call(name,payload,abort){
 assert.ok(signatures[name]);if(abort.aborted)throw Error('Canceled');
 const args=signatures[name].map(([field,type])=>{assert.ok(Object.hasOwn(payload,field));const value=payload[field];return value===null?'null':"'"+String(type==='jsonb'?JSON.stringify(value):value).replaceAll("'","''")+"'::"+type;});
 const query=`set role service_role;select coalesce(to_jsonb(public.${name}(${args.join(',')}))::text,'null');`;
 const value=JSON.parse(await execute(['exec','-i',container,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],query));
 if(loseNext===name){loseNext=null;throw Error('Simulated lost acknowledgment');}return value;
}};
const store=createRefreshStore(rpc,codec);
loseNext='stylist_adopt_refresh';assert.equal(await store.adopt('initial-fixture',scope,signal()),'unconfirmed');
const adopted=await store.inspect(owner,session,signal());assert.equal(adopted.status,'found');assert.equal(adopted.scope.generation,1);assert.equal(adopted.state,'ready');
assert.equal(await store.adopt('must-not-overwrite',scope,signal()),'refused');
const contenders=await Promise.all([store.claim(owner,session,1,signal()),store.claim(owner,session,1,signal())]);
const winners=contenders.filter(value=>value.status==='claimed');assert.equal(winners.length,1);const first=winners[0];
assert.equal(first.readSecret(),'initial-fixture');assert.equal(first.readSecret(),null);
loseNext='stylist_finish_refresh';assert.equal(await store.finish('rotated-fixture',first.scope,first.leaseId,scope.expiresAt,signal()),'unconfirmed');
const completed=await store.inspect(owner,session,signal());assert.equal(completed.status,'found');assert.equal(completed.scope.generation,2);assert.equal(completed.state,'ready');
assert.equal(await store.finish('stale-fixture',first.scope,first.leaseId,scope.expiresAt,signal()),'refused');
const next=await store.claim(owner,session,2,signal());assert.equal(next.status,'claimed');assert.equal(next.readSecret(),'rotated-fixture');
assert.equal(await store.hold(next.scope,next.leaseId,signal()),'confirmed');
await execute(['restart',container]);
for(let attempt=0;;attempt++){
 try{await execute(['exec',container,'pg_isready','-h','127.0.0.1','-U','postgres']);break;}catch{if(attempt>=50)throw Error('Restart unavailable');await new Promise(resolve=>setTimeout(resolve,100));}
}
// Rebuild process-local codec/adapter with the same explicit test key after the database restart.
const resumed=createRefreshStore(rpc,createRefreshEnvelopes(keyring,'fixture'));
const held=await resumed.inspect(owner,session,signal());assert.equal(held.status,'found');assert.equal(held.state,'held');assert.equal(held.scope.generation,2);
assert.equal((await resumed.claim(owner,session,2,signal())).status,'refused');
assert.equal(await resumed.remove(held.scope,held.leaseId,false,signal()),'refused');
assert.equal(await resumed.remove(held.scope,held.leaseId,true,signal()),'confirmed');
assert.equal((await resumed.inspect(owner,session,signal())).status,'absent');
assert.equal(await store.adopt('wrong-key-fixture',scope,signal()),'confirmed');
const wrongKey=createRefreshStore(rpc,createRefreshEnvelopes(new Map([['fixture',randomBytes(32)]]),'fixture'));
assert.equal((await wrongKey.claim(owner,session,1,signal())).status,'unconfirmed');
const unresolved=await store.inspect(owner,session,signal());assert.equal(unresolved.status,'found');assert.equal(unresolved.state,'rotating');
assert.equal((await store.claim(owner,session,1,signal())).status,'refused');
assert.equal(await store.hold(unresolved.scope,unresolved.leaseId,signal()),'confirmed');
assert.equal(await store.remove(unresolved.scope,unresolved.leaseId,true,signal()),'confirmed');
console.log('Encrypted refresh adapter PostgreSQL composition passed: lost acknowledgments, one concurrent winner, next-generation decryption, restart hold, wrong-key refusal and fenced removal.');
