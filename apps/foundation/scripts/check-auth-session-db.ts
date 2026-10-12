/** Actual local PostgreSQL, synthetic Auth schema and generated asymmetric tokens. */
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {generateKeyPair,exportJWK,createLocalJWKSet,SignJWT} from 'jose';
import {createAuthSessionAuthority} from '../src/server/auth-session.ts';
import {createIdentityVerifier} from '../src/server/verified-identity.ts';
const container=process.argv[2];if(!/^stylist-data-[a-f0-9]{10}$/.test(container??''))throw Error('Isolated fixture required');
const owner='00000000-0000-0000-0000-000000000001',session='00000000-0000-0000-0000-000000000077';
const sql=(query:string)=>execFileSync('docker',['exec','-i',container,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],{input:query,encoding:'utf8',timeout:8000,stdio:['pipe','pipe','pipe']}).trim();
sql(`insert into auth.sessions(id,user_id) values('${session}','${owner}');`);
const authority=createAuthSessionAuthority({async call(name,p){
 assert.equal(name,'stylist_auth_session_active');assert.deepEqual(Object.keys(p).sort(),['p_owner','p_session']);
 assert.match(String(p.p_owner),/^[a-f0-9-]{36}$/);assert.match(String(p.p_session),/^[a-f0-9-]{36}$/);
 return sql(`set role service_role; select public.stylist_auth_session_active('${p.p_owner}','${p.p_session}');`)==='t';
}});
const pair=await generateKeyPair('ES256'),jwk=await exportJWK(pair.publicKey);jwk.kid='local';
const now=Math.floor(Date.now()/1000),url='https://fixture.supabase.co';
const token=await new SignJWT({sub:owner,session_id:session,iss:url+'/auth/v1',aud:'authenticated',role:'authenticated',is_anonymous:false,iat:now,exp:now+300}).setProtectedHeader({alg:'ES256',kid:'local'}).sign(pair.privateKey);
const verify=createIdentityVerifier(url,createLocalJWKSet({keys:[jwk]}),authority),signal=()=>new AbortController().signal;
const identity=await verify.verify(token,signal());assert.equal(identity?.ownerId,owner);
sql(`delete from auth.sessions where id='${session}';`);
assert.equal(await identity?.isCurrent(signal()),false);assert.equal(await verify.verify(token,signal()),null);
console.log('Generated signed JWT plus prepared SQL authority rejects the same unexpired token after synthetic session deletion');
