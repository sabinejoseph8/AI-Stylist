/** Captured local witness reference. A separate folder does not prove independence. */
import {isAbsolute,resolve,relative,sep} from 'node:path';
export type ReplayWitnessPin=Readonly<{root:string;witnessId:string;journalId:string;kind:'replay'}>;
const uuid=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
export function captureReplayWitness(raw:ReplayWitnessPin,journalId:string,...separateRoots:string[]):ReplayWitnessPin{
 if(!raw||typeof raw!=='object'||Object.keys(raw).sort().join(',')!=='journalId,kind,root,witnessId'||raw.kind!=='replay'||!uuid(raw.witnessId)||!uuid(raw.journalId)||raw.journalId!==journalId||typeof raw.root!=='string'||!isAbsolute(raw.root)||resolve(raw.root)!==raw.root)throw Error('Captured replay witness required');
 for(const root of separateRoots){if(typeof root!=='string'||!isAbsolute(root)||resolve(root)!==root)throw Error('Captured replay roots unavailable');const a=relative(root,raw.root),b=relative(raw.root,root);if(!a||!(a==='..'||a.startsWith('..'+sep))&&!isAbsolute(a)||!b||!(b==='..'||b.startsWith('..'+sep))&&!isAbsolute(b))throw Error('Separate replay witness root required');}
 return Object.freeze({...raw});
}
