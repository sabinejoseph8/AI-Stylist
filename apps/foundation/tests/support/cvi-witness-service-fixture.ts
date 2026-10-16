/** Durable journal and ephemeral keys; proof issuers are explicit simulations. */
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {generateKeyPairSync,sign} from 'node:crypto';
import {createLocalCviWitnessService,witnessServiceDigest} from '../../src/server/local-cvi-witness-service.ts';
import type {WitnessPrincipal,WitnessMetadata,WitnessServiceRequest,WitnessServiceSources} from '../../src/server/local-cvi-witness-service.ts';
import {historyCanonical} from '../../src/server/local-cvi-history-authority.ts';
import {D} from './cvi-domain-history-fixture.ts';
export const fixtureKey=()=>{const k=generateKeyPairSync('ed25519');return {...k,pem:k.publicKey.export({type:'spki',format:'pem'}).toString(),sign:(body:string)=>sign(null,Buffer.from(body),k.privateKey).toString('hex')};};
export function serviceCall(input:Record<string,unknown>):Promise<any>{return new Promise((resolve,reject)=>{const c=spawn('python3',[fileURLToPath(new URL('./cvi-witness-service-store.py',import.meta.url))],{stdio:['pipe','pipe','pipe']});let out='';const timer=setTimeout(()=>{c.kill('SIGKILL');reject(Error('Fixture timeout'));},6000);c.stdout.on('data',d=>out+=d.toString());c.stderr.resume();c.on('error',()=>{clearTimeout(timer);reject(Error('Fixture unavailable'));});c.on('close',code=>{clearTimeout(timer);try{if(code!==0)throw Error();resolve(JSON.parse(out));}catch{reject(Error('Fixture unavailable'));}});c.stdin.on('error',()=>{});c.stdin.end(JSON.stringify(input));});}
export async function witnessServiceFixture(){
 const root=await mkdtemp(join(tmpdir(),'stylist-witness-service-')),authority=fixtureKey(),database=fixtureKey(),fence=fixtureKey(),keys={observer:fixtureKey(),writer:fixtureKey(),signer:fixtureKey(),reconciler:fixtureKey()};
 const pin={authorityId:'fixture-authority-service',witnessId:'11111111-1111-4111-8111-111111111111',storeId:'22222222-2222-4222-8222-222222222222',policyDigest:D(1),keyId:'fixture-key-authority',publicKeyPem:authority.pem};
 const storePin={authorityId:pin.authorityId,witnessId:pin.witnessId,storeId:pin.storeId,policyDigest:pin.policyDigest};
 const initial:WitnessMetadata={storeId:pin.storeId,policyDigest:pin.policyDigest,epochFloor:0,headFloor:D(2),observedClock:1000,historyDigest:D(3)},target={...initial,epochFloor:1,headFloor:D(4),historyDigest:D(5)};
 const grants=Object.entries(keys).map(([role,key],i)=>({role,principalDigest:D(10+i),keyId:'fixture-key-'+role,publicKeyPem:key.pem})) as WitnessPrincipal[];
 await serviceCall({root,mode:'prepare',pin:storePin,current:initial,now:1000});let n=900,now=1000,crashAt:string|undefined,crashMode:string|undefined;
 const invoke=(actor:WitnessPrincipal,mode:string,args:Record<string,unknown>)=>serviceCall({root,mode,pin:storePin,actor:{principalDigest:actor.principalDigest,role:actor.role},args,now,crashAt:!crashMode||crashMode===mode?crashAt:undefined});
 const store={admit:(a:WitnessPrincipal,r:WitnessServiceRequest,id:string)=>invoke(a,'admit',{id,challenge:r.challenge,action:r.action,operationId:r.operationId,expectedRevision:r.expectedRevision,issuedAt:r.issuedAt,expiresAt:r.expiresAt}),inspect:(a:WitnessPrincipal)=>invoke(a,'inspect',{}),apply:(a:WitnessPrincipal,action:string,args:Record<string,unknown>)=>invoke(a,action,args)};
 const proofPins={database:{keyId:'fixture-key-database',publicKeyPem:database.pem},fence:{keyId:'fixture-key-fence',publicKeyPem:fence.pem}};
 const sourceProof=(kind:'database'|'fence',binding:any,patch:Record<string,unknown>={})=>{const body={version:1,kind,state:kind==='database'?'target-committed':'writers-fenced',keyId:proofPins[kind].keyId,...binding,issuedAt:now,expiresAt:now+1000,...patch};return {body,signature:(kind==='database'?database:fence).sign(historyCanonical(body))};};
 let sources:WitnessServiceSources={transition:async(_a,_o,current)=>({from:current,to:target}),database:async b=>sourceProof('database',b),fence:async b=>sourceProof('fence',b)};
 const sourceProxy:WitnessServiceSources={transition:(...a)=>sources.transition(...a),database:(...a)=>sources.database(...a),fence:(...a)=>sources.fence(...a)};
 const make=()=>createLocalCviWitnessService(pin,grants,store,sourceProxy,proofPins,authority.sign,()=>now,5000);
 const envelope=(role:WitnessPrincipal['role']='writer',action:WitnessServiceRequest['action']='advance',operationId=D(100),expectedRevision=0,patch:Record<string,unknown>={})=>{const actor=grants.find(a=>a.role===role)!,request={version:1 as const,authorityId:pin.authorityId,witnessId:pin.witnessId,storeId:pin.storeId,policyDigest:pin.policyDigest,principalDigest:actor.principalDigest,keyId:actor.keyId,action,operationId,expectedRevision,challenge:D(n++),issuedAt:now,expiresAt:now+2000,...patch} as WitnessServiceRequest;return {request,signature:keys[role].sign(historyCanonical(request))};};
 return {root,pin,storePin,initial,target,grants,store,keys,authority,proofPins,sourceProof,make,envelope,inspect:()=>store.inspect(grants[0]),setSources:(patch:Partial<WitnessServiceSources>)=>{sources={...sources,...patch};},setNow:(v:number)=>{now=v;},setCrash:(v:string|undefined,mode?:string)=>{crashAt=v;crashMode=mode;},close:()=>rm(root,{recursive:true,force:true})};
}
