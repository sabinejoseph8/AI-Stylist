import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {fullStateFixture} from './cvi-full-state-fixture.ts';
import {createLocalStartupCheckpointInspector} from '../../src/server/local-cvi-startup-checkpoint.ts';
import {witnessServiceDigest} from '../../src/server/local-cvi-witness-service.ts';
import {historyCanonical} from '../../src/server/local-cvi-history-authority.ts';
import type {StartupPin,StartupRegistry,StartupReadPorts} from '../../src/server/local-cvi-startup-checkpoint.ts';
export function freshStartup(pin:StartupPin,registry:StartupRegistry,ports:StartupReadPorts):Promise<any>{return new Promise((resolve,reject)=>{
 const p=spawn(process.execPath,[fileURLToPath(new URL('./cvi-startup-reader.ts',import.meta.url))],{stdio:['pipe','pipe','pipe']});let buffer='',result:any,settled=false;
 const fail=()=>{if(!settled){settled=true;reject(Error('Fresh startup held'));}p.kill('SIGKILL');};
 const timer=setTimeout(fail,8000);p.stdout.on('data',d=>{buffer+=d.toString();if(buffer.length>1048576)return fail();let at:number;while((at=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,at);buffer=buffer.slice(at+1);let m:any;try{m=JSON.parse(line);}catch{return fail();}if(m.stage==='result')result=m.result;else if(m.stage==='held')fail();else if(['authority','database'].includes(m.stage)&&typeof m.nonce==='string')Promise.resolve().then(()=>ports[m.stage as keyof StartupReadPorts](m.nonce,new AbortController().signal)).then(r=>{if(!settled)p.stdin.write(JSON.stringify(r)+'\n');},fail);else fail();}});
 p.stderr.resume();p.stdin.on('error',()=>{});p.on('error',fail);p.on('close',code=>{clearTimeout(timer);if(!settled){settled=true;if(code!==0||!result)reject(Error('Fresh startup held'));else resolve(result);}});
 p.stdin.write(JSON.stringify({pin,registry,now:1000})+'\n');
});}
export async function startupFixture(committed=true){
 const f=await fullStateFixture(),port=f.x.authorityPort('rotator');
 const registry:StartupRegistry={version:1,entries:[{operationId:f.plan.id,target:f.plan.to,projection:f.command.target}]};
 const pin:StartupPin={authority:f.x.pin,database:f.identityPin,readerPrincipal:f.x.actors.find(a=>a.role==='observer')!.principalDigest,registryDigest:witnessServiceDigest(registry),minimumRevision:2};
 let checkpoint:any={snapshot:f.states.target,projection:f.command.target,operationId:f.command.operationId,transactionId:'40',claimHash:'c'.repeat(64),consumed:true,protected:true},patch:Record<string,unknown>={},invalid=false,time=1000;
 if(committed){const e=await port.claim(f.plan,'e'.repeat(64));checkpoint.claimHash=witnessServiceDigest(e.request);await f.finalizer(checkpoint.claimHash,'40',async()=>checkpoint).finalize(new AbortController().signal);}
 const ports:StartupReadPorts={authority:n=>port.read(n),database:async nonce=>{const body={version:1,keyId:f.identityPin.keyId,storeId:f.x.pin.storeId,policyDigest:f.x.pin.policyDigest,nonce,issuedAt:1000,expiresAt:2000,checkpoint,...patch};return {body,signature:invalid?'0'.repeat(128):f.key.sign(historyCanonical(body))};}};
 return {...f,pin,registry,ports,make:()=>createLocalStartupCheckpointInspector(pin,registry,ports,()=>time),checkpoint:()=>structuredClone(checkpoint),setCheckpoint:(c:any)=>{checkpoint=c;},patch:(p:Record<string,unknown>)=>{patch=p;},invalid:()=>{invalid=true;},setTime:(t:number)=>{time=t;}};
}
