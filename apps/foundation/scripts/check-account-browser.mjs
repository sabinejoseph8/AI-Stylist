// Test-only: disposable PostgreSQL, generated identities and synthetic Auth. Never receives a key.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {randomBytes} from 'node:crypto';
import {createServer} from 'node:https';
import {generateKeyPair,exportJWK,SignJWT,decodeJwt} from 'jose';
import {build} from 'vite';
import {prepareAccountApplication} from '../src/server/account-application.ts';
import {createAccountNetwork} from '../src/server/account-network.ts';
import {createAccountTransport} from '../src/server/account-transport.ts';
const container=process.argv[2];assert.match(container??'',/^stylist-refresh-[a-f0-9]{10}$/);
const owner='11111111-1111-4111-8111-111111111111',session='55555555-5555-4555-8555-555555555555',recoverySession='66666666-6666-4666-8666-666666666666';
const origin='https://127.0.0.1:4327',project='https://fixture.supabase.co',root=fileURLToPath(new URL('..',import.meta.url));
const temporary=mkdtempSync(join(tmpdir(),'stylist-account-browser-'));let browser,network,application,primaryContext;
function sql(query){return new Promise((resolve,reject)=>{
 const child=spawn('docker',['exec','-i',container,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],{stdio:['pipe','pipe','pipe']});let output='',size=0;
 const timer=setTimeout(()=>{child.kill();reject(Error('Synthetic database deadline'));},15000);
 child.on('error',()=>{clearTimeout(timer);reject(Error('Synthetic database unavailable'));});child.stdout.on('data',chunk=>{size+=chunk.length;if(size>65536){child.kill();reject(Error('Synthetic output limit'));}output+=chunk;});child.stderr.resume();child.on('close',code=>{clearTimeout(timer);code===0?resolve(output.trim()):reject(Error('Synthetic database operation failed'));});child.stdin.end(query);
});}
const signatures={stylist_consume_account_admission:[],stylist_auth_session_active:[['p_owner','uuid'],['p_session','uuid']],stylist_auth_session_presence:[['p_owner','uuid'],['p_session','uuid']],stylist_adopt_refresh:[['p_owner','uuid'],['p_session','uuid'],['p_expiry','bigint'],['p_envelope','jsonb']],stylist_inspect_refresh:[['p_owner','uuid'],['p_session','uuid']],stylist_claim_refresh:[['p_owner','uuid'],['p_session','uuid'],['p_generation','bigint']],stylist_hold_refresh:[['p_owner','uuid'],['p_session','uuid'],['p_generation','bigint'],['p_lease','uuid']],stylist_finish_refresh:[['p_owner','uuid'],['p_session','uuid'],['p_generation','bigint'],['p_lease','uuid'],['p_expiry','bigint'],['p_envelope','jsonb']],stylist_remove_refresh:[['p_owner','uuid'],['p_session','uuid'],['p_generation','bigint'],['p_lease','uuid'],['p_revoked','boolean']]};
async function rpc(name,payload){assert.ok(Object.hasOwn(signatures,name));const args=signatures[name].map(([field,type])=>{assert.ok(Object.hasOwn(payload,field));const value=payload[field];return value===null?'null':"'"+String(type==='jsonb'?JSON.stringify(value):value).replaceAll("'","''")+"'::"+type;});return JSON.parse(await sql(`set role service_role;select coalesce(to_jsonb(public.${name}(${args.join(',')}))::text,'null');`));}
try{
 const pair=await generateKeyPair('ES256'),jwk={...await exportJWK(pair.publicKey),kid:'browser-fixture'};
 async function token(id,recovery=false,expired=false){return new SignJWT({session_id:id,role:'authenticated',is_anonymous:false,...(recovery?{amr:[{method:'recovery',timestamp:Math.floor(Date.now()/1000)}]}:{})}).setProtectedHeader({alg:'ES256',kid:'browser-fixture'}).setSubject(owner).setIssuer(project+'/auth/v1').setAudience('authenticated').setIssuedAt(Math.floor(Date.now()/1000)-(expired?3600:0)).setExpirationTime(expired?Math.floor(Date.now()/1000)-1:'5m').sign(pair.privateKey);}
 let verifications=0,updates=0,logouts=0,requests=0;
 const provider=async(url,init)=>{
  const target=new URL(url),body=init.body?JSON.parse(init.body):{};assert.equal(target.origin,project);assert.equal(init.redirect,'error');
  if(target.pathname==='/auth/v1/.well-known/jwks.json')return Response.json({keys:[jwk]});
  if(target.pathname.startsWith('/rest/v1/rpc/')){const name=target.pathname.split('/').at(-1);return Response.json(name==='stylist_expire_media_receipts'?0:await rpc(name,body));}
  if(target.pathname==='/auth/v1/token'){
   if(target.searchParams.get('grant_type')==='password'){await sql(`insert into auth.sessions values('${session}','${owner}',null);`);return Response.json({access_token:await token(session),refresh_token:'browser-initial',token_type:'bearer'});}
   assert.equal(target.searchParams.get('grant_type'),'refresh_token');assert.equal(body.refresh_token,'browser-initial');return Response.json({access_token:await token(session),refresh_token:'browser-rotated',token_type:'bearer'});
  }
  if(target.pathname==='/auth/v1/recover'){requests++;assert.equal(body.email,'sample@example.test');assert.equal(body.code_challenge_method,'S256');assert.equal(new URL(target.searchParams.get('redirect_to')).origin,origin);return Response.json({});}
  if(target.pathname==='/auth/v1/verify'){assert.deepEqual(body,{token_hash:'synthetic-email-proof',type:'recovery'});verifications++;await sql(`insert into auth.sessions values('${recoverySession}','${owner}',null);`);return Response.json({access_token:await token(recoverySession,true),refresh_token:'discarded-reset-refresh',token_type:'bearer'});}
  if(target.pathname==='/auth/v1/user'){updates++;assert.deepEqual(body,{password:'Made-up-password-123!'});return Response.json({id:owner});}
  assert.equal(target.pathname,'/auth/v1/logout');assert.equal(target.searchParams.get('scope'),'local');const id=decodeJwt(init.headers.authorization.slice(7)).session_id;assert.ok([session,recoverySession].includes(id));logouts++;await sql(`delete from auth.sessions where id='${id}';`);return new Response(null,{status:204});
 };
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',join(temporary,'key.pem'),'-out',join(temporary,'cert.pem'),'-days','1','-subj','/CN=127.0.0.1'],{stdio:'ignore'});
 const output=join(temporary,'site');await build({configFile:false,root,build:{outDir:output,emptyOutDir:true,rollupOptions:{input:join(root,'account.html')}},logLevel:'error'});
 const options={appOrigin:origin,projectUrl:project,serviceKey:'synthetic-browser-server-key',fetch:provider,refreshKeyring:new Map([['fixture',randomBytes(32)]]),activeRefreshKeyId:'fixture'};
 application=await prepareAccountApplication(options,output);
 network=createAccountNetwork(application,listener=>createServer({key:readFileSync(join(temporary,'key.pem')),cert:readFileSync(join(temporary,'cert.pem'))},createAccountTransport(origin,listener)));assert.equal(await network.start(4327,'127.0.0.1'),true);
 const require=createRequire(import.meta.url),{webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');browser=await webkit.launch({headless:true,...(process.env.WEBKIT_EXECUTABLE?{executablePath:process.env.WEBKIT_EXECUTABLE}:{})});
 const profile=join(temporary,'browser-profile'),launchOptions={headless:true,ignoreHTTPSErrors:true,...(process.env.WEBKIT_EXECUTABLE?{executablePath:process.env.WEBKIT_EXECUTABLE}:{})};
 let context=primaryContext=await webkit.launchPersistentContext(profile,launchOptions),page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(origin+'/account');await page.getByLabel('Email address',{exact:true}).fill('sample@example.test');await page.getByLabel('Password',{exact:true}).fill('synthetic-password');await page.locator('form button[type=submit]').click();await page.getByText('Sign-in completed. Protected features verify your session on the server.',{exact:true}).waitFor();
 const cookie=(await context.cookies()).find(c=>c.name==='__Host-stylist_access');assert(cookie?.secure&&cookie.httpOnly&&cookie.sameSite==='Strict');assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
 const stored=await rpc('stylist_inspect_refresh',{p_owner:owner,p_session:session});assert.equal(stored.generation,1);assert.doesNotMatch(JSON.stringify(stored),/browser-initial/);
 await page.reload();await page.getByRole('button',{name:'Sign out',exact:true}).waitFor();assert.equal((await rpc('stylist_inspect_refresh',{p_owner:owner,p_session:session})).generation,1);
 await context.close();primaryContext=undefined;context=primaryContext=await webkit.launchPersistentContext(profile,launchOptions);page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto(origin+'/account');await page.getByRole('button',{name:'Sign out',exact:true}).waitFor();assert.equal((await rpc('stylist_inspect_refresh',{p_owner:owner,p_session:session})).generation,1);
 assert.ok(cookie.expires>Date.now()/1000+604790);assert.ok(stored.expires_at_ms>Date.now()+604790000);
 const resourceRequest=value=>new Request(origin+'/api/wardrobe',{headers:{cookie:'__Host-stylist_access='+value}});
 const resourceProof=await application.authorizeResource(resourceRequest(cookie.value),new AbortController().signal);assert.equal(resourceProof?.ownerId,owner);
 await sql(`update stylist_private.refresh_ownership set expires_at_ms=1 where session_id='${session}';`);
 assert.equal(await resourceProof.isCurrent(new AbortController().signal),false);assert.equal(await application.authorizeResource(resourceRequest(cookie.value),new AbortController().signal),null);
 await page.reload();await page.getByText('Saved sign-in could not be confirmed. Please sign in.',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Sign out',exact:true}).count(),0);assert.equal((await rpc('stylist_inspect_refresh',{p_owner:owner,p_session:session})).generation,1);
 await sql(`update stylist_private.refresh_ownership set expires_at_ms=${stored.expires_at_ms},state='held',lease_id='77777777-7777-4777-8777-777777777777' where session_id='${session}';`);
 assert.equal(await application.authorizeResource(resourceRequest(cookie.value),new AbortController().signal),null);
 await sql(`update stylist_private.refresh_ownership set state='ready',lease_id=null where session_id='${session}';`);
 // Replace the server application with the same private keyring and durable database.
 assert.equal(await network.close(),true);application=await prepareAccountApplication(options,output);
 network=createAccountNetwork(application,listener=>createServer({key:readFileSync(join(temporary,'key.pem')),cert:readFileSync(join(temporary,'cert.pem'))},createAccountTransport(origin,listener)));assert.equal(await network.start(4327,'127.0.0.1'),true);
 const expiredAccess=await token(session,false,true);assert.equal(await application.authorizeResource(resourceRequest(expiredAccess),new AbortController().signal),null);
 await context.addCookies([{...cookie,value:expiredAccess}]);
 await page.reload();await page.getByRole('button',{name:'Sign out',exact:true}).waitFor();const rotated=await rpc('stylist_inspect_refresh',{p_owner:owner,p_session:session});assert.equal(rotated.generation,2);assert.equal(rotated.expires_at_ms,stored.expires_at_ms);const renewed=(await context.cookies()).find(c=>c.name==='__Host-stylist_access');assert.ok(Math.abs(renewed.expires-cookie.expires)<=1);
 const replacementProof=await application.authorizeResource(resourceRequest(renewed.value),new AbortController().signal);assert.equal(replacementProof?.ownerId,owner);
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByText('You are signed out.',{exact:true}).waitFor();await page.getByLabel('Password',{exact:true}).waitFor();assert.equal(await page.getByLabel('Password',{exact:true}).inputValue(),'');assert(!(await context.cookies()).some(c=>c.name==='__Host-stylist_access'));assert.equal(await rpc('stylist_auth_session_presence',{p_owner:owner,p_session:session}),'absent');assert.equal(await rpc('stylist_inspect_refresh',{p_owner:owner,p_session:session}),null);
 assert.equal(await replacementProof.isCurrent(new AbortController().signal),false);assert.equal(await application.authorizeResource(resourceRequest(renewed.value),new AbortController().signal),null);
 await page.getByRole('button',{name:'Recover access',exact:true}).click();await page.getByLabel('Email address',{exact:true}).fill('sample@example.test');await page.getByRole('button',{name:'Request recovery',exact:true}).click();await page.getByText('If this address can receive account recovery, instructions will be sent.',{exact:true}).waitFor();assert.equal(requests,1);
 // Receiving browser has none of the requesting browser's PKCE or account cookies.
 const receiver=await browser.newContext({ignoreHTTPSErrors:true}),reset=await receiver.newPage();reset.on('pageerror',error=>errors.push(error.message));assert.equal((await receiver.cookies()).length,0);
 await reset.goto(origin+'/account/recovery?token_hash=synthetic-email-proof');await reset.getByRole('button',{name:'Continue to password reset'}).waitFor();assert.equal(verifications,0);assert.equal(reset.url(),origin+'/account/recovery');await reset.getByRole('button',{name:'Continue to password reset'}).click();await reset.waitForURL(origin+'/account/reset');await reset.getByRole('heading',{name:'Choose a new password'}).waitFor();assert.equal(verifications,1);
 assert(!(await receiver.cookies()).some(c=>c.name==='__Host-stylist_access'));await reset.getByLabel('New password',{exact:true}).fill('Made-up-password-123!');await reset.getByLabel('Confirm new password',{exact:true}).fill('Made-up-password-123!');await reset.getByRole('button',{name:'Update password',exact:true}).click();await reset.getByText('Password updated. Sign in to use your stylist.',{exact:true}).waitFor();assert.equal(updates,1);assert.equal(logouts,2);assert.equal(await reset.getByLabel('New password',{exact:true}).inputValue(),'');assert.equal(await reset.getByRole('button',{name:'Update password',exact:true}).isDisabled(),true);assert(!(await receiver.cookies()).some(c=>c.name==='__Host-stylist_reset'||c.name==='__Host-stylist_access'));assert.equal(await rpc('stylist_auth_session_presence',{p_owner:owner,p_session:recoverySession}),'absent');
 await reset.reload();await reset.getByText('Recovery permission is unavailable. Request a new recovery link.',{exact:true}).waitFor();assert.equal(updates,1);assert.deepEqual(errors,[]);
 await primaryContext.close();primaryContext=undefined;await browser.close();browser=undefined;assert.equal(await network.close(),true);
 console.log('Complete account HTTPS/WebKit/PostgreSQL rehearsal passed: actual connected build, signed login, encrypted adoption, seven-day persistent cookie, fresh reload and persistent-profile browser relaunch restoration without refresh, absolute-expiry UI refusal, server replacement, browser-driven expired-access generation-two refresh with unchanged absolute expiry, durable resource expiry/hold refusal, expired-token resource denial, scoped sign-out and resource revocation, empty browser storage, separate-browser recovery request/confirmation/reset, one update, primary absence, cleared cookies, reload refusal and graceful shutdown. Auth and media-maintenance responses were synthetic.');
}finally{await primaryContext?.close();await browser?.close();await network?.close();await application?.close();rmSync(temporary,{recursive:true,force:true});}
