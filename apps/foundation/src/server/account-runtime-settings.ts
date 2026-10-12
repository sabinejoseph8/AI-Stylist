import {isAbsolute} from 'node:path';
/** Explicit server-only parsing. No environment reads, logging, credential generation or activation. */
export function readAccountRuntimeSettings(env:Readonly<Record<string,string|undefined>>){
 try{
  const origin=new URL(env.ACCOUNT_APP_ORIGIN??''),project=new URL(env.SUPABASE_URL??'');
  if(origin.protocol!=='https:'||origin.origin!==env.ACCOUNT_APP_ORIGIN||origin.username||origin.password||project.protocol!=='https:'||project.origin!==env.SUPABASE_URL||project.port||!/^[-a-z0-9]+\.supabase\.co$/.test(project.hostname))throw Error();
  const serviceKey=env.SUPABASE_SECRET_KEY;
  if(typeof serviceKey!=='string'||serviceKey.length<20||serviceKey.length>8192||/[\s\u0000-\u001f\u007f]/.test(serviceKey))throw Error();
  const activeKeyId=env.ACCOUNT_REFRESH_ACTIVE_KEY_ID,encoded=env.ACCOUNT_REFRESH_KEYS;
  if(typeof activeKeyId!=='string'||!/^[-A-Za-z0-9_]{1,64}$/.test(activeKeyId)||typeof encoded!=='string'||encoded.length>1024)throw Error();
  const parsed:unknown=JSON.parse(encoded);
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error();
  const entries=Object.entries(parsed);if(entries.length<1||entries.length>4)throw Error();
  const fields=[...encoded.matchAll(/"([-A-Za-z0-9_]{1,64})"\s*:\s*"([-A-Za-z0-9_]{43})"/g)];
  if(fields.length!==entries.length||new Set(fields.map(field=>field[1])).size!==entries.length)throw Error();
  const keyring=new Map<string,Uint8Array>();
  for(const [id,value] of entries){if(!/^[-A-Za-z0-9_]{1,64}$/.test(id)||typeof value!=='string'||!/^[-A-Za-z0-9_]{43}$/.test(value))throw Error();const bytes=Buffer.from(value,'base64url');if(bytes.length!==32||bytes.toString('base64url')!==value)throw Error();keyring.set(id,bytes);}
  if(!keyring.has(activeKeyId))throw Error();
  const portText=env.PORT,host=env.HOST??'127.0.0.1',directory=env.ACCOUNT_BUILD_DIRECTORY;
  if(typeof portText!=='string'||!/^\d{1,5}$/.test(portText)||Number(portText)<1||Number(portText)>65535||!['127.0.0.1','::1','0.0.0.0'].includes(host)||typeof directory!=='string'||!isAbsolute(directory)||directory.includes('\0'))throw Error();
  return Object.freeze({appOrigin:origin.origin,projectUrl:project.origin,serviceKey,refreshKeyring:keyring as ReadonlyMap<string,Uint8Array>,activeRefreshKeyId:activeKeyId,port:Number(portText),bindHost:host as '127.0.0.1'|'::1'|'0.0.0.0',buildDirectory:directory});
 }catch{throw Error('Account runtime settings unavailable');}
}
