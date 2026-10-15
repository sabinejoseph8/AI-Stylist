/** Disposable child-process harness; never a production adapter or startup command. */
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createDurableRecoveryAdmission} from '../../src/server/recovery-durable-admission.ts';
import type {RecoveryAdmissionPort} from '../../src/server/recovery-durable-admission.ts';
export async function fixtureCall(root:string,expected:unknown,mode:string,request?:unknown){
 return new Promise<unknown>((resolve,reject)=>{
  const child=spawn('python3',[fileURLToPath(new URL('./recovery-admission-store.py',import.meta.url))],{stdio:['pipe','pipe','pipe']});let text='',size=0;
  const timer=setTimeout(()=>{child.kill('SIGKILL');reject(Error('Fixture unavailable'));},5000);
  child.stdout.on('data',data=>{size+=data.length;if(size>65536){child.kill('SIGKILL');reject(Error('Fixture unavailable'));}else text+=data.toString();});
  child.stderr.resume();child.on('error',error=>{clearTimeout(timer);reject(error);});
  child.on('close',code=>{clearTimeout(timer);if(code!==0){reject(Error('Fixture unavailable'));return;}try{resolve(JSON.parse(text));}catch{reject(Error('Fixture unavailable'));}});
  child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify({root,expected,mode,request}));
 });
}
export function fixturePort(root:string,expected:unknown):RecoveryAdmissionPort{
 return {reserve:(r,_s)=>fixtureCall(root,expected,'reserve',r),claimReset:(r,_s)=>fixtureCall(root,expected,'claimReset',r),settle:(r,_s)=>fixtureCall(root,expected,'settle',r)};
}
if(process.argv[2]==='probe'){
 let source='';for await(const chunk of process.stdin)source+=chunk;
 const {root,expected,mode,generation=1}=JSON.parse(source);let providerCalls=0,passwordCalls=0;
 const guard=createDurableRecoveryAdmission({storeId:expected.store_id,policyId:expected.policy_digest},fixturePort(root,expected),{exchange:async()=>{
  providerCalls++;if(mode==='crash-verify')process.exit(71);
  return {ownerId:'00000000-0000-4000-8000-000000000002',expiresAt:Date.now()+60000,resetPassword:async()=>{passwordCalls++;if(mode==='crash-reset')process.exit(72);return true;},discard:async()=>true};
 }},3000);
 const value=await guard.exchange({subjectKey:'b'.repeat(64),generation},'synthetic-only',new AbortController().signal);
 if('status' in value)process.stdout.write(JSON.stringify({status:value.status,providerCalls,passwordCalls}));
 else{const changed=await value.resetPassword('made-up-only',new AbortController().signal),cleaned=await value.discard(new AbortController().signal);process.stdout.write(JSON.stringify({status:changed&&cleaned?'complete':'unavailable',providerCalls,passwordCalls}));}
}
