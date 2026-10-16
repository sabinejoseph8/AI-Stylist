/** Existing signer under a parent-owned SQLite lock. Ephemeral key by stdin only. */
import {createPrivateKey,sign} from 'node:crypto';
import {createLocalCviReceiptSigner} from '../../src/server/local-cvi-receipt-signer.ts';
let raw='';for await(const c of process.stdin)raw+=c;
const x=JSON.parse(raw),key=createPrivateKey(x.privateKeyPem);
try{const s=createLocalCviReceiptSigner(x.pin,{claim:async()=>x.record},body=>sign(null,Buffer.from(body),key).toString('hex'),0,()=>x.now,1000);console.log(JSON.stringify(await s.acknowledge(x.receiptId,new AbortController().signal)));}
catch{process.exitCode=2;}
