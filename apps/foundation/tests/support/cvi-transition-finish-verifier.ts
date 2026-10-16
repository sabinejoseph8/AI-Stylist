/** Public-key verifier process for disposable local gate integration. */
import {verifyLocalGateFinishProof} from '../../src/server/local-cvi-gate-finish-proof.ts';
let raw='';try{
 for await(const chunk of process.stdin){raw+=chunk;if(Buffer.byteLength(raw)>1048576)throw Error();}
 const x=JSON.parse(raw);if(Object.keys(x).sort().join(',')!=='binding,now,pack')throw Error();
 process.stdout.write(JSON.stringify(verifyLocalGateFinishProof(x.binding,x.pack,x.now))+'\n');
}catch{process.stdout.write('{"status":"held"}\n');process.exitCode=2;}
