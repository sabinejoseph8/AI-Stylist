/** TEST-ONLY envelope harness. Exercises the shared source checks but cannot
 * register the private protected-owner brand required by the HTTP candidate. */
import {createLocalCviStartupEnvelope} from '../../src/server/local-cvi-startup-envelope.ts';
import type {createLocalCviStartupOwner as ProtectedStartup} from '../../src/server/local-cvi-startup-owner.ts';
export function createLocalCviStartupOwner(...args:Parameters<typeof ProtectedStartup>){
 return createLocalCviStartupEnvelope(args[0],args[1],args[2],args[3],args[4],args[5],args[6],{claim:()=>true,bind:()=>{},adopt:()=>{},hold:()=>{},ready:()=>true,register:()=>{}});
}
