/** Disposable process bridge. Trusted test config is separate from request data. */
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {cviCredentialDigests} from '../../src/server/local-cvi-credentials.ts';
import type {AuthorityEvidence} from '../../src/server/local-cvi-mandatory-persistence.ts';
export function ownerReplayRequest(f:any,now=1000){return {storeId:f.journal.storeId,bindingDigest:cviCredentialDigests(f.resources.binding).scopeDigest,requestDigest:'d'.repeat(64),now};}
export function ownerReplayCall(f:any,lease:any,mode:string,request:Record<string,unknown>,options:Readonly<{
 signal?:AbortSignal;times?:number[];crashAt?:string;config?:Record<string,unknown>;
 read?:(nonce:string,index:number)=>Promise<AuthorityEvidence>;
}>={}):Promise<any>{
 const reader=f.x.actors.find((a:any)=>a.role==='observer')!,port=f.x.authorityPort('rotator');
 const config={nativeRoot:f.x.root,lease:structuredClone(lease),ownerDigest:f.ownerDigest,authorityPin:f.x.pin,readerPrincipal:reader.principalDigest,minimumRevision:4,replayStoreId:f.journal.storeId,bindingDigest:cviCredentialDigests(f.resources.binding).scopeDigest,node:process.execPath,verifier:fileURLToPath(new URL('./cvi-owner-replay-verifier.ts',import.meta.url)),...options.config};
 return new Promise((resolve,reject)=>{
  const p=spawn('python3',[fileURLToPath(new URL('./cvi-owner-replay-store.py',import.meta.url))],{stdio:['pipe','pipe','pipe']});let buffer='',answer:unknown,held=false,count=0;const inflight=new Set<Promise<unknown>>();
  const fail=()=>{held=true;p.kill('SIGKILL');},abort=()=>fail(),timer=setTimeout(fail,8000);
  options.signal?.addEventListener('abort',abort,{once:true});
  p.stdout.on('data',d=>{buffer+=d.toString();if(buffer.length>1048576)return fail();let at:number;while((at=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,at);buffer=buffer.slice(at+1);let m:any;try{m=JSON.parse(line);}catch{return fail();}
   if(m.stage==='held')fail();else if(m.stage==='result')answer=m.result;else if(m.stage==='owner-read'){
    const n=++count,work=Promise.resolve().then(()=>{if(held)throw Error('Canceled fixture read');return options.read?options.read(m.nonce,n):port.read(m.nonce);}).then(e=>{if(!held)p.stdin.write(JSON.stringify(e)+'\n');},fail);inflight.add(work);void work.finally(()=>inflight.delete(work));
   }else fail();
  }});
  p.stderr.resume();p.stdin.on('error',()=>{});p.on('error',()=>{clearTimeout(timer);options.signal?.removeEventListener('abort',abort);reject(Error('Owner replay fixture unavailable'));});
  p.on('close',async code=>{clearTimeout(timer);options.signal?.removeEventListener('abort',abort);await Promise.allSettled([...inflight]);if(held||code!==0||answer===undefined)reject(Error('Owner replay fixture held'));else resolve(answer);});
  if(options.signal?.aborted)fail();else p.stdin.write(JSON.stringify({root:f.replayRoot,mode,request,config,times:options.times,crashAt:options.crashAt})+'\n');
 });
}
