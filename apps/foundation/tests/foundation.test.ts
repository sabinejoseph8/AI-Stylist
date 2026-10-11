import {describe,it,expect} from 'vitest';
import {once} from 'node:events';
import {request} from 'node:http';
import {readConfig} from '../src/server/config.ts';
import {createFoundationServer} from '../src/server/http.ts';
import {FIELDS} from '../../../packages/style-contracts/src/index.ts';
import {FIELDS as prototypeFields} from '../../../prototypes/voice-avatar/src/notebook-state.ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {App} from '../src/web/app.tsx';
import {createFoundationCoordinator} from '../src/server/coordinator.ts';
describe('foundation configuration',()=>{
 it('defaults to loopback development with providers disabled',()=>{expect(readConfig({})).toEqual({mode:'development',host:'127.0.0.1',port:4323,liveEnabled:false});expect(Object.isFrozen(readConfig({}))).toBe(true);});
 it('supports a separate explicit test environment',()=>expect(readConfig({APP_MODE:'test',PORT:'4324'})).toMatchObject({mode:'test',port:4324}));
 it.each([{APP_MODE:'production'},{NODE_ENV:'production'},{APP_MODE:'preview'},{HOST:'0.0.0.0'},{HOST:'example.com'},{PORT:'0'},{PORT:'65536'},{PORT:'1.5'},{PORT:'-1'},{PORT:'4323x'}])('refuses invalid or premature production configuration %j',env=>expect(()=>readConfig(env)).toThrow());
 it('does not copy private environment values into public configuration',()=>{expect(JSON.stringify(readConfig({OPENAI_API_KEY:'fixture-secret',SUPABASE_SECRET_KEY:'fixture-private'}))).not.toContain('fixture');});
});
describe('local foundation HTTP boundary',()=>{
 it('serves health, refuses unknown hosts, methods and customer session access',async()=>{
  const server=createFoundationServer(readConfig({APP_MODE:'test'}));server.listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();if(!address||typeof address==='string')throw Error('Fixture server unavailable');
  const base=`http://127.0.0.1:${address.port}`;
  // Node fetch controls Host itself; use HTTP requests to exercise explicit Host rejection.
  const fetch=(url:string,options:{headers:Record<string,string>;method?:string})=>new Promise<{status:number;json:()=>unknown;headers:{get:(name:string)=>string|null}}>((resolve,reject)=>{
   const req=request(url,options,res=>{let body='';res.setEncoding('utf8');res.on('data',chunk=>{body+=chunk;});res.on('end',()=>resolve({status:res.statusCode!,json:()=>JSON.parse(body),headers:{get:name=>{const value=res.headers[name];return typeof value==='string'?value:null;}}}));});req.on('error',reject);req.end();
  });
  try{
   const health=await fetch(base+'/healthz',{headers:{Host:'127.0.0.1:4323'}});expect(health.status).toBe(200);expect(await health.json()).toEqual({status:'ok',mode:'test',liveEnabled:false});expect(health.headers.get('cache-control')).toBe('no-store');
   expect((await fetch(base+'/healthz',{headers:{Host:'untrusted.invalid'}})).status).toBe(403);
   const denied=await fetch(base+'/api/session',{headers:{Host:'localhost:4323'}});expect(denied.status).toBe(401);
   const post=await fetch(base+'/healthz',{method:'POST',headers:{Host:'localhost:4323'}});expect(post.status).toBe(405);expect(post.headers.get('allow')).toBe('GET');
   expect((await fetch(base+'/unknown',{headers:{Host:'localhost:4323'}})).status).toBe(404);
  }finally{await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
 });
});
describe('approved foundation shell',()=>{
 it('shares the exact seven note fields with the existing prototype',()=>{expect(FIELDS).toBe(prototypeFields);expect(FIELDS.map(([id])=>id)).toEqual(['occasion','season','color','style','budget','lookType','wardrobe']);});
 it('renders four destinations, a collapsed notebook and explicit limitations',()=>{const html=renderToStaticMarkup(createElement(App));for(const text of ['Stylist','Wardrobe','Saved looks','Profile','My Styling Notes','Local development preview'])expect(html).toContain(text);expect(html).toContain('<details>');expect(html).not.toContain('<details open');expect(html.match(/Not specified/g)).toHaveLength(7);expect(html).toContain('Accounts, avatar and microphone are not connected');expect(html).toContain('disabled');});
});

describe('foundation coordinator port',()=>{
 it('never claims a customer session exists before identity integration',()=>{const coordinator=createFoundationCoordinator();expect(coordinator.available).toBe(false);expect(coordinator.start()).toEqual({started:false,reason:'accounts-not-connected'});expect(Object.isFrozen(coordinator)).toBe(true);});
});
