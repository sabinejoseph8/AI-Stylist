/** Actual supervised disposable IPC, not a configured production gate port. */
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {witnessServiceDigest} from '../../src/server/local-cvi-witness-service.ts';
import {gateFinishScope} from '../../src/server/local-cvi-gate-finish-proof.ts';
import type {GateFinishBinding,GateFinishProofPack,GateTransitionMarker,GateFinishPrepared} from '../../src/server/local-cvi-gate-finish-proof.ts';
export async function finishProcess(root:string,binding:GateFinishBinding,clock:()=>number,options:Readonly<{deadlineMs?:number;loseReply?:boolean}>={}){
 const original=structuredClone(binding),started=clock(),deadline=options.deadlineMs??8000;
 if(!Number.isSafeInteger(deadline)||deadline<1||deadline>8000||!Number.isSafeInteger(started)||started<original.marker.issuedAt||started>=original.marker.expiresAt)throw Error('Fixture gate deadline unavailable');
 const child=spawn('python3',[fileURLToPath(new URL('./cvi-transition-finish-store.py',import.meta.url))],{stdio:['pipe','pipe','pipe']});
 let raw='',ready:undefined|{marker:GateTransitionMarker;prepared:GateFinishPrepared},answer:any,held=false,requested=false,closed=false,last=started;
 let readyResolve!:(r:NonNullable<typeof ready>)=>void,readyReject!:(e:Error)=>void,finishResolve!:(r:any)=>void,finishReject!:(e:Error)=>void,exitResolve!:()=>void;
 const beginning=new Promise<NonNullable<typeof ready>>((r,j)=>{readyResolve=r;readyReject=j;}),ending=new Promise<any>((r,j)=>{finishResolve=r;finishReject=j;}),exit=new Promise<void>(r=>exitResolve=r);void ending.catch(()=>{});
 const hold=()=>{if(held)return;held=true;readyReject(Error('Fixture gate held'));finishReject(Error('Fixture gate held'));child.kill('SIGKILL');};
 const timer=setTimeout(hold,Math.min(deadline,original.marker.expiresAt-started));
 child.stdout.on('data',d=>{raw+=d.toString();if(raw.length>1048576)return hold();let at:number;while((at=raw.indexOf('\n'))>=0){const line=raw.slice(0,at);raw=raw.slice(at+1);let m:any;try{m=JSON.parse(line);}catch{return hold();}
  if(m.stage==='ready'&&Object.keys(m).sort().join(',')==='marker,prepared,stage'&&!ready&&!requested){ready={marker:m.marker,prepared:m.prepared};readyResolve(structuredClone(ready));}
  else if(m.stage==='finished'&&Object.keys(m).sort().join(',')==='result,stage'&&ready&&requested&&!answer){answer=m.result;}
  else return hold();
 }});
 child.stderr.resume();child.stdin.on('error',hold);child.on('error',hold);child.on('close',code=>{
  closed=true;clearTimeout(timer);
  if(held||code!==0||!ready||!requested||!answer||Object.keys(answer).sort().join(',')!=='operationId,scopeDigest,status,targetDigest'||answer.status!=='transition-finished'||answer.operationId!==original.plan.id||answer.scopeDigest!==witnessServiceDigest(gateFinishScope(original.marker))||answer.targetDigest!==original.marker.targetNativeDigest)hold();else finishResolve(structuredClone(answer));exitResolve();
 });
 child.stdin.write(JSON.stringify({root,scope:gateFinishScope(original.marker),intent:original.plan,context:{pin:original.pin,writerPrincipal:original.writerPrincipal,owner:original.owner,commit:original.commit},now:started,node:process.execPath,verifier:fileURLToPath(new URL('./cvi-transition-finish-verifier.ts',import.meta.url)),testMode:options.loseReply?'lose-reply':undefined})+'\n');
 try{
  const descriptor=await beginning;
  return {...descriptor,async finish(pack:GateFinishProofPack){const at=clock();if(held||closed||requested||!Number.isSafeInteger(at)||at<last||at>=original.marker.expiresAt){hold();throw Error('Fixture gate finish unavailable');}last=at;requested=true;child.stdin.end(JSON.stringify({command:'finish',pack:structuredClone(pack)})+'\n');return ending;},close:async()=>{hold();await exit;},isHeld:()=>held};
 }catch(e){hold();await exit;throw e;}
}
