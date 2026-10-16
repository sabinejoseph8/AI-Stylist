/** Public-key proof verifier for a locked local replay mutation. No write port. */
import {verifyLocalWitnessReply} from './local-cvi-witness-service.ts';
import {historyCanonical} from './local-cvi-history-authority.ts';
import type {WitnessServicePin} from './local-cvi-witness-service.ts';
import type {AuthorityEvidence} from './local-cvi-mandatory-persistence.ts';
const exact=(v:unknown,keys:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
export function verifyLocalOwnerReplayProof(pin:WitnessServicePin,readerPrincipal:string,nonce:string,current:Record<string,unknown>,minimumRevision:number,now:number,evidence:AuthorityEvidence){
 if(!/^[a-f0-9]{64}$/.test(readerPrincipal)||!/^[a-f0-9]{64}$/.test(nonce)||!Number.isSafeInteger(minimumRevision)||minimumRevision<0||!exact(evidence,['request','reply']))throw Error('Owner replay proof unavailable');
 const result=verifyLocalWitnessReply(pin,evidence.request,evidence.reply,now);
 if(evidence.request.action!=='read'||evidence.request.challenge!==nonce||evidence.request.principalDigest!==readerPrincipal||!exact(result,['status','revision','current','pending'])||result.status!=='read'||!Number.isSafeInteger(result.revision)||Number(result.revision)<minimumRevision||result.pending!==null||!exact(result.current,['storeId','policyDigest','epochFloor','headFloor','observedClock','historyDigest'])||historyCanonical(result.current)!==historyCanonical(current))throw Error('Owner replay proof unavailable');
 return {revision:Number(result.revision)};
}
