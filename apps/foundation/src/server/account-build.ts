import {open,lstat,readdir} from 'node:fs/promises';
import {constants} from 'node:fs';
import {isAbsolute,join} from 'node:path';
/** Reads a trusted deployment-owned build only. No request path reaches the filesystem. */
export async function loadAccountBuild(directory:string){
 if(typeof directory!=='string'||!isAbsolute(directory))throw Error('Account build unavailable');
 const root=await lstat(directory),assetDirectory=join(directory,'assets');
 if(!root.isDirectory()||root.isSymbolicLink())throw Error('Account build unavailable');
 const folder=await lstat(assetDirectory);if(!folder.isDirectory()||folder.isSymbolicLink())throw Error('Account build unavailable');
 const names=await readdir(assetDirectory);
 if(names.length<1||names.length>32||names.some(name=>!/^[-A-Za-z0-9_]+\.(js|css)$/.test(name)))throw Error('Account asset unavailable');
 async function read(path:string,limit:number){
  const handle=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
  try{
   const stat=await handle.stat();if(!stat.isFile()||stat.size<1||stat.size>limit)throw Error('Account build limit');
   const bytes=Buffer.alloc(Math.min(stat.size+1,limit+1));let offset=0;
   while(offset<bytes.length){const result=await handle.read(bytes,offset,bytes.length-offset,null);if(result.bytesRead===0)break;offset+=result.bytesRead;}
   // Refuse a changed file rather than serving a mixed or unbounded deployment.
   const after=await handle.stat();if(offset!==stat.size||after.size!==stat.size||after.mtimeMs!==stat.mtimeMs||after.ctimeMs!==stat.ctimeMs)throw Error('Account build changed');
   return bytes.subarray(0,offset);
  }finally{await handle.close();}
 }
 const htmlBytes=await read(join(directory,'account.html'),65536);
 const html=new TextDecoder('utf-8',{fatal:true}).decode(htmlBytes);
 const assets=new Map<string,Uint8Array>();let remaining=5*1024*1024-htmlBytes.length;
 for(const name of names.sort()){const bytes=await read(join(assetDirectory,name),remaining);remaining-=bytes.length;assets.set('/assets/'+name,bytes);}
 return Object.freeze({html,assets:assets as ReadonlyMap<string,Uint8Array>});
}
