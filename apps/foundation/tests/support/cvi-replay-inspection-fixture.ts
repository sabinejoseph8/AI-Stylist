/** In-memory inspection fixture. Actual file inspection is tested separately. */
import {createHash} from 'node:crypto';
import type {ReplayInspectionRequest} from '../../src/server/local-cvi-replay-inspection.ts';
export function replayInspectionFixture(r:ReplayInspectionRequest,rows:readonly {status:string}[]=[],limit=64){
 const pendingCount=rows.filter(v=>v.status==='reserved').length,recordCount=rows.length;
 return {...r,clock:r.now,expiresAt:10000,limit,recordCount,pendingCount,spentCount:recordCount-pendingCount,journalDigest:createHash('sha256').update(JSON.stringify([rows,r.now])).digest('hex'),status:pendingCount?'replay-pending':recordCount>=limit?'replay-exhausted':'replay-idle',permissions:{write:false,activate:false,renew:false,sign:false,resume:false}};
}
