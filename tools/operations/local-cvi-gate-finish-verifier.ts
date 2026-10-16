/** Disabled pure verifier subprocess. No network, credential lookup or reads. */
import {verifyLocalGateFinishProof} from '../../apps/foundation/src/server/local-cvi-gate-finish-proof.ts';
let raw='';try{for await(const data of process.stdin){raw+=data.toString();if(Buffer.byteLength(raw)>1048576)throw Error();}const x=JSON.parse(raw);if(Object.keys(x).sort().join(',')!=='binding,now,pack')throw Error();process.stdout.write(JSON.stringify(verifyLocalGateFinishProof(x.binding,x.pack,x.now)));}catch{process.exitCode=2;}
