import {createServer} from 'node:http';
import type {LocalConfig} from './config.ts';
import {createFoundationCoordinator} from './coordinator.ts';
export function createFoundationServer(config:LocalConfig){
 const coordinator=createFoundationCoordinator();
 return createServer((req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  const host=req.headers.host;
  if(host!==`127.0.0.1:${config.port}`&&host!==`localhost:${config.port}`){res.writeHead(403);res.end(JSON.stringify({error:'Request refused.'}));return;}
  if(req.method!=='GET'){res.setHeader('Allow','GET');res.writeHead(405);res.end(JSON.stringify({error:'Method unavailable.'}));return;}
  if(req.url==='/healthz'){res.writeHead(200);res.end(JSON.stringify({status:'ok',mode:config.mode,liveEnabled:false}));return;}
  if(req.url?.startsWith('/api/')){res.writeHead(401);res.end(JSON.stringify({error:'Sign-in integration is not connected. No customer session is available.',reason:coordinator.start().reason}));return;}
  res.writeHead(404);res.end(JSON.stringify({error:'Not found.'}));
 });
}
