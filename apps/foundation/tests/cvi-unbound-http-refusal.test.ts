/** Shared envelope checks cannot publish the protected HTTP owner identity. */
import {it,expect} from 'vitest';
import {startupAdmissionFixture} from './support/cvi-startup-admission-fixture.ts';
import {createLocalCviStartupEnvelope} from '../src/server/local-cvi-startup-envelope.ts';
import {isLocalCviStartedOwner} from '../src/server/local-cvi-startup-owner.ts';
import {createLocalCviHttpAdapter} from '../src/server/local-cvi-http-adapter.ts';
it('an unbound envelope endpoint cannot enter the protected HTTP composition',async()=>{
 const f=await startupAdmissionFixture();let owner:any;try{
  const flow=f.resources.makeFlow(),resources={...f.resources,replay:f.rawReplay,makeFlow:()=>flow};
  owner=await createLocalCviStartupEnvelope(f.expected,f.checkpoint,f.admission(),resources,()=>1000,8000,8000,{claim:()=>true,bind:()=>{},adopt:()=>{},hold:()=>{},ready:()=>true,register:()=>{}}).start(new AbortController().signal);
  expect(owner).not.toBeNull();expect(isLocalCviStartedOwner(owner)).toBe(false);
  expect(()=>createLocalCviHttpAdapter({simulation:true,binding:f.resources.binding,owner,context:{flow} as any,transcript:{} as any,applicationRequest:new Request('https://app.example.test/notebook'),clock:()=>1000})).toThrow();
  expect(f.drafts()).toBe(0);expect(f.replayHooks.reserve).not.toHaveBeenCalled();
 }finally{owner?.end();await f.close();}
},30000);
