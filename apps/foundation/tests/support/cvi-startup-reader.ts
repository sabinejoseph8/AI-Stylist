/** Fresh verification process receives public pins only, never private keys. */
import {createInterface} from 'node:readline';
import {createLocalStartupCheckpointInspector} from '../../src/server/local-cvi-startup-checkpoint.ts';
const lines=createInterface({input:process.stdin,crlfDelay:Infinity}),it=lines[Symbol.asyncIterator]();
const receive=async()=>{const n=await it.next();if(n.done)throw Error();return JSON.parse(n.value);};
const send=(v:unknown)=>process.stdout.write(JSON.stringify(v)+'\n');
try{
 const input=await receive(),rpc=async(stage:string,nonce:string)=>{send({stage,nonce});return receive();};
 const inspector=createLocalStartupCheckpointInspector(input.pin,input.registry,{authority:n=>rpc('authority',n),database:n=>rpc('database',n)},()=>input.now);
 const result=await inspector.inspect(new AbortController().signal);send({stage:'result',result});
}catch{send({stage:'held'});process.exitCode=2;}finally{lines.close();}
