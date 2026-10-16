/** TEST ONLY: protocol/body/replay contracts. Cannot register a protected owner. */
import {createLocalCviHttpEnvelope} from '../../src/server/local-cvi-http-adapter.ts';
import {isContractOwner,continueContractOwner} from './cvi-private-contract-owner.ts';
export {localCviLlmConfiguration} from '../../src/server/local-cvi-http-adapter.ts';
export function createLocalCviHttpAdapter(options:Parameters<typeof createLocalCviHttpEnvelope>[0]){
 return createLocalCviHttpEnvelope(options,{ready:isContractOwner,continue:continueContractOwner});
}
