import {createSupabaseAccountHost} from '../src/server/supabase-account-host.ts';
import {createServer,request as nodeRequest} from 'node:http';
// Test-only composition. Receives a disposable container name, never a credential.
import assert from 'node:assert/strict';
import {createAccountComposition} from '../src/server/account-composition.ts';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {createRefreshEnvelopes} from '../src/server/refresh-envelope.ts';
import {createRefreshStore} from '../src/server/refresh-store.ts';
import {createRefreshRotation} from '../src/server/refresh-rotation.ts';
import {createAccountSessions} from '../src/server/account-session.ts';
import {createStoredRefreshPort} from '../src/server/refresh-port.ts';
import {createAccountRefresh} from '../src/server/account-refresh.ts';
import {createRefreshHttp} from '../src/server/refresh-http.ts';
import {createRefreshProvider} from '../src/server/refresh-provider.ts';
import {createRefreshProviderHttp} from '../src/server/refresh-provider-http.ts';
import {createRefreshReconciliation} from '../src/server/refresh-reconciliation.ts';
import {createAuthSessionPresence} from '../src/server/auth-session-presence.ts';
import {createInitialSessionStager} from '../src/server/initial-session.ts';
import {createStoredSignOut} from '../src/server/stored-signout.ts';
import {createAccountSignOut} from '../src/server/account-signout.ts';
import {createSignOutHttp} from '../src/server/signout-http.ts';
import {createPasswordProviderHttp} from '../src/server/password-provider-http.ts';
import {createPasswordProvider} from '../src/server/password-provider.ts';
import {createPasswordAccounts} from '../src/server/password-account.ts';
import {createOAuthProvider} from '../src/server/oauth-provider.ts';
import {createAccountExchange} from '../src/server/account-exchange.ts';
import {createOAuthStart} from '../src/server/oauth-start.ts';
import {createRecoveryProviderHttp} from '../src/server/recovery-provider-http.ts';
import {createRecoveryProvider} from '../src/server/recovery-provider.ts';
import {createAccountRecovery} from '../src/server/account-recovery.ts';
import {createRecoveryBrowser} from '../src/server/recovery-browser.ts';
import {createRecoveryHttp} from '../src/server/recovery-http.ts';
import {createRecoveryRequest} from '../src/server/recovery-request.ts';
import {createIdentityVerifier} from '../src/server/verified-identity.ts';
import {createAuthSessionAuthority} from '../src/server/auth-session.ts';
import {createRefreshScan} from '../src/server/refresh-scan.ts';
import {createAccountSecurity} from '../src/server/account-security.ts';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
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
 stylist_consume_account_admission:[],
 stylist_refresh_key_usage:[['p_key_id','text']],
 stylist_list_refresh_candidates:[['p_after','uuid'],['p_limit','integer']],
 stylist_auth_session_presence:[['p_owner','uuid'],['p_session','uuid']],
 stylist_auth_session_active:[['p_owner','uuid'],['p_session','uuid']],
 stylist_adopt_refresh:[['p_owner','uuid'],['p_session','uuid'],['p_expiry','bigint'],['p_envelope','jsonb']],
 stylist_inspect_refresh:[['p_owner','uuid'],['p_session','uuid']],
 stylist_claim_refresh:[['p_owner','uuid'],['p_session','uuid'],['p_generation','bigint']],
 stylist_finish_refresh:[['p_owner','uuid'],['p_session','uuid'],['p_generation','bigint'],['p_lease','uuid'],['p_expiry','bigint'],['p_envelope','jsonb']],
 stylist_hold_refresh:[['p_owner','uuid'],['p_session','uuid'],['p_generation','bigint'],['p_lease','uuid']],
 stylist_remove_refresh:[['p_owner','uuid'],['p_session','uuid'],['p_generation','bigint'],['p_lease','uuid'],['p_revoked','boolean']],
};
let loseNext=null;
const rpc={async call(name,payload,abort){
 assert.ok(signatures[name]);if(abort?.aborted)throw Error('Canceled');
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

// Actual signature verification and current-session SQL lookup, with synthetic provider output.
const origin='https://stylist.example',project='https://example.supabase.co';
const pair=await generateKeyPair('ES256'),jwk={...await exportJWK(pair.publicKey),kid:'rehearsal'};
const security=createAccountSecurity({appOrigin:origin,projectUrl:project,fetch:async()=>new Response(JSON.stringify({keys:[jwk]})),rpc});
async function token(sessionId=session,expired=false){
 return new SignJWT({session_id:sessionId,role:'authenticated',is_anonymous:false}).setProtectedHeader({alg:'ES256',kid:'rehearsal'}).setSubject(owner).setIssuer(project+'/auth/v1').setAudience('authenticated').setIssuedAt().setExpirationTime(expired?Math.floor(Date.now()/1000)-60:'5m').sign(pair.privateKey);
}
let providerToken=await token(),revocations=0;
const rotation=createRefreshRotation(store,{async rotate(value,abort){
 assert.equal(value,'coordinator-fixture');assert.equal(abort.aborted,false);
 return {accessToken:providerToken,refreshSecret:'coordinator-next-fixture',expiresAt:scope.expiresAt,async revoke(){revocations++;return true;}};
}});
async function runSession(){
 const sessions=createAccountSessions(security,origin);
 return sessions.run(abort=>rotation.stage(scope,abort),signal(),{returnPath:'/',expectedOwner:owner,expectedSessionId:session});
}
assert.equal(await store.adopt('coordinator-fixture',scope,signal()),'confirmed');
const ready=await runSession();assert.equal(ready.status,'ready');assert.equal(ready.setCookies.length,1);assert.match(ready.setCookies[0],/Secure; HttpOnly; SameSite=Strict/);
const afterAdoption=await store.inspect(owner,session,signal());assert.equal(afterAdoption.scope.generation,2);assert.equal(afterAdoption.state,'ready');
assert.equal(await ready.discard(),true);assert.equal((await store.inspect(owner,session,signal())).status,'absent');assert.equal(revocations,1);
// A committed rotation with a lost acknowledgment must expose no cookie and reconcile after revocation.
assert.equal(await store.adopt('coordinator-fixture',scope,signal()),'confirmed');loseNext='stylist_finish_refresh';
assert.equal((await runSession()).status,'unavailable');assert.equal((await store.inspect(owner,session,signal())).status,'absent');assert.equal(revocations,2);
// Wrong signed session and expired signed access never adopt the staged rotation.
for(const invalid of [await token('44444444-4444-4444-8444-444444444444'),await token(session,true)]){
 providerToken=invalid;assert.equal(await store.adopt('coordinator-fixture',scope,signal()),'confirmed');
 assert.equal((await runSession()).status,'unavailable');assert.equal((await store.inspect(owner,session,signal())).status,'absent');
}
assert.equal(revocations,4);
console.log('Refresh coordinator/session PostgreSQL composition passed: verified cookie after adoption, ambiguous-write cleanup, wrong-session refusal and expired-access refusal. Provider rotation/revocation remain synthetic.');

providerToken=await token();
assert.equal(await store.adopt('coordinator-fixture',scope,signal()),'confirmed');
const port=createStoredRefreshPort(security,store,rotation,origin);
const refreshFactory=accountFactory({refresh:port});
const http=refreshFactory.routes().get('/api/account/refresh');
function refreshRequest(body='{}'){
 return new Request(origin+'/api/account/refresh',{method:'POST',headers:{origin,host:'stylist.example',cookie:'__Host-stylist_access='+providerToken,'content-type':'application/json'},body});
}
const invalidBody=await http.handle(refreshRequest(JSON.stringify({ownerId:'foreign'})),signal());assert.equal(invalidBody.status,400);
assert.equal((await store.inspect(owner,session,signal())).scope.generation,1);
const delivered=await http.handle(refreshRequest(),signal());assert.equal(delivered.status,200);assert.deepEqual(await delivered.json(),{status:'signedIn'});assert.match(delivered.headers.get('set-cookie'),/__Host-stylist_access=/);
assert.equal((await store.inspect(owner,session,signal())).scope.generation,2);
assert.equal(await http.discardResponse(delivered),true);assert.equal((await store.inspect(owner,session,signal())).status,'absent');
assert.equal(await refreshFactory.close(),true);
console.log('Account factory refresh HTTP/PostgreSQL composition passed: verified cookie-derived scope, generation adoption, identity JSON refusal and failed-delivery cleanup. HTTP uses Request/Response factories, not a deployed server.');

// All provider requests stop at this injected fixture fetch; no provider network is used.
let providerMode='normal',providerRequests=0,logoutRequests=0;
const operations=createRefreshProviderHttp(project,'fixture-private-api-key-not-real',async(url,init)=>{
 providerRequests++;assert.equal(init.redirect,'error');assert.equal(init.credentials,'omit');
 if(url===project+'/auth/v1/token?grant_type=refresh_token'){
  assert.deepEqual(JSON.parse(init.body),{refresh_token:'transport-fixture'});
  return new Response(providerMode==='malformed'?'not-json':JSON.stringify({access_token:providerToken,refresh_token:'transport-next-fixture',token_type:'bearer'}),{headers:{'content-type':'application/json'}});
 }
 assert.equal(url,project+'/auth/v1/logout?scope=local');logoutRequests++;assert.equal(init.headers.authorization,'Bearer '+providerToken);
 return new Response(null,{status:['refused-cleanup','lost-quarantine-claim','lost-quarantine-hold'].includes(providerMode)?401:204});
});
const bridged=createRefreshProvider(operations,()=>scope.expiresAt),transportRotation=createRefreshRotation(store,bridged);
function transportHttp(){
 const account=createAccountRefresh(security,origin,createStoredRefreshPort(security,store,transportRotation,origin));
 return {account,http:createRefreshHttp(origin,account)};
}
for(const mode of ['normal','lost-write','malformed','refused-cleanup','lost-quarantine-claim','lost-quarantine-hold']){
 providerMode=mode;assert.equal(await store.adopt('transport-fixture',scope,signal()),'confirmed');
 const composed=transportHttp();if(mode==='lost-write')loseNext='stylist_finish_refresh';
 const response=await composed.http.handle(refreshRequest(),signal());
 if(mode==='normal'){
  assert.equal(response.status,200);assert.equal((await store.inspect(owner,session,signal())).scope.generation,2);
  assert.equal(await composed.http.discardResponse(response),true);assert.equal((await store.inspect(owner,session,signal())).status,'absent');
 }else if(mode==='lost-write'){
  assert.equal(response.status,400);assert.equal(response.headers.get('set-cookie'),null);assert.equal((await store.inspect(owner,session,signal())).status,'absent');
 }else if(mode==='malformed'){
  assert.equal(response.status,400);assert.equal(response.headers.get('set-cookie'),null);assert.equal(composed.account.cleanupHeld(),true);
  const unresolved=await store.inspect(owner,session,signal());assert.equal(unresolved.state,'rotating');assert.equal((await store.claim(owner,session,1,signal())).status,'refused');
  // Fixture teardown only, not a claim that remote ambiguity was resolved.
  assert.equal(await store.remove(unresolved.scope,unresolved.leaseId,true,signal()),'confirmed');
 }else{
  assert.equal(response.status,200);
  if(mode==='lost-quarantine-claim')loseNext='stylist_claim_refresh';
  if(mode==='lost-quarantine-hold')loseNext='stylist_hold_refresh';
  assert.equal(await composed.http.discardResponse(response),false);assert.equal(composed.account.cleanupHeld(),true);
  const retained=await store.inspect(owner,session,signal());assert.equal(retained.status,'found');assert.equal(retained.scope.generation,2);assert.equal(retained.state,mode==='lost-quarantine-claim'?'rotating':'held');
  await execute(['restart',container]);
  for(let attempt=0;;attempt++){try{await execute(['exec',container,'pg_isready','-h','127.0.0.1','-U','postgres']);break;}catch{if(attempt>=50)throw Error('Restart unavailable');await new Promise(r=>setTimeout(r,100));}}
  const replacement=createRefreshStore(rpc,createRefreshEnvelopes(keyring,'fixture'));
  assert.equal((await replacement.inspect(owner,session,signal())).state,retained.state);
  assert.equal((await replacement.claim(owner,session,2,signal())).status,'refused');
  // Explicit synthetic teardown; production cannot assume this confirmation.
  assert.equal(await store.remove(retained.scope,retained.leaseId,true,signal()),'confirmed');
 }
}
assert.equal(providerRequests,11);assert.equal(logoutRequests,5);
console.log('Provider HTTP/bridge/database/account composition passed: adoption, lost write acknowledgment, malformed response hold and unconfirmed cleanup retention. Provider fetch and teardown revocation are synthetic.');

const revokedProof={status:'revoked',ownerId:owner,sessionId:session};
assert.equal(await store.adopt('reconcile-fixture',scope,signal()),'confirmed');
const reconcileClaim=await store.claim(owner,session,1,signal());assert.equal(reconcileClaim.status,'claimed');reconcileClaim.clearSecret();
assert.equal(await store.hold(reconcileClaim.scope,reconcileClaim.leaseId,signal()),'confirmed');
const discovery=await store.discover(null,10,signal());assert.equal(discovery.status,'found');assert.equal(discovery.candidates.length,1);
const found=discovery.candidates[0];assert.equal(found.state,'held');assert.equal(found.scope.sessionId,session);
assert.equal(JSON.stringify(discovery).includes('envelope'),false);
const cleanupScope={...found.scope,leaseId:found.leaseId};
const uncertain=createRefreshReconciliation(store,{confirm:async()=>({status:'unconfirmed'})});
assert.equal(await uncertain.reconcile(cleanupScope,signal()),'unconfirmed');assert.equal((await store.inspect(owner,session,signal())).state,'held');
await execute(['restart',container]);
for(let attempt=0;;attempt++){try{await execute(['exec',container,'pg_isready','-h','127.0.0.1','-U','postgres']);break;}catch{if(attempt>=50)throw Error('Restart unavailable');await new Promise(r=>setTimeout(r,100));}}
const reconciliationStore=createRefreshStore(rpc,createRefreshEnvelopes(keyring,'fixture'));
const rediscovered=await reconciliationStore.discover(null,10,signal());assert.equal(rediscovered.status,'found');assert.equal(rediscovered.candidates[0].state,'held');
const reconciliation=createRefreshReconciliation(reconciliationStore,{confirm:async()=>revokedProof});
assert.equal(await reconciliation.reconcile({...cleanupScope,generation:2},signal()),'stale');
loseNext='stylist_remove_refresh';assert.equal(await reconciliation.reconcile(cleanupScope,signal()),'unconfirmed');
assert.equal((await reconciliationStore.inspect(owner,session,signal())).status,'absent');
// Explicit trusted recheck after an uncertain removal, never a rotation retry.
assert.equal(await reconciliation.reconcile(cleanupScope,signal()),'confirmed');
assert.equal(await store.adopt('competing-fixture',scope,signal()),'confirmed');
const racing=createRefreshReconciliation(store,{confirm:async()=>{
 const newer=await store.claim(owner,session,1,signal());assert.equal(newer.status,'claimed');newer.clearSecret();
 assert.equal(await store.finish('competing-next-fixture',newer.scope,newer.leaseId,scope.expiresAt,signal()),'confirmed');return revokedProof;
}});
assert.equal(await racing.reconcile({...cleanupScope,leaseId:null},signal()),'unconfirmed');
const competing=await store.inspect(owner,session,signal());assert.equal(competing.scope.generation,2);assert.equal(competing.state,'ready');
// Synthetic teardown only. The authority above is a fixture, not real provider termination.
assert.equal(await store.remove(competing.scope,competing.leaseId,true,signal()),'confirmed');
console.log('Cleanup reconciliation PostgreSQL composition passed: held restart persistence, stale-scope refusal, lost removal acknowledgment with explicit proof recheck, and concurrent-generation fencing. Revocation authority is synthetic.');

const scanSecond='44444444-4444-4444-8444-444444444444',scanThird='55555555-5555-4555-8555-555555555555';
await execute(['exec','-i',container,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],`insert into auth.sessions values('${scanSecond}','${owner}',null),('${scanThird}','${owner}',null);`);
for(const id of [session,scanSecond,scanThird])assert.equal(await store.adopt('scan-fixture',{...scope,sessionId:id},signal()),'confirmed');
const scanAuthority={confirm:async(ownerId,sessionId)=>sessionId===scanSecond?{status:'revoked',ownerId,sessionId}:{status:'unconfirmed'}};
const initialScan=createRefreshScan(store,createRefreshReconciliation(store,scanAuthority));
const firstPage=await initialScan.page(null,1,signal());assert.equal(firstPage.status,'page');assert.equal(firstPage.unconfirmed,1);assert.equal(firstPage.nextAfter,session);assert.equal(firstPage.endOfSweep,false);
assert.equal((await store.inspect(owner,session,signal())).status,'found');
await execute(['restart',container]);
for(let attempt=0;;attempt++){try{await execute(['exec',container,'pg_isready','-h','127.0.0.1','-U','postgres']);break;}catch{if(attempt>=50)throw Error('Restart unavailable');await new Promise(r=>setTimeout(r,100));}}
const scanStore=createRefreshStore(rpc,createRefreshEnvelopes(keyring,'fixture'));
const replacementScan=createRefreshScan(scanStore,createRefreshReconciliation(scanStore,scanAuthority));
const secondPage=await replacementScan.page(firstPage.nextAfter,1,signal());assert.equal(secondPage.confirmed,1);assert.equal(secondPage.nextAfter,scanSecond);assert.equal((await scanStore.inspect(owner,scanSecond,signal())).status,'absent');
const thirdPage=await replacementScan.page(secondPage.nextAfter,1,signal());assert.equal(thirdPage.unconfirmed,1);assert.equal(thirdPage.nextAfter,scanThird);
const endPage=await replacementScan.page(thirdPage.nextAfter,1,signal());assert.equal(endPage.endOfSweep,true);assert.equal(endPage.visited,0);
// A later full sweep requires fresh explicit authority; reaching the prior end did not resolve unknowns.
const finalScan=createRefreshScan(scanStore,createRefreshReconciliation(scanStore,{confirm:async(ownerId,sessionId)=>({status:'revoked',ownerId,sessionId})}));
const finalPage=await finalScan.page(null,10,signal());assert.equal(finalPage.confirmed,2);assert.equal(finalPage.endOfSweep,true);
assert.equal((await scanStore.discover(null,10,signal())).candidates.length,0);
await execute(['exec','-i',container,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],`delete from auth.sessions where id in ('${scanSecond}','${scanThird}');`);
console.log('Reconciliation scan PostgreSQL composition passed: unknown-record preservation, confirmed-only removal, actual restart and replacement-scanner cursor resume, empty terminal page, and fresh full-sweep resolution. Authority remains synthetic.');

// Key transition uses actual encrypted database rows, never a provider call.
assert.equal(await store.adopt('old-key-fixture',scope,signal()),'confirmed');
const replacementKey=randomBytes(32);
const transitionCodec=createRefreshEnvelopes(new Map([['fixture',key],['replacement',replacementKey]]),'replacement');
const transitionStore=createRefreshStore(rpc,transitionCodec);
const transitionClaim=await transitionStore.claim(owner,session,1,signal());assert.equal(transitionClaim.status,'claimed');
assert.equal(transitionClaim.readSecret(),'old-key-fixture');
assert.deepEqual(await transitionStore.keyUsage('fixture',signal()),{status:'found',keyId:'fixture',total:1,ready:0,rotating:1,held:0,expired:0});
assert.equal(await transitionStore.finish('new-key-fixture',transitionClaim.scope,transitionClaim.leaseId,scope.expiresAt,signal()),'confirmed');
await execute(['restart',container]);
for(let attempt=0;;attempt++){try{await execute(['exec',container,'pg_isready','-h','127.0.0.1','-U','postgres']);break;}catch{if(attempt>=50)throw Error('Restart unavailable');await new Promise(r=>setTimeout(r,100));}}
const retiredStore=createRefreshStore(rpc,createRefreshEnvelopes(new Map([['replacement',replacementKey]]),'replacement'));
const afterRetirement=await retiredStore.claim(owner,session,2,signal());assert.equal(afterRetirement.status,'claimed');assert.equal(afterRetirement.readSecret(),'new-key-fixture');
assert.equal(await retiredStore.remove(afterRetirement.scope,afterRetirement.leaseId,true,signal()),'confirmed');
// Removing the old key before all records transition must not release an old secret.
assert.equal(await store.adopt('unmigrated-fixture',scope,signal()),'confirmed');
assert.notEqual((await retiredStore.claim(owner,session,1,signal())).status,'claimed');
assert.equal((await store.keyUsage('replacement',signal())).total,0);
const unavailableRecord=await store.inspect(owner,session,signal());assert.equal(unavailableRecord.status,'found');assert.notEqual(unavailableRecord.state,'ready');
await execute(['exec','-i',container,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],`update stylist_private.refresh_ownership set state='held',expires_at_ms=1 where session_id='${session}';`);
assert.deepEqual(await store.keyUsage('fixture',signal()),{status:'found',keyId:'fixture',total:1,ready:0,rotating:0,held:1,expired:1});
console.log('Encrypted key transition PostgreSQL rehearsal passed: overlap reads, new-key write, actual restart, retirement read, and premature retirement retaining blocked ownership. No provider calls.');

// Actual initial password composition; provider replies remain synthetic.
await execute(['exec','-i',container,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],`delete from stylist_private.refresh_ownership where session_id='${session}';`);
const initialVerifier=createIdentityVerifier(project,async()=>pair.publicKey,createAuthSessionAuthority(rpc));
let initialRevoked=true,initialCalls=0,initialLogouts=0,deleteInitialSession=false;
const initialHttp=createPasswordProviderHttp(project,'synthetic-password-http-key',async(url,init)=>{
 assert.equal(init.redirect,'error');assert.equal(init.credentials,'omit');
 if(url===project+'/auth/v1/logout?scope=local'){
  initialLogouts++;assert.match(init.headers.authorization,/^Bearer /);
  if(deleteInitialSession)await execute(['exec','-i',container,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],`delete from auth.sessions where id='${session}';`);
  return new Response(null,{status:initialRevoked?204:503});
 }
 initialCalls++;assert.deepEqual(JSON.parse(init.body),{email:'sample@example.test',password:'made-up'});
 if(url===project+'/auth/v1/signup')return Response.json({id:owner});
 assert.equal(url,project+'/auth/v1/token?grant_type=password');
 return Response.json({access_token:await token(),refresh_token:'initial-password-fixture',token_type:'bearer'});
});
const initialStager=createInitialSessionStager(store,initialVerifier,()=>scope.expiresAt,(jwt,abort)=>initialHttp.revoke(jwt,'local',abort));
const initialProvider=createPasswordProvider(initialHttp,initialStager);
const passwordInput={method:'signIn',email:'sample@example.test',password:'made-up'};
function accountFactory(overrides){
 const refuse=async()=>{throw Error('Unexpected provider operation');};
 return createAccountComposition(origin,project,security,{password:{password:refuse},exchange:{exchange:refuse},refresh:{refresh:refuse},signOut:{revoke:refuse},recovery:{exchange:refuse},recoveryRequest:{request:refuse},...overrides});
}
const passwordFactory=accountFactory({password:initialProvider});
const passwordRoute=passwordFactory.routes().get('/api/account/password');
const passwordRequest=input=>new Request(origin+'/api/account/password',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(input)});
const confirmation=await passwordRoute.handle(passwordRequest({...passwordInput,method:'signUp'}),signal());assert.equal(confirmation.status,200);assert.deepEqual(await confirmation.json(),{status:'confirmationRequired'});assert.equal(confirmation.headers.get('set-cookie'),null);assert.equal((await store.inspect(owner,session,signal())).status,'absent');assert.equal(initialLogouts,0);
const initialReady=await passwordRoute.handle(passwordRequest(passwordInput),signal());assert.equal(initialReady.status,200);assert.deepEqual(await initialReady.json(),{status:'signedIn'});assert.match(initialReady.headers.get('set-cookie'),/__Host-stylist_access=/);assert.equal((await store.inspect(owner,session,signal())).scope.generation,1);
assert.equal(await passwordRoute.discardResponse(initialReady),true);assert.equal((await store.inspect(owner,session,signal())).status,'absent');assert.equal(await passwordFactory.close(),true);
loseNext='stylist_adopt_refresh';initialRevoked=false;
const uncertainAccounts=createPasswordAccounts(security,origin,initialProvider);
assert.equal((await uncertainAccounts.submit(passwordInput,signal())).status,'unavailable');assert.equal(uncertainAccounts.cleanupHeld(),true);
const uncertainInitial=await store.inspect(owner,session,signal());assert.equal(uncertainInitial.status,'found');assert.notEqual(uncertainInitial.state,'ready');
await execute(['restart',container]);
for(let attempt=0;;attempt++){try{await execute(['exec',container,'pg_isready','-h','127.0.0.1','-U','postgres']);break;}catch{if(attempt>=50)throw Error('Restart unavailable');await new Promise(r=>setTimeout(r,100));}}
assert.notEqual((await createRefreshStore(rpc,codec).claim(owner,session,1,signal())).status,'claimed');
assert.equal(initialCalls,3);assert.equal(initialLogouts,2);
console.log('Initial password HTTP/PostgreSQL composition passed: generated identity, first adoption, cleanup, and lost acknowledgment/refused revocation restart protection.');

// Real primary-database presence authority, including cascade after actual session deletion.
const presence=createAuthSessionPresence(rpc);
assert.deepEqual(await presence.confirm(owner,session,signal()),{status:'unconfirmed'});
assert.deepEqual(await presence.confirm('33333333-3333-4333-8333-333333333333',session,signal()),{status:'unconfirmed'});
const signOutPort=createStoredSignOut(security,store,presence,origin,(jwt,abort)=>initialHttp.revoke(jwt,'local',abort));
const signOutFactory=accountFactory({signOut:signOutPort});
const signOutHttp=signOutFactory.routes().get('/api/account/sign-out').handle;
const signOutToken=await token();
const signOutRequest=()=>new Request(origin+'/api/account/sign-out',{method:'POST',headers:{origin,'content-type':'application/json',cookie:'__Host-stylist_access='+signOutToken},body:'{}'});
// HTTP acceptance does not prove primary session removal.
initialRevoked=true;
const unconfirmedSignOut=await signOutHttp(signOutRequest(),signal());assert.equal(unconfirmedSignOut.status,409);assert.equal((await unconfirmedSignOut.json()).status,'remoteUnconfirmed');assert.match(unconfirmedSignOut.headers.get('set-cookie'),/Max-Age=0/);
assert.equal((await store.inspect(owner,session,signal())).state,'held');
// This injected provider actually deletes the synthetic Auth row, triggering ownership cascade.
deleteInitialSession=true;
const confirmedSignOut=await signOutHttp(signOutRequest(),signal());assert.equal(confirmedSignOut.status,200);assert.equal((await confirmedSignOut.json()).status,'signedOut');assert.match(confirmedSignOut.headers.get('set-cookie'),/Max-Age=0/);
assert.equal((await store.inspect(owner,session,signal())).status,'absent');assert.equal(initialLogouts,4);
assert.equal(await security.authorize(new Request(origin+'/',{headers:{cookie:'__Host-stylist_access='+signOutToken}}),signal()),null);
assert.equal(await signOutFactory.close(),true);
console.log('Account factory sign-out HTTP/PostgreSQL composition passed: accepted-only reply remains unconfirmed, browser cookies clear, primary deletion confirms cleanup, and the old signed token is denied.');
assert.deepEqual(await presence.confirm(owner,session,signal()),{status:'revoked',ownerId:owner,sessionId:session});
assert.equal(await createRefreshReconciliation(scanStore,presence).reconcile({...scope,leaseId:null},signal()),'confirmed');
console.log('Primary Auth session presence composition passed: present/mismatched owners remain unconfirmed; actual session deletion permits scoped reconciliation. Hosted activation remains unverified.');

// OAuth uses actual refresh ownership and identity authority; all provider responses are synthetic.
await execute(['exec','-i',container,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],`insert into auth.sessions values('${session}','${owner}',null);`);
let oauthCalls=0,oauthRevoked=true;
const oauthHttp=createPasswordProviderHttp(project,'synthetic-oauth-http-key',async(url,init)=>{
 assert.equal(init.redirect,'error');assert.equal(init.credentials,'omit');
 if(url===project+'/auth/v1/logout?scope=local')return new Response(null,{status:oauthRevoked?204:503});
 assert.equal(url,project+'/auth/v1/token?grant_type=pkce');
 const body=JSON.parse(init.body);assert.deepEqual(Object.keys(body).sort(),['auth_code','code_verifier']);
 assert.equal(body.auth_code,'synthetic-oauth-code');assert.match(body.code_verifier,/^[A-Za-z0-9_-]{43}$/);
 oauthCalls++;return Response.json({access_token:await token(),refresh_token:'synthetic-oauth-refresh',token_type:'bearer'});
});
const oauthStager=createInitialSessionStager(store,initialVerifier,()=>scope.expiresAt,(jwt,abort)=>oauthHttp.revoke(jwt,'local',abort));
const oauthProvider=createOAuthProvider(oauthHttp,oauthStager),oauthStart=createOAuthStart(project,security.callbacks);
function oauthRequest(provider){
 const start=oauthStart.begin(provider,'/saved-looks'),url=new URL(new URL(start.url).searchParams.get('redirect_to'));
 url.searchParams.set('code','synthetic-oauth-code');return new Request(url,{headers:{cookie:start.setCookies[0].split(';')[0]}});
}
for(const provider of ['google','apple']){
 const app=accountFactory({exchange:oauthProvider}),routes=app.routes();
 const started=await routes.get('/api/account/oauth').handle(new Request(origin+'/api/account/oauth',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({provider,returnPath:'/saved-looks'})}),signal());
 assert.equal(started.status,200);const handoff=await started.json();assert.equal(handoff.status,'handoff');
 const url=new URL(new URL(handoff.url).searchParams.get('redirect_to'));url.searchParams.set('code','synthetic-oauth-code');
 const request=new Request(url,{headers:{cookie:started.headers.get('set-cookie').split(';')[0]}}),route=routes.get('/auth/callback/'+provider);
 const ready=await route.handle(request,signal());assert.equal(ready.status,303);assert.equal(ready.headers.get('location'),'/saved-looks');assert.match(ready.headers.get('set-cookie'),/__Host-stylist_access=/);
 assert.equal((await store.inspect(owner,session,signal())).scope.generation,1);
 const replay=await route.handle(request,signal());assert.equal(replay.headers.get('location'),'/account?status=unavailable');
 assert.equal(await route.discardResponse(ready),true);assert.equal((await store.inspect(owner,session,signal())).status,'absent');assert.equal(await app.close(),true);
}
assert.equal(oauthCalls,2);
loseNext='stylist_adopt_refresh';oauthRevoked=false;
const uncertainOAuth=createAccountExchange(security,origin,oauthProvider);
assert.deepEqual(await uncertainOAuth.complete(oauthRequest('google'),'google',signal()),{status:'unavailable'});
assert.equal(uncertainOAuth.cleanupHeld(),true);assert.notEqual((await store.inspect(owner,session,signal())).state,'ready');
await execute(['restart',container]);
for(let attempt=0;;attempt++){try{await execute(['exec',container,'pg_isready','-h','127.0.0.1','-U','postgres']);break;}catch{if(attempt>=50)throw Error('Restart unavailable');await new Promise(r=>setTimeout(r,100));}}
assert.notEqual((await createRefreshStore(rpc,codec).claim(owner,session,1,signal())).status,'claimed');assert.equal(oauthCalls,3);
console.log('OAuth HTTP/PostgreSQL composition passed: both bound providers, one-use callbacks, encrypted adoption and lost-save/refused-cleanup protection across database restart. No real provider calls.');

