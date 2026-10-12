import {it,expect,vi} from 'vitest';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {randomBytes} from 'node:crypto';
import {createServer,request as requestHttp} from 'node:http';
import type {AddressInfo} from 'node:net';
import {createAccountSecurity} from '../src/server/account-security.ts';
import {createRefreshEnvelopes} from '../src/server/refresh-envelope.ts';
import {createRefreshStore} from '../src/server/refresh-store.ts';
import {createRefreshRotation} from '../src/server/refresh-rotation.ts';
import {createStoredRefreshPort} from '../src/server/refresh-port.ts';
import {createAccountRefresh} from '../src/server/account-refresh.ts';
import {createRefreshHttp} from '../src/server/refresh-http.ts';
import {createAccountNodeListener} from '../src/server/account-node.ts';
const origin='https://stylist.example',project='https://example.supabase.co',path='/api/account/refresh';
const owner='11111111-1111-4111-8111-111111111111',session='22222222-2222-4222-8222-222222222222',lease='33333333-3333-4333-8333-333333333333';
async function fixture(stall=false){
 const pair=await generateKeyPair('ES256'),token=await new SignJWT({session_id:session,role:'authenticated',is_anonymous:false}).setProtectedHeader({alg:'ES256',kid:'fixture'}).setSubject(owner).setIssuer(project+'/auth/v1').setAudience('authenticated').setIssuedAt().setExpirationTime('5m').sign(pair.privateKey);
 const security=createAccountSecurity({appOrigin:origin,projectUrl:project,fetch:async()=>new Response(JSON.stringify({keys:[{...await exportJWK(pair.publicKey),kid:'fixture'}]})),rpc:{call:async()=>true}});
 const codec=createRefreshEnvelopes(new Map([['fixture',randomBytes(32)]]),'fixture'),scope={ownerId:owner,sessionId:session,generation:1,expiresAt:Date.now()+60000};
 let row:Record<string,unknown>|null={owner_id:owner,session_id:session,generation:1,expires_at_ms:scope.expiresAt,envelope:codec.seal('old-fixture',scope),state:'ready',lease_id:null};
 let release!:()=>void,began!:()=>void;const started=new Promise<void>(r=>began=r),gate=new Promise<void>(r=>release=r);
 const call=vi.fn(async(name:string,p:Record<string,unknown>)=>{
  if(name==='stylist_inspect_refresh')return row;
  if(name==='stylist_claim_refresh'){if(!row||row.state!=='ready')return null;row={...row,state:'rotating',lease_id:lease};return row;}
  if(name==='stylist_finish_refresh'){began();if(stall)await gate;if(!row||row.lease_id!==p.p_lease)return false;row={...row,generation:2,state:'ready',lease_id:null,envelope:p.p_envelope};return true;}
  if(name==='stylist_remove_refresh'){if(!row||row.generation!==p.p_generation||row.lease_id!==p.p_lease)return false;row=null;return true;}
  throw Error('Unexpected fixture operation');
 });
 const store=createRefreshStore({call},codec),revoke=vi.fn(async()=>true),rotation=createRefreshRotation(store,{rotate:async()=>({accessToken:token,refreshSecret:'new-fixture',expiresAt:scope.expiresAt,revoke})});
 const http=createRefreshHttp(origin,createAccountRefresh(security,origin,createStoredRefreshPort(security,store,rotation,origin)));
 const server=createServer(createAccountNodeListener(origin,new Map([[path,http]])));
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const port=(server.address() as AddressInfo).port;
 const open=()=>requestHttp({host:'127.0.0.1',port,path,method:'POST',headers:{host:'stylist.example',origin,cookie:'__Host-stylist_access='+token,'content-type':'application/json'}});
 return {open,revoke,started,release,row:()=>row,close:()=>new Promise<void>(r=>server.close(()=>r()))};
}
it('delivers stored refresh cookie over loopback HTTP after adoption',async()=>{
 const f=await fixture();try{
  const result=await new Promise<{status:number;body:string;cookies:string[]}>((resolve,reject)=>{const req=f.open();req.on('response',res=>{let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>resolve({status:res.statusCode!,body,cookies:res.headers['set-cookie']??[]}));});req.on('error',reject);req.end('{}');});
  expect(result.status).toBe(200);expect(JSON.parse(result.body)).toEqual({status:'signedIn'});expect(result.cookies).toHaveLength(1);expect(result.cookies[0]).toContain('Secure; HttpOnly; SameSite=Strict');expect(f.row()?.generation).toBe(2);expect(f.revoke).not.toHaveBeenCalled();
 }finally{await f.close();}
});
it('revokes and removes ownership after client disconnect during refresh adoption',async()=>{
 const f=await fixture(true);try{
  const req=f.open();req.on('error',()=>{});req.end('{}');await f.started;req.destroy();await new Promise(r=>setTimeout(r,20));f.release();
  await vi.waitFor(()=>expect(f.revoke).toHaveBeenCalledTimes(1));await vi.waitFor(()=>expect(f.row()).toBeNull());
 }finally{f.release();await f.close();}
});
