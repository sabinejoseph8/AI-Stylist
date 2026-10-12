import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
export interface RefreshScope {readonly ownerId:string;readonly sessionId:string;readonly generation:number;readonly expiresAt:number}
export interface RefreshEnvelope {readonly version:1;readonly keyId:string;readonly nonce:string;readonly ciphertext:string;readonly tag:string}
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
/** Server-only codec. No key creation, persistence, provider transport or automatic rotation is installed. */
export function createRefreshEnvelopes(keyring:ReadonlyMap<string,Uint8Array>,activeKeyId:string){
 const keys=new Map<string,Buffer>();
 if(keyring.size<1||keyring.size>4)throw Error('Refresh storage unavailable');
 for(const [id,key] of keyring){if(!/^[A-Za-z0-9_-]{1,64}$/.test(id)||!(key instanceof Uint8Array)||key.byteLength!==32)throw Error('Refresh storage unavailable');keys.set(id,Buffer.from(key));}
 if(!keys.has(activeKeyId))throw Error('Refresh storage unavailable');
 function aad(scope:RefreshScope,keyId:string){
  if(!scope||typeof scope.ownerId!=='string'||typeof scope.sessionId!=='string'||!uuid.test(scope.ownerId)||!uuid.test(scope.sessionId)||!Number.isSafeInteger(scope.generation)||scope.generation<1||!Number.isSafeInteger(scope.expiresAt)||scope.expiresAt<=Date.now())throw Error();
  return Buffer.from(JSON.stringify(['ai-stylist-refresh',1,keyId,scope.ownerId,scope.sessionId,scope.generation,scope.expiresAt]));
 }
 function bytes(value:unknown,max:number,exact?:number){
  if(typeof value!=='string'||value.length>max||!value||!/^[A-Za-z0-9_-]+$/.test(value))throw Error();
  const data=Buffer.from(value,'base64url');if(data.toString('base64url')!==value||(exact!==undefined&&data.length!==exact))throw Error();return data;
 }
 return Object.freeze({
  seal(value:string,scope:RefreshScope):RefreshEnvelope{
   try{
    if(typeof value!=='string'||value.length<1||value.length>8192)throw Error();
    const plain=Buffer.from(value,'utf8');if(plain.length>8192||new TextDecoder('utf-8',{fatal:true}).decode(plain)!==value)throw Error();
    const nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',keys.get(activeKeyId)!,nonce);cipher.setAAD(aad(scope,activeKeyId));
    const ciphertext=Buffer.concat([cipher.update(plain),cipher.final()]);
    return Object.freeze({version:1,keyId:activeKeyId,nonce:nonce.toString('base64url'),ciphertext:ciphertext.toString('base64url'),tag:cipher.getAuthTag().toString('base64url')});
   }catch{throw Error('Refresh storage unavailable');}
  },
  open(value:unknown,scope:RefreshScope):string|null{
   try{
    if(!value||typeof value!=='object'||Array.isArray(value))return null;
    const x=value as Record<string,unknown>;
    if(Object.keys(x).sort().join(',')!=='ciphertext,keyId,nonce,tag,version'||x.version!==1||typeof x.keyId!=='string'||!keys.has(x.keyId))return null;
    const nonce=bytes(x.nonce,16,12),tag=bytes(x.tag,22,16),ciphertext=bytes(x.ciphertext,10923);
    if(ciphertext.length>8192)throw Error();
    const cipher=createDecipheriv('aes-256-gcm',keys.get(x.keyId)!,nonce);cipher.setAAD(aad(scope,x.keyId));cipher.setAuthTag(tag);
    return new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat([cipher.update(ciphertext),cipher.final()]));
   }catch{return null;}
  },
 });
}
