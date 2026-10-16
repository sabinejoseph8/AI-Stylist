/** Public synthetic bindings only; no credentials from files or environment. */
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createLocalCviCredentialEndpoint,startLocalCviCredentialEndpoint,cviCredentialDigests} from '../../src/server/local-cvi-credentials.ts';
import type {CviCredentialLease} from '../../src/server/local-cvi-credentials.ts';
import {createLocalCviStyling} from '../../src/server/local-cvi-styling.ts';
import {port as rawPort,fixtureBinding} from './cvi-replay-process.ts';
export const credentialBinding=(generation=1)=>({...fixtureBinding,secret:(generation===1?'a':generation===2?'b':'c').repeat(64)});
export function credentialCall(root:string,mode:string,args:Record<string,unknown>={}):Promise<unknown>{return new Promise((resolve,reject)=>{
 const c=spawn('python3',[fileURLToPath(new URL('./cvi-credential-store.py',import.meta.url))],{stdio:['pipe','pipe','pipe']});let out='';const timer=setTimeout(()=>{c.kill('SIGKILL');reject(Error('Fixture timeout'));},3000);
 c.stdout.on('data',d=>out+=d.toString());c.stderr.resume();c.on('error',()=>{clearTimeout(timer);reject(Error('Fixture unavailable'));});c.on('close',code=>{clearTimeout(timer);try{if(code!==0)throw Error();resolve(JSON.parse(out));}catch{reject(Error('Fixture unavailable'));}});c.stdin.on('error',()=>{});c.stdin.end(JSON.stringify({root,mode,...args}));
});}
/** TEST adapter normalizes only journal binding to stable scope; raw ack is rebound.
 * Current credential checks remain separate, so cross-store atomicity is unproven. */
export function scopeReplay(root:string,storeId:string,scopeDigest:string){const raw=rawPort(root,storeId);return {storeId,
 inspect:async(r:Parameters<NonNullable<typeof raw.inspect>>[0],s:AbortSignal)=>({...await raw.inspect!({...r,bindingDigest:scopeDigest},s) as object,bindingDigest:r.bindingDigest}),
 reserve:async(r:Parameters<typeof raw.reserve>[0],s:AbortSignal)=>({...await raw.reserve({...r,bindingDigest:scopeDigest},s) as object,bindingDigest:r.bindingDigest}),
 consume:async(r:Parameters<typeof raw.consume>[0],s:AbortSignal)=>({...await raw.consume({...r,bindingDigest:scopeDigest},s) as object,bindingDigest:r.bindingDigest})};}
export function makeEndpoint(root:string,replayRoot:string,replayId:string,lease:CviCredentialLease,binding=credentialBinding(lease.generation),afterConsume?:()=>Promise<void>){
 let drafts=0;const flow=createLocalCviStyling({draft:async()=>{drafts++;return 'Synthetic checked output.';},check:async(text,s)=>({approved:true,revision:s.revision,text})},2000);
 const replay=scopeReplay(replayRoot,replayId,lease.scopeDigest),consume=replay.consume;
 replay.consume=async(r,s)=>{const ack=await consume(r,s);await afterConsume?.();return ack;};
 return {flow,get drafts(){return drafts;},endpoint:createLocalCviCredentialEndpoint(binding,flow,replay,lease,{check:async request=>credentialCall(root,'check',{request})},()=>1000,2500)};
}
export function fixtureRequest(secret=credentialBinding().secret,id='fixture-one'){
 return new Request(fixtureBinding.origin+'/v1/chat/completions',{method:'POST',headers:{authorization:`Bearer ${secret}`,'content-type':'application/json','x-cvi-conversation':fixtureBinding.conversation,'x-cvi-request-id':id},body:JSON.stringify({model:'local-simulation',stream:true,messages:[{role:'user',content:'synthetic only'}]})});
}
if(process.argv[2]==='credential-probe'){
 let raw='';for await(const c of process.stdin)raw+=c;const x=JSON.parse(raw),s=makeEndpoint(x.root,x.replayRoot,x.replayId,x.lease);
 const r=await s.endpoint.handle(fixtureRequest(x.secret??credentialBinding(x.lease.generation).secret,x.id??'fixture-one'));let released=false;try{released=(await r.text()).includes('Synthetic checked output.');}catch{}
 console.log(JSON.stringify({status:r.status,drafts:s.drafts,released}));
}

if(process.argv[2]==='boot-probe'){
 let raw='';for await(const c of process.stdin)raw+=c;const x=JSON.parse(raw);let drafts=0;
 const flow=createLocalCviStyling({draft:async()=>{drafts++;return 'Synthetic checked output.';},check:async(text,s)=>({approved:true,text,revision:s.revision})},2000);
 const binding=credentialBinding(x.generation),scope=cviCredentialDigests(binding).scopeDigest;
 const e=await startLocalCviCredentialEndpoint(binding,flow,scopeReplay(x.replayRoot,x.replayId,scope),
  {storeId:x.storeId,previous:x.previous,bootDigest:String(x.generation).repeat(64)},
  {activate:async input=>credentialCall(x.root,'activate',input),check:async request=>credentialCall(x.root,'check',{request})},()=>1000,2500);
 let released=false;if(e){const response=await e.handle(fixtureRequest(binding.secret,x.id??'fixture-new'));try{released=(await response.text()).includes('Synthetic checked output.');}catch{}}
 console.log(JSON.stringify({started:e!==null,drafts,released}));
}
