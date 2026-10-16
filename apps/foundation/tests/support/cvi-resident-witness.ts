/** Persistent local IPC transport only. No proof/state cache or retry fallback. */
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export function residentWitnessTransport(){
 const child=spawn('python3',[fileURLToPath(new URL('./cvi-resident-witness-store.py',import.meta.url))],{stdio:['pipe','pipe','pipe']});
 let sequence=0,buffer='',dead=false,closing=false,calls=0;const pending=new Map<number,{resolve(v:unknown):void;reject(e:Error):void;timer:ReturnType<typeof setTimeout>}>();
 let exited!:()=>void;const exit=new Promise<void>(r=>exited=r);
 const hold=()=>{if(dead)return;dead=true;for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('Resident witness held'));}pending.clear();child.kill('SIGKILL');};
 child.stdout.on('data',bytes=>{buffer+=bytes.toString();if(buffer.length>4194304)return hold();let at:number;
  while((at=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,at);buffer=buffer.slice(at+1);let frame:any;try{frame=JSON.parse(line);}catch{return hold();}
   const request=pending.get(frame.id);if(!request||typeof frame.ok!=='boolean'||Object.keys(frame).sort().join(',')!==(frame.ok?'id,ok,result':'id,ok'))return hold();
   pending.delete(frame.id);clearTimeout(request.timer);if(frame.ok)request.resolve(frame.result);else request.reject(Error('Resident witness refused'));
  }
 });
 child.stderr.resume();child.stdin.on('error',hold);child.on('error',()=>{hold();exited();});child.on('close',()=>{hold();exited();});
 const call=(raw:Record<string,unknown>)=>new Promise<any>((resolve,reject)=>{
  if(dead||closing||sequence>=Number.MAX_SAFE_INTEGER){reject(Error('Resident witness unavailable'));return;}
  const id=++sequence,input=structuredClone(raw),frame=JSON.stringify({id,input})+'\n';if(Buffer.byteLength(frame)>4194304){reject(Error('Resident witness input unavailable'));return;}
  const timer=setTimeout(hold,6000);pending.set(id,{resolve,reject,timer});calls++;child.stdin.write(frame);
 });
 return {call,stats:()=>Object.freeze({calls,processStarts:1}),terminate:async()=>{hold();await exit;},close:async()=>{if(closing){await exit;return;}closing=true;if(pending.size)hold();else child.stdin.end();await exit;}};
}
