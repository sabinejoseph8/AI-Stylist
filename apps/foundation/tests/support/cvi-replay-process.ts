/** Test-only process bridge. All tokens, clocks, prompts and stores are synthetic. */
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createLocalCviRestartEndpoint} from '../../src/server/local-cvi-endpoint.ts';
import type {CviReplayPort} from '../../src/server/local-cvi-endpoint.ts';
import {createLocalCviStyling} from '../../src/server/local-cvi-styling.ts';
export const fixtureBinding={origin:'https://cvi.example.test',conversation:'fixture-room',secret:'a'.repeat(64),expiresAt:10000};
export const fixtureDigest=createHash('sha256').update(JSON.stringify([fixtureBinding.origin,fixtureBinding.conversation,fixtureBinding.secret,fixtureBinding.expiresAt])).digest('hex');
export function call(root:string,mode:string,args:Record<string,unknown>={}):Promise<unknown>{
 return new Promise((resolve,reject)=>{const child=spawn('python3',[fileURLToPath(new URL('./cvi-replay-store.py',import.meta.url))],{stdio:['pipe','pipe','pipe']});let out='';
  const timer=setTimeout(()=>{child.kill('SIGKILL');reject(Error('Fixture timeout'));},3000);child.stdout.on('data',d=>out+=d.toString());child.stderr.resume();
  child.on('error',()=>{clearTimeout(timer);reject(Error('Fixture unavailable'));});child.on('close',code=>{clearTimeout(timer);try{if(code!==0)throw Error();resolve(JSON.parse(out));}catch{reject(Error('Fixture unavailable'));}});
  child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify({root,mode,...args}));
 });
}
export function port(root:string,storeId:string):CviReplayPort{return {storeId,inspect:async(request)=>call(root,'boundary',{request}),reserve:async(request)=>call(root,'reserve',{request}),consume:async(request)=>call(root,'consume',{request})};}
if(process.argv[2]==='probe'){
 let raw='';for await(const chunk of process.stdin)raw+=chunk;const x=JSON.parse(raw);let draftCalls=0;
 const flow=createLocalCviStyling({draft:async()=>{draftCalls++;return 'Synthetic checked jacket.';},check:async(text,s)=>({approved:true,text,revision:s.revision})},2000);
 const replay=port(x.root,x.storeId),originalReserve=replay.reserve.bind(replay),originalConsume=replay.consume.bind(replay);
 replay.reserve=async(r,s)=>{if(x.mode?.startsWith('reserve-write-'))return call(x.root,'reserve',{request:r,crashAt:x.mode.slice(14)});const a=await originalReserve(r,s);if(x.mode==='crash-reserved')process.exit(73);return a;};
 replay.consume=async(r,s)=>{if(x.mode?.startsWith('write-'))return call(x.root,'consume',{request:r,crashAt:x.mode.slice(6)});
  const a=await originalConsume(r,s);if(x.mode==='crash-spent')process.exit(74);return a;};
 const endpoint=createLocalCviRestartEndpoint(fixtureBinding,flow,replay,()=>1000,2500);
 const request=new Request(fixtureBinding.origin+'/v1/chat/completions',{method:'POST',headers:{authorization:`Bearer ${fixtureBinding.secret}`,'content-type':'application/json','x-cvi-conversation':fixtureBinding.conversation,'x-cvi-request-id':x.id??'fixture-one'},body:JSON.stringify({model:'local-simulation',stream:true,messages:[{role:'user',content:'Synthetic long sleeves'}]})});
 const response=await endpoint.handle(request);let released=false;try{released=(await response.text()).includes('Synthetic checked jacket.');}catch{}
 console.log(JSON.stringify({status:response.status,draftCalls,released}));
}
