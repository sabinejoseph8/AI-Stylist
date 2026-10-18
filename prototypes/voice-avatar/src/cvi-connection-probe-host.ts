import type {IncomingMessage,ServerResponse} from 'node:http';
import {randomBytes} from 'node:crypto';
import {validatePreview} from './preview-gate.ts';
import {PrivatePreviewAccess} from './private-preview-access.ts';
import {connectionProbeCallback} from './cvi-connection-probe-http.ts';
import type {ConnectionProbeSession} from './cvi-connection-probe-session.ts';
import {probeStopReason} from './cvi-probe-diagnostics.ts';
/** Dormant composition. Explicit attachment, current operator preflight and durable
 * admission are required; there is no provisioning or customer route here. */
export function connectionProbeHost(options:{preview:{origin:string;password:string};credential:string;session:ConnectionProbeSession;available:()=>Promise<boolean>;operatorPreflightValid:()=>boolean;asset:(path:string)=>Uint8Array|null;diagnostic?:(value:{reason:ReturnType<typeof probeStopReason>;state:string;callbackCount:number})=>void}){
 const target=validatePreview(options.preview),access=new PrivatePreviewAccess(options.preview);
 const callback=connectionProbeCallback({host:target.host,credential:options.credential,session:options.session});
 const ownerToken=randomBytes(32).toString('base64url');let started=false,closed=false;
 const send=(res:ServerResponse,status:number,value:unknown)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};
 return{
  close:async()=>{closed=true;access.dispose();await options.session.stop();},
  tick:()=>options.session.tick(),
  handle:async(req:IncomingMessage,res:ServerResponse)=>{
   res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
   res.setHeader('Permissions-Policy','camera=(), microphone=(self), display-capture=()');
   if(closed){send(res,503,{available:false});return;}
   if(req.url==='/api/connection-probe/v1/chat/completions'){await callback(req,res);return;}
   if(req.method==='GET'&&req.url==='/healthz'){send(res,200,{status:'ok'});return;}
   if(req.headers.host!==target.host||!req.url||req.url.includes('?')||req.url.includes('#')){send(res,403,{});return;}
   const auth=access.resolve(req.headers.authorization,req.headers.cookie);
   if(auth.status!==200){res.setHeader('WWW-Authenticate','Basic realm="AI Stylist private probe"');send(res,auth.status,{});return;}
   if(req.method==='GET'&&(req.url==='/connection-probe.html'||/^\/assets\/[A-Za-z0-9_.-]+\.(?:js|css)$/.test(req.url))){
    const asset=options.asset(req.url);if(!asset){send(res,404,{});return;}
    const cookie=access.issue(req.headers.authorization);if(cookie)res.setHeader('Set-Cookie',cookie);
    res.setHeader('Content-Type',req.url.endsWith('.html')?'text/html; charset=utf-8':req.url.endsWith('.js')?'text/javascript; charset=utf-8':'text/css; charset=utf-8');
    res.statusCode=200;res.end(asset);return;
   }
   if(req.method==='GET'&&req.url==='/api/connection-probe/status'){
    const available=!started&&options.operatorPreflightValid()&&await options.available();
    send(res,200,{available,state:options.session.snapshot().state});return;
   }
   if(req.method!=='POST'||req.headers.origin!==target.origin||req.headers['content-encoding']||req.headers['content-type']!=='application/json'||req.headers['content-length']!=='2') {send(res,403,{});return;}
   // Commands contain exactly {}. No user-controlled IDs, prompts or configuration.
   let body='';for await(const chunk of req){body+=chunk.toString();if(body.length>2)break;}
   if(body!=='{}'){send(res,400,{});return;}
   if(req.url==='/api/connection-probe/start'){
    if(started||!options.operatorPreflightValid()){send(res,409,{});return;}
    // Claim locally before awaiting the independent, durable one-start CAS.
    started=true;
    try{if(!await options.available())throw Error();const join=await options.session.start(true);send(res,200,{...join,ownerToken});}
    catch{send(res,409,{state:options.session.snapshot().state});}return;
   }
   if(!started||req.headers['x-probe-owner']!==ownerToken){send(res,403,{});return;}
   if(req.url==='/api/connection-probe/heartbeat'){send(res,options.session.heartbeat()?200:409,options.session.snapshot());return;}
   if(req.url==='/api/connection-probe/end'){await options.session.stop();const snapshot=options.session.snapshot();try{options.diagnostic?.({reason:probeStopReason(req.headers['x-probe-stop-reason']),state:snapshot.state,callbackCount:snapshot.callbackCount});}catch{/* diagnostics never interfere with cleanup */}send(res,200,snapshot);return;}
   send(res,404,{});
  },
 };
}
