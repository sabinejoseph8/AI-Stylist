/** Subprocess verifier receives only the pinned public key and fixed evidence. */
import {verifyLocalOwnerReplayProof} from '../../src/server/local-cvi-owner-replay-proof.ts';
let raw='';for await(const b of process.stdin)raw+=b;
try{const x=JSON.parse(raw);console.log(JSON.stringify(verifyLocalOwnerReplayProof(x.pin,x.readerPrincipal,x.nonce,x.current,x.minimumRevision,x.now,x.evidence)));}catch{process.exitCode=2;}
