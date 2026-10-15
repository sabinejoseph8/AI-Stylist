/** Disposable test bridge only. Independent witness protection is an assumption. */
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createLocalCviCredentialEndpoint} from '../../src/server/local-cvi-credentials.ts';
import type {CviCredentialLease} from '../../src/server/local-cvi-credentials.ts';
import {createLocalCviStyling} from '../../src/server/local-cvi-styling.ts';
import {credentialBinding,fixtureRequest} from './cvi-credential-process.ts';
export function witnessedCall(root:string,mode:string,args:Record<string,unknown>={}):Promise<unknown>{return new Promise((resolve,reject)=>{
 const c=spawn('python3',[fileURLToPath(new URL('./cvi-witness-store.py',import.meta.url))],{stdio:['pipe','pipe','pipe']});let out='';const timer=setTimeout(()=>{c.kill('SIGKILL');reject(Error('Fixture timeout'));},3000);
 c.stdout.on('data',d=>out+=d.toString());c.stderr.resume();c.on('error',()=>{clearTimeout(timer);reject(Error('Fixture unavailable'));});c.on('close',code=>{clearTimeout(timer);try{if(code!==0)throw Error();resolve(JSON.parse(out));}catch{reject(Error('Fixture unavailable'));}});c.stdin.on('error',()=>{});c.stdin.end(JSON.stringify({root,mode,...args}));
});}
export type WitnessFixture={root:string;replayRoot:string;replayId:string;credentialWitness:Record<string,unknown>;replayWitness:Record<string,unknown>;lease:CviCredentialLease};
export function witnessedEndpoint(x:WitnessFixture,options:{crashAt?:string;witnessCrashAt?:string;afterConsume?:()=>Promise<void>}={}){
 let drafts=0;const flow=createLocalCviStyling({draft:async()=>{drafts++;return 'Witnessed fixture outfit.';},check:async(text,s)=>({approved:true,text,revision:s.revision})},2000);
 const replay={storeId:x.replayId,
  reserve:async(r:Record<string,unknown>)=>({...await witnessedCall(x.replayRoot,'reserve',{request:{...r,bindingDigest:x.lease.scopeDigest},witness:x.replayWitness,crashAt:options.crashAt,witnessCrashAt:options.witnessCrashAt}) as object,bindingDigest:r.bindingDigest}),
  consume:async(r:Record<string,unknown>)=>{const raw=await witnessedCall(x.replayRoot,'consume',{request:{...r,bindingDigest:x.lease.scopeDigest},witness:x.replayWitness});await options.afterConsume?.();return {...raw as object,bindingDigest:r.bindingDigest};}};
 const endpoint=createLocalCviCredentialEndpoint(credentialBinding(x.lease.generation),flow,replay,x.lease,{check:async request=>witnessedCall(x.root,'check',{request,witness:x.credentialWitness})},()=>1000,2500);
 return {endpoint,get drafts(){return drafts;}};
}
if(process.argv[2]==='witness-probe'){
 let raw='';for await(const c of process.stdin)raw+=c;const x=JSON.parse(raw),s=witnessedEndpoint(x,x.options);
 const r=await s.endpoint.handle(fixtureRequest(credentialBinding(x.lease.generation).secret,x.id??'fixture-one'));let released=false;try{released=(await r.text()).includes('Witnessed fixture outfit.');}catch{}
 console.log(JSON.stringify({status:r.status,drafts:s.drafts,released}));
}