// Recovery HTTP and browser composition uses actual primary-session presence, synthetic provider calls.
for(const scenario of ['confirmed','unconfirmed','ordinary']){
 await execute(['exec','-i',container,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],`delete from auth.sessions where id='${session}';insert into auth.sessions values('${session}','${owner}',null);`);
 const recoveryJwt=await new SignJWT({session_id:session,role:'authenticated',is_anonymous:false,amr:[{method:scenario==='ordinary'?'password':'recovery',timestamp:Math.floor(Date.now()/1000)}]}).setProtectedHeader({alg:'ES256',kid:'rehearsal'}).setSubject(owner).setIssuer(project+'/auth/v1').setAudience('authenticated').setIssuedAt().setExpirationTime('5m').sign(pair.privateKey);
 let callbackUrl,updates=0,exchanges=0;
 const recoveryHttp=createRecoveryProviderHttp(project,origin,'synthetic-recovery-http-key',async(url,init)=>{
  assert.equal(init.redirect,'error');assert.equal(init.credentials,'omit');
  const target=new URL(url),body=JSON.parse(init.body);
  if(target.pathname==='/auth/v1/recover'){
   callbackUrl=target.searchParams.get('redirect_to');assert.deepEqual(Object.keys(body).sort(),['code_challenge','code_challenge_method','email']);return Response.json({});
  }
  if(target.pathname==='/auth/v1/token'){
   exchanges++;assert.equal(target.searchParams.get('grant_type'),'pkce');assert.equal(body.auth_code,'synthetic-recovery-code');assert.match(body.code_verifier,/^[A-Za-z0-9_-]{43}$/);return Response.json({access_token:recoveryJwt,refresh_token:'discarded-recovery-refresh',token_type:'bearer'});
  }
  assert.equal(url,project+'/auth/v1/user');assert.equal(init.method,'PUT');assert.deepEqual(body,{password:'synthetic-reset-password'});assert.equal(init.headers.authorization,'Bearer '+recoveryJwt);updates++;return Response.json({id:owner});
 });
 const recoveryProvider=createRecoveryProvider({...recoveryHttp,revoke:(jwt,scope,abort)=>initialHttp.revoke(jwt,scope,abort)},initialVerifier,presence);
 const app=createAccountComposition(origin,project,security,{password:initialProvider,exchange:oauthProvider,
  refresh:{refresh:async()=>{throw Error('Unexpected refresh');}},signOut:signOutPort,recovery:recoveryProvider,recoveryRequest:recoveryHttp});
 const routes=app.routes();
 const requested=await routes.get('/api/account/recover').handle(new Request(origin+'/api/account/recover',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({email:'sample@example.test'})}),signal());
 assert.equal(requested.status,202);assert.equal((await requested.json()).status,'recoveryRequested');
 const callback=new Request(callbackUrl+'&code=synthetic-recovery-code',{headers:{cookie:requested.headers.get('set-cookie').split(';')[0]}});
 deleteInitialSession=scenario!=='unconfirmed';initialRevoked=true;
 const delivered=await routes.get('/auth/callback/recovery').handle(callback,signal());assert.equal(exchanges,1);
 assert.equal(delivered.status,303);assert.doesNotMatch(delivered.headers.get('set-cookie'),/__Host-stylist_access/);
 if(scenario==='ordinary'){
  assert.equal(delivered.headers.get('location'),'/account?status=unavailable');assert.equal(updates,0);assert.equal(await app.close(),true);continue;
 }
 assert.equal(delivered.headers.get('location'),'/account/reset');
 const replay=await routes.get('/auth/callback/recovery').handle(callback,signal());assert.equal(replay.headers.get('location'),'/account?status=unavailable');assert.equal(exchanges,1);
 const cookie=delivered.headers.getSetCookie().find(x=>x.startsWith('__Host-stylist_reset=')).split(';')[0];
 const request=()=>new Request(origin+'/api/account/reset',{method:'POST',headers:{origin,'content-type':'application/json',cookie},body:JSON.stringify({password:'synthetic-reset-password',confirmation:'synthetic-reset-password'})});
 const result=await routes.get('/api/account/reset').handle(request(),signal());assert.equal(result.status,scenario==='confirmed'?200:409);assert.equal((await result.json()).status,scenario==='confirmed'?'resetComplete':'unconfirmed');assert.match(result.headers.get('set-cookie'),/Max-Age=0/);assert.doesNotMatch(result.headers.get('set-cookie'),/__Host-stylist_access/);assert.equal(updates,1);
 assert.equal((await routes.get('/api/account/reset').handle(request(),signal())).status,400);assert.equal(await app.close(),scenario==='confirmed');
 assert.equal((await routes.get('/api/account/reset').handle(request(),signal())).status,503);
 assert.equal((await presence.confirm(owner,session,signal())).status,scenario==='confirmed'?'revoked':'unconfirmed');
}
console.log('Account factory recovery HTTP/PostgreSQL/browser composition passed: request and PKCE, signed purpose, one reset, no account cookie, primary deletion proof, ordinary-token refusal and unconfirmed cleanup. Provider calls were synthetic.');

