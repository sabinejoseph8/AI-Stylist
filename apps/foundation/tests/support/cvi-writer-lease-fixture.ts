/** Guarded participating writers; no hosted grants or independent control store. */
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {integratedWitnessFixture} from './cvi-integrated-witness-fixture.ts';
import {hostedPrincipalDigest} from '../../src/server/local-cvi-hosted-proposal.ts';
import {historyCanonical} from '../../src/server/local-cvi-history-authority.ts';
import {D} from './cvi-domain-history-fixture.ts';
export function leaseCall(input:Record<string,unknown>):Promise<any>{return new Promise((resolve,reject)=>{const p=spawn('python3',[fileURLToPath(new URL('./cvi-writer-lease-store.py',import.meta.url))],{stdio:['pipe','pipe','pipe']});let out='';const timer=setTimeout(()=>{p.kill('SIGKILL');reject(Error('Fixture timeout'));},8000);p.stdout.on('data',d=>out+=d.toString());p.stderr.resume();p.stdin.on('error',()=>{});p.on('error',()=>{clearTimeout(timer);reject(Error('Fixture unavailable'));});p.on('close',code=>{clearTimeout(timer);try{if(code!==0)throw Error();resolve(JSON.parse(out));}catch{reject(Error('Fixture unavailable'));}});p.stdin.end(JSON.stringify(input));});}
export async function writerLeaseFixture(){
 const x=await integratedWitnessFixture(),root=x.dbRoot,owner=hostedPrincipalDigest(x.f.rotator),rotator={role:'rotator',principalDigest:D(70)},fencer={role:'fencer',principalDigest:D(71)},signer={role:'signer',principalDigest:D(72)};
 await leaseCall({root,mode:'bootstrap'});let boot=1800,barrier:any=null,lastRelease:Record<string,unknown>|undefined;const records=new Map<string,any>();
 const activate=async(previous:number,extra:Record<string,unknown>={})=>leaseCall({root,mode:'activate',actor:rotator,previous,owner,boot:D(boot++),...extra});
 const fence=async(generation:number,extra:Record<string,unknown>={})=>{barrier=await leaseCall({root,mode:'fence',actor:fencer,generation,...extra});return barrier;};
 const inspect=()=>leaseCall({root,mode:'inspect'});
 x.setFenceCheck(async()=>{const s=await inspect();return barrier!==null&&s.gate.state==='fenced'&&s.gate.generation===barrier.generation;});
 const apply=async(p:any,lease:any,extra:Record<string,unknown>={})=>{const s=await x.read();if(s.pending!==p.id||historyCanonical(s.current)!==historyCanonical(p.to))throw Error('Fixture unavailable');const r=await leaseCall({root,mode:'apply',config:x.config,intent:p,lease,...extra});if(p.mode==='claim')records.set(p.id,r);return r;};
 const release=async(p:any,extra:Record<string,unknown>={})=>{const record=records.get(p.id);records.delete(p.id);if(!record)throw Error('Fixture unavailable');const s=await x.read('signer');if(s.pending!==null||historyCanonical(s.current)!==historyCanonical(p.to))throw Error('Fixture unavailable');lastRelease={root,mode:'release',actor:signer,barrier,expected:p.to,record,signerConfig:{node:process.execPath,script:fileURLToPath(new URL('./cvi-leased-sign.ts',import.meta.url)),pin:x.receiptPin,receiptId:x.receiptId,privateKeyPem:x.receiptTestKey.privateKey.export({type:'pkcs8',format:'pem'}).toString()},...extra};return leaseCall(lastRelease);};
 return {...x,owner,rotator,fencer,signerRole:signer,activate,fence,leaseInspect:inspect,guardedApply:apply,release,loseLeaseRecords:()=>records.clear(),replayLeaseRelease:(extra:Record<string,unknown>={})=>{if(!lastRelease)throw Error('Fixture unavailable');return leaseCall({...lastRelease,...extra});},root};
}
