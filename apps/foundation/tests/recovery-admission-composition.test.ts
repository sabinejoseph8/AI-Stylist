import {it,expect,vi} from 'vitest';
import {generateKeyPair,exportJWK,createLocalJWKSet,SignJWT} from 'jose';
import {createDurableRecoveryAdmission} from '../src/server/recovery-durable-admission.ts';
import {createRecoveryTokenProvider} from '../src/server/recovery-provider.ts';
import {createIdentityVerifier} from '../src/server/verified-identity.ts';
import {createTokenRecoveryOwner} from '../src/server/account-recovery.ts';
import {createRecoveryConfirmation} from '../src/server/recovery-confirmation.ts';
import {createRecoveryConfirmationHttp} from '../src/server/recovery-confirmation-http.ts';
import {createRecoveryBrowser} from '../src/server/recovery-browser.ts';
const origin='https://stylist.example',project='https://fixture.supabase.co',ownerId='00000000-0000-4000-8000-000000000002',sessionId='00000000-0000-4000-8000-000000000003',signal=()=>new AbortController().signal;
const pair=await generateKeyPair('ES256'),jwk=await exportJWK(pair.publicKey);jwk.kid='durable-composition';
it.each([['recovery',true,'resetComplete'],['otp',true,'unavailable'],['recovery',false,'unconfirmed']] as const)('preserves signed %s purpose and cleanup=%s through browser delivery and durable admission',async(method,cleanupVerified,expected)=>{
 let active=true,state='empty';const binding={storeId:'00000000-0000-4000-8000-000000000001',policyId:'a'.repeat(64)};
 const updatePassword=vi.fn(async()=>true),verifier=createIdentityVerifier(project,createLocalJWKSet({keys:[jwk]}),{active:async()=>active});
 const provider=createRecoveryTokenProvider({
  async verifyRecoveryToken(){const now=Math.floor(Date.now()/1000);const access_token=await new SignJWT({iss:project+'/auth/v1',aud:'authenticated',sub:ownerId,session_id:sessionId,role:'authenticated',is_anonymous:false,iat:now,exp:now+300,amr:[{method,timestamp:now}]}).setProtectedHeader({alg:'ES256',kid:jwk.kid}).sign(pair.privateKey);return {access_token,token_type:'bearer'};},
  updatePassword,async revoke(){if(cleanupVerified)active=false;return true;},
 },verifier,{confirm:async()=>({status:active?'unconfirmed':'revoked',ownerId,sessionId})});
 const reserve=vi.fn(async(r:{storeId:string;policyId:string;operationId:string})=>{state='reserved';return {...binding,operationId:r.operationId,status:state};});
 const guard=createDurableRecoveryAdmission(binding,{reserve,async claimReset(r){state='resetting';return {...r,status:state};},async settle(r){state=r.outcome;return {...binding,operationId:r.operationId,status:state};}}, {exchange:(proof:string,s)=>provider.verifyToken(proof,s)});
 const owner=createTokenRecoveryOwner({verifyToken:(proof,s)=>guard.exchange({subjectKey:'b'.repeat(64),generation:1},proof,s)}),browser=createRecoveryBrowser(origin),receiving=createRecoveryConfirmation(origin,owner),http=createRecoveryConfirmationHttp(origin,receiving,browser);
 const landing=receiving.begin(new Request(origin+'/account/recovery?token_hash=synthetic-proof'))!;
 const confirm=await http.confirm(new Request(origin+'/api/account/recovery-confirm',{method:'POST',headers:{origin,cookie:landing.setCookie.split(';')[0]!,'content-type':'application/json'},body:JSON.stringify({confirmation:landing.confirmation})}),signal());
 if(expected==='unavailable'){
  expect(await confirm.json()).toEqual({status:'unavailable'});expect(state).toBe('rejected');expect(updatePassword).not.toHaveBeenCalled();
 }else{
  expect(await confirm.json()).toEqual({status:'resetRequired'});expect(state).toBe('reserved');const cookie=confirm.headers.getSetCookie().find(x=>x.startsWith('__Host-stylist_reset='))!.split(';')[0]!;
  const result=await browser.submit(new Request(origin+'/api/account/reset',{method:'POST',headers:{origin,cookie}}),{password:'made-up-only',confirmation:'made-up-only'},signal());
  expect(result.status).toBe(expected);expect(state).toBe(cleanupVerified?'completed':'held');expect(updatePassword).toHaveBeenCalledOnce();
 }
 expect(reserve).toHaveBeenCalledOnce();expect(confirm.headers.getSetCookie().some(x=>x.startsWith('__Host-stylist_access='))).toBe(false);await browser.close();
});
