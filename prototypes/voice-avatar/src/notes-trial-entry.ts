import type {Server} from 'node:http';
import {attachProtectedSimulatedNoteBridge} from './protected-note-network-bridge.ts';
type BridgeOptions=Parameters<typeof attachProtectedSimulatedNoteBridge>[1];
type Startup=ReturnType<NonNullable<BridgeOptions['createStartupTransports']>>;
/** Concrete disabled trial composition. Not imported by server.ts or the CLI.
 * No environment, credentials, actual providers, financial approval or live mode.
 * Uses the existing simulation endpoint; this is not a customer-facing route.
 * A future live entry needs its own reviewed durable allowance and activation. */
export function attachPreparedNotesOnlyTrial(server:Server,options:{
 simulation?:boolean;preview:BridgeOptions['preview'];allowance:BridgeOptions['allowance'];
 createStartupTransports:()=>Startup&{countFetch:NonNullable<Startup['countFetch']>};
}){
 if(options.simulation!==true)throw Error('Live notes-only trial is disabled.');
 if(options.allowance.purpose!=='notes-only-simulation')throw Error('Separate notebook allowance required.');
 return attachProtectedSimulatedNoteBridge(server,{
  simulation:true,maxTurns:2,cleanupRequirement:'remote-verified',preview:options.preview,allowance:options.allowance,
  createStartupTransports:()=>{
   const prepared=options.createStartupTransports();
   if(typeof prepared.countFetch!=='function')throw Error('Token counting preparation required.');
   return prepared;
  }
 });
}
