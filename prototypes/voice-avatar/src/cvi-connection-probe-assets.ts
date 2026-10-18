import {lstat,open,readdir,realpath} from 'node:fs/promises';
import {constants} from 'node:fs';
import {isAbsolute,join,sep} from 'node:path';
/** Preload only the built private page and bounded public JS/CSS assets. No
 * per-request filesystem lookup, secret/config files or traversal fallback. */
export async function loadConnectionProbeAssets(directory:string){
 const unavailable=()=>Error('Connection probe build unavailable.');
 try{
  if(typeof directory!=='string'||!isAbsolute(directory))throw unavailable();
  const root=await realpath(directory),assetRoot=join(root,'assets'),assetStat=await lstat(assetRoot);if(!assetStat.isDirectory()||assetStat.isSymbolicLink())throw unavailable();
  const names=(await readdir(assetRoot)).filter(name=>/^[A-Za-z0-9_.-]+\.(?:js|css)$/.test(name));if(names.length>64)throw unavailable();
  const files=['/connection-probe.html',...names.map(name=>'/assets/'+name)],data=new Map<string,Uint8Array>();let total=0;
  for(const path of files){
   const file=join(root,path.slice(1)),stat=await lstat(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>4_000_000)throw unavailable();const physical=await realpath(file);if(!physical.startsWith(root+sep))throw unavailable();
   const handle=await open(physical,constants.O_RDONLY|constants.O_NOFOLLOW);const chunks:Uint8Array[]=[];let size=0;
   try{const opened=await handle.stat();if(!opened.isFile()||opened.size>4_000_000)throw unavailable();while(true){const chunk=new Uint8Array(65536);const {bytesRead}=await handle.read(chunk);if(bytesRead===0)break;size+=bytesRead;if(size>4_000_000||total+size>16_000_000)throw unavailable();chunks.push(chunk.slice(0,bytesRead));}}
   finally{await handle.close();}
   const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}total+=size;data.set(path,bytes);
  }
  return Object.freeze({getAsset:async(path:string,signal:AbortSignal)=>{if(signal.aborted)throw unavailable();return data.get(path)?.slice()??null;},paths:()=>[...data.keys()]});
 }catch{throw unavailable();}
}
