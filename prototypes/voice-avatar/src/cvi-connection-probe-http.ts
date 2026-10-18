import {createHash,timingSafeEqual} from 'node:crypto';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {connectionProbeSse} from './cvi-connection-probe-contract.ts';
import type {ConnectionProbeSession} from './cvi-connection-probe-session.ts';
const object=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const equal=(a:string,b:string)=>timingSafeEqual(createHash('sha256').update(a).digest(),createHash('sha256').update(b).digest());
export function validateConnectionProbeRequest(value:unknown){
 if(!object(value)||value.model!=='connection-probe-fixed-v1'||value.stream!==true||!Array.isArray(value.messages)||value.messages.length<1||value.messages.length>128)throw Error('Probe request shape unavailable.');
 // Parse only the shape. Never retain or echo messages or any extra request fields.
 for(const message of value.messages){if(!object(message)||!['system','user','assistant','developer'].includes(String(message.role))||!(typeof message.content==='string'||message.content===null||Array.isArray(message.content)))throw Error('Probe request shape unavailable.');}
 return Object.freeze({stream:true as const,messageCount:value.messages.length,hasTools:Array.isArray(value.tools)&&value.tools.length>0});
}
/** Dedicated provider ingress. Owner cookies/Basic auth never authenticate it.
 * No query tokens, forwarding-header trust, fetch, transcript storage or raw logs. */
export function connectionProbeCallback(options:{host:string;credential:string;session:ConnectionProbeSession}){
 if(!/^[a-z0-9-]+\.onrender\.com$/.test(options.host)||!/^[A-Za-z0-9_-]{43,128}$/.test(options.credential))throw Error('Probe endpoint configuration requires review.');
 const expected='Bearer '+options.credential;
 return async(req:IncomingMessage,res:ServerResponse)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  const reject=(status:number)=>{res.statusCode=status;res.end();};
  if(req.method!=='POST'||req.url!=='/api/connection-probe/v1/chat/completions'||req.headers.host!==options.host||req.headers.origin||req.headers.cookie||req.headers['content-encoding']||!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']??'')){reject(403);return;}
  const authorization=req.headers.authorization;
  if(typeof authorization!=='string'||authorization.length>256||!equal(authorization,expected)){reject(401);return;}
  if(!options.session.admitCallback()){reject(409);return;}
  let bytes=0;const chunks:Buffer[]=[];
  const timer=setTimeout(()=>req.destroy(),3000);
  try{
   for await(const chunk of req){const data=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);bytes+=data.length;if(bytes>32768){reject(413);req.destroy();return;}chunks.push(data);}
   const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));
   validateConnectionProbeRequest(value);
   // State can change while a request is arriving. Do not release after End.
   options.session.tick();
   if(options.session.snapshot().state!=='active'){reject(409);return;}
   res.statusCode=200;res.setHeader('Content-Type','text/event-stream');
   res.end(connectionProbeSse());
  }catch{if(!res.headersSent)reject(400);else res.destroy();}
  finally{clearTimeout(timer);chunks.length=0;}
 };
}
