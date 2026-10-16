/** Pure public-key verifier. No authority private key or raw persistence port. */
import {verifyLocalWitnessReply,witnessServiceDigest} from '../../src/server/local-cvi-witness-service.ts';
import {historyCanonical} from '../../src/server/local-cvi-history-authority.ts';
let raw='';for await(const b of process.stdin)raw+=b;
try{
 const x=JSON.parse(raw),a=x.approval,r=a.request;
 const granted=verifyLocalWitnessReply(x.pin,r,a.reply,x.now) as any;
 if(r.action!=='advance'||r.operationId!==x.intent.id||r.principalDigest!==x.intent.actor.principalDigest||granted.status!=='advanced'||granted.operationId!==x.intent.id||granted.revision!==r.expectedRevision+1||historyCanonical(granted.current)!==historyCanonical(x.intent.to))throw Error();
 if(x.mode==='read'){
  const e=x.evidence,q=e.request,result=verifyLocalWitnessReply(x.pin,q,e.reply,x.now) as any;
  if(x.phase==='claim'){if(q.action!=='claim-execution'||q.operationId!==x.intent.id||q.principalDigest!==x.intent.actor.principalDigest||q.challenge!==x.nonce||result.status!=='execution-claimed'||result.operationId!==x.intent.id||result.revision!==granted.revision||result.targetDigest!==witnessServiceDigest(x.intent.to)||result.grantHash!==witnessServiceDigest(a.request))throw Error();}
  else if(q.action!=='read'||q.challenge!==x.nonce||q.principalDigest!==x.readPrincipal||result.status!=='read'||historyCanonical(result.current)!==historyCanonical(x.intent.to)||result.revision!==granted.revision+(x.phase==='reconciled'?1:0)||result.pending!==(x.phase==='reconciled'?null:x.intent.id))throw Error();
 }else if(x.mode!=='advanced')throw Error();
 console.log('{"verified":true}');
}catch{process.exitCode=2;}
