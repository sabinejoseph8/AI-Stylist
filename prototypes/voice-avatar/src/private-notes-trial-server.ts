import {createServer} from 'node:http';
import {PreviewGate,validatePreview} from './preview-gate.ts';
import {attachPrivateNotesTrialNetwork} from './private-notes-trial-network.ts';
import {validatePrivateNotesTrialActivation} from './private-notes-trial-owner.ts';
import {validatePrivateNotesTrialLedger} from './private-notes-trial-contract.ts';
type NetworkOptions=Parameters<typeof attachPrivateNotesTrialNetwork>[1];
/** Dedicated explicit server factory. No environment, secrets, default network,
 * initializer or listen call. Normal prototype startup does not import this. */
export function createPrivateNotesTrialServer(options:NetworkOptions&{readLedger:(signal:AbortSignal)=>Promise<unknown>;getAsset:(path:string,signal:AbortSignal)=>Promise<Uint8Array|null>}){
 const activation=validatePrivateNotesTrialActivation(options.activation),address=validatePreview(options.preview),gate=new PreviewGate(options.preview);
 let disposed=false;
 const server=createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Strict-Transport-Security','max-age=31536000');res.setHeader('Permissions-Policy','microphone=(self), camera=(), geolocation=()');
  res.setHeader('Content-Security-Policy',`default-src 'none'; script-src 'self'; worker-src 'self'; style-src 'self'; connect-src 'self' wss://${address.host}; img-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`);
  const json=(status:number,value:unknown)=>{if(!res.destroyed){res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));}};
  if(req.url==='/healthz'&&req.method==='GET'){json(disposed?503:200,{ok:!disposed});return;}
  if(disposed){json(503,{error:'Private notes trial unavailable.'});return;}
  if(req.headers.host!==address.host){json(403,{error:'Private preview address required.'});return;}
  const access=gate.check(req.headers.authorization);if(access!==200){if(access===401)res.setHeader('WWW-Authenticate','Basic realm="AI Stylist private preview", charset="UTF-8"');json(access,{error:'Private preview access required.'});return;}
  if(req.method!=='GET'){json(405,{error:'Method unavailable.'});return;}
  if(req.url==='/api/private-notes-trial-availability'){
   if(req.headers.origin&&req.headers.origin!==address.origin||req.headers['sec-fetch-site']==='cross-site'){json(403,{error:'Private preview origin required.'});return;}
   const controller=new AbortController();let reject!:(reason:Error)=>void;
   const canceled=new Promise<never>((_r,j)=>reject=j);void canceled.catch(()=>{});
   const abort=()=>{controller.abort();reject(Error('Availability unavailable.'));};const timer=setTimeout(abort,5000);res.once('close',abort);
   let enabled=false;
   try{const ledger=validatePrivateNotesTrialLedger(await Promise.race([Promise.resolve().then(()=>options.readLedger(controller.signal)),canceled]));const state=network.snapshot();enabled=!disposed&&!state.closed&&state.networkAttached&&!controller.signal.aborted&&ledger.approval.id===activation.approvalId&&ledger.reservation===null&&!state.active&&!state.held&&state.connections===0;}
   catch{/* Availability is held; never expose the store response. */}
   finally{clearTimeout(timer);res.off('close',abort);controller.abort();}
   json(200,{version:1,enabled,noticeVersion:'notes-private-trial-v1'});return;
  }
  const path=req.url==='/'?'/notes-live.html':req.url;
  if(!path||!/^\/(?:notes-live\.html|assets\/[A-Za-z0-9_.-]+\.(?:js|css))$/.test(path)){json(404,{error:'Page unavailable.'});return;}
  const controller=new AbortController();let reject!:(reason:Error)=>void;const canceled=new Promise<never>((_r,j)=>reject=j);void canceled.catch(()=>{});
  const abort=()=>{controller.abort();reject(Error('Asset unavailable.'));};const timer=setTimeout(abort,5000);res.once('close',abort);
  try{const bytes=await Promise.race([Promise.resolve().then(()=>options.getAsset(path,controller.signal)),canceled]);if(disposed||controller.signal.aborted||!(bytes instanceof Uint8Array)||bytes.byteLength>4_000_000)throw Error();const type=path.endsWith('.html')?'text/html; charset=utf-8':path.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8';if(!res.destroyed){res.writeHead(200,{'Content-Type':type});res.end(bytes);}}
  catch{json(404,{error:'Page unavailable.'});}
  finally{clearTimeout(timer);res.off('close',abort);controller.abort();}
 });
 const network=attachPrivateNotesTrialNetwork(server,{...options,activation});
 const dispose=()=>{if(disposed)return;disposed=true;network.dispose();};server.once('close',dispose);
 return{server,dispose,snapshot:()=>({disposed,network:network.snapshot()})};
}
