/** Disposable integration only. Real SQLite/crypto; fencing remains a simulation. */
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {mkdtemp,mkdir,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createLocalCviWitnessService,verifyLocalWitnessReply,witnessServiceDigest} from '../../src/server/local-cvi-witness-service.ts';
import type {WitnessPrincipal,WitnessServiceRequest} from '../../src/server/local-cvi-witness-service.ts';
import {createLocalCviReceiptSigner} from '../../src/server/local-cvi-receipt-signer.ts';
import {hostedPrincipalDigest} from '../../src/server/local-cvi-hosted-proposal.ts';
import {historyCanonical} from '../../src/server/local-cvi-history-authority.ts';
import {fixtureKey,serviceCall} from './cvi-witness-service-fixture.ts';
import {domainFixture,D} from './cvi-domain-history-fixture.ts';
import {receiptCall} from './cvi-receipt-process.ts';
export function intentCall(input:Record<string,unknown>):Promise<any>{return new Promise((resolve,reject)=>{const p=spawn('python3',[fileURLToPath(new URL('./cvi-integrated-intent-store.py',import.meta.url))],{stdio:['pipe','pipe','pipe']});let out='';const timer=setTimeout(()=>{p.kill('SIGKILL');reject(Error('Fixture timeout'));},6000);p.stdout.on('data',d=>out+=d.toString());p.stderr.resume();p.stdin.on('error',()=>{});p.on('error',()=>{clearTimeout(timer);reject(Error('Fixture unavailable'));});p.on('close',code=>{clearTimeout(timer);try{if(code!==0)throw Error();resolve(JSON.parse(out));}catch{reject(Error('Fixture unavailable'));}});p.stdin.end(JSON.stringify(input));});}
export async function integratedWitnessFixture(){
 const base=await mkdtemp(join(tmpdir(),'stylist-integrated-witness-')),dbRoot=join(base,'db'),serviceRoot=join(base,'service');await mkdir(dbRoot,{mode:0o700});await mkdir(serviceRoot,{mode:0o700});
 const f=domainFixture(),scope=await receiptCall(dbRoot,'prepare',f.rotator,{snapshot:f.initial}),raw=await receiptCall(dbRoot,'project',f.rotator),{status,snapshot,...projection}=raw;
 const authority=fixtureKey(),database=fixtureKey(),fence=fixtureKey(),receiptKey=fixtureKey(),keys={observer:fixtureKey(),writer:fixtureKey(),signer:fixtureKey(),reconciler:fixtureKey()};
 const receiptPin={authorityId:'fixture-authority-integrated-receipt',storeId:scope.storeId,policyDigest:scope.policyDigest,principalDigest:hostedPrincipalDigest(f.rotator),keyId:'fixture-key-integrated-receipt',publicKeyPem:receiptKey.pem};
 const domainInput={projection,command:{type:'rotate',previous:0,bindingDigest:D(2),bootDigest:D(3)}};
 const receiptRequest={version:1,authorityId:receiptPin.authorityId,storeId:scope.storeId,policyDigest:scope.policyDigest,principalDigest:receiptPin.principalDigest,action:'commit',challenge:D(820),issuedAt:1000,expiresAt:2000,input:domainInput};
 const receiptId=witnessServiceDigest(receiptRequest),commitArgs={request:domainInput,receiptContext:{request:receiptRequest,keyId:receiptPin.keyId}},claimArgs={identity:receiptId,principal:receiptPin.principalDigest};
 const pin={authorityId:'fixture-authority-integrated-service',witnessId:'11111111-1111-4111-8111-111111111111',storeId:scope.storeId,policyDigest:scope.policyDigest,keyId:'fixture-key-integrated-service',publicKeyPem:authority.pem};
 const storePin={authorityId:pin.authorityId,witnessId:pin.witnessId,storeId:pin.storeId,policyDigest:pin.policyDigest};
 const config={actor:f.rotator,now:1000,node:process.execPath,validator:fileURLToPath(new URL('./cvi-transaction-validator.ts',import.meta.url))};
 const observe=()=>intentCall({root:dbRoot,mode:'observe'}),initial=await observe();
 await serviceCall({root:serviceRoot,mode:'prepare',pin:storePin,current:initial,now:1000});
 const grants=Object.entries(keys).map(([role,key],i)=>({role,principalDigest:D(40+i),keyId:'fixture-key-integrated-'+role,publicKeyPem:key.pem})) as WitnessPrincipal[];
 const invoke=(a:WitnessPrincipal,mode:string,args:Record<string,unknown>)=>serviceCall({root:serviceRoot,pin:storePin,actor:{principalDigest:a.principalDigest,role:a.role},mode,args,now:1000});
 const store={admit:(a:WitnessPrincipal,r:WitnessServiceRequest,id:string)=>invoke(a,'admit',{id,challenge:r.challenge,action:r.action,operationId:r.operationId,expectedRevision:r.expectedRevision,issuedAt:r.issuedAt,expiresAt:r.expiresAt}),inspect:(a:WitnessPrincipal)=>invoke(a,'inspect',{}),apply:(a:WitnessPrincipal,action:string,args:Record<string,unknown>)=>invoke(a,action,args)};
 const plans=new Map<string,any>(),records=new Map<string,any>();let n=1200,fenced=true,proofPatch:Record<string,unknown>={},proofReads=0,signatures=0;
 const proofPins={database:{keyId:'fixture-key-integrated-database',publicKeyPem:database.pem},fence:{keyId:'fixture-key-integrated-fence',publicKeyPem:fence.pem}};
 const signedProof=(kind:'database'|'fence',binding:any,state:string)=>{const body={version:1,kind,state,keyId:proofPins[kind].keyId,...binding,issuedAt:1000,expiresAt:2000,...(kind==='database'?proofPatch:{})};return {body,signature:(kind==='database'?database:fence).sign(historyCanonical(body))};};
 const sources={transition:async(a:WitnessPrincipal,id:string,current:any)=>{const p=plans.get(id);if(!p||a.role!=='writer'||a.principalDigest!==grants.find(g=>g.role==='writer')!.principalDigest||historyCanonical(p.from)!==historyCanonical(current))throw Error('Fixture unavailable');return {from:structuredClone(p.from),to:structuredClone(p.to)};},
 database:async(b:any)=>{proofReads++;const actual=await observe();return signedProof('database',b,witnessServiceDigest(actual)===b.targetDigest?'target-committed':'old-state');},
 fence:async(b:any)=>signedProof('fence',b,fenced?'writers-fenced':'writers-running')};
 const make=()=>createLocalCviWitnessService(pin,grants,store,sources,proofPins,authority.sign,()=>1000,5000);
 const inspect=()=>store.inspect(grants[0]);
 const request=(role:WitnessPrincipal['role'],action:WitnessServiceRequest['action'],operationId:string,expectedRevision:number)=>{const a=grants.find(g=>g.role===role)!,r:WitnessServiceRequest={version:1,authorityId:pin.authorityId,witnessId:pin.witnessId,storeId:pin.storeId,policyDigest:pin.policyDigest,principalDigest:a.principalDigest,keyId:a.keyId,action,operationId,expectedRevision,challenge:D(n++),issuedAt:1000,expiresAt:3000};return {request:r,signature:keys[role].sign(historyCanonical(r))};};
 const exchange=async(e:ReturnType<typeof request>)=>verifyLocalWitnessReply(pin,e.request,await make().handle(e,new AbortController().signal),1000) as any;
 const read=async(role:WitnessPrincipal['role']='observer')=>exchange(request(role,'read',D(n++),0));
 const plan=async(kind:'commit'|'claim',args=kind==='commit'?commitArgs:claimArgs)=>{const p=await intentCall({root:dbRoot,mode:'plan',config,kind,args});plans.set(p.id,structuredClone(p));return p;};
 const advance=async(p:any)=>{const s=await inspect(),result=await exchange(request('writer','advance',p.id,s.revision));if(result.status!=='advanced'||historyCanonical(result.current)!==historyCanonical(p.to))throw Error('Fixture unavailable');return result;};
 const apply=async(p:any,crashAt?:string)=>{const s=await read();if(s.pending!==p.id||historyCanonical(s.current)!==historyCanonical(p.to))throw Error('Fixture unavailable');const r=await intentCall({root:dbRoot,mode:'apply',config,intent:p,crashAt});if(p.mode==='claim')records.set(p.id,r);return r;};
 const reconcile=async(p:any)=>{const s=await inspect();return exchange(request('reconciler','reconcile',p.id,s.revision));};
 const signer=(p:any)=>createLocalCviReceiptSigner(receiptPin,{claim:async(id:string,signal:AbortSignal)=>{const r=records.get(p.id);records.delete(p.id);if(!r||id!==receiptId||signal.aborted)throw Error('Fixture unavailable');const s=await read('signer'),actual=await observe();if(signal.aborted||s.pending!==null||historyCanonical(s.current)!==historyCanonical(actual)||historyCanonical(s.current)!==historyCanonical(p.to))throw Error('Fixture unavailable');return r;}},body=>{signatures++;return receiptKey.sign(body);},0,()=>1000,5000);
 return {dbRoot,serviceRoot,config,f,initial,pin,receiptId,receiptPin,commitArgs,claimArgs,observe,inspect,plan,advance,apply,reconcile,signer,read,make,request,exchange,signatures:()=>signatures,proofReads:()=>proofReads,setFenced:(v:boolean)=>{fenced=v;},setProofPatch:(v:Record<string,unknown>)=>{proofPatch=v;},loseRecords:()=>records.clear(),
 dbSnapshot:()=>readFile(join(dbRoot,'history.sqlite')),dbRestore:(b:Buffer)=>writeFile(join(dbRoot,'history.sqlite'),b),close:()=>rm(base,{recursive:true,force:true})};
}
