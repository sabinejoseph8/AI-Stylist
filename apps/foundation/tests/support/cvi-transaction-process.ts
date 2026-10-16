/** Test-only fresh process fixture. No real DB URL, key, account or provider. */
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createLocalCviTransactionAdapter} from '../../src/server/local-cvi-transaction.ts';
import type {DomainActor,DomainCommand} from '../../src/server/local-cvi-domain-history.ts';
export function transactionCall(root:string,mode:string,actor:DomainActor,args:Record<string,unknown>={},now=1000):Promise<unknown>{return new Promise((resolve,reject)=>{
 const c=spawn('python3',[fileURLToPath(new URL('./cvi-transaction-store.py',import.meta.url))],{stdio:['pipe','pipe','pipe']});let out='';const timer=setTimeout(()=>{c.kill('SIGKILL');reject(Error('Fixture timeout'));},6000);
 c.stdout.on('data',d=>out+=d.toString());c.stderr.resume();c.on('error',()=>{clearTimeout(timer);reject(Error('Fixture unavailable'));});c.on('close',code=>{clearTimeout(timer);try{if(code!==0)throw Error();resolve(JSON.parse(out));}catch{reject(Error('Fixture unavailable'));}});c.stdin.on('error',()=>{});c.stdin.end(JSON.stringify({root,mode,config:{actor,now,node:process.execPath,validator:fileURLToPath(new URL('./cvi-transaction-validator.ts',import.meta.url))},...args}));
});}
export function transactionPort(root:string,actor:DomainActor,options:{now?:number;crashAt?:string}={}){
 const captured=Object.freeze({...actor});return {
  project:async()=>transactionCall(root,'project',captured,{},options.now??1000),
  commit:async(request:unknown)=>transactionCall(root,'commit',captured,{request,crashAt:options.crashAt},options.now??1000),
 };
}
if(process.argv[2]==='transaction-probe'){
 let raw='';for await(const c of process.stdin)raw+=c;const x=JSON.parse(raw),adapter=createLocalCviTransactionAdapter(x.actor,x.policyDigest,transactionPort(x.root,x.actor,x.options),x.minimumEpoch??0,()=>x.options?.now??1000,5000);
 const projection=await adapter.project();const applied=projection?await adapter.commit(projection,x.command as DomainCommand):null;
 console.log(JSON.stringify({projected:projection!==null,committed:applied!==null,held:adapter.isHeld(),epoch:applied?.epoch??null}));
}
