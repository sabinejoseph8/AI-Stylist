/** Synthetic crash probe. Ephemeral test key arrives by stdin, never stored. */
import {sign,createPrivateKey} from 'node:crypto';
import {createLocalCviReceiptSigner} from '../../src/server/local-cvi-receipt-signer.ts';
import {receiptCall} from './cvi-receipt-process.ts';
let raw='';for await(const c of process.stdin)raw+=c;
const x=JSON.parse(raw),key=createPrivateKey(x.privateKeyPem);
const signer=createLocalCviReceiptSigner(x.pin,{claim:()=>receiptCall(x.root,'claim',x.actor,{identity:x.identity,principal:x.pin.principalDigest})},message=>{
 sign(null,Buffer.from(message),key);process.exit(75);
},0,()=>1000,5000);
await signer.acknowledge(x.identity,new AbortController().signal);
process.exitCode=2;