// The provider may ignore cancellation and create a session after the caller leaves.
await execute(['exec','-i',container,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],`insert into auth.sessions values('${session}','${owner}',null);`);
const lateRecoveryJwt=await new SignJWT({session_id:session,role:'authenticated',is_anonymous:false,amr:[{method:'recovery',timestamp:Math.floor(Date.now()/1000)}]}).setProtectedHeader({alg:'ES256',kid:'rehearsal'}).setSubject(owner).setIssuer(project+'/auth/v1').setAudience('authenticated').setIssuedAt().setExpirationTime('5m').sign(pair.privateKey);
let releaseLateRecovery,markLateStarted,markLateConfirmed,lateUpdates=0;
const lateStarted=new Promise(resolve=>markLateStarted=resolve),lateConfirmed=new Promise(resolve=>markLateConfirmed=resolve);
deleteInitialSession=true;initialRevoked=true;
const lateProvider=createRecoveryProvider({
 exchange:()=>{markLateStarted();return new Promise(resolve=>releaseLateRecovery=resolve);},
 updatePassword:async()=>{lateUpdates++;return true;},
 revoke:(jwt,scope,abort)=>initialHttp.revoke(jwt,scope,abort),
},initialVerifier,{async confirm(ownerId,sessionId,abort){const result=await presence.confirm(ownerId,sessionId,abort);markLateConfirmed(result);return result;}});
const lateRecovery=createAccountRecovery(security,lateProvider),lateFlow=security.callbacks.begin('recovery'),lateController=new AbortController();
const lateWork=lateRecovery.complete(new Request(lateFlow.callbackUrl+'&code=synthetic',{headers:{cookie:lateFlow.cookie.split(';')[0]}}),lateController.signal);
await lateStarted;lateController.abort();assert.deepEqual(await lateWork,{status:'unavailable'});
releaseLateRecovery({access_token:lateRecoveryJwt,token_type:'bearer'});
let lateTimer;
try{assert.deepEqual(await Promise.race([lateConfirmed,new Promise((_,reject)=>{lateTimer=setTimeout(()=>reject(Error('Late cleanup unconfirmed')),8000);})]),{status:'revoked',ownerId:owner,sessionId:session});}finally{clearTimeout(lateTimer);}
await new Promise(resolve=>setTimeout(resolve,0));assert.equal(lateRecovery.cleanupHeld(),false);assert.equal(lateUpdates,0);
assert.deepEqual(await presence.confirm(owner,session,signal()),{status:'revoked',ownerId:owner,sessionId:session});
console.log('Late canceled recovery PostgreSQL composition passed: independent cleanup identity verification, actual primary session deletion, no reset permission/update and no unnecessary cleanup hold.');

