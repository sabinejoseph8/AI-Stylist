import {createRequire} from 'node:module';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createServer} from 'node:https';
import assert from 'node:assert/strict';
import {build} from 'vite';
import {createRecoveryHttp} from '../src/server/recovery-http.ts';
import {createRecoveryReadinessHttp} from '../src/server/recovery-readiness-http.ts';
import {createRecoveryConfirmation} from '../src/server/recovery-confirmation.ts';
import {createRecoveryConfirmationHttp} from '../src/server/recovery-confirmation-http.ts';
import {createRecoveryBrowser} from '../src/server/recovery-browser.ts';
import {createAccountNodeListener} from '../src/server/account-node.ts';
const require=createRequire(import.meta.url),{webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const temporary=mkdtempSync(join(tmpdir(),'stylist-confirmation-'));let browser,server,recoveryBrowser;
try{
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',join(temporary,'key.pem'),'-out',join(temporary,'cert.pem'),'-days','1','-subj','/CN=127.0.0.1'],{stdio:'ignore'});
 const origin='https://127.0.0.1:4326';let verifications=0,cleanups=0,resets=0;
 const output=join(temporary,'site');await build({configFile:false,root:process.cwd(),build:{outDir:output,emptyOutDir:true,rollupOptions:{input:'tests/browser/confirmed-recovery.html'}},logLevel:'error'});
 const binding=createRecoveryConfirmation(origin,{confirm:async()=>{verifications++;return {status:'resetRequired',expiresAt:Date.now()+60000,reset:async(password)=>{assert.equal(password,'Made-up-password-123!');resets++;return {status:'resetComplete'};},discard:async()=>{cleanups++;return true;}};}});
 recoveryBrowser=createRecoveryBrowser(origin);const http=createRecoveryConfirmationHttp(origin,binding,recoveryBrowser);
 const listener=createAccountNodeListener(origin,new Map([['/account/recovery',{handle:async(request,signal)=>http.landing(request,signal)}],['/api/account/recovery-confirm',{handle:http.confirm,discardResponse:http.discardResponse}],['/api/account/reset-ready',{handle:createRecoveryReadinessHttp(origin,recoveryBrowser)}],['/api/account/reset',{handle:createRecoveryHttp(origin,recoveryBrowser)}]]));
 server=createServer({key:readFileSync(join(temporary,'key.pem')),cert:readFileSync(join(temporary,'cert.pem'))},(request,response)=>{if(request.method==='GET'&&(request.url==='/account/reset'||/^\/assets\/[A-Za-z0-9._-]+\.js$/.test(request.url??''))){
 const file=request.url==='/account/reset'?join(output,'tests/browser/confirmed-recovery.html'):join(output,request.url.slice(1));
 try{const data=readFileSync(file);response.writeHead(200,{'content-type':request.url==='/account/reset'?'text/html; charset=utf-8':'text/javascript; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"});response.end(data);}catch{response.writeHead(404);response.end();}return;
 }void listener(request,response);});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(4326,'127.0.0.1',resolve);});
 browser=await webkit.launch({headless:true,...(process.env.WEBKIT_EXECUTABLE?{executablePath:process.env.WEBKIT_EXECUTABLE}:{})});
 const context=await browser.newContext({ignoreHTTPSErrors:true}),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(origin+'/account/recovery?token_hash=synthetic-email-proof');await page.getByRole('button',{name:'Continue to password reset'}).waitFor();assert.equal(verifications,0);assert.equal(page.url(),origin+'/account/recovery');
 const cookie=(await context.cookies()).find(x=>x.name==='__Host-stylist_recovery_confirm');assert(cookie?.secure&&cookie.httpOnly&&cookie.sameSite==='Strict');
 const script=await page.locator('script').textContent(),nonce=script.match(/confirmation:'([A-Za-z0-9_-]{43})'/)[1];
 await page.getByRole('button',{name:'Continue to password reset'}).click();await page.waitForURL(origin+'/account/reset');assert.equal(verifications,1);
 const cookies=await context.cookies();assert(cookies.some(x=>x.name==='__Host-stylist_reset'&&x.secure&&x.httpOnly));assert(!cookies.some(x=>x.name==='__Host-stylist_recovery_confirm'));assert(!cookies.some(x=>x.name==='__Host-stylist_account'));
 const replay=await context.request.post(origin+'/api/account/recovery-confirm',{headers:{origin,cookie:cookie.name+'='+cookie.value},data:{confirmation:nonce}});assert.equal(replay.status(),400);assert.equal(verifications,1);
 try{await page.getByRole('heading',{name:'Choose a new password'}).waitFor({timeout:5000});}catch(error){console.error({pageErrors:errors,body:await page.locator('body').innerText()});throw error;}
 await page.getByLabel('New password',{exact:true}).fill('Made-up-password-123!');await page.getByLabel('Confirm new password',{exact:true}).fill('Made-up-password-123!');
 await page.getByRole('button',{name:'Update password',exact:true}).click();
 await page.getByText('Password updated. Sign in to use your stylist.',{exact:true}).waitFor();
 assert.equal(resets,1);assert.equal(cleanups,1);assert.equal(await page.getByLabel('New password',{exact:true}).inputValue(), '');
 assert.equal(await page.getByLabel('Confirm new password',{exact:true}).inputValue(), '');assert.equal(await page.getByRole('button',{name:'Update password',exact:true}).isDisabled(),true);
 assert(!(await context.cookies()).some(x=>x.name==='__Host-stylist_reset'||x.name==='__Host-stylist_account'));
 await page.reload();await page.getByText('Recovery permission is unavailable. Request a new recovery link.',{exact:true}).waitFor();assert.equal(resets,1);assert.deepEqual(errors,[]);
 assert.equal(await recoveryBrowser.close(),true);assert.equal(cleanups,1);binding.close();
 console.log('WebKit HTTPS confirmation passed: scanner-safe landing, clean URL, CSP script, explicit click, secure reset-only cookie, confirmation clearing, redirect into the actual React reset form, one password update, cleared fields/cookies, disabled replay, unavailable reload and cleanup. Synthetic provider only.');
}finally{await browser?.close();await recoveryBrowser?.close();if(server)await new Promise(resolve=>server.close(resolve));rmSync(temporary,{recursive:true,force:true});}
