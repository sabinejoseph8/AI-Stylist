import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {PreviewGate,validatePreview} from './preview-gate.ts';
import type {PreviewConfig} from './preview-gate.ts';
const NAME='__Host-stylist_notes_access';
/** Process-local, five-minute bridge from a Basic-authenticated HTML request to
 * the same-origin browser WebSocket. Never issued by health, metadata or socket
 * requests. No credential or authorization token enters JavaScript or a URL. */
export class PrivatePreviewAccess {
 private gate:PreviewGate;
 private basic:string;
 private binding:Buffer;
 private token:string|null=null;
 private expires=0;
 constructor(config:PreviewConfig){validatePreview(config);this.gate=new PreviewGate(config);this.basic='Basic '+Buffer.from('stylist:'+config.password).toString('base64');this.binding=createHash('sha256').update(config.origin+'\n'+config.password).digest();}
 matches(config:PreviewConfig){const digest=createHash('sha256').update(config.origin+'\n'+config.password).digest();return timingSafeEqual(this.binding,digest);}
 resolve(header:string|undefined,cookie:string|undefined):{status:200|401|429;authorization?:string}{
  if(header){const status=this.gate.check(header);return status===200?{status,authorization:this.basic}:{status};}
  if(this.token&&Date.now()<this.expires&&cookie&&cookie.length<=4096){
   const values=cookie.split(';').map(v=>v.trim()).filter(v=>v.startsWith(NAME+'='));
   if(values.length===1){const candidate=values[0]!.slice(NAME.length+1);if(/^[A-Za-z0-9_-]{43}$/.test(candidate)&&timingSafeEqual(Buffer.from(candidate),Buffer.from(this.token)))return{status:200,authorization:this.basic};}
  }
  return{status:this.gate.check(undefined)};
 }
 issue(header:string|undefined):string|null{
  if(!header||this.gate.check(header)!==200)return null;
  if(!this.token||Date.now()>=this.expires){this.token=randomBytes(32).toString('base64url');this.expires=Date.now()+300000;}
  const remaining=Math.max(1,Math.floor((this.expires-Date.now())/1000));
  return `${NAME}=${this.token}; Max-Age=${remaining}; HttpOnly; Secure; SameSite=Strict; Path=/`;
 }
 dispose(){this.token=null;this.expires=0;}
}