// Complete concrete host: actual HTTP, PostgreSQL and crypto, with synthetic Auth transport.
await execute(['exec','-i',container,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],`insert into auth.sessions values('${session}','${owner}',null);`);
let fullRefreshes=0,fullLogouts=0;
const fullFetch=async(url,init)=>{
 const target=new URL(url),body=init.body?JSON.parse(init.body):{};
 assert.equal(target.origin,project);assert.equal(init.redirect,'error');
 if(target.pathname==='/auth/v1/.well-known/jwks.json')return Response.json({keys:[jwk]});
 if(target.pathname.startsWith('/rest/v1/rpc/')){
  const name=target.pathname.split('/').at(-1);
  // This focused fixture has no media receipts. Maintenance acceptance is synthetic here.
  if(name==='stylist_expire_media_receipts')return Response.json(0);
  return Response.json(await rpc.call(name,body,init.signal));
 }
 if(target.pathname==='/auth/v1/token'){
  if(target.searchParams.get('grant_type')==='refresh_token'){fullRefreshes++;assert.equal(body.refresh_token,'full-host-initial');return Response.json({access_token:await token(),refresh_token:'full-host-rotated',token_type:'bearer'});}
  assert.equal(target.searchParams.get('grant_type'),'password');return Response.json({access_token:await token(),refresh_token:'full-host-initial',token_type:'bearer'});
 }
 if(target.pathname==='/auth/v1/logout'){
  assert.equal(target.searchParams.get('scope'),'local');fullLogouts++;
  await execute(['exec','-i',container,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],`delete from auth.sessions where id='${session}';`);return new Response(null,{status:204});
 }
 throw Error('Unexpected complete host transport');
};
const fullHost=createSupabaseAccountHost({appOrigin:origin,projectUrl:project,serviceKey:'synthetic-full-host-key',fetch:fullFetch,refreshKeyring:keyring,activeRefreshKeyId:'fixture',initialExpiry:()=>Date.now()+600000,rotatedExpiry:()=>Date.now()+600000});
const server=createServer(fullHost.handle);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const post=(path,body,cookie='')=>new Promise((resolve,reject)=>{
 const req=nodeRequest({host:'127.0.0.1',port:server.address().port,path,method:'POST',headers:{host:new URL(origin).host,origin,'content-type':'application/json',cookie}},res=>{let text='';res.on('data',chunk=>text+=chunk);res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(text),cookies:res.headers['set-cookie']??[]}));});req.on('error',reject);req.end(JSON.stringify(body));
});
try{
 assert.equal(await fullHost.start(),true);
 const signed=await post('/api/account/password',{method:'signIn',email:'sample@example.test',password:'synthetic-password'});assert.equal(signed.status,200);assert.deepEqual(signed.body,{status:'signedIn'});
 const cookie=signed.cookies.find(c=>c.startsWith('__Host-stylist_access=')).split(';')[0];
 const initial=await store.inspect(owner,session,signal());assert.equal(initial.status,'found');assert.equal(initial.scope.generation,1);assert.equal(initial.state,'ready');
 const rotated=await post('/api/account/refresh',{},cookie);assert.equal(rotated.status,200);assert.equal(fullRefreshes,1);
 const after=await store.inspect(owner,session,signal());assert.equal(after.status,'found');assert.equal(after.scope.generation,2);assert.equal(after.state,'ready');
 const row=await rpc.call('stylist_inspect_refresh',{p_owner:owner,p_session:session},signal());assert.equal(codec.open(row.envelope,after.scope),'full-host-rotated');assert.doesNotMatch(JSON.stringify(row),/full-host-initial|full-host-rotated/);
 const nextCookie=rotated.cookies.find(c=>c.startsWith('__Host-stylist_access=')).split(';')[0];
 const out=await post('/api/account/sign-out',{},nextCookie);assert.equal(out.status,200);assert.deepEqual(out.body,{status:'signedOut'});assert.equal(fullLogouts,1);assert.ok(out.cookies.some(c=>c.includes('Max-Age=0')));
 assert.deepEqual(await presence.confirm(owner,session,signal()),{status:'revoked',ownerId:owner,sessionId:session});assert.equal((await store.inspect(owner,session,signal())).status,'absent');
 assert.equal((await post('/api/account/refresh',{},nextCookie)).status,400);assert.equal(fullRefreshes,1);assert.equal(await fullHost.close(),true);
}finally{await fullHost.close();await new Promise(resolve=>server.close(resolve));}
console.log('Complete Supabase host HTTP/PostgreSQL composition passed: signed login, encrypted adoption, actual durable admission, generation-two rotation, scoped logout, primary absence, cascade and stale-cookie refusal. Auth and media-maintenance responses were synthetic.');
