/** Ephemeral Ed25519 TEST signer and in-memory linearizable-authority model.
 * No signer key is saved, displayed, sent to a provider or used by an app entry. */
import {generateKeyPairSync,sign} from 'node:crypto';
import {historyCanonical,historyRequestHash} from '../../src/server/local-cvi-history-authority.ts';
import type {HistoryRequest,HistoryPin,HistoryAuthorityPort} from '../../src/server/local-cvi-history-authority.ts';
export function authorityFixture(){
 const keys=generateKeyPairSync('ed25519'),pin:HistoryPin={authorityId:'fixture-authority-primary',storeId:'00000000-0000-4000-8000-000000000001',kind:'replay',keyId:'fixture-key-current',publicKeyPem:keys.publicKey.export({type:'spki',format:'pem'}).toString()};
 let epoch=0,head='a'.repeat(64),active=true,writer=true;const requests:HistoryRequest[]=[];
 const signed=(body:Record<string,unknown>)=>({body,signature:sign(null,Buffer.from(historyCanonical(body)),keys.privateKey).toString('hex')});
 const exchange=async(request:HistoryRequest)=>{
  requests.push(request);let result=request.action==='read'?'read':'applied';
  if(request.authorityId!==pin.authorityId||request.storeId!==pin.storeId||request.kind!==pin.kind||!active)result='held';
  else if(request.action==='advance'){
   if(!writer)result='held';else if(request.expectedEpoch!==epoch||request.expectedHead!==head)result='conflict';
   else{epoch++;head=request.nextHead!;}
  }
  return signed({version:1,authorityId:pin.authorityId,storeId:pin.storeId,kind:pin.kind,keyId:pin.keyId,challenge:request.challenge,
   requestHash:historyRequestHash(request),epoch,head,state:active?'active':'held',result});
 };
 const port:HistoryAuthorityPort={exchange};
 return {pin,port,requests,signed,head:()=>({epoch,head}),set:(e:number,h:string)=>{epoch=e;head=h;},active:(v:boolean)=>{active=v;},writer:(v:boolean)=>{writer=v;}};
}
