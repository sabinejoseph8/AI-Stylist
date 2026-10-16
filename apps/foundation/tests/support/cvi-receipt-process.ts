/** Test-only bridge; no credentials, hosts or durable application data. */
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import type {DomainActor} from '../../src/server/local-cvi-domain-history.ts';
export function receiptCall(root:string,mode:string,actor:DomainActor,args:Record<string,unknown>={},now=1000):Promise<any>{return new Promise((resolve,reject)=>{
 const c=spawn('python3',[fileURLToPath(new URL('./cvi-receipt-store.py',import.meta.url))],{stdio:['pipe','pipe','pipe']});let out='';const timer=setTimeout(()=>{c.kill('SIGKILL');reject(Error('Fixture timeout'));},6000);
 c.stdout.on('data',d=>out+=d.toString());c.stderr.resume();c.on('error',()=>{clearTimeout(timer);reject(Error('Fixture unavailable'));});c.on('close',code=>{clearTimeout(timer);try{if(code!==0)throw Error();resolve(JSON.parse(out));}catch{reject(Error('Fixture unavailable'));}});c.stdin.on('error',()=>{});c.stdin.end(JSON.stringify({root,mode,config:{actor,now,node:process.execPath,validator:fileURLToPath(new URL('./cvi-transaction-validator.ts',import.meta.url))},...args}));
});}
