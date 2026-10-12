import {it,expect,vi} from 'vitest';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {createAccountSecurity} from '../src/server/account-security.ts';
import {createIdentityVerifier} from '../src/server/verified-identity.ts';
import {createRecoveryProvider} from '../src/server/recovery-provider.ts';
import {createAccountRecovery} from '../src/server/account-recovery.ts';
import {createRecoveryBrowser} from '../src/server/recovery-browser.ts';
import {createRecoveryHttp} from '../src/server/recovery-http.ts';
const origin='https://stylist.example',project='https://example.supabase.co';
const owner='11111111-1111-4111-8111-111111111111',sessionId='22222222-2222-4222-8222-222222222222';
const signal=()=>new AbortController().signal;
async function fixture(method='recovery',confirmed=true){
 const pair=await generateKeyPair('ES256');let alive=true;
 const jwt=await new SignJWT({session_id:sessionId,role:'authenticated',is_anonymous:false,amr:[{method,timestamp:Math.floor(Date.now()/1000)}]}).setProtectedHeader({alg:'ES256',kid:'fixture'}).setSubject(owner).setIssuer(project+'/auth/v1').setAudience('authenticated').setIssuedAt().setExpirationTime('5m').sign(pair.privateKey);
 const security=createAccountSecurity({appOrigin:origin,projectUrl:project,fetch:async()=>Response.json({keys:[{...await exportJWK(pair.publicKey),kid:'fixture'}]}),rpc:{call:async()=>alive}});
 const verifier=createIdentityVerifier(project,async()=>pair.publicKey,{active:async()=>alive});
 const updatePassword=vi.fn(async()=>true),revoke=vi.fn(async()=>{if(confirmed)alive=false;return true;});
 const provider=createRecoveryProvider({exchange:async()=>({access_token:jwt,token_type:'bearer'}),updatePassword,revoke},verifier,{confirm:async()=>alive?{status:'unconfirmed'}:{status:'revoked',ownerId:owner,sessionId}});
 const recovery=createAccountRecovery(security,provider),browser=createRecoveryBrowser(origin),http=createRecoveryHttp(origin,browser);
 const flow=security.callbacks.begin('recovery'),callback=new Request(flow.callbackUrl+'&code=synthetic',{headers:{cookie:flow.cookie.split(';')[0]}});
 return {recovery,browser,http,callback,updatePassword,revoke};
}
function resetRequest(cookie:string){return new Request(origin+'/api/account/reset',{method:'POST',headers:{origin,'content-type':'application/json',cookie},body:JSON.stringify({password:'made-up-reset',confirmation:'made-up-reset'})});}
it('composes signed recovery proof, browser binding, one reset and confirmed cleanup',async()=>{
 const f=await fixture(),grant=await f.recovery.complete(f.callback,signal());expect(grant.status).toBe('resetRequired');if(grant.status!=='resetRequired')throw Error();
 expect(await f.recovery.complete(f.callback,signal())).toEqual({status:'unavailable'});
 const delivery=f.browser.install(grant),cookie=delivery.setCookie.split(';')[0];expect(cookie).toMatch(/^__Host-stylist_reset=/);
 const wrong=await f.http(resetRequest('__Host-stylist_reset='+'a'.repeat(43)),signal());expect(wrong.status).toBe(400);expect(f.updatePassword).not.toHaveBeenCalled();
 const reply=await f.http(resetRequest(cookie),signal());expect(reply.status).toBe(200);expect(await reply.json()).toEqual({status:'resetComplete'});
 expect(reply.headers.get('set-cookie')).toContain('Max-Age=0');expect(reply.headers.get('set-cookie')).not.toContain('__Host-stylist_access');expect(f.updatePassword).toHaveBeenCalledOnce();expect(f.revoke).toHaveBeenCalledOnce();
 expect((await f.http(resetRequest(cookie),signal())).status).toBe(400);expect(await f.browser.close()).toBe(true);
});
it('denies an ordinarily signed password token at the composed recovery boundary',async()=>{
 const f=await fixture('password');expect(await f.recovery.complete(f.callback,signal())).toEqual({status:'unavailable'});expect(f.updatePassword).not.toHaveBeenCalled();expect(f.revoke).toHaveBeenCalledOnce();expect(await f.browser.close()).toBe(true);
});
it('reports unconfirmed after a password update when primary cleanup is not proved',async()=>{
 const f=await fixture('recovery',false),grant=await f.recovery.complete(f.callback,signal());if(grant.status!=='resetRequired')throw Error();
 const cookie=f.browser.install(grant).setCookie.split(';')[0],reply=await f.http(resetRequest(cookie),signal());
 expect(reply.status).toBe(409);expect(await reply.json()).toEqual({status:'unconfirmed'});expect(reply.headers.get('set-cookie')).toContain('Max-Age=0');expect(f.recovery.cleanupHeld()).toBe(true);expect(f.browser.cleanupHeld()).toBe(true);expect(f.updatePassword).toHaveBeenCalledOnce();expect(await f.browser.close()).toBe(false);
});
